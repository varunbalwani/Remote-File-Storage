var express = require('express');
var router = express.Router();
var { CreateMultipartUploadCommand } = require('@aws-sdk/client-s3');
var s3 = require('../config/s3Client');
var config = require('../config/common');

var BUCKET_NAME = config.s3.bucketName;
var PART_SIZE = 5 * 1024 * 1024; // 5MB minimum part size required by S3

router.post('/', async (req, res) => {
    const { fileName, fileType, fileSize, uploadedBy } = req.body;

    if (!fileName || !fileType || !fileSize) {
        return res.status(400).json({ error: 'fileName, fileType and fileSize are required' });
    }

    const s3Key = Date.now() + '-' + fileName;
    const totalParts = Math.ceil(fileSize / PART_SIZE);

    try {
        const command = new CreateMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: fileType,
        });

        const { UploadId } = await s3.send(command);

        return res.status(200).json({
            uploadId: UploadId,
            s3Key,
            partSize: PART_SIZE,
            totalParts,
        });
    } catch (err) {
        console.error('Initiate upload error:', err);
        return res.status(500).json({ error: 'Failed to initiate upload', details: err.message });
    }
});

module.exports = router;
