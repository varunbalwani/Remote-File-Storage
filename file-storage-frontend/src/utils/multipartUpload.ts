import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface UploadProgress {
    uploadedParts: number;
    totalParts: number;
    percentage: number;
}

export interface UploadState {
    s3Key: string;
    uploadId: string;
    totalParts: number;
    partSize: number;
    completedParts: { PartNumber: number; ETag: string }[];
}

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadPartWithRetry(
    url: string,
    chunk: Blob,
    partNumber: number,
    retries = MAX_RETRIES
): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.put(url, chunk, {
                headers: { 'Content-Type': 'application/octet-stream' },
            });
            // S3 returns the ETag in the response header
            const etag = response.headers['etag'];
            if (!etag) throw new Error(`No ETag returned for part ${partNumber}`);
            return etag;
        } catch (err) {
            if (attempt === retries) throw err;
            console.warn(`Part ${partNumber} attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS * attempt}ms...`);
            await sleep(RETRY_DELAY_MS * attempt);
        }
    }
    throw new Error(`Part ${partNumber} failed after ${retries} retries`);
}

export async function uploadFileMultipart(
    file: File,
    uploadedBy: string,
    onProgress?: (progress: UploadProgress) => void,
    resumeState?: UploadState
): Promise<void> {
    let uploadState: UploadState;

    if (resumeState) {
        // Resume from where we left off
        uploadState = resumeState;
        console.log(`Resuming upload from part ${resumeState.completedParts.length + 1}`);
    } else {
        // Step 1: Initiate multipart upload
        const initiateRes = await axios.post(`${API_URL}/initiateUpload`, {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadedBy,
        });

        uploadState = {
            s3Key: initiateRes.data.s3Key,
            uploadId: initiateRes.data.uploadId,
            totalParts: initiateRes.data.totalParts,
            partSize: initiateRes.data.partSize,
            completedParts: [],
        };
    }

    const { s3Key, uploadId, totalParts, partSize, completedParts } = uploadState;

    // Figure out which parts still need uploading
    const completedPartNumbers = new Set(completedParts.map((p) => p.PartNumber));
    const remainingParts = Array.from({ length: totalParts }, (_, i) => i + 1).filter(
        (n) => !completedPartNumbers.has(n)
    );

    // Step 2: Get presigned URLs for all remaining parts in one request
    const urlRes = await axios.post(`${API_URL}/getPartUrl`, {
        s3Key,
        uploadId,
        partNumbers: remainingParts,
    });

    const partUrlMap: Record<number, string> = {};
    for (const { partNumber, url } of urlRes.data.urls) {
        partUrlMap[partNumber] = url;
    }

    // Step 3: Upload parts (sequentially to keep memory low, can be parallelized)
    const newCompletedParts = [...completedParts];

    for (const partNumber of remainingParts) {
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        const etag = await uploadPartWithRetry(partUrlMap[partNumber], chunk, partNumber);
        newCompletedParts.push({ PartNumber: partNumber, ETag: etag });

        onProgress?.({
            uploadedParts: newCompletedParts.length,
            totalParts,
            percentage: Math.round((newCompletedParts.length / totalParts) * 100),
        });
    }

    // Step 4: Complete the multipart upload
    await axios.post(`${API_URL}/completeUpload`, {
        s3Key,
        uploadId,
        parts: newCompletedParts,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy,
    });
}

export async function abortUpload(s3Key: string, uploadId: string): Promise<void> {
    try {
        await axios.post(`${API_URL}/abortUpload`, { s3Key, uploadId });
    } catch (err) {
        console.error('Failed to abort upload:', err);
    }
}
