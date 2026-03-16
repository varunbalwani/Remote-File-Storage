var express = require('express');
var router = express.Router();
var { CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
var s3 = require('../config/s3Client');
var config = require('../config/common');
var File = require('../models/File');

var BUCKET_NAME = config.s3.bucketName;

router.post('/', async (req, res) => {
    const { s3Key, uploadId, parts, fileName, fileType, fileSize, uploadedBy } = req.body;

    if (!s3Key || !uploadId || !parts || !fileName || !fileType || !fileSize) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // parts must be sorted by PartNumber for S3 to assemble correctly
    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

    try {
        const command = new CompleteMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            UploadId: uploadId,
            MultipartUpload: { Parts: sortedParts },
        });

        await s3.send(command);

        // Save metadata to MongoDB after S3 assembly is confirmed
        try {
            const fileDoc = new File({
                fileName,
                fileType,
                fileSize,
                s3Key,
                uploadedBy: uploadedBy || 'anonymous',
            });

            const savedDoc = await fileDoc.save();
            return res.status(201).json({ message: 'File uploaded successfully', file: savedDoc });
        } catch (mongoErr) {
            // S3 upload succeeded but DB failed - attempt S3 cleanup
            console.error('MongoDB save failed after S3 complete, aborting:', mongoErr);
            try {
                await s3.send(new AbortMultipartUploadCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key,
                    UploadId: uploadId,
                }));
            } catch (abortErr) {
                console.error('S3 abort failed - orphaned file at key:', s3Key, abortErr);
            }

            return res.status(500).json({
                error: 'Failed to save file metadata. Upload has been rolled back.',
                details: mongoErr.message,
            });
        }
    } catch (err) {
        console.error('Complete upload error:', err);
        return res.status(500).json({ error: 'Failed to complete upload', details: err.message });
    }
});

module.exports = router;
