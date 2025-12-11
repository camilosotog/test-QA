import AWS from 'aws-sdk';

const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
};

export const s3 = new AWS.S3({
  accessKeyId: s3Config.accessKeyId as string,
  secretAccessKey: s3Config.secretAccessKey as string,
  region: s3Config.region
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'qa-oncredit';

/**
 * Sube un archivo a S3
 * @param fileBuffer Buffer del archivo
 * @param fileName Nombre del archivo
 * @param mimeType Tipo MIME (ej: image/png)
 * @returns URL pública del archivo
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<string> {
  const key = `test-evidence/${Date.now()}-${fileName}`;

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType
    // Nota: No usamos ACL porque el bucket tiene Block Public Access habilitado
    // Los permisos se manejan a través de la política del bucket
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${(error as any).message}`);
  }
}

/**
 * Elimina un archivo de S3
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    const key = fileUrl.split(`${S3_BUCKET}/`)[1];
    if (!key) return;

    await s3.deleteObject({
      Bucket: S3_BUCKET,
      Key: key
    }).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
  }
}
