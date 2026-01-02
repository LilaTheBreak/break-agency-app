# Google Cloud Storage Implementation Summary

## Overview
The Break app has been migrated from AWS S3 to Google Cloud Storage (GCS) as the primary file storage system. All file uploads, downloads, and storage operations now use GCS.

## Implementation Details

### Files Created
- `apps/api/src/services/storage/googleCloudStorage.ts` - Main GCS service abstraction

### Files Modified
- `apps/api/src/routes/files.ts` - Updated to use GCS instead of S3
- `apps/api/src/services/fileService.ts` - Migrated all file operations to GCS
- `apps/api/src/services/s3Upload.ts` - Updated to use GCS (kept for backward compatibility)
- `apps/api/src/services/aiAgent/fileExtractors.ts` - Updated file extraction to use GCS
- `apps/api/src/server.ts` - Added GCS configuration validation
- `apps/api/package.json` - Added `@google-cloud/storage` dependency

### Dependencies Added
- `@google-cloud/storage@7.18.0`

## Environment Variables

### Required (Production)
```bash
GCS_PROJECT_ID=break-agency-storage
GCS_BUCKET_NAME=break-agency-app-storage
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### Setup Instructions

1. **Create Service Account in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select project: `break-agency-storage`
   - Navigate to: IAM & Admin → Service Accounts
   - Create new service account or use existing
   - Grant "Storage Admin" role
   - Create JSON key and download

2. **Set Environment Variables in Railway:**
   - Go to Railway dashboard → Your service → Variables
   - Add `GCS_PROJECT_ID`: `break-agency-storage`
   - Add `GCS_BUCKET_NAME`: `break-agency-app-storage`
   - Add `GOOGLE_APPLICATION_CREDENTIALS_JSON`: (paste entire JSON key as a single-line string)

3. **Create GCS Bucket (if not exists):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/storage)
   - Create bucket: `break-agency-app-storage`
   - Location: `europe-west2` (London)
   - Storage class: `Standard`
   - Access control: `Uniform` (bucket-level IAM)
   - Public access: **Disabled** (private by default)

## Storage Service API

### `uploadFile(buffer, filename, mimeType, folder?, userId?)`
Uploads a file to GCS and returns metadata.

**Parameters:**
- `buffer: Buffer` - File content
- `filename: string` - Original filename
- `mimeType: string` - MIME type (e.g., "image/png", "application/pdf")
- `folder?: string` - Optional folder (e.g., "contracts", "avatars", "briefs")
- `userId?: string` - User ID for organizing files

**Returns:**
```typescript
{
  key: string;        // Storage path (e.g., "contracts/user123/2025/01/uuid-filename.pdf")
  url: string;        // Signed URL (expires in 1 hour)
  signedUrl: string;  // Same as url
  mimeType: string;   // MIME type
}
```

**Example:**
```typescript
import { uploadFile } from "./services/storage/googleCloudStorage.js";

const result = await uploadFile(
  buffer,
  "contract.pdf",
  "application/pdf",
  "contracts",
  userId
);
// result.key: "contracts/user123/2025/01/uuid-contract.pdf"
// result.signedUrl: "https://storage.googleapis.com/..."
```

### `getSignedUrl(key, expiresIn?)`
Generates a signed URL for accessing a file.

**Parameters:**
- `key: string` - Object key (storage path)
- `expiresIn?: number` - Expiration in seconds (default: 900 = 15 minutes, max: 7 days)

**Returns:**
```typescript
string // Signed URL
```

**Example:**
```typescript
import { getSignedUrl } from "./services/storage/googleCloudStorage.js";

const url = await getSignedUrl("contracts/user123/2025/01/uuid-contract.pdf", 3600);
// URL expires in 1 hour
```

### `deleteFile(key)`
Deletes a file from GCS.

**Parameters:**
- `key: string` - Object key (storage path)

**Example:**
```typescript
import { deleteFile } from "./services/storage/googleCloudStorage.js";

