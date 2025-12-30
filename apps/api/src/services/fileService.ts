import prisma from "../lib/prisma.js";
import { buildObjectKey, createPresignedUploadUrl, createPresignedDownloadUrl, s3 } from "../lib/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { safeEnv } from "../utils/safeEnv.js";

const bucket = safeEnv("S3_BUCKET", "local-bucket");
const region = safeEnv("S3_REGION", "us-east-1");
const endpoint = process.env.S3_ENDPOINT || undefined;
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

function buildFileUrl(key: string): string {
  if (endpoint && forcePathStyle) {
    // Cloudflare R2 or S3-compatible with path-style
    return `${endpoint}/${bucket}/${key}`;
  } else if (endpoint) {
    // Custom endpoint (virtual-hosted style)
    return `${endpoint}/${key}`;
  } else {
    // Standard S3
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}

export async function requestUploadUrl(userId: string, filename: string, contentType: string) {
  const key = buildObjectKey(userId, filename);
  const uploadUrl = await createPresignedUploadUrl(key, contentType);
  return {
    uploadUrl,
    fileKey: key,
    contentType
  };
}

export async function confirmUpload(userId: string, fileKey: string, filename: string, type: string) {
  const url = buildFileUrl(fileKey);
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
  // Return existing URL or build from key
  return { url: file.url || buildFileUrl(file.key) };
}

export async function getPresignedUrl(key: string) {
  const url = await createPresignedDownloadUrl(key);
  return {
    url,
    fields: {}
  };
}

export async function uploadFileToS3(key: string, fileBuffer: Buffer, mimeType: string) {
  const bucket = safeEnv("S3_BUCKET", "local-bucket");
  
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType
    })
  );
  
  return buildFileUrl(key);
}

export async function saveUploadedFile(userId: string | null, file: Express.Multer.File) {
  const key = buildObjectKey(userId || "anon", file.originalname);
  const url = await uploadFileToS3(key, file.buffer, file.mimetype);

  const record = await prisma.file.create({
    data: {
      userId: userId || undefined,
      key,
      url,
      filename: file.originalname,
      type: file.mimetype,
      size: file.size
    }
  });

  return record;
}
