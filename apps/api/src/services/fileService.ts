import prisma from "../lib/prisma.js";

export async function requestUploadUrl(userId: string, filename: string, contentType: string) {
  const key = `uploads/${userId || "anon"}-${Date.now()}-${filename}`;
  // Stub: in real flow return signed URL
  return {
    uploadUrl: `https://example.com/${key}`,
    fileKey: key,
    contentType
  };
}

export async function confirmUpload(userId: string, fileKey: string, filename: string, type: string) {
  const url = `https://example.com/${fileKey}`;
  const file = await prisma.file.create({
    data: {
      userId,
      key: fileKey,
      url,
      filename,
      type
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
  return { url: file.url || `https://example.com/${file.key}` };
}

export async function getPresignedUrl(key: string) {
  console.log("[S3 STUB] getPresignedUrl", key);
  return {
    url: `https://stub-s3.local/${key}`,
    fields: {}
  };
}

export async function uploadFileToS3(key: string, fileBuffer: Buffer, mimeType: string) {
  console.log("[S3 STUB] uploadFileToS3", { key, mimeType });
  return `https://stub-s3.local/${key}`;
}

export async function saveUploadedFile(userId: string | null, file: Express.Multer.File) {
  const key = `uploads/${userId || "anon"}-${Date.now()}-${file.originalname}`;
  const url = await uploadFileToS3(key, file.buffer, file.mimetype);

  const record = await prisma.file.create({
    data: {
      userId: userId || undefined,
      key,
      url,
      filename: file.originalname,
      type: file.mimetype
    }
  });

  return record;
}
