# Gmail Connection - Production Setup Guide

## Root Cause Analysis

**Issue**: Gmail connection failing in production with "Failed to connect Gmail" error

**Root Causes Identified**:
1. **Missing or invalid OAuth credentials** - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` set to "test" values
2. **Redirect URI mismatch** - Production redirect URI not matching Google Cloud Console configuration
3. **Poor error handling** - Generic 500 errors hiding specific OAuth failures
4. **Missing refresh token** - Google not returning refresh token when user already granted consent

---

## Google Cloud Console Setup (REQUIRED)

### 1. OAuth Client ID Configuration

Navigate to: https://console.cloud.google.com/apis/credentials

**For Production:**
- **Application type**: Web application
- **Name**: `Break Agency - Gmail Integration (Production)`
- **Authorized JavaScript origins**:
  ```
  https://www.tbctbctbc.online
  https://tbctbctbc.online
  ```
- **Authorized redirect URIs** (CRITICAL - must match exactly):
  ```
  https://api.your-production-domain.com/api/gmail/auth/callback
  https://your-railway-backend.up.railway.app/api/gmail/auth/callback
  ```

**For Development:**
- **Authorized redirect URIs**:
  ```
  http://localhost:5001/api/gmail/auth/callback
  ```

### 2. Enable Gmail API

Navigate to: https://console.cloud.google.com/apis/library

Search for and enable:
- **Gmail API**
- **Google+ API** (for user profile)

### 3. OAuth Consent Screen

Required scopes:
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `openid`

**Publishing status**: 
- For production: Must be **Published** (not in testing mode)
- For development: Can remain in testing mode

---

## Environment Variables (Railway/Vercel)

### Required Environment Variables

```bash
# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_secret_here

# Main OAuth redirect (for Google login)
GOOGLE_REDIRECT_URI=https://your-railway-backend.up.railway.app/api/auth/google/callback

# Gmail-specific redirect (for Gmail connection)
GMAIL_REDIRECT_URI=https://your-railway-backend.up.railway.app/api/gmail/auth/callback

# Frontend URL (for OAuth redirects)
FRONTEND_ORIGIN=https://www.tbctbctbc.online
WEB_APP_URL=https://www.tbctbctbc.online,https://tbctbctbc.online
```

### Validation Checklist

✅ **GOOGLE_CLIENT_ID**:
- NOT set to "test"
- Ends with `.apps.googleusercontent.com`
- Matches the client ID from Google Cloud Console

✅ **GOOGLE_CLIENT_SECRET**:
- NOT set to "test"
- Is the actual secret from Google Cloud Console

✅ **GMAIL_REDIRECT_URI**:
- Uses HTTPS (not HTTP) in production
- Matches EXACTLY one of the authorized redirect URIs in Google Cloud Console
- Uses the Railway backend domain (or your actual API domain)
- Path is `/api/gmail/auth/callback`

✅ **FRONTEND_ORIGIN**:
- Points to your production frontend URL
- Used for redirecting users after OAuth success/failure

---

## Testing Gmail Connection

### 1. Check Server Logs on Startup

Look for these log messages when server starts:

```
✅ [GMAIL AUTH] Configuration:
   clientId: ✓ Set
   clientSecret: ✓ Set
   redirectUri: https://your-api-domain.com/api/gmail/auth/callback
   source: GMAIL_REDIRECT_URI
