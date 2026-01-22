# GCS Workload Identity Federation - Quick Reference

## Current Implementation Status

✅ **Code Migration Complete**
- [apps/api/src/services/storage/googleCloudStorage.ts](apps/api/src/services/storage/googleCloudStorage.ts) - Updated to use ADC with OIDC
- [apps/api/src/services/aiAgent/fileExtractors.ts](apps/api/src/services/aiAgent/fileExtractors.ts) - Updated to use ADC with OIDC
- [apps/api/src/server.ts](apps/api/src/server.ts) - Updated validation and logging

**Key Changes:**
- Removed all `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable parsing
- Removed JSON key file handling
- Implemented Application Default Credentials (ADC) for OIDC support
- Added comprehensive error logging for OIDC authentication issues

---

## What Was Changed

### 1. Storage Client Initialization

**Before:**
```typescript
const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
const storage = new Storage({
  projectId: GCS_PROJECT_ID,
  credentials
});
```

**After:**
```typescript
const storage = new Storage({
  projectId: GOOGLE_CLOUD_PROJECT || GCS_PROJECT_ID,
  // ADC automatically uses OIDC credentials from Railway
});
```

### 2. Error Logging

Now includes:
- Which authentication method is in use
- Identity provider configuration
- Service account email
- Helpful troubleshooting information if auth fails

### 3. Validation

Updated to check:
- GOOGLE_CLOUD_PROJECT (or GCS_PROJECT_ID as fallback)
- GCS_BUCKET_NAME
- GOOGLE_WORKLOAD_IDENTITY_PROVIDER format (with detailed validation)
- GOOGLE_SERVICE_ACCOUNT_EMAIL format (with detailed validation)
- OIDC_TOKEN availability warning

---

## Environment Variables Required

| Variable | Value | Example |
|----------|-------|---------|
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | `my-project-123` |
| `GOOGLE_WORKLOAD_IDENTITY_PROVIDER` | WIF Provider URL | `projects/123456/locations/global/workloadIdentityPools/railway-pool/providers/railway-provider` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account Email | `break-agency-gcs@my-project-123.iam.gserviceaccount.com` |
| `GCS_BUCKET_NAME` | GCS Bucket Name | `break-agency-app-storage` |
| `OIDC_TOKEN` | Auto-set by Railway | (provided by Railway in OIDC environment) |

---

## Startup Logs to Expect

### Successful Configuration

```
>>> GOOGLE_CLOUD_PROJECT = my-project-123
>>> GOOGLE_WORKLOAD_IDENTITY_PROVIDER = [SET]
>>> GOOGLE_SERVICE_ACCOUNT_EMAIL = [SET]
>>> OIDC_TOKEN (Railway) = [SET]
...
[GCS] Using Workload Identity Federation
[GCS]   - Identity Provider: projects/123456/locations/global/workloadIdentityPools/railway-pool/providers/railway-provider
[GCS]   - Service Account: break-agency-gcs@my-project-123.iam.gserviceaccount.com
[GCS] Bucket break-agency-app-storage verified
[GCS] Initialized successfully with auth method: Workload Identity Federation (OIDC)
✅ GCS configuration validated
   Auth method: Workload Identity Federation (OIDC)
```

### Configuration Warnings

If `GOOGLE_WORKLOAD_IDENTITY_PROVIDER` or `GOOGLE_SERVICE_ACCOUNT_EMAIL` are not set:

```
⚠️  WARNING: GCS CONFIGURATION INCOMPLETE:
   ⚠️  GOOGLE_WORKLOAD_IDENTITY_PROVIDER is not set - Workload Identity Federation not configured
   ⚠️  GOOGLE_SERVICE_ACCOUNT_EMAIL is not set - Workload Identity Federation not configured
   ⚠️  OIDC_TOKEN not available - ensure running in Railway with OIDC enabled
