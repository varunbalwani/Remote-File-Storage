var express = require('express');
var router = express.Router();
var multer = require('multer');
var { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
var s3 = require('../config/s3Client');
var config = require('../config/common');
var File = require('../models/File');

var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  },
});

var BUCKET_NAME = config.s3.bucketName;

router.put('/', upload.single('file'), async (req, res) => {
  var s3Key = null;
  console.log(req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    var file = req.file;
    s3Key = Date.now() + '-' + file.originalname;

    var putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(putCommand);

    var fileDoc = new File({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      s3Key: s3Key,
      uploadedBy: req.body.uploadedBy || 'anonymous',
    });

    var savedDoc;
    try {
      savedDoc = await fileDoc.save();
    } catch (mongoErr) {
      console.error('MongoDB insert failed, rolling back S3 upload:', mongoErr);

      var deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      });

      try {
        await s3.send(deleteCommand);
      } catch (s3DeleteErr) {
        console.error('S3 rollback FAILED! Orphaned file at key:', s3Key, s3DeleteErr);
      }

      return res.status(500).json({
        error: 'Failed to save file metadata to database. Upload has been rolled back.',
        details: mongoErr.message,
      });
    }

    return res.status(201).json({
      message: 'File uploaded successfully',
      file: savedDoc,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload file', details: err.message });
  }
});

module.exports = router;
