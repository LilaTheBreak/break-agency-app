import AWS from "aws-sdk";
import { safeEnv } from "../../utils/safeEnv.js";
import crypto from "crypto";

const s3 = new AWS.S3({
  accessKeyId: safeEnv("S3_ACCESS_KEY", "test"),
  secretAccessKey: safeEnv("S3_SECRET_KEY", "test"),
  region: safeEnv("S3_REGION", "us-east-1"),
  signatureVersion: "v4"
});

const BUCKET = safeEnv("S3_BUCKET", "local-bucket");

export async function uploadFileToS3(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  folder = "general"
) {
  const key = `${folder}/${crypto.randomUUID()}-${filename}`;

  await s3
    .putObject({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType
    })
    .promise();

  return {
    key,
    url: `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`
  };
}

export function getSignedUploadUrl(filename: string, mimeType: string, folder = "general") {
  const key = `${folder}/${crypto.randomUUID()}-${filename}`;

  const url = s3.getSignedUrl("putObject", {
    Bucket: BUCKET,
    Key: key,
    Expires: 60 * 5,
    ContentType: mimeType
  });

  return { key, url };
}
