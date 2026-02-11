var express = require('express');
var router = express.Router();
var File = require('../models/File');
var s3 = require('../config/s3Client');
var config = require('../config/common');
var { GetObjectCommand } = require('@aws-sdk/client-s3');

router.get('/', async (req, res) => {
    try {
        var files = await File.find().sort({ createdAt: -1 });
        var s3Files = [];
        for (var file of files) {
            var getCommand = new GetObjectCommand({
                Bucket: config.s3.bucketName,
                Key: file.s3Key,
            });
            var s3File = await s3.send(getCommand);
            s3Files.push({ s3File, metadata: { fileName: file.fileName, fileType: file.fileType, fileSize: file.fileSize, s3Key: file.s3Key, uploadedBy: file.uploadedBy } });
        }
        return res.status(200).json({
            message: 'Files fetched successfully',
            count: files.length,
            files: s3Files,
        });
    } catch (err) {
        console.error('Fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch files', details: err.message });
    }
});

module.exports = router;
