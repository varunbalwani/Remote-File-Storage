var express = require('express');
var router = express.Router();
var { UploadPartCommand } = require('@aws-sdk/client-s3');
var { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
var s3 = require('../config/s3Client');
var config = require('../config/common');

var BUCKET_NAME = config.s3.bucketName;

router.post('/', async (req, res) => {
    const { s3Key, uploadId, partNumbers } = req.body;

    if (!s3Key || !uploadId || !partNumbers || !Array.isArray(partNumbers)) {
        return res.status(400).json({ error: 's3Key, uploadId and partNumbers[] are required' });
    }

    try {
        const urls = await Promise.all(
            partNumbers.map(async (partNumber) => {
                const command = new UploadPartCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key,
                    UploadId: uploadId,
                    PartNumber: partNumber,
                });
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                return { partNumber, url };
            })
        );

        return res.status(200).json({ urls });
    } catch (err) {
        console.error('Get part URL error:', err);
        return res.status(500).json({ error: 'Failed to generate part URLs', details: err.message });
    }
});

module.exports = router;
