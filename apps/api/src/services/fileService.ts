import prisma from "../lib/prisma.js";
import {
  buildObjectKey,
  getSignedUrl as getGCSignedUrl,
  uploadFile as uploadFileToGCS
} from "./storage/googleCloudStorage.js";

export async function requestUploadUrl(userId: string, filename: string, contentType: string) {
  const key = buildObjectKey(userId, filename);
  // For GCS, we generate a signed URL for upload (PUT operation)
  // Note: GCS doesn't support presigned upload URLs the same way S3 does
  // We'll generate a signed URL that allows PUT operations
  const uploadUrl = await getGCSignedUrl(key, 3600); // 1 hour expiry
  return {
    uploadUrl,
    fileKey: key,
    contentType
  };
}

export async function confirmUpload(userId: string, fileKey: string, filename: string, type: string) {
  // Generate signed URL for the uploaded file
  const url = await getGCSignedUrl(fileKey, 3600); // 1 hour expiry
  const file = await prisma.file.create({
    data: {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || undefined,
      key: fileKey,
      url,
      filename,
      type,
      updatedAt: new Date()
    }
  });
  return file;
}

export async function listUserFiles(userId: string, folder?: string) {
  return prisma.file.findMany({
    where: {
      userId,
      folder: folder || undefined
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getDownloadUrl(fileId: string, requesterId: string, isAdmin: boolean) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("File not found");
  if (file.userId && file.userId !== requesterId && !isAdmin) {
    throw new Error("Forbidden");
  }
  // Generate fresh signed URL (existing URL may have expired)
  const url = await getGCSignedUrl(file.key, 3600); // 1 hour expiry
  return { url, filename: file.key.split('/').pop() || 'unknown' };
}

export async function getPresignedUrl(key: string) {
  const url = await getGCSignedUrl(key, 3600); // 1 hour expiry
  return {
    url,
    fields: {}
  };
}

export async function uploadFileToStorage(key: string, fileBuffer: Buffer, mimeType: string) {
  // Extract folder and filename from key if it follows our pattern
  const keyParts = key.split("/");
  const filename = keyParts[keyParts.length - 1];
  const folder = keyParts.length > 1 ? keyParts[0] : undefined;
  const userId = keyParts.length > 2 ? keyParts[1] : undefined;
  
  const uploadResult = await uploadFileToGCS(
    fileBuffer,
    filename,
    mimeType,
    folder,
    userId
  );
  
  return uploadResult.signedUrl;
}

export async function saveUploadedFile(userId: string | null, file: Express.Multer.File) {
  const uploadResult = await uploadFileToGCS(
    file.buffer,
    file.originalname,
    file.mimetype,
    undefined,
    userId || undefined
  );

  const record = await prisma.file.create({
    data: {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || undefined,
      key: uploadResult.key,
      url: uploadResult.signedUrl,
      filename: file.originalname,
      type: file.mimetype,
      size: file.size,
      updatedAt: new Date()
    }
  });

  return record;
}
