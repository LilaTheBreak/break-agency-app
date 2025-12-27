# FILE UPLOAD & STORAGE AUDIT

**Date:** 27 December 2025  
**Status:** ⚠️ INFRASTRUCTURE EXISTS BUT DISABLED  
**S3 Configuration:** ❌ NOT CONFIGURED

---

## EXECUTIVE SUMMARY

File upload infrastructure is **fully implemented** but **completely disabled** via feature flag. The system has:
- ✅ Complete upload UI components (`FileUploader.jsx`, `FileUploadPanel.jsx`)
- ✅ Backend API routes (`/api/files/*`)
- ✅ Database schema (`File` model)
- ✅ S3 integration code with fallback to stub URLs
- ❌ **S3 credentials NOT configured** (all uploads return stub URLs)
- ❌ **Feature flag disabled**: `FILE_UPLOAD_ENABLED: false`

**Workaround:** Users must paste external file URLs (Google Drive, Dropbox, etc.) into text fields.

---

## FILE UPLOAD STATUS BY FEATURE

### ✅ WORKING: Admin Resource Hub File Uploads
**Location:** `/admin/resource-hub`  
**Status:** FULLY FUNCTIONAL (Admin-only feature)  
**How:** 
- Uses dedicated `/api/resources/upload` endpoint
- Bypasses `FILE_UPLOAD_ENABLED` flag
- Stores file metadata (filename, type, size) in database
- **Currently returns stub S3 URLs** but UI accepts them

**Evidence:**
```javascript
// apps/web/src/pages/AdminResourceHub.jsx:149
const handleFileUpload = async (file, fieldName) => {
  const formDataUpload = new FormData();
  formDataUpload.append("file", file);
  const response = await fetch(`${API_BASE}/api/resources/upload`, {
    method: "POST",
    credentials: "include",
    body: formDataUpload,
  });
  // Stores: uploadUrl, uploadFilename, uploadFileType, uploadFileSize
}
```

---

### ❌ DISABLED: Contract PDF Uploads
**Location:** Contract management panels  
**Status:** BUTTON VISIBLE BUT NON-FUNCTIONAL  
**Why:** Feature flag disabled + S3 not configured

**Evidence:**
```jsx
// apps/web/src/components/ContractsPanel.jsx:417
<button onClick={() => handleUploadSigned(contract.id)}>
  Upload signed
</button>

// Handler just marks contract as "Signed" without actual file:
const handleUploadSigned = (contractId) => {
  setContracts((prev) =>
    prev.map((c) =>
      c.id === contractId
        ? { ...c, status: "Signed", 
            documents: [...(c.documents || []), 
              { label: "Signed copy", url: "#", updatedAt: new Date() }]
          }
        : c
    )
  );
};
```

**Manual Workaround:** 
- Admin marks contract as "Signed" manually
- External contract PDF URL can be pasted into contract details

---

### ❌ DISABLED: Deliverable Proof Uploads
**Location:** Deal/opportunity deliverables tracking  
**Status:** NO UPLOAD UI SHOWN  
**Why:** `FILE_UPLOAD_ENABLED: false` gates the upload components

**Evidence:**
```javascript
// apps/web/src/config/features.js:125
FILE_UPLOAD_ENABLED: false,

// Explanation comment:
"File upload will be available once storage is configured."
```

**Manual Workaround:**
- Creator/brand pastes proof URL (YouTube, Dropbox, etc.) into deliverable notes
- Admin manually verifies proof and marks deliverable complete

---

### ❌ DISABLED: Brief Attachments / Deal Documents
**Location:** Brand Dashboard, Creator Dashboard, Admin Approvals  
**Status:** UPLOAD PANEL SHOWN BUT DISABLED  
**Why:** Feature flag check blocks upload button

**Evidence:**
```jsx
// apps/web/src/components/FileUploadPanel.jsx:102
<FeatureGate feature={UPLOAD_FLAG} mode="button">
  <label className="inline-flex cursor-pointer">
    {uploading ? "Uploading…" : "Upload file"}
    <input type="file" onChange={handleUpload} 
           disabled={!isUploadEnabled} />
  </label>
</FeatureGate>

// Shows disabled notice:
{!isUploadEnabled && <DisabledNotice feature={UPLOAD_FLAG} />}
```

