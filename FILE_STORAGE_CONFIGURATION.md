# File Storage Configuration Guide

## Overview

The break-agency-app supports multiple storage backends for file uploads:
- **AWS S3** (default)
- **Cloudflare R2** (S3-compatible)
- **Local storage** (fallback for development)

## Required Environment Variables

### For AWS S3:
```bash
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key-id
S3_SECRET_KEY=your-secret-access-key
```

### For Cloudflare R2:
```bash
S3_BUCKET=your-r2-bucket-name
S3_REGION=auto
S3_ACCESS_KEY=your-r2-access-key-id
S3_SECRET_KEY=your-r2-secret-access-key
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=true
```

### Optional Configuration:
```bash
STORAGE_DRIVER=s3  # Options: s3, uploadthing, local (default: s3)
```

## Storage Backend Selection

The system automatically selects the storage backend based on environment variables:

1. **S3/R2**: If `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` are set
2. **UploadThing**: If `STORAGE_DRIVER=uploadthing` and `UPLOADTHING_URL`/`UPLOADTHING_KEY` are set
3. **Local**: Falls back to local filesystem storage in `uploads/` directory

## File Upload Endpoints

### 1. Base64 Upload (`/api/files/upload`)
- Used by: `FileUploadPanel` component
- Method: POST
- Body: `{ filename, content (base64), folder }`
- Returns: `{ file: { id, url, filename, type, size } }`

### 2. Multipart Upload (`/api/resources/upload`)
- Used by: Resource Hub
- Method: POST
- Content-Type: `multipart/form-data`
- Field: `file`
- Returns: `{ url, fileId, filename, type, size }`

### 3. Pre-signed URL (`/api/files/upload-url`)
- Used by: Direct S3 uploads
- Method: POST
- Body: `{ filename, contentType }`
- Returns: `{ uploadUrl, key }`

## File Validation

### Allowed File Types:
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, `.xlsx`
- Archives: `application/zip`, `application/x-zip-compressed`
- Media: `.mov`, `.mp4`

### File Size Limits:
- Default: 50MB per file
- Configurable via multer limits

## Error Handling

The system includes graceful error handling:

1. **S3 Upload Failure**: Falls back to creating stub record with warning
2. **Invalid File Type**: Returns 400 with clear error message
3. **File Size Exceeded**: Returns 413 with size limit information
4. **Storage Unavailable**: Logs error and returns 503

## Security Considerations

- All uploads require authentication (`requireAuth` middleware)
- Admin-only endpoints: `/api/resources/upload`
- User-scoped uploads: Files are stored under `uploads/{userId}/` prefix
- Signed URLs: Download URLs expire after 15 minutes (configurable)

## Database Schema

Files are stored in the `File` model:
```prisma
model File {
  id        String
  userId    String
  key       String    // Storage key (S3 path)
  url       String    // Public or signed URL
  filename  String
  type      String    // MIME type
  folder    String?   // Optional folder grouping
  size      Int?      // File size in bytes
  createdAt DateTime
  updatedAt DateTime
}
```

## Testing Storage Configuration

1. **Check Environment Variables**: Ensure all required vars are set
2. **Test Upload**: Use `/api/files/upload` endpoint with a test file
3. **Verify Storage**: Check that file appears in S3/R2 bucket
4. **Test Download**: Verify file can be retrieved via URL

## Cloudflare R2 Setup

1. Create R2 bucket in Cloudflare dashboard
2. Generate API token with R2 read/write permissions
3. Set environment variables:
   - `S3_ENDPOINT`: Your R2 endpoint URL
   - `S3_FORCE_PATH_STYLE=true`: Required for R2
   - `S3_REGION=auto`: R2 doesn't use regions
4. Use R2 API token credentials for `S3_ACCESS_KEY` and `S3_SECRET_KEY`

## Troubleshooting

### Upload Fails with "S3 Error"
- Check bucket name and region
- Verify credentials have correct permissions
- For R2: Ensure `S3_ENDPOINT` is set correctly

### Files Not Accessible
- Check bucket CORS configuration
- Verify signed URL expiration settings
- Ensure bucket is publicly readable (if using public URLs)

### Local Storage Fallback
- If S3/R2 is not configured, files save to `apps/api/uploads/`
- Local URLs: `/uploads/{key}`
- Not suitable for production

