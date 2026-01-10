# Gmail OAuth Implementation - Step-by-Step Guide

**Objective:** Enable Gmail sync feature by configuring Google OAuth credentials  
**Estimated Time:** 2-3 hours  
**Prerequisites:** Google account with admin access to create API credentials  

---

## PHASE 1: GOOGLE CLOUD SETUP (60 minutes)

### Step 1.1: Create Google Cloud Project

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. In the top-left, click **Select a Project** → **New Project**
3. **Project Name:** `break-agency` (or similar)
4. **Organization:** Leave empty (unless you have one)
5. Click **Create**
6. Wait 2-3 minutes for project to initialize

**Verification:**
```
You should see "break-agency" in the top-left project selector ✅
```

---

### Step 1.2: Enable Required APIs

1. In the top search bar, search for `Gmail API`
2. Click on **Gmail API** result
3. Click **Enable** button
4. Wait for it to say "✅ API enabled"

**Repeat for these APIs:**
- [ ] Gmail API - `https://console.cloud.google.com/apis/library/gmail.googleapis.com`
- [ ] Google+ API - `https://console.cloud.google.com/apis/library/plus.googleapis.com`
- [ ] Cloud Pub/Sub API (optional) - `https://console.cloud.google.com/apis/library/pubsub.googleapis.com`

**Verification:**
```
In APIs & Services → Enabled APIs, you should see:
- Gmail API ✅
- Google+ API ✅
- (Optional) Cloud Pub/Sub API ✅
```

---

### Step 1.3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials** (left menu)
2. Click **+ Create Credentials** (top button)
3. Select **OAuth 2.0 Client IDs**
4. If prompted "To create an OAuth client ID, you must first set a user consent screen":
   - Click **Configure Consent Screen**
   - See **Step 1.4** below

**After Consent Screen is Set:**
1. Go back to **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client IDs**
3. Application Type: **Web application**
4. Name: `break-agency-web-app`

---

### Step 1.4: Configure OAuth Consent Screen

1. In **APIs & Services** → **OAuth consent screen** (left menu)
2. Select **External** (users not in your organization)
3. Click **Create**
4. Fill out form:

**App Information:**
```
App name:        Break Agency
User support email: your-email@company.com
```

**App Logo:**
- Leave blank (optional)

**Authorized Domains:**
- Add: `thebreakco.com`

**Scopes:**
1. Click **Add or Remove Scopes**
2. Select these scopes:
   - ✅ `https://www.googleapis.com/auth/gmail.send`
   - ✅ `https://www.googleapis.com/auth/gmail.readonly`
   - ✅ `https://www.googleapis.com/auth/userinfo.email`
   - ✅ `https://www.googleapis.com/auth/userinfo.profile`
   - ✅ `openid`
3. Click **Update**

**Test Users:**
1. Click **Add Users**
2. Add your Gmail email address
3. Click **Save and Continue** → **Back to Dashboard**

**Verification:**
```
OAuth consent screen shows "✅ Configured"
```

---

### Step 1.5: Create OAuth Client Credentials

1. Go back to **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client IDs**
3. Application Type: **Web application**
4. Name: `break-agency-web-app`
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://thebreakco.com
   https://app.thebreakco.com
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:3001/api/gmail/auth/callback
   https://api.thebreakco.com/api/gmail/auth/callback
   ```
7. Click **Create**

**CRITICAL: Save these values!**
- **Client ID:** `xxx.apps.googleusercontent.com` → Save as `GOOGLE_CLIENT_ID`
- **Client Secret:** `GOCSPX-xxx` → Save as `GOOGLE_CLIENT_SECRET`

```bash
# Create a secure file with credentials
cat > ~/break_gmail_creds.txt << EOF
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
EOF

chmod 600 ~/break_gmail_creds.txt
```

**Verification:**
```
Credentials page shows your OAuth 2.0 Client ID ✅
You have saved GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET ✅
```

---

### Step 1.6: (Optional) Create Service Account for Pub/Sub

**Skip this if you only want polling-based sync (every 15 minutes)**

1. Go to **Credentials**
2. Click **+ Create Credentials** → **Service Account**
3. Service Account Name: `break-agency-email-sync`
4. Click **Create and Continue**
5. **Grant roles:**
   - Role: `Editor` (or search `Pub/Sub Admin`)
   - Click **Continue**
6. Click **Done**
7. In the service accounts list, click on the new account
8. Go to **Keys** tab
9. Click **Add Key** → **Create new key**
10. Key type: **JSON**
11. Click **Create**
12. A JSON file will download

**Encode for environment variable:**
```bash
# Base64 encode the downloaded JSON
cat ~/break-agency-email-sync-xxxxx.json | base64 -w 0 > ~/gmail_service_account.txt

