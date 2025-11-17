import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import https from "node:https";

type UploadResult = {
  key: string;
  url: string;
};

const DRIVER = (process.env.STORAGE_DRIVER || "s3").toLowerCase();
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "";

const UPLOADTHING_URL = process.env.UPLOADTHING_URL || "";
const UPLOADTHING_KEY = process.env.UPLOADTHING_KEY || "";

const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

export async function uploadFile(buffer: Buffer, filename: string, folder = "uploads"): Promise<UploadResult> {
  if (DRIVER === "uploadthing" && UPLOADTHING_URL && UPLOADTHING_KEY) {
    return uploadViaUploadThing(buffer, filename, folder);
  }
  if (DRIVER === "s3" && S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY) {
    return uploadToS3(buffer, filename, folder);
  }
  return uploadToLocal(buffer, filename, folder);
}

export async function generateSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
  if (!key) throw new Error("File key required");
  if (DRIVER === "uploadthing" && UPLOADTHING_URL) {
    return `${UPLOADTHING_URL.replace(/\/$/, "")}/${key}`;
  }
  if (DRIVER === "s3" && S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY) {
    const host = `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
    const encodedKey = encodeURI(key);
    const endpoint = `https://${host}/${encodedKey}`;
    const now = new Date();
    const amzDate = toAmzDate(now);
    const credentialScope = `${toDateStamp(now)}/${S3_REGION}/s3/aws4_request`;
    const params = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${S3_ACCESS_KEY}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expiresInSeconds),
      "X-Amz-SignedHeaders": "host"
    });
    const canonicalRequest = [
      "GET",
      `/${encodedKey}`,
      params.toString(),
      `host:${host}\n`,
      "host",
      "UNSIGNED-PAYLOAD"
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      hashHex(canonicalRequest)
    ].join("\n");
    const signature = hmacHex(getSigningKey(S3_SECRET_KEY, now, S3_REGION, "s3"), stringToSign);
    params.set("X-Amz-Signature", signature);
    return `${endpoint}?${params.toString()}`;
  }
  return pathToLocalUrl(key);
}

export async function deleteFile(key: string) {
  if (!key) return;
  if (DRIVER === "uploadthing" && UPLOADTHING_URL && UPLOADTHING_KEY) {
    await fetch(`${UPLOADTHING_URL.replace(/\/$/, "")}/file/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: {
        "x-api-key": UPLOADTHING_KEY
      }
    }).catch(() => null);
    return;
  }
  if (DRIVER === "s3" && S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY) {
    await signedS3Request("DELETE", key);
    return;
  }
  const target = path.join(LOCAL_UPLOAD_DIR, key);
  await fs.rm(target).catch(() => null);
}

async function uploadToS3(buffer: Buffer, filename: string, folder: string) {
  const key = createStorageKey(folder, filename);
  const contentType = detectContentType(filename);
  await signedS3Request("PUT", key, {
    body: buffer,
    contentType
  });
  const url = await generateSignedUrl(key);
  return { key, url };
}

async function signedS3Request(
  method: string,
  key: string,
  options: { body?: Buffer; contentType?: string } = {}
) {
  const host = `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
  const encodedKey = encodeURI(key);
  const endpoint = `https://${host}/${encodedKey}`;
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = toDateStamp(now);
  const credentialScope = `${dateStamp}/${S3_REGION}/s3/aws4_request`;
  const payloadHash = options.body ? hashHex(options.body) : hashHex("");
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join("\n");
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method.toUpperCase(),
    `/${encodedKey}`,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hashHex(canonicalRequest)
  ].join("\n");
  const signingKey = getSigningKey(S3_SECRET_KEY, now, S3_REGION, "s3");
  const signature = hmacHex(signingKey, stringToSign);
  const headers: Record<string, string> = {
    Authorization: `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash
  };
  if (options.contentType) headers["Content-Type"] = options.contentType;
  const response = await sendHttpsRequest(endpoint, {
    method,
    headers,
    body: options.body
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`S3 request failed (${response.statusCode}): ${response.body.toString("utf8")}`);
  }
}

async function uploadViaUploadThing(buffer: Buffer, filename: string, folder: string) {
  if (!UPLOADTHING_URL || !UPLOADTHING_KEY) {
    return uploadToLocal(buffer, filename, folder);
  }
  console.warn("UploadThing fallback not fully configured; storing file locally.");
  return uploadToLocal(buffer, filename, folder);
}

async function uploadToLocal(buffer: Buffer, filename: string, folder: string) {
  const key = createStorageKey(folder, filename);
  const target = path.join(LOCAL_UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return { key, url: pathToLocalUrl(key) };
}

function createStorageKey(folder: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${folder.replace(/\/+/g, "-")}/${Date.now()}-${safeName}`;
}

function detectContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".pdf":
      return "application/pdf";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".doc":
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

function pathToLocalUrl(key: string) {
  return `/uploads/${key}`;
}

function sendHttpsRequest(
  target: string,
  options: { method: string; headers: Record<string, string>; body?: Buffer }
) {
  return new Promise<{ statusCode: number; body: Buffer }>((resolve, reject) => {
    const url = new URL(target);
    const req = https.request(
      {
        method: options.method,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: options.headers
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode || 0, body: Buffer.concat(chunks) }));
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function hashHex(value: string | Buffer) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmacHex(key: Buffer, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

function getSigningKey(secret: string, date: Date, region: string, service: string) {
  const dateKey = crypto.createHmac("sha256", `AWS4${secret}`).update(toDateStamp(date)).digest();
  const dateRegionKey = crypto.createHmac("sha256", dateKey).update(region).digest();
  const dateRegionServiceKey = crypto.createHmac("sha256", dateRegionKey).update(service).digest();
  return crypto.createHmac("sha256", dateRegionServiceKey).update("aws4_request").digest();
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDateStamp(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}
