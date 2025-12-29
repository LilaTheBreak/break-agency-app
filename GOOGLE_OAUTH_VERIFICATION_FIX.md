# Google OAuth Verification Fix Guide
**Date:** December 29, 2025  
**Issue:** "Google hasn't verified this app" warning blocking Gmail connection  
**Status:** 🔴 CRITICAL - Production Blocking

---

## 🎯 Problem Summary

Users are seeing this warning when connecting Gmail:
> **"Google hasn't verified this app. The app is requesting access to sensitive info..."**

This warning appears because:
1. **Gmail scopes are classified as "Sensitive"** by Google
2. **OAuth consent screen is not properly configured** or not published
3. **App verification may be required** for production use

---

## 📋 Current Configuration Audit

### Scopes Being Requested

**File:** `apps/api/src/integrations/gmail/googleAuth.ts`

```typescript
scope: [
  "https://www.googleapis.com/auth/gmail.send",        // ⚠️ SENSITIVE
  "https://www.googleapis.com/auth/gmail.readonly",    // ⚠️ SENSITIVE
  "https://www.googleapis.com/auth/userinfo.email",    // ✅ Not sensitive
  "https://www.googleapis.com/auth/userinfo.profile",   // ✅ Not sensitive
  "openid"                                             // ✅ Not sensitive
]
```

**Scope Classification:**
- `gmail.send` - **SENSITIVE** (allows sending emails)
- `gmail.readonly` - **SENSITIVE** (allows reading emails)
- `userinfo.email` - Not sensitive
- `userinfo.profile` - Not sensitive
- `openid` - Not sensitive

**Why Sensitive Scopes Trigger Warning:**
- Google requires apps using sensitive scopes to have a verified OAuth consent screen
- For external users, Google verification is mandatory
- Test users can bypass verification temporarily

### Production Redirect URI

**Current Configuration:**
```
https://breakagencyapi-production.up.railway.app/api/gmail/auth/callback
```

**Environment Variable:**
- `GMAIL_REDIRECT_URI` (or derived from `GOOGLE_REDIRECT_URI`)

---

## 🛠️ Fix Steps (Execute in Order)

### Step 1: Access Google Cloud Console

1. Navigate to: https://console.cloud.google.com
2. Select the project: **"The Break Agency APP"** (or your project name)
3. Go to: **APIs & Services** → **OAuth consent screen**

---

### Step 2: Configure OAuth Consent Screen

#### 2.1 Basic App Information

**User Type:**
- ✅ Select **"External"** (required for real users)
- ⚠️ If you select "Internal", only users in your Google Workspace can use it

**App Information:**
- **App name:** `The Break`
- **User support email:** `lila@thebreakco.com`
- **App logo:** Upload The Break logo (optional but recommended)
- **Application home page:** `https://www.tbctbctbc.online`
- **Application privacy policy link:** ⚠️ **REQUIRED** - Must be publicly accessible
  - Example: `https://www.tbctbctbc.online/privacy-policy`
  - **Action Required:** Create this page if it doesn't exist
- **Application terms of service link:** ⚠️ **REQUIRED** - Must be publicly accessible
  - Example: `https://www.tbctbctbc.online/terms-of-service`
  - **Action Required:** Create this page if it doesn't exist
- **Authorized domains:** Add `tbctbctbc.online` and `railway.app` (if needed)

#### 2.2 Scopes

**Current Scopes (DO NOT CHANGE):**
- ✅ `https://www.googleapis.com/auth/gmail.send`
- ✅ `https://www.googleapis.com/auth/gmail.readonly`
- ✅ `https://www.googleapis.com/auth/userinfo.email`
- ✅ `https://www.googleapis.com/auth/userinfo.profile`
- ✅ `openid`

**Note:** These scopes are already configured. Verify they match exactly.

#### 2.3 Test Users (IMMEDIATE FIX)

**This is the fastest way to remove the warning for internal users:**