```

**If you see**:
```
❌ [GMAIL AUTH] Invalid GOOGLE_CLIENT_ID - Gmail connection will fail
❌ [GMAIL AUTH] Invalid GOOGLE_CLIENT_SECRET - Gmail connection will fail
```
→ Fix your environment variables immediately

### 2. Test OAuth Flow

1. Navigate to `/admin/inbox` in production
2. Click "Connect Gmail"
3. Should redirect to Google OAuth consent screen
4. Grant permissions
5. Should redirect back to `/admin/inbox?gmail_connected=1`

### 3. Check for Errors

**If redirect shows `?gmail_error=redirect_uri_mismatch`**:
- Your `GMAIL_REDIRECT_URI` doesn't match Google Cloud Console
- Check for typos, HTTP vs HTTPS, trailing slashes

**If redirect shows `?gmail_error=code_expired`**:
- Authorization code was used twice or expired
- Ask user to try connecting again (normal behavior if page is refreshed during OAuth)

**If redirect shows `?gmail_error=invalid_credentials`**:
- `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` are wrong
- Verify credentials match Google Cloud Console

**If redirect shows `?gmail_error=missing_refresh_token`**:
- Google didn't return refresh token
- This happens if user already granted consent before
- Solution: User needs to revoke access at https://myaccount.google.com/permissions
- Then connect again with `prompt=consent` (already implemented)

### 4. Test Token Refresh

After successful connection:
```bash
# In production logs, watch for:
[GMAIL TOKEN REFRESH] Success for userId=...
```

If you see:
```
[GMAIL TOKEN] Invalid grant for user ... - user needs to reconnect Gmail
```
→ User needs to disconnect and reconnect Gmail

---

## Database Schema

Gmail tokens are stored in `GmailToken` table:

```prisma
model GmailToken {
  userId            String    @id
  accessToken       String    // Short-lived (1 hour)
  refreshToken      String    // Long-lived, used to get new access tokens
  expiryDate        DateTime? // When access token expires
  scope             String?   // OAuth scopes granted
  tokenType         String?   // Usually "Bearer"
  idToken           String?   // JWT with user info
  lastSyncedAt      DateTime? // Last successful inbox sync
  lastError         String?   // Last error message (if any)
  lastErrorAt       DateTime? // When last error occurred
  webhookExpiration DateTime? // Gmail push notification webhook expiry
  webhookHistoryId  String?   // Gmail history ID for incremental sync
}
```

---

## Common Production Issues

### Issue 1: "Failed to connect Gmail" (Generic Error)

**Cause**: OAuth token exchange failed
**Solution**: Check server logs for specific error (now improved with detailed logging)

### Issue 2: Redirect URI Mismatch

**Symptoms**:
- User redirected to error page after clicking "Connect Gmail"
- Error: `?gmail_error=redirect_uri_mismatch`

**Solution**:
1. Check Railway environment variable: `GMAIL_REDIRECT_URI`
2. Check Google Cloud Console → Credentials → OAuth 2.0 Client IDs
3. Ensure they EXACTLY match (including protocol, domain, path)

### Issue 3: Invalid Grant Error

**Symptoms**:
- Gmail initially connects successfully
- Later fails with "invalid_grant" error in logs
- Inbox sync stops working

**Causes**:
- User revoked access at https://myaccount.google.com/permissions
- Refresh token expired (rare, but possible after 6 months of inactivity)
- User changed their Google password

**Solution**: User must disconnect and reconnect Gmail

### Issue 4: Missing Refresh Token

**Symptoms**:
- OAuth flow completes
- But immediately shows error about missing refresh token

**Cause**: Google didn't return refresh token because user already granted consent previously

**Solutions**:
1. User revokes access at https://myaccount.google.com/permissions
2. Connect again (OAuth flow uses `prompt=consent` to force new token)
3. OR: Wait 7 days and Google will automatically return refresh token

### Issue 5: Tokens Lost After Restart

**Symptoms**: Gmail disconnects every time server restarts

**Cause**: Database connection issue or tokens not being persisted

**Solution**:
- Check `GmailToken` table in database
- Verify `DATABASE_URL` is correct
- Check Prisma connection logs

---

## Monitoring & Debugging

### Key Log Messages to Watch

**Successful Connection**:
```
[INTEGRATION] Gmail OAuth successful { userId: '...', hasRefreshToken: true }
[GMAIL CALLBACK] Successfully saved tokens for user ...
```

**Token Refresh Success**:
```
[GMAIL TOKEN REFRESH] Success for userId=...
```

**Connection Errors**:
```
[GMAIL CALLBACK] ERROR during token exchange or save: ...
[GMAIL TOKEN REFRESH ERROR] { userId: '...', error: '...' }
```

### Database Checks

Check if token exists and is valid:
```sql
SELECT 
  userId,
  LENGTH(accessToken) as accessTokenLength,
  LENGTH(refreshToken) as refreshTokenLength,
  expiryDate,
  lastSyncedAt,
  lastError,
  lastErrorAt
FROM "GmailToken"
WHERE userId = 'user_id_here';
```

Should return:
- `accessTokenLength` > 0
- `refreshTokenLength` > 0
- `expiryDate` in the future (or NULL)
- `lastError` should be NULL (or empty)

---

## User Actions Required

### When User Needs to Reconnect

Users must reconnect Gmail if:
1. They see "Gmail authentication has expired" error
2. They revoked access at https://myaccount.google.com/permissions
3. They changed their Google password
4. Server logs show "invalid_grant" errors

### Disconnect and Reconnect Flow

1. User clicks "Disconnect Gmail" in settings
2. Navigate to `/admin/inbox`
3. Click "Connect Gmail"
4. Complete OAuth flow
5. Verify "Gmail connected successfully!" message appears

---

## Files Modified in This Fix

### Backend Files
1. **`apps/api/src/integrations/gmail/googleAuth.ts`**
   - Added detailed error handling for token exchange
   - Added configuration validation on startup
   - Improved redirect URI derivation logic
   - Added specific error messages for common OAuth failures

2. **`apps/api/src/routes/gmailAuth.ts`**
   - Improved error handling in OAuth callback
   - Added specific error codes for different failure types
   - Added validation for missing refresh token
   - Clear lastError fields on successful reconnection

3. **`apps/api/src/services/gmail/tokens.ts`**
   - Enhanced logging for token retrieval
   - Improved token refresh error handling
   - Added specific logging for invalid_grant errors
   - Better validation of token existence

4. **`apps/api/src/controllers/gmailInboxController.ts`** (already fixed)
   - Added handling for GmailNotConnectedError
   - Added handling for OAuth token expiration

### Frontend Files
5. **`apps/web/src/pages/InboxPage.jsx`**
   - Added specific error messages for different OAuth failures
   - Improved user feedback for connection errors

---

## Validation Checklist

Before marking Gmail connection as "WORKING":

- [ ] Server starts without credential validation errors
- [ ] Can initiate OAuth flow from `/admin/inbox`
- [ ] OAuth redirect completes successfully
- [ ] Tokens are saved to database
- [ ] Inbox sync works after connection
- [ ] Token refresh works automatically
- [ ] Errors are logged with specific details
- [ ] Users can disconnect and reconnect
- [ ] Refresh token persists across server restarts
- [ ] No silent failures or generic 500 errors

---

## Status

**Gmail Connection Status**: ✅ **FIXED** (Pending Production Deployment)

**Required for Production**:
1. Set valid `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway
2. Set correct `GMAIL_REDIRECT_URI` matching Google Cloud Console
3. Deploy backend with these fixes
4. Test OAuth flow end-to-end
5. Verify tokens persist and refresh correctly

**Existing Users**: 
- ⚠️ **Must reconnect Gmail** after deployment (one-time action)
- Previous tokens may be invalid due to configuration issues
- New tokens will work correctly with improved error handling