**Used in:**
- `BrandDashboard.jsx` (line 685): Brief attachments
- `CreatorDashboard.jsx`: Deal documents
- `AdminApprovalsPage.jsx` (line 283): Application supporting docs

**Manual Workaround:**
- Users share files via Google Drive/Dropbox
- Admin pastes shared links into deal notes

---

### ⚠️ MANUAL WORKAROUND: Avatar/Profile Images
**Location:** Profile pages (`ProfilePage.jsx`, `ProfilePageNew.jsx`)  
**Status:** URL INPUT FIELD (NO UPLOAD BUTTON)  
**How:** Users paste direct image URL

**Evidence:**
```jsx
// apps/web/src/pages/ProfilePageNew.jsx:256
<Field label="Profile photo" helper="Used everywhere">
  <input
    type="url"
    name="avatarUrl"
    value={identity.avatarUrl}
    onChange={handleChange}
    placeholder="https://your-photo.jpg or upload URL"
  />
</Field>
```

**Works because:** No upload needed, just stores URL string in database.

---

## S3/STORAGE CONFIGURATION STATUS

### Environment Variables
**Location:** `apps/api/.env.example`

```bash
S3_BUCKET=          # ❌ Not set
S3_REGION=          # ❌ Not set
S3_ACCESS_KEY=      # ❌ Not set
S3_SECRET_KEY=      # ❌ Not set
S3_ENDPOINT=        # ❌ Not set (for Cloudflare R2)
S3_FORCE_PATH_STYLE=false
```

**Actual `.env` status:** No S3 variables configured (checked via `grep`)

### Storage Drivers Available
**Location:** `apps/api/src/services/storage/storageClient.ts`

```typescript
const DRIVER = process.env.STORAGE_DRIVER || "s3"; // Default: s3
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "";

// Fallback chain:
if (DRIVER === "s3" && S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY) {
  return uploadToS3(buffer, filename, folder);
}
return uploadToLocal(buffer, filename, folder); // Fallback: ./uploads/
```

**Supported Drivers:**
1. `s3` - AWS S3 or S3-compatible (Cloudflare R2, DigitalOcean Spaces)
2. `uploadthing` - UploadThing service (requires `UPLOADTHING_URL`, `UPLOADTHING_KEY`)
3. `local` - Local filesystem (`uploads/` directory)

**Current State:** Falls back to local storage but **returns stub URLs** instead of real presigned URLs.

---

## API ROUTES INVENTORY

### `/api/files/*` Routes
**Location:** `apps/api/src/routes/files.ts`

| Endpoint | Method | Status | Purpose | Auth |
|----------|--------|--------|---------|------|
| `/api/files` | GET | ✅ Working | List user files | Required |
| `/api/files/upload-url` | POST | ⚠️ Returns stub | Request presigned upload URL | Required |
| `/api/files/upload` | POST | ⚠️ Returns stub | Direct base64 upload | Required |
| `/api/files/confirm` | POST | ✅ Working | Confirm upload, save to DB | Required |
| `/api/files/:id/download` | GET | ⚠️ Returns stub | Get download URL | Required |
| `/api/files/:id` | DELETE | ✅ Working | Delete file record | Required |

**Stub URL Example:**
```typescript
// apps/api/src/services/fileService.ts:7
return {
  uploadUrl: `https://example.com/${key}`,
  fileKey: key
};

// apps/api/src/services/fileService.ts:14
const url = `https://example.com/${fileKey}`;
```

### `/api/resources/upload` Route
**Location:** `apps/api/src/routes/resources.ts` (implied from frontend)  
**Status:** ✅ Working (Admin-only)  
**Auth:** `requireAuth` + `requireAdmin` middleware  
**Returns:** File metadata with stub URL

---

## DATABASE SCHEMA

### `File` Model
**Location:** `apps/api/prisma/schema.prisma:559`

```prisma
model File {
  id        String   @id
  userId    String?
  key       String    // S3 object key
  url       String?   // Public URL or presigned URL
  filename  String
  type      String    // MIME type
  folder    String?   // Optional organization folder
  size      Int?
  createdAt DateTime @default(now())
  updatedAt DateTime
  User      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([folder])
  @@index([userId])
}
```

**Supported Features:**
- ✅ User ownership with cascading delete
- ✅ Folder organization
- ✅ MIME type tracking
- ✅ File size metadata
- ✅ Indexed for fast queries

---

## UPLOAD FLOW ARCHITECTURE

### Two-Phase Upload (FileUploader.jsx)
**Location:** `apps/web/src/components/FileUploader.jsx`

```javascript
// Phase 1: Request presigned URL
const { uploadUrl, fileKey } = await requestUploadUrl({
  filename: file.name,
  contentType: file.type
});