1. Scroll to **"Test users"** section
2. Click **"+ ADD USERS"**
3. Add these email addresses:
   - `lila@thebreakco.com`
   - Any other internal team members who need Gmail access
4. Click **"ADD"**

**Result:**
- ✅ Test users will NOT see the "unverified app" warning
- ✅ Gmail connection will work immediately for test users
- ⚠️ External users will still see the warning until app is verified

#### 2.4 Publishing Status

**Current Status:** Likely "Testing" (unpublished)

**For Immediate Fix (Test Users Only):**
- Keep status as **"Testing"**
- Add test users (Step 2.3)
- This allows internal team to connect Gmail without warning

**For Production (All Users):**
- Must change to **"In production"**
- Requires Google verification (see Step 3)
- Can take 4-6 weeks for Google to review

---

### Step 3: Verify OAuth Client Configuration

1. Navigate to: **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID (the one used for Gmail)
3. Click to edit

**Authorized JavaScript origins:**
```
https://www.tbctbctbc.online
https://tbctbctbc.online
```

**Authorized redirect URIs (CRITICAL - must match exactly):**
```
https://breakagencyapi-production.up.railway.app/api/gmail/auth/callback
https://breakagencyapi-production.up.railway.app/api/auth/google/callback
http://localhost:5001/api/gmail/auth/callback
http://localhost:5001/api/auth/google/callback
```

**⚠️ Verify:**
- ✅ All redirect URIs are listed
- ✅ No typos or trailing slashes
- ✅ HTTP vs HTTPS matches exactly
- ✅ Port numbers match (5001 for local, none for production)

---

### Step 4: Create Required Legal Pages (If Missing)

#### 4.1 Privacy Policy Page

**URL:** `https://www.tbctbctbc.online/privacy-policy`

**Required Content:**
- How user data is collected
- How Gmail data is used
- Data storage and security
- User rights (access, deletion)
- Contact information

**Minimum Requirements:**
- Must be publicly accessible (no login required)
- Must explain Gmail data usage
- Must include contact email: `lila@thebreakco.com`

#### 4.2 Terms of Service Page

**URL:** `https://www.tbctbctbc.online/terms-of-service`

**Required Content:**
- Service description
- User responsibilities
- Gmail integration terms
- Limitation of liability
- Contact information

**Minimum Requirements:**
- Must be publicly accessible (no login required)
- Must mention Gmail integration
- Must include contact email: `lila@thebreakco.com`

**Quick Fix Option:**
- Use a privacy policy generator (e.g., Termly, iubenda)
- Or create simple pages with essential information
- Update later with full legal review

---

### Step 5: Prepare for Google Verification (If Publishing)

**When to Verify:**
- You want external users (not just test users) to connect Gmail
- You want to remove the warning for all users
- You're ready for production launch

**Verification Requirements:**

1. **App Information:**
   - ✅ App name, logo, support email (already configured)
   - ✅ Privacy policy URL (must be created - Step 4.1)
   - ✅ Terms of service URL (must be created - Step 4.2)

2. **Scope Justification:**
   - **Why Gmail access is needed:**
     - "Users connect their Gmail accounts to sync emails into The Break platform for unified inbox management"
     - "Emails are used to identify brand contacts and opportunities"
     - "Users can send emails through the platform using their connected Gmail account"
   - **Data usage:**
     - "Gmail data is only accessed with explicit user consent"
     - "Emails are stored securely in our database"
     - "Data is not shared with third parties"
     - "Users can disconnect Gmail at any time"

3. **Screenshots/Videos:**
   - Screenshot of Gmail connection flow
   - Screenshot of inbox showing synced emails
   - Video walkthrough (optional but helpful)

4. **Submit for Verification:**
   - In OAuth consent screen, click **"PUBLISH APP"**
   - Fill out verification form
   - Submit to Google
   - Wait 4-6 weeks for review

**⚠️ Important:**
- Do NOT submit for verification until privacy policy and terms pages exist
- Verification can be rejected if required information is missing
- You can continue using test users while verification is pending

---

## ✅ Immediate Fix Checklist

