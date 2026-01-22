# Google Cloud Storage - Workload Identity Federation (OIDC) Setup

## Overview

This application now uses **Workload Identity Federation** to authenticate with Google Cloud Storage (GCS). This eliminates the need for service account JSON key files, which were previously blocked by your organization's policy.

### Key Benefits

✅ **No JSON Keys** - Credentials are never stored as files  
✅ **OIDC Standard** - Uses industry-standard OpenID Connect  
✅ **Railway Compatible** - Fully integrated with Railway's OIDC environment  
✅ **Automatic Auth** - Application Default Credentials (ADC) handles authentication  
✅ **Secure** - Temporary credentials with automatic expiration  

---

## How Workload Identity Federation Works

```
┌─────────────────┐
│   Railway App   │
└────────┬────────┘
         │
         │ 1. Has OIDC_TOKEN (Railway provides)
         │
         ▼
┌──────────────────────────────┐
│   Google STS (Security Token  │
│   Service)                   │
└────────┬─────────────────────┘
         │
         │ 2. Validates OIDC token
         │    using Identity Provider
         │
         ▼
┌──────────────────────────────┐
│  Identity Pool & Provider    │
│  (Google Cloud)              │
└────────┬─────────────────────┘
         │
         │ 3. Issues temporary
         │    credentials
         │
         ▼
┌──────────────────────────────┐
│   Google Cloud Storage       │
│   (with service account)     │
└──────────────────────────────┘
```

**No JSON key files are transmitted or stored anywhere in this flow.**

---

## Setup Instructions

### Step 1: Create a Google Cloud Project (if not already done)

```bash
# List existing projects
gcloud projects list

# Create a new project (optional)
gcloud projects create break-agency-wif --name="Break Agency Workload Identity"
```

### Step 2: Enable Required APIs

```bash
gcloud services enable --project=YOUR_PROJECT_ID \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  serviceusage.googleapis.com
```

### Step 3: Create a Service Account (if not already done)

```bash
gcloud iam service-accounts create break-agency-gcs \
  --project=YOUR_PROJECT_ID \
  --display-name="Break Agency GCS Service Account"
```

### Step 4: Grant GCS Permissions to Service Account

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:break-agency-gcs@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/storage.admin
```

### Step 5: Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create railway-pool \
  --project=YOUR_PROJECT_ID \
  --location=global \
  --display-name="Railway OIDC Pool"
```

**Note the pool resource name format:**
```
projects/YOUR_PROJECT_ID/locations/global/workloadIdentityPools/railway-pool
```

### Step 6: Create Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create-oidc railway-provider \
  --project=YOUR_PROJECT_ID \
  --location=global \
  --workload-identity-pool=railway-pool \
  --display-name="Railway OIDC Provider" \
  --attribute-mapping="google.subject=assertion.sub" \
  --issuer-uri=https://oidc.railway.app
```

**Note the provider resource name format:**
```
projects/YOUR_PROJECT_ID/locations/global/workloadIdentityPools/railway-pool/providers/railway-provider
```

### Step 7: Create IAM Binding

Allow the Railway OIDC provider to assume the service account:

```bash
# Get your Railway project ID from Railway dashboard
RAILWAY_PROJECT_ID="your-railway-project-id"

gcloud iam service-accounts add-iam-policy-binding \
  break-agency-gcs@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --project=YOUR_PROJECT_ID \
  --role=roles/iam.workloadIdentityUser \
  --principal="principalSet://iam.googleapis.com/projects/YOUR_GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/railway-pool/attribute.sub/railway:${RAILWAY_PROJECT_ID}:*"