await deleteFile("contracts/user123/2025/01/uuid-contract.pdf");
```

### `buildObjectKey(userId, filename, folder?)`
Builds a storage path for a file.

**Parameters:**
- `userId: string` - User ID
- `filename: string` - Original filename
- `folder?: string` - Optional folder

**Returns:**
```typescript
string // Storage path (e.g., "contracts/user123/2025/01/uuid-filename.pdf")
```

## File Organization

Files are organized in GCS using the following structure:
```
{folder}/{userId}/{year}/{month}/{uuid}-{sanitized-filename}
```

**Examples:**
- `contracts/user123/2025/01/550e8400-e29b-41d4-a716-446655440000-contract.pdf`
- `uploads/user456/2025/01/6ba7b810-9dad-11d1-80b4-00c04fd430c8-image.png`
- `briefs/user789/2025/01/6ba7b811-9dad-11d1-80b4-00c04fd430c8-brief.docx`

## Security

### Access Control
- **Files are private by default** - No public access
- **Signed URLs** - All file access uses time-limited signed URLs
- **Server-side only** - Signed URLs are generated server-side, never exposed in client code
- **IAM-based** - Access controlled via service account permissions

### Signed URL Expiration
- Default: 15 minutes (900 seconds)
- Configurable: 1 minute to 7 days
- URLs automatically expire and cannot be reused

## Migration Notes

### What Changed
1. **Storage Provider**: AWS S3 → Google Cloud Storage
2. **Authentication**: AWS credentials → GCS service account JSON
3. **URL Generation**: S3 presigned URLs → GCS signed URLs
4. **File Paths**: S3 object keys → GCS object keys (same format)

### Backward Compatibility
- File keys (paths) remain the same format
- Database records unchanged (only URLs may differ)
- API endpoints unchanged
- Frontend code unchanged

### Removed Dependencies
- `@aws-sdk/client-s3` - Still in package.json but no longer used
- `@aws-sdk/s3-request-presigner` - Still in package.json but no longer used

**Note:** These can be removed in a future cleanup, but kept for now to avoid breaking changes.

## Testing

### Local Testing
1. Set environment variables in `.env`:
   ```bash
   GCS_PROJECT_ID=break-agency-storage
   GCS_BUCKET_NAME=break-agency-app-storage
   GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
   ```

2. Test file upload:
   ```bash
   curl -X POST http://localhost:5001/api/files/upload \
     -H "Content-Type: application/json" \
     -H "Cookie: session=..." \
     -d '{
       "filename": "test.pdf",
       "content": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMy..."
     }'
   ```

### Production Testing
1. Verify environment variables are set in Railway
2. Check server logs for GCS initialization:
   ```
   [GCS] Initialized for project: break-agency-storage, bucket: break-agency-app-storage
   [GCS] Bucket break-agency-app-storage verified
   ```
3. Test file upload via frontend or API
4. Verify file appears in GCS bucket in Google Cloud Console

## Troubleshooting

### "GOOGLE_APPLICATION_CREDENTIALS_JSON is required"
**Cause:** Environment variable not set or empty.

**Fix:** Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` in Railway with the full service account JSON as a single-line string.

### "Bucket does not exist"
**Cause:** Bucket `break-agency-app-storage` doesn't exist in project `break-agency-storage`.

**Fix:** 
1. Create bucket in [Google Cloud Console](https://console.cloud.google.com/storage)
2. Or wait for automatic creation (may fail if service account lacks permissions)

### "GCS upload failed"
**Cause:** Service account lacks permissions or bucket doesn't exist.

**Fix:**
1. Verify service account has "Storage Admin" role
2. Verify bucket exists and is accessible
3. Check Railway logs for detailed error messages

### Signed URLs expire too quickly
**Cause:** Default expiration is 15 minutes.

**Fix:** Increase expiration when calling `getSignedUrl()`:
```typescript
const url = await getSignedUrl(key, 3600); // 1 hour
```

## Next Steps

1. **Remove S3 Dependencies** (optional cleanup):
   - Remove `@aws-sdk/client-s3` from package.json
   - Remove `@aws-sdk/s3-request-presigner` from package.json
   - Remove `apps/api/src/lib/s3.ts` (if no longer needed)

2. **Monitor Usage**:
   - Check GCS bucket usage in Google Cloud Console
   - Monitor costs (free tier: 5GB storage, 5,000 Class A operations/month)

3. **Optimize**:
   - Consider lifecycle policies for old files
   - Implement file versioning if needed
   - Add CDN integration for frequently accessed files

## References

- [Google Cloud Storage Node.js Client](https://cloud.google.com/nodejs/docs/reference/storage/latest)
- [GCS Signed URLs Documentation](https://cloud.google.com/storage/docs/access-control/signing-urls-with-helpers)
- [GCS IAM Permissions](https://cloud.google.com/storage/docs/access-control/iam-permissions)