# Content goes into GOOGLE_APPLICATION_CREDENTIALS_JSON
cat ~/gmail_service_account.txt
# Copy the long base64 string
```

**Verification:**
```
Service account JSON downloaded ✅
Service account encoded as base64 ✅
```

---

## PHASE 2: ENVIRONMENT CONFIGURATION (10 minutes)

### Step 2.1: Update .env.production

Edit `/Users/admin/Desktop/break-agency-app-1/.env.production` (lines 36-52):

```bash
# Open the file
nano .env.production
```

**Find this section:**
```env
# GOOGLE OAUTH
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.thebreakco.com/api/auth/google/callback

# GMAIL / GOOGLE INTEGRATION
GOOGLE_APPLICATION_CREDENTIALS_JSON={}
```

**Replace with your actual credentials:**
```env
# GOOGLE OAUTH
GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID_FROM_STEP_1.5>
GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET_FROM_STEP_1.5>
GOOGLE_REDIRECT_URI=https://api.thebreakco.com/api/gmail/auth/callback

# GMAIL / GOOGLE INTEGRATION
GOOGLE_APPLICATION_CREDENTIALS_JSON=<OPTIONAL_BASE64_FROM_STEP_1.6>
```

**Example (with real values):**
```env
# GOOGLE OAUTH
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=https://api.thebreakco.com/api/gmail/auth/callback

# GMAIL / GOOGLE INTEGRATION
GOOGLE_APPLICATION_CREDENTIALS_JSON=eyJlbmNvZGVkX2pzb24iOiAidmFsdWUifQ==
```

**Save & Exit:**
```
Ctrl+O → Enter → Ctrl+X
```

**Verification:**
```bash
# Verify values are set
grep GOOGLE_ .env.production | head -5

# Should show:
# GOOGLE_CLIENT_ID=123456789-abc...
# GOOGLE_CLIENT_SECRET=GOCSPX-...
# GOOGLE_REDIRECT_URI=https://api.the.breakco.com/api/gmail/auth/callback
```

---

### Step 2.2: Update .env.development (For Local Testing)

Edit `/Users/admin/Desktop/break-agency-app-1/.env.development`:

```env
# GOOGLE OAUTH
GOOGLE_CLIENT_ID=<SAME_AS_PRODUCTION>
GOOGLE_CLIENT_SECRET=<SAME_AS_PRODUCTION>
GOOGLE_REDIRECT_URI=http://localhost:3001/api/gmail/auth/callback

# GMAIL / GOOGLE INTEGRATION
GOOGLE_APPLICATION_CREDENTIALS_JSON=<OPTIONAL>
```

**Note:** Use same Client ID/Secret, but different REDIRECT_URI for localhost

---

## PHASE 3: SERVER VALIDATION (5 minutes)

### Step 3.1: Start API Server

```bash
cd /Users/admin/Desktop/break-agency-app-1
npm run start:api
```

**Expected output:**
```
✅ [GMAIL AUTH] GOOGLE_CLIENT_ID loaded successfully
✅ [GMAIL AUTH] GOOGLE_CLIENT_SECRET loaded successfully
✅ [GMAIL AUTH] Redirect URI is valid
✅ Gmail features are enabled
```

**If you see errors:**
```
❌ [GMAIL AUTH] Invalid GOOGLE_CLIENT_ID
  → Check that env var is exactly copied (no extra spaces)
  
❌ [GMAIL AUTH] Invalid GOOGLE_CLIENT_SECRET
  → Check that env var is exactly copied, starts with "GOCSPX-"
  
❌ [GMAIL AUTH] Invalid redirect URI
  → Check that GOOGLE_REDIRECT_URI matches value in Google Cloud
```

**To verify credentials are loaded:**
```bash
# In another terminal, check the env:
curl http://localhost:3001/health | grep -i gmail

# Or check server logs:
tail -50 api.log | grep -i gmail
```

**Verification:**
```
Server starts without credential validation errors ✅
Gmail features enabled message appears in logs ✅
```

---

### Step 3.2: Test OAuth URL Generation

```bash
# Get your user ID first (logged in user):
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/gmail/auth/url

