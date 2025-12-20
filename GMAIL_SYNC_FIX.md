# Gmail Sync Fix - OAuth Configuration

## Problem
Gmail sync was failing because the OAuth redirect URI was incorrectly configured.

## What Was Fixed

### 1. **Separate Gmail OAuth Callback**
- Main auth: `/api/auth/google/callback`
- Gmail auth: `/api/gmail/auth/callback` ← **New**

### 2. **User ID Passing**
- Gmail OAuth now passes user ID in `state` parameter
- Auth required before getting Gmail OAuth URL

### 3. **Correct Redirect URI**
- Fixed to use Gmail-specific callback URL
- Auto-generates from main callback if `GMAIL_REDIRECT_URI` not set

## Required: Update Google OAuth Console

### Add New Redirect URI:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select: **"The Break Co Agency App"** OAuth client
3. Under **Authorized redirect URIs**, add:

   **Current URLs:**
   ```
   ✅ https://breakagencyapi-production.up.railway.app/api/auth/google/callback
   ✅ http://localhost:5001/api/auth/google/callback
   ```

   **ADD THESE NEW URLs:**
   ```
   🆕 https://breakagencyapi-production.up.railway.app/api/gmail/auth/callback
   🆕 http://localhost:5001/api/gmail/auth/callback
   ```

4. Click **Save**

### After Subdomain Setup (api.tbctbctbc.online):

Add these additional URLs:
```
🆕 https://api.tbctbctbc.online/api/auth/google/callback
🆕 https://api.tbctbctbc.online/api/gmail/auth/callback
```

## Testing Gmail Sync

### 1. **Connect Gmail** (Admin Dashboard):
```
1. Log in to admin dashboard
2. Go to Inbox page
3. Click "Connect Gmail" button
4. Authorize Gmail access
5. Should redirect back to /admin/inbox?gmail_connected=1
```

### 2. **Verify Connection**:
```bash
# Check if token was saved
curl https://breakagencyapi-production.up.railway.app/api/gmail/messages \
  -H "Cookie: break_session=YOUR_SESSION_COOKIE"

# Should return: Gmail messages or empty array (not "Gmail not connected" error)
```

### 3. **Manual Sync**:
```bash
# Trigger sync
curl -X POST https://breakagencyapi-production.up.railway.app/api/gmail/inbox/sync \
  -H "Cookie: break_session=YOUR_SESSION_COOKIE"

# Should return: {"message":"Gmail inbox sync completed.","imported":X,"updated":Y,...}
```

## Environment Variables (No Changes Needed)

Current Railway variables work fine:
```bash
GOOGLE_CLIENT_ID=583250868510-2l8so00gv97bedejv9hq5d73nins36ag...
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/auth/google/callback
```

The code now auto-generates the Gmail redirect URI by replacing `/api/auth/` with `/api/gmail/auth/`.

## Common Errors

### "Gmail not connected"
- User hasn't connected Gmail yet
- Go to Inbox page and click "Connect Gmail"

### "Missing code or user"  
- OAuth callback failed
- Check Google Console has correct redirect URIs
- Check Railway logs for errors

### "No refresh_token returned"
- Google didn't return refresh token
- User needs to disconnect and reconnect with `prompt=consent`
- This should be automatic now with the fix

## Next Steps

1. ✅ **Update Google OAuth Console** (add Gmail callback URLs)
2. ✅ **Railway auto-deployed** the fix
3. 🔄 **Test Gmail connection** in admin dashboard
4. 🔄 **Verify sync works** after connecting

## Rollback (if needed)

If something breaks:
```bash
git revert 299ab66
git push origin main
```

Railway will auto-deploy the previous version.
