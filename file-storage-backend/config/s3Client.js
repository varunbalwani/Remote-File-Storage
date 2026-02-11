var { S3Client } = require('@aws-sdk/client-s3');
var config = require('./common');

var s3 = new S3Client({
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    forcePathStyle: config.s3.forcePathStyle,
    credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
    },
});

module.exports = s3;