# Should return something like:
# {
#   "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=123456..."
# }
```

**Verification:**
```
OAuth URL generates successfully ✅
URL points to Google login ✅
```

---

## PHASE 4: OAUTH FLOW TESTING (15 minutes)

### Step 4.1: Complete OAuth Flow

**Part A: Start Frontend**
```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/web
npm run dev
```

Navigate to: `http://localhost:3000/admin/inbox`

**Part B: Click "Connect Gmail"**
1. You should see a button "Connect Gmail Account"
2. Click it
3. You'll be redirected to Google login

**Part C: Grant Permission**
1. Sign in with your Google account
2. You'll see a consent screen asking for:
   - ✅ Read your emails
   - ✅ Send emails on your behalf
   - ✅ Your email address
   - ✅ Your profile info
3. Click "Allow"

**Part D: Redirect Back**
1. You should be redirected back to `http://localhost:3000/admin/inbox`
2. You should see:
   - Message: "Syncing your emails..."
   - List of your recent emails should appear

**Part E: Verify Database**
```bash
# Connect to database (adjust connection string):
psql postgresql://user:password@localhost:5432/break

# Check GmailToken was created:
SELECT * FROM "GmailToken" WHERE "userId" = '<YOUR_USER_ID>';

# Should return:
# | userId | accessToken | refreshToken | lastSyncedAt | ... |
# | xxx    | ya29.a0Af... | 1//0gxxx...  | 2026-01-10   | ... |
```

**Verification:**
```
✅ Redirect to Google login successful
✅ Permission grant successful
✅ Redirect back to inbox successful
✅ GmailToken record created
✅ Emails displayed in inbox
```

---

### Step 4.2: Monitor First Sync

In the inbox UI:
1. You should see "Syncing..." message
2. After 10-30 seconds, emails should load
3. You should see your recent Gmail messages

**In server logs, you should see:**
```
[GMAIL] Syncing inbox for userId: xxx
[GMAIL] Fetched 25 messages from Gmail API
[GMAIL] Mapped messages to InboundEmail records
[GMAIL] Sync completed: imported=25, updated=0, skipped=0
```

**Verification:**
```
✅ Sync completes without errors
✅ Emails appear in inbox
✅ Server logs show sync stats
```

---

## PHASE 5: CRON JOB VERIFICATION (15 minutes)

### Step 5.1: Wait for Background Sync

The background sync runs **every 15 minutes**. Wait for the next occurrence:

1. Note current time: `2026-01-10 14:35`
2. Next sync should be: `14:45`, `15:00`, `15:15`, etc.
3. Check server logs:
```bash
tail -f api.log | grep CRON
```

**Expected logs:**
```
[CRON] Starting Gmail background sync...
[GMAIL] Syncing inbox for userId: xxx
[GMAIL] Syncing inbox for userId: yyy
[CRON] Gmail background sync completed
```

**Verification:**
```
✅ Cron job runs every 15 minutes
✅ Runs without errors
✅ Syncs all users with GmailToken records
```

---

### Step 5.2: Monitor InboundEmail Growth

```bash
# Every 15 minutes, run:
psql postgresql://user:password@localhost:5432/break -c \
  "SELECT COUNT(*) FROM \"InboundEmail\";"

# You should see growth:
# First check:  25
# After 15 min: 50
# After 30 min: 75
# (depending on your Gmail volume)
```

**Verification:**
```
✅ InboundEmail table grows over time
✅ Each sync adds new messages
✅ No duplicate emails (unique gmailId constraint)
```

---

### Step 5.3: Verify AI Analysis

```bash
# Check if AI analysis ran:
psql postgresql://user:password@localhost:5432/break -c \
  "SELECT \"subject\", \"aiSummary\", \"aiCategory\", \"aiUrgency\" 
   FROM \"InboundEmail\" 
   LIMIT 5;"

# You should see:
# | subject | aiSummary | aiCategory | aiUrgency |
# | Your email subject... | AI generated summary... | deal | high |
```

**Verification:**
```
✅ aiSummary is populated (not NULL)
✅ aiCategory is one of: deal, inquiry, notification, other
✅ aiUrgency is one of: high, medium, low
✅ AI analysis runs without errors
```

---

## PHASE 6: CRM LINKING VERIFICATION (10 minutes)

### Step 6.1: Check Deal Linking

