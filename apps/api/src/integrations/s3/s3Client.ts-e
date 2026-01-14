function buildStubUrl(key: string) {
  return `https://stub-s3.local/${key}`;
}

export async function getPresignedPost(key: string) {
  console.log("[S3 STUB] getPresignedPost", key);
  return {
    url: buildStubUrl(key),
    fields: {}
  };
}

export async function uploadToS3(key: string, buffer: Buffer, type?: string) {
  console.log("[S3 STUB] uploadToS3", { key, type });
  return buildStubUrl(key);
}

export async function uploadFileToS3(
  buffer: Buffer,
  contentType: string,
  filename: string,
  folder: string
) {
  const key = `${folder}/${Date.now()}-${filename}`;
  const url = await uploadToS3(key, buffer, contentType);
  console.log("[S3 STUB] uploadFileToS3", { key, url });
  return { key, url };
}

export default {
  getPresignedPost,
  uploadToS3,
  uploadFileToS3
};
