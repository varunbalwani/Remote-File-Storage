var mongoose = require('mongoose');

var fileSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
        s3Key: {
            type: String,
            required: true,
            unique: true,
        },
        uploadedBy: {
            type: String,
            default: 'anonymous',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('File', fileSchema);