```

**To find your GCP project number:**
```bash
gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'
```

---

## Environment Variables Setup

Add these environment variables to Railway:

### Required for Workload Identity Federation:

```
GOOGLE_CLOUD_PROJECT = YOUR_PROJECT_ID
GOOGLE_WORKLOAD_IDENTITY_PROVIDER = projects/YOUR_PROJECT_ID/locations/global/workloadIdentityPools/railway-pool/providers/railway-provider
GOOGLE_SERVICE_ACCOUNT_EMAIL = break-agency-gcs@YOUR_PROJECT_ID.iam.gserviceaccount.com
GCS_BUCKET_NAME = break-agency-app-storage
```

### Optional (for backward compatibility):

```
GCS_PROJECT_ID = YOUR_PROJECT_ID  # Falls back to this if GOOGLE_CLOUD_PROJECT not set
```

### What Railway Provides Automatically:

```
OIDC_TOKEN = [automatically set by Railway in OIDC environment]
```

---

## Verification

### 1. Check Configuration Startup Logs

The application will log authentication status on startup:

```
[GCS] Using Workload Identity Federation
[GCS]   - Identity Provider: projects/YOUR_PROJECT_ID/locations/global/workloadIdentityPools/railway-pool/providers/railway-provider
[GCS]   - Service Account: break-agency-gcs@YOUR_PROJECT_ID.iam.gserviceaccount.com
[GCS] Bucket break-agency-app-storage verified
[GCS] Initialized successfully with auth method: Workload Identity Federation (OIDC)
```

### 2. Test File Upload

Make a request to the file upload endpoint. If authentication succeeds, the file will be stored in GCS.

### 3. Check GCS Console

Visit [Google Cloud Console > Cloud Storage](https://console.cloud.google.com/storage) to verify:
- Bucket exists and is accessible
- Files are being uploaded
- No JSON key files are present

---

## Troubleshooting

### Error: "GCS initialization failed: Could not load credentials"

**Cause:** OIDC environment not configured or OIDC_TOKEN not available

**Solution:**
1. Verify Railway has OIDC enabled (check Railway project settings)
2. Verify OIDC_TOKEN environment variable is set in Railway logs
3. Check GOOGLE_WORKLOAD_IDENTITY_PROVIDER format is correct

### Error: "Failed to create bucket"

**Cause:** Service account doesn't have permissions or bucket already exists in another project

**Solution:**
1. Create the bucket manually in GCP console
2. Verify service account has `roles/storage.admin` role
3. Set correct GCS_BUCKET_NAME

### Error: "Unauthorized: 403 Forbidden"

**Cause:** IAM binding not configured or credentials not exchanged correctly

**Solution:**
1. Verify IAM binding was created successfully:
   ```bash
   gcloud iam service-accounts get-iam-policy \
     break-agency-gcs@YOUR_PROJECT_ID.iam.gserviceaccount.com \
     --project=YOUR_PROJECT_ID
   ```
2. Check Railway project ID is correct in IAM binding
3. Verify OIDC provider URL is `https://oidc.railway.app`

### Error: "Invalid identity provider format"

**Cause:** GOOGLE_WORKLOAD_IDENTITY_PROVIDER doesn't include `workloadIdentityPools`

**Solution:**
Ensure the environment variable follows this format:
```
projects/YOUR_PROJECT_ID/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID
```

---

## Code Changes

### Before (Service Account JSON Keys)

```typescript
const GOOGLE_APPLICATION_CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
const storage = new Storage({
  projectId: GCS_PROJECT_ID,
  credentials  // ❌ JSON key passed directly
});
```

### After (Workload Identity Federation)

```typescript
// ✅ No credential parsing or JSON keys
const storage = new Storage({
  projectId: GOOGLE_CLOUD_PROJECT || GCS_PROJECT_ID,
  // ADC automatically detects OIDC environment and uses Railway's OIDC_TOKEN
});
```

**Application Default Credentials (ADC) automatically:**
1. Detects OIDC environment (Railway provides OIDC_TOKEN)
2. Exchanges OIDC token with Google STS
3. Obtains temporary credentials
4. Authenticates with GCS

**No JSON keys are ever involved.**

---

## Security Considerations

### ✅ Secure by Design

- **No Persistent Credentials:** Temporary credentials expire automatically
- **OIDC Standard:** Uses industry-standard authentication
- **Principle of Least Privilege:** Service account has only required permissions
- **Audit Trail:** All operations logged in Google Cloud Audit Logs
- **Network Isolation:** OIDC tokens only exchanged with Google APIs

### ⚠️ Best Practices

1. **Rotate Identities:** Railway OIDC token refreshes automatically
2. **Monitor Access:** Check Google Cloud Audit Logs for unauthorized attempts
3. **Limit Scope:** Create separate service accounts for different environments (dev, staging, prod)
4. **IAM Bindings:** Review IAM bindings quarterly for accuracy

---

## Migration from JSON Keys

If you previously used service account JSON keys:

### 1. Remove Old Configuration

Delete or unset:
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- `GOOGLE_APPLICATION_CREDENTIALS` environment variables

### 2. Add New Configuration

Set the four environment variables listed in "Environment Variables Setup" section

### 3. Verify

- Restart the application
- Check startup logs for "Workload Identity Federation" message
- Test file upload/download operations

### 4. Clean Up GCP

Once verified working, you can optionally:
- Delete old service account JSON keys from GCP console
- Create a new service account for OIDC (optional but cleaner)

---

## References

- [Google Workload Identity Federation Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Railway OIDC Documentation](https://docs.railway.app/deploy/environment-variables#oidc)
- [Google Cloud Storage Client Library](https://cloud.google.com/nodejs/docs/reference/storage/latest)

---

## Support

If you encounter issues:

1. Check startup logs for authentication method and configuration
2. Verify all environment variables are set correctly
3. Review Google Cloud Audit Logs for detailed error information
4. Check Railway OIDC is enabled in project settings

**Key Log Locations:**
- Railway: Deployment logs show OIDC_TOKEN and environment variables
- Google Cloud: [Cloud Logging](https://console.cloud.google.com/logs) shows GCS API errors
- Application: Server stdout/stderr shows [GCS] prefixed logs