// Phase 2: Upload directly to S3 (currently stub)
await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file
});

// Phase 3: Confirm upload, save to database
const saved = await confirmUpload({ 
  fileKey, 
  filename: file.name, 
  type: file.type 
});
```

**Progress Tracking:**
- 10% - Requesting upload URL
- 30% - Uploading file
- 80% - Confirming upload
- 100% - Complete

### Base64 Upload (FileUploadPanel.jsx)
**Location:** `apps/web/src/components/FileUploadPanel.jsx:48`

```javascript
const handleUpload = async (event) => {
  const file = event.target.files?.[0];
  const response = await uploadFileRequest({ file, folder });
  // Internally converts to base64 and sends via POST
};

// apps/web/src/services/fileClient.js:5
const content = await fileToBase64(file);
await apiFetch("/files/upload", {
  method: "POST",
  body: JSON.stringify({
    filename: file.name,
    content, // base64 data URL
    folder
  })
});
```

**Allowed File Types:** PDF, PNG, MOV, MP4, DOCX  
**Validation:** `apps/web/src/services/fileClient.js:3`

---

## FEATURE FLAGS

### `FILE_UPLOAD_ENABLED`
**Location:** `apps/web/src/config/features.js:125`

```javascript
/**
 * File Upload
 * UNLOCK WHEN:
 * - S3/Cloudflare R2/storage backend configured
 * - File upload API tested
 * - File validation implemented
 */
FILE_UPLOAD_ENABLED: false,
```

**Explanation shown to users:**
```javascript
// Line 226
FILE_UPLOAD_ENABLED: "File upload will be available once storage is configured."
```

### Feature Gate Component
**Usage Pattern:**
```jsx
<FeatureGate feature="FILE_UPLOAD_ENABLED" mode="button">
  <button>Upload file</button>
