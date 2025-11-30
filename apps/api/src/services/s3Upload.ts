import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3.js";
import { safeEnv } from "../utils/safeEnv.js";

export async function uploadBufferToS3(buffer: Buffer, key: string) {
  const bucket = safeEnv("S3_BUCKET", "local-bucket");
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf"
    })
  );
  const endpoint = process.env.S3_PUBLIC_URL || `https://${bucket}.s3.amazonaws.com`;
  return `${endpoint}/${key}`;
}
