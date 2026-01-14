import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { sendSlackAlert } from '../integrations/slack/slackClient.js';
import { safeEnv } from '../utils/safeEnv.js';

const bucket = safeEnv("S3_BUCKET", "local-bucket");
const region = safeEnv("S3_REGION", "us-east-1");
const endpoint = process.env.S3_ENDPOINT || undefined;
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
const accessKeyId = safeEnv("S3_ACCESS_KEY", "test");
const secretAccessKey = safeEnv("S3_SECRET_KEY", "test");

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

export function buildObjectKey(userId: string, filename: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `uploads/${userId}/${year}/${month}/${randomUUID()}-${safeName}`;
}

export async function createPresignedUploadUrl(key: string, contentType: string, expiresIn = 900) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    return uploadUrl;
  } catch (error) {
    await sendSlackAlert("S3 presign upload failed", { error: `${error}` });
    throw error;
  }
}

export async function createPresignedDownloadUrl(key: string, expiresIn = 900) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn });
    return downloadUrl;
  } catch (error) {
    await sendSlackAlert("S3 presign download failed", { error: `${error}` });
    throw error;
  }
}

export async function deleteObject(key: string) {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );
  } catch (error) {
    await sendSlackAlert("S3 delete failed", { error: `${error}` });
    throw error;
  }
}

export async function listObjects(prefix: string, maxKeys = 1000) {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys
    })
  );
  return result.Contents || [];
}
