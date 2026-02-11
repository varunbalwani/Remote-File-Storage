module.exports = {
    s3: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        bucketName: process.env.S3_BUCKET_NAME,
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:4566',
        forcePathStyle: true,
    },
    db: {
        url: process.env.DATABASE_URL,
    },
    port: process.env.PORT || 3000,
};
