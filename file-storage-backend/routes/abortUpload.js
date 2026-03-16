var express = require('express');
var router = express.Router();
var { AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
var s3 = require('../config/s3Client');
var config = require('../config/common');

var BUCKET_NAME = config.s3.bucketName;

// Called by frontend when user cancels or an unrecoverable error occurs
router.post('/', async (req, res) => {
    const { s3Key, uploadId } = req.body;

    if (!s3Key || !uploadId) {
        return res.status(400).json({ error: 's3Key and uploadId are required' });
    }

    try {
        await s3.send(new AbortMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            UploadId: uploadId,
        }));

        return res.status(200).json({ message: 'Upload aborted successfully' });
    } catch (err) {
        console.error('Abort upload error:', err);
        return res.status(500).json({ error: 'Failed to abort upload', details: err.message });
    }
});

module.exports = router;