```

---

## Upload Route Compatibility

### No Breaking Changes

All existing upload endpoints work exactly the same:
- File upload still returns signed URLs
- Signed URL generation is unchanged
- File deletion works the same
- File metadata retrieval works the same

**Example Upload Response (Unchanged):**
```json
{
  "key": "uploads/user-123/2026/01/uuid-filename.pdf",
  "url": "https://storage.googleapis.com/break-agency-app-storage/uploads/...",
  "signedUrl": "https://storage.googleapis.com/break-agency-app-storage/uploads/...?X-Goog-Signature=...",
  "mimeType": "application/pdf"
}
```

---

## Testing the Migration

### 1. Deploy Updated Code

```bash
git add apps/api/src/services/storage/googleCloudStorage.ts
git add apps/api/src/services/aiAgent/fileExtractors.ts
git add apps/api/src/server.ts
git commit -m "feat: Migrate GCS to Workload Identity Federation (OIDC)"
git push
```

### 2. Configure Railway Environment Variables

In Railway Project Settings → Variables:
- Set `GOOGLE_CLOUD_PROJECT`
- Set `GOOGLE_WORKLOAD_IDENTITY_PROVIDER`
- Set `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- Ensure `GCS_BUCKET_NAME` is set
- Remove `GOOGLE_APPLICATION_CREDENTIALS_JSON` if present

### 3. Deploy and Check Logs

Redeploy and watch startup logs for:
```
[GCS] Using Workload Identity Federation
[GCS] Bucket [...] verified
[GCS] Initialized successfully with auth method: Workload Identity Federation (OIDC)
✅ GCS configuration validated
```

### 4. Test File Upload

Make a file upload request:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should succeed with a signed URL in response.

### 5. Verify in GCS Console

Check [Google Cloud Storage console](https://console.cloud.google.com/storage) that:
- File appears in the bucket
- No JSON key files are present
- Bucket shows recent activity

---

## Rollback (If Needed)

If you need to temporarily revert to JSON keys:

1. **Add back the old code:**
   ```bash
   git revert <commit-hash>
   ```

2. **Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` in Railway**

3. **Redeploy**

**Note:** This is not recommended for production. OIDC is more secure.

---

## Google Cloud Commands Reference

### List Created Resources
```bash
# Workload Identity Pools
gcloud iam workload-identity-pools list --location=global --project=YOUR_PROJECT_ID

# Workload Identity Providers
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=railway-pool \
  --location=global \
  --project=YOUR_PROJECT_ID

# Service Accounts
gcloud iam service-accounts list --project=YOUR_PROJECT_ID

# Service Account IAM Bindings
gcloud iam service-accounts get-iam-policy \
  break-agency-gcs@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --project=YOUR_PROJECT_ID
```

### Debugging OIDC Token Exchange
```bash
# View GCS API activity in logs
gcloud logging read "resource.type=gcs_bucket" \
  --limit=50 \
  --project=YOUR_PROJECT_ID
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Could not load credentials" | OIDC_TOKEN not available | Enable OIDC in Railway project settings |
| "Unauthorized: 403" | IAM binding missing | Create IAM binding between service account and OIDC provider |
| "workloadIdentityPools" format error | Invalid provider URL | Use exact format: `projects/ID/locations/global/workloadIdentityPools/...` |
| "Bucket does not exist" | Wrong bucket name | Verify GCS_BUCKET_NAME matches actual GCS bucket |
| "permission denied" | Service account lacks permissions | Grant `roles/storage.admin` to service account |

---

## Next Steps

1. ✅ Code is ready - all changes are complete
2. 📝 Create GCP resources (Workload Identity Pool, Provider, IAM binding)
3. 🔧 Configure environment variables in Railway
4. 🚀 Deploy and verify with startup logs
5. 📋 Test file upload/download functionality
6. 🧹 Remove old `GOOGLE_APPLICATION_CREDENTIALS_JSON` variable