**For Test Users (Can be done immediately):**

- [ ] Access Google Cloud Console OAuth consent screen
- [ ] Add `lila@thebreakco.com` as test user
- [ ] Add other internal team emails as test users
- [ ] Verify OAuth client redirect URIs are correct
- [ ] Test Gmail connection with test user account
- [ ] Confirm warning no longer appears for test users

**For Production (Requires more work):**

- [ ] Create privacy policy page at `/privacy-policy`
- [ ] Create terms of service page at `/terms-of-service`
- [ ] Update OAuth consent screen with privacy/terms URLs
- [ ] Verify all app information is complete
- [ ] Decide: Publish now (with verification) or keep in testing mode
- [ ] If publishing: Submit for Google verification

---

## 🧪 Testing

### Test 1: Connect Gmail as Test User

1. Log in to The Break as `lila@thebreakco.com` (or another test user)
2. Navigate to `/admin/inbox`
3. Click "Connect Gmail"
4. **Expected:** OAuth consent screen shows app name "The Break" (no warning)
5. **Expected:** After granting access, redirects to `/admin/inbox?gmail_connected=1`
6. **Expected:** Gmail sync works without errors

### Test 2: Verify Redirect URI

1. Check Railway logs for Gmail OAuth callback
2. **Expected:** No "redirect_uri_mismatch" errors
3. **Expected:** Successful token exchange

### Test 3: External User (If Published)

1. Log in as a user NOT in test users list
2. Try to connect Gmail
3. **If in Testing mode:** Will see warning (expected)
4. **If Published & Verified:** Should NOT see warning

---

## 📝 Backend Safety Checks

### Current Implementation Status

**✅ Secure Token Storage:**
- Tokens stored in database (`GmailToken` model)
- NOT in localStorage
- Refresh tokens persisted

**✅ Minimal Scopes:**
- Only requesting necessary Gmail scopes
- `gmail.send` is needed (used in `sendOutbound.ts`)
- `gmail.readonly` is needed (used in `syncInbox.ts`)

**✅ Redirect URI Configuration:**
- Uses `GMAIL_REDIRECT_URI` environment variable
- Falls back to derived URI if not set
- Validates redirect URI on startup

**✅ Error Handling:**
- Specific error messages for OAuth failures
- Redirects with error codes for frontend handling
- Logs OAuth errors for debugging

### No Code Changes Required

The backend implementation is correct. The issue is purely in Google Cloud Console configuration.

---

## 🚫 What NOT to Do

- ❌ **Do NOT** ask users to click "Advanced" and "Continue anyway"
- ❌ **Do NOT** ignore the warning long-term
- ❌ **Do NOT** downgrade security or remove scopes if they're needed
- ❌ **Do NOT** use a different Google account to bypass verification
- ❌ **Do NOT** publish app without privacy policy and terms pages

---

## 📞 Support Contacts

**For Google OAuth Issues:**
- Google Cloud Support: https://cloud.google.com/support
- OAuth Help Center: https://support.google.com/cloud/answer/10311615

**For The Break App:**
- Developer Contact: `lila@thebreakco.com`
- Support Email: `lila@thebreakco.com`

---

## 📚 Additional Resources

- [Google OAuth Consent Screen Guide](https://support.google.com/cloud/answer/10311615)
- [OAuth 2.0 Scopes for Gmail API](https://developers.google.com/gmail/api/auth/scopes)
- [App Verification Process](https://support.google.com/cloud/answer/9110914)

---

## 🎯 Success Criteria

**Immediate (Test Users):**
- ✅ Test users can connect Gmail without warning
- ✅ Gmail sync works for test users
- ✅ No "unverified app" warning for test users

**Production (All Users):**
- ✅ All users can connect Gmail without warning
- ✅ OAuth consent screen is published
- ✅ App is verified by Google (if required)
- ✅ Privacy policy and terms pages exist and are accessible

---

**Last Updated:** December 29, 2025  
**Next Review:** After OAuth consent screen configuration

