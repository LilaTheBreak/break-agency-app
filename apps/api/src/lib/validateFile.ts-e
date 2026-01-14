export function validateUploadedFile(file: Express.Multer.File) {
  if (!file) {
    throw new Error("File is required");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large (limit 10MB)");
  }

  if (!file.mimetype) {
    throw new Error("Invalid file type");
  }

  return true;
}
