"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_BUCKET = exports.s3 = void 0;
exports.uploadToS3 = uploadToS3;
exports.deleteFromS3 = deleteFromS3;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const s3Config = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
};
exports.s3 = new aws_sdk_1.default.S3({
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
    region: s3Config.region
});
exports.S3_BUCKET = process.env.AWS_S3_BUCKET || 'qa-oncredit';
/**
 * Sube un archivo a S3
 * @param fileBuffer Buffer del archivo
 * @param fileName Nombre del archivo
 * @param mimeType Tipo MIME (ej: image/png)
 * @returns URL pública del archivo
 */
async function uploadToS3(fileBuffer, fileName, mimeType = 'application/octet-stream') {
    const key = `test-evidence/${Date.now()}-${fileName}`;
    const params = {
        Bucket: exports.S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType
    };
    try {
        const result = await exports.s3.upload(params).promise();
        return result.Location;
    }
    catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
}
/**
 * Elimina un archivo de S3
 */
async function deleteFromS3(fileUrl) {
    try {
        const key = fileUrl.split(`${exports.S3_BUCKET}/`)[1];
        if (!key)
            return;
        await exports.s3.deleteObject({
            Bucket: exports.S3_BUCKET,
            Key: key
        }).promise();
    }
    catch (error) {
        console.error('Error deleting from S3:', error);
    }
}
//# sourceMappingURL=s3.js.map