</FeatureGate>
```

**Behavior when disabled:**
- Button remains visible but disabled
- Shows `<DisabledNotice>` with explanation
- Input field `disabled={true}`

---

## RATE LIMITING

### File Upload Limits
**Location:** `apps/api/src/middleware/rateLimit.ts:71`

```typescript
FILE_UPLOAD: {
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 10,                   // 10 uploads per window
  message: "Too many file uploads. Try again later."
}
```

**Applied to:** All `/api/files/*` routes

---

## WHAT HAPPENS WHEN CLICKED?

### 1. Upload Button in FileUploadPanel
**Current Behavior:**
```
Click "Upload file" → Button disabled, no action
Show: "File upload will be available once storage is configured."
```

**Expected Behavior (when enabled):**
```
Click → File picker → Select file → Base64 encode → POST /api/files/upload
→ Returns stub URL → Save to database → Display in file list
```

### 2. Upload Button in FileUploader
**Current Behavior:**
```
Click → File picker → requestUploadUrl() → Returns https://example.com/...
→ PUT to example.com (fails silently or times out)
→ confirmUpload() → Saves stub URL to database
→ Shows "✓ Upload complete" but file not actually uploaded
```

**Expected Behavior (when S3 configured):**
```
Click → Request presigned URL → Upload to S3 → Confirm → Save real S3 URL
```

### 3. "Upload Signed" in ContractsPanel
**Current Behavior:**
```
Click → handleUploadSigned() → Marks contract as "Signed"
→ Adds mock document: { label: "Signed copy", url: "#" }
→ No file picker shown, no actual upload
```

**Expected Behavior:**
```
Click → File picker → Upload PDF → Save S3 URL → Attach to contract
```

### 4. Avatar URL Input
**Current Behavior:**
```
Paste URL → onChange → Save to database → Works perfectly
(No upload button exists)
```

---

## ALTERNATIVE FILE URL INPUTS

### Where Manual URL Entry Works

1. **Profile Avatar**
   - Field: `avatarUrl` (text input)
   - Placeholder: "https://your-photo.jpg or upload URL"
   - Status: ✅ Works

2. **Contract File URL** (if schema supports)
   - Would need text field for `fileUrl`
   - Status: ⚠️ Not exposed in UI

3. **Deliverable Proof URL**
   - Field: Notes/description area
   - Status: ⚠️ Workaround via text field

4. **Resource Links** (Admin Resource Hub)
   - Field: `uploadUrl` (currently for uploaded files)
   - Status: ✅ Accepts manual URLs

---

## HIDDEN/DISABLED UPLOAD BUTTONS

### Completely Hidden
- ❌ None - All upload components remain visible but disabled

### Disabled with Notice
- ✅ `FileUploadPanel` in Brand/Creator Dashboards
- ✅ `FileUploadPanel` in Admin Approvals
- ✅ Brief attachments upload

### Visible but Non-Functional
- ⚠️ "Upload signed" button in ContractsPanel (looks enabled but doesn't upload)

### Not Present at All
- ✅ Profile avatar upload button (design choice: URL input instead)
- ✅ Deliverable proof upload (no UI component)

---

## WORKAROUNDS FOR BETA LAUNCH

### For Users
1. **Contracts:** 
   - Email signed PDF to admin
   - Admin marks contract as "Signed" manually
   - Store PDF in Google Drive, paste link in notes

2. **Deliverable Proofs:**
   - Post content on platforms (Instagram, YouTube)
   - Share public link in deliverable notes
   - Screenshot + upload to Imgur/Google Photos, paste link

3. **Brief Attachments:**
   - Upload deck to Google Drive/Dropbox
   - Share public link
   - Paste link in opportunity description

4. **Profile Images:**
   - Upload to imgur.com or similar
   - Copy direct image URL
   - Paste into avatar URL field

### For Admins
- Enable Resource Hub uploads (already working)
- Manually track external file links in CRM notes
- Use "Workspace mode" for contracts

---

## ENABLING FILE UPLOADS - CHECKLIST

### Option A: Configure S3 (AWS/R2)
```bash
# apps/api/.env
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1  # or auto for Cloudflare R2
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_ENDPOINT=https://xxxx.r2.cloudflarestorage.com  # For R2 only
S3_FORCE_PATH_STYLE=true  # For R2
```

**Steps:**
1. Create S3 bucket or Cloudflare R2 bucket
2. Configure CORS (allow PUT from your domain)
3. Generate access keys
4. Add to `.env`
5. Test with `npx prisma db execute --stdin <<< "SELECT 1"`
6. Enable flag: `FILE_UPLOAD_ENABLED: true`

### Option B: Use Local Storage (Not Recommended for Production)
```bash
# apps/api/.env
STORAGE_DRIVER=local
# No other config needed
```

**Limitations:**
- Files stored in `apps/api/uploads/`
- Not accessible via CDN
- Lost on container restart (unless volume mounted)
- No presigned URLs (public paths only)

### Option C: Use UploadThing Service
```bash
# apps/api/.env
STORAGE_DRIVER=uploadthing
UPLOADTHING_URL=https://your-uploadthing-instance.com
UPLOADTHING_KEY=your-api-key
```

**Requires:** UploadThing account and setup

---

## POST-ENABLEMENT TASKS

1. **Update Feature Flag:**
   ```javascript
   // apps/web/src/config/features.js
   FILE_UPLOAD_ENABLED: true,
   ```

2. **Test Upload Flow:**
   - Upload PDF (contract test)
   - Upload image (avatar test)
   - Upload video (proof test)
   - Verify S3 URLs are real, not stub

3. **Update UI:**
   - Remove or update "File upload will be available..." notices
   - Test file picker on all platforms (desktop, mobile)

4. **Database Cleanup:**
   - Delete stub URL file records:
     ```sql
     DELETE FROM "File" WHERE url LIKE '%example.com%' OR url LIKE '%stub-s3.local%';
     ```

5. **Monitor:**
   - S3 storage usage
   - Upload success rate
   - Rate limit hits

6. **User Communication:**
   - Announce file upload feature enabled
   - Update help docs with upload instructions
   - Demo in onboarding video

---

## RECOMMENDED APPROACH FOR BETA

### Phase 1: Launch WITHOUT File Uploads (Current State)
**Timeline:** Week 1-2  
**Approach:**
- ✅ Keep `FILE_UPLOAD_ENABLED: false`
- ✅ Use external URL workarounds
- ✅ Admin Resource Hub uploads work (admin-only)
- ✅ Focus on core workflows (deals, contracts, messaging)

**Communication:**
> "File uploads are coming soon! For now, please share files via Google Drive/Dropbox and paste links."

### Phase 2: Enable for Admins Only (Week 3)
**Timeline:** Week 3  
**Approach:**
- Configure Cloudflare R2 (free tier: 10GB storage)
- Test uploads in admin areas only
- Keep creator/brand uploads disabled
- Monitor storage and costs

### Phase 3: Enable for All Users (Week 4-6)
**Timeline:** Week 4-6  
**Approach:**
- Enable `FILE_UPLOAD_ENABLED: true`
- Announce feature launch
- Monitor usage patterns
- Set up storage alerts (>80% capacity)

---

## RISKS & MITIGATIONS

### Risk: Storage Costs Spike
**Mitigation:**
- Start with Cloudflare R2 (free 10GB)
- Set file size limits (10MB per file)
- Implement file expiration (90 days for non-contract files)
- Monitor usage weekly

### Risk: Users Upload Inappropriate Content
**Mitigation:**
- Rate limiting already in place (10 uploads per 5 min)
- Admin can delete files via API
- File types restricted (PDF, PNG, MOV, MP4, DOCX)
- Consider adding virus scanning (ClamAV)

### Risk: Broken Stub URLs in Database
**Mitigation:**
- Run cleanup script before enabling:
  ```sql
  UPDATE "File" SET url = NULL WHERE url LIKE '%example.com%';
  ```
- Users re-upload files after enablement

### Risk: CORS Issues with S3
**Mitigation:**
- Configure bucket CORS policy:
  ```json
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
  ```

---

## SUMMARY

| Component | Status | S3 Config Required? | Workaround Available? |
|-----------|--------|---------------------|----------------------|
| FileUploader.jsx | ✅ Built | Yes | N/A |
| FileUploadPanel.jsx | ✅ Built | Yes | External links |
| Contract PDF uploads | ❌ Disabled | Yes | Email/Drive links |
| Deliverable proofs | ❌ Disabled | Yes | Platform links (YouTube) |
| Brief attachments | ❌ Disabled | Yes | Drive/Dropbox links |
| Avatar images | ✅ Works | No | Manual URL input |
| Admin Resource Hub | ✅ Works | No | Accepts stub URLs |
| API routes | ✅ Working | Yes | Returns stubs |
| Database schema | ✅ Ready | No | N/A |
| S3 integration | ⚠️ Stub mode | **Yes** | Local storage fallback |

**FEATURE FLAGS:** `FILE_UPLOAD_ENABLED = false`  
**S3 STATUS:** ❌ Not Configured  
**RECOMMENDATION:** Launch beta WITHOUT file uploads, enable in Week 3-4 after S3 setup.

---

## NEXT STEPS

### Immediate (Pre-Launch)
- [ ] Document external URL workarounds in user guide
- [ ] Update contract UI to clearly show "Email signed copy to admin"
- [ ] Test admin Resource Hub uploads thoroughly
- [ ] Add "Coming soon" badge to disabled upload buttons

### Week 3 (Post-Launch)
- [ ] Create Cloudflare R2 account
- [ ] Configure bucket and CORS
- [ ] Add credentials to `.env`
- [ ] Test uploads in staging
- [ ] Enable for admins only

### Week 4-6 (Rollout)
- [ ] Enable `FILE_UPLOAD_ENABLED: true`
- [ ] Clean up stub URL database records
- [ ] Announce feature to users
- [ ] Monitor storage usage
- [ ] Update help documentation

---

**Audit Completed:** 27 December 2025  
**Next Review:** After S3 configuration (Week 3)
