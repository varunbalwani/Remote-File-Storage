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
        url: process.env.DATABASE_URL || 'mongodb+srv://varunbalwani123_db_user:S8iHwlIUcR3vISTW@cluster69.5a6z6jg.mongodb.net/file_storage?retryWrites=true&w=majority&appName=Cluster69',
    },
    port: process.env.PORT || 3000,
};