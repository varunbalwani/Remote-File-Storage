var express = require('express');
var router = express.Router();
var { GetObjectCommand } = require('@aws-sdk/client-s3');
var s3 = require('../config/s3Client');
var config = require('../config/common');
var File = require('../models/File');

var BUCKET_NAME = config.s3.bucketName || 'file-storage-bucket';

router.get('/:s3Key', async (req, res) => {
    try {
        var fileDoc = await File.findOne({ s3Key: req.params.s3Key });

        if (!fileDoc) {
            return res.status(404).json({ error: 'File not found' });
        }

        var getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: req.params.s3Key,
        });

        var s3Response = await s3.send(getCommand);

        res.setHeader('Content-Disposition', 'attachment; filename="' + fileDoc.fileName + '"');
        res.setHeader('Content-Type', fileDoc.fileType);

        s3Response.Body.pipe(res);
    } catch (err) {
        console.error('Download error:', err);
        return res.status(500).json({ error: 'Failed to download file', details: err.message });
    }
});

module.exports = router;
