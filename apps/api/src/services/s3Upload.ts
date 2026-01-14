import { uploadFile } from './storage/googleCloudStorage';

/**
 * Upload buffer to Google Cloud Storage
 * @deprecated Use uploadFile from googleCloudStorage directly
 */
export async function uploadBufferToS3(buffer: Buffer, key: string) {
  // Extract folder and filename from key
  const keyParts = key.split("/");
  const filename = keyParts[keyParts.length - 1];
  const folder = keyParts.length > 1 ? keyParts[0] : undefined;
  
  const uploadResult = await uploadFile(
    buffer,
    filename,
    "application/pdf",
    folder
  );
  
  return uploadResult.signedUrl;
}
