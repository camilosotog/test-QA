import AWS from 'aws-sdk';
export declare const s3: AWS.S3;
export declare const S3_BUCKET: string;
/**
 * Sube un archivo a S3
 * @param fileBuffer Buffer del archivo
 * @param fileName Nombre del archivo
 * @param mimeType Tipo MIME (ej: image/png)
 * @returns URL pública del archivo
 */
export declare function uploadToS3(fileBuffer: Buffer, fileName: string, mimeType?: string): Promise<string>;
/**
 * Elimina un archivo de S3
 */
export declare function deleteFromS3(fileUrl: string): Promise<void>;
//# sourceMappingURL=s3.d.ts.map