```bash
# Find emails that mention deals:
psql postgresql://user:password@localhost:5432/break -c \
  "SELECT \"subject\", \"dealId\", \"brandId\", \"aiCategory\" 
   FROM \"InboundEmail\" 
   WHERE \"dealId\" IS NOT NULL 
   LIMIT 5;"

# Expected:
# | subject | dealId | brandId | aiCategory |
# | Deal discussion... | deal-id-123 | brand-id-456 | deal |
```

**Verification:**
```
✅ dealId populated for emails about deals
✅ brandId populated for emails about brands
✅ Linking happens automatically via AI analysis
```

---

### Step 6.2: Check Contact Creation

```bash
# See if new contacts were created from emails:
psql postgresql://user:password@localhost:5432/break -c \
  "SELECT COUNT(*) FROM \"Contact\" 
   WHERE \"createdAt\" > NOW() - INTERVAL '1 hour';"

# May or may not have new contacts depending on emails
# But command should run without error
```

---

## PHASE 7: PRODUCTION DEPLOYMENT (10 minutes)

### Step 7.1: Update Production .env

**Before going live, update production environment:**

```bash
# SSH to production server
ssh admin@api.thebreakco.com

# Edit .env.production
nano /app/.env.production

# Update these lines:
GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>
GOOGLE_APPLICATION_CREDENTIALS_JSON=<YOUR_BASE64_JSON_OPTIONAL>

# Save & exit
```

---

### Step 7.2: Restart Production API

```bash
# Restart PM2 process
pm2 restart api

# Verify server logs
pm2 logs api | grep GMAIL
```

**Expected logs:**
```
✅ [GMAIL AUTH] GOOGLE_CLIENT_ID loaded successfully
✅ [GMAIL AUTH] GOOGLE_CLIENT_SECRET loaded successfully
✅ Gmail features are enabled
```

---

### Step 7.3: Test Production OAuth

1. Navigate to `https://app.thebreakco.com/admin/inbox`
2. Click "Connect Gmail Account"
3. Complete Google login + permission grant
4. Should see inbox with emails

---

## TROUBLESHOOTING

### OAuth Credentials Not Loading

```bash
# Check env file exists
cat .env.production | grep GOOGLE_CLIENT_ID

# Check for trailing spaces
wc -c .env.production  # Should be reasonable size

# Check file encoding
file .env.production  # Should be ASCII text
```

### Redirect URI Mismatch Error

```
"The redirect_uri parameter doesn't match pre-registered redirect_uri values."
```

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Check **Authorized redirect URIs**
4. Make sure it exactly matches:
   - Production: `https://api.thebreakco.com/api/gmail/auth/callback`
   - Local: `http://localhost:3001/api/gmail/auth/callback`
5. Click **Save**

### Emails Not Appearing

```
Possible causes:
1. First sync hasn't run yet (wait 15 minutes)
2. Gmail API not enabled in Google Cloud
3. OAuth tokens invalid (try disconnecting and reconnecting)
4. Sync error in server logs (check: pm2 logs api)
```

**Debug:**
```bash
# Manually trigger sync
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3001/api/gmail/inbox/sync

# Check logs
pm2 logs api | tail -30
```

### Tokens Expired

```
OAuth tokens expire after ~1 hour. Refresh token is auto-used to get new access token.
If manual intervention needed:
1. User disconnects Gmail in UI
2. User clicks "Connect Gmail" again
3. Complete OAuth flow again
```

---

## FINAL CHECKLIST

- [ ] Google Cloud Project created
- [ ] Gmail API enabled
- [ ] Google+ API enabled
- [ ] OAuth Consent Screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] GOOGLE_CLIENT_ID saved
- [ ] GOOGLE_CLIENT_SECRET saved
- [ ] .env.production updated with credentials
- [ ] .env.development updated with credentials
- [ ] API server started without credential errors
- [ ] OAuth URL generation tested
- [ ] OAuth flow completed end-to-end
- [ ] GmailToken record created in database
- [ ] First sync completed (emails in inbox)
- [ ] Cron job verified running every 15 minutes
- [ ] InboundEmail table growing
- [ ] AI analysis fields populated
- [ ] Deal/Brand linking verified
- [ ] Production .env updated
- [ ] Production API restarted
- [ ] Production OAuth tested
- [ ] Monitoring configured

---

**Implementation Time:** Approximately 2-3 hours total  
**Complexity:** Medium (requires Google Cloud setup)  
**Risk Level:** Low (feature-gated, no breaking changes)  

**Need Help?** Review GMAIL_SYNC_AUDIT_COMPLETE.md for architectural details.
