# Gmail Sync Troubleshooting Guide
**Date:** December 29, 2025  
**Issue:** Gmail messages not syncing / "Failed to list Gmail messages" error

---

## 🔍 Problem Diagnosis

### Error Message
```
Failed to load suggested tasks from Gmail: Error: Failed to list Gmail messages.
```

### Root Causes

1. **Gmail Not Connected**
   - User hasn't connected their Gmail account yet
   - OAuth token expired or invalid
   - Token was deleted

2. **Messages Not Synced**
   - Gmail is connected but sync hasn't run yet
   - Background sync (cron) hasn't executed
   - Manual sync hasn't been triggered

3. **API Endpoint Error**
   - Backend error when fetching messages
   - Database connection issue
   - Authentication failure

---

## ✅ Fixes Applied

### 1. Improved Backend Error Handling
**File:** `apps/api/src/routes/gmailMessages.ts`

**Changes:**
- Added Gmail connection check before fetching messages
- Returns proper error response if Gmail not connected
- Returns empty array in error response to prevent frontend crashes

**Before:**
```typescript
router.get("/messages", requireAuth, async (req, res, next) => {
  const messages = await prisma.inboxMessage.findMany({...});
  res.json(messages);
});
```

**After:**
```typescript
router.get("/messages", requireAuth, async (req, res, next) => {
  // Check if Gmail is connected
  const token = await prisma.gmailToken.findUnique({...});
  if (!token || !token.refreshToken) {
    return res.status(404).json({
      error: "gmail_not_connected",
      message: "Gmail account is not connected...",
      messages: []
    });
  }
  // ... fetch messages
});
```

### 2. Improved Frontend Error Handling
**File:** `apps/web/src/services/gmailClient.js`

**Changes:**
- Better error messages based on error type
- Handles `gmail_not_connected` error specifically
- Returns empty array on error to prevent crashes

**File:** `apps/web/src/pages/AdminTasksPage.old.jsx`

**Changes:**
- More helpful error messages for users
- Suggests syncing inbox if no messages found
- Handles empty message arrays gracefully

---

## 🛠️ How to Fix Gmail Sync Issues

### Step 1: Verify Gmail Connection

1. **Check Connection Status:**
   - Navigate to `/admin/inbox` or `/admin/settings`
   - Look for "Gmail Connected" status
   - If not connected, click "Connect Gmail"

2. **Verify OAuth Token:**
   - Check Railway logs for Gmail auth errors
   - Look for: `"Gmail account is not connected"` or `"invalid_grant"`

### Step 2: Trigger Manual Sync

**Option A: Via Frontend**
1. Go to `/admin/inbox`
2. Click "Sync Gmail" or "Sync Inbox" button
3. Wait for sync to complete (check for success message)

**Option B: Via API**
```bash
curl -X POST https://breakagencyapi-production.up.railway.app/api/gmail/inbox/sync \
  -H "Cookie: break_session=YOUR_SESSION_COOKIE"
```

**Option C: Via Gmail Messages Endpoint**
```bash
curl -X POST https://breakagencyapi-production.up.railway.app/api/gmail/messages/sync \
  -H "Cookie: break_session=YOUR_SESSION_COOKIE"
```

### Step 3: Check Background Sync

**Background sync runs every 15 minutes automatically:**
- Check Railway logs for: `"[CRON] Starting Gmail background sync..."`
- Verify cron job is registered: `"[CRON] All cron jobs registered successfully"`
- Check for sync errors in logs

**If background sync isn't working:**
1. Check Railway cron job configuration
2. Verify `CRON_SECRET` environment variable is set
3. Check Railway logs for cron job errors

### Step 4: Verify Messages in Database

**Check if messages were imported:**
```sql
-- Count messages for a user
SELECT COUNT(*) FROM "InboundEmail" WHERE "userId" = 'USER_ID';

-- Check recent sync timestamp
SELECT "lastSyncedAt" FROM "GmailToken" WHERE "userId" = 'USER_ID';
```

---

## 🧪 Testing Checklist

### Test 1: Gmail Connection
- [ ] User can connect Gmail account
- [ ] OAuth flow completes successfully
- [ ] Token is stored in database
- [ ] No "gmail_not_connected" errors

### Test 2: Manual Sync
- [ ] Can trigger sync via `/admin/inbox` page
- [ ] Sync completes without errors
- [ ] Messages appear in inbox after sync
- [ ] Sync statistics are accurate

### Test 3: Message Listing
- [ ] `/api/gmail/messages` returns messages (if synced)
- [ ] `/api/gmail/inbox` returns threads (if synced)
- [ ] Empty arrays returned if no messages (not errors)
- [ ] Error messages are helpful and actionable

### Test 4: Background Sync
- [ ] Cron job runs every 15 minutes
- [ ] Sync completes for all connected users
- [ ] New messages are imported automatically
- [ ] No duplicate messages created

---

## 📋 Common Issues & Solutions

### Issue: "Gmail account is not connected"
**Solution:**
1. Go to `/admin/inbox` or `/admin/settings`
2. Click "Connect Gmail"
3. Complete OAuth flow
4. Verify token is saved in database

### Issue: "No messages found" (but Gmail is connected)
**Solution:**
1. Trigger manual sync: Click "Sync Gmail" button
2. Wait 1-2 minutes for sync to complete
3. Refresh the page
4. Check Railway logs for sync errors

### Issue: "Failed to list Gmail messages" (500 error)
**Solution:**
1. Check Railway logs for backend errors
2. Verify database connection is working
3. Check if `InboundEmail` and `InboxMessage` tables exist
4. Verify user has Gmail token in database

### Issue: Messages not syncing automatically
**Solution:**
1. Check if cron job is running: Look for `"[CRON] Starting Gmail background sync..."`
2. Verify `CRON_SECRET` is set in Railway
3. Check cron job registration in `apps/api/src/cron/index.ts`
4. Manually trigger sync to test

### Issue: "Token has been expired" or "invalid_grant"
**Solution:**
1. User needs to reconnect Gmail account
2. OAuth token refresh failed
3. Go to `/admin/inbox` and click "Disconnect" then "Connect Gmail" again

---

## 🔍 Debugging Steps

### 1. Check Railway Logs
```bash
railway logs --service @breakagency/api | grep -i gmail
```

**Look for:**
- `[GMAIL SYNC]` - Sync operations
- `[GMAIL CALLBACK]` - OAuth callbacks
- `[GMAIL AUTH]` - Authentication issues
- `[CRON]` - Background sync jobs

### 2. Check Database
```sql
-- Check Gmail tokens
SELECT "userId", "lastSyncedAt", "lastError", "lastErrorAt" 
FROM "GmailToken";

-- Check imported messages
SELECT COUNT(*), "userId" 
FROM "InboundEmail" 
GROUP BY "userId";

-- Check recent syncs
SELECT "userId", "lastSyncedAt" 
FROM "GmailToken" 
WHERE "lastSyncedAt" > NOW() - INTERVAL '1 hour';
```

### 3. Test API Endpoints

**Check Gmail Status:**
```bash
curl https://breakagencyapi-production.up.railway.app/api/gmail/auth/status \
  -H "Cookie: break_session=YOUR_SESSION_COOKIE"
```

**List Messages:**
```bash
curl https://breakagencyapi-production.up.railway.app/api/gmail/messages \
  -H "Cookie: break_session=YOUR_SESSION_COOKIE"
```

**Trigger Sync:**
```bash
curl -X POST https://breakagencyapi-production.up.railway.app/api/gmail/inbox/sync \
  -H "Cookie: break_session=YOUR_SESSION_COOKIE"
```

---

## 📝 Next Steps

1. **Deploy fixes to Railway:**
   ```bash
   cd apps/api
   git add .
   git commit -m "Fix Gmail sync error handling"
   git push
   # Railway will auto-deploy
   ```

2. **Deploy frontend fixes to Vercel:**
   ```bash
   cd apps/web
   git add .
   git commit -m "Improve Gmail error messages"
   git push
   # Vercel will auto-deploy
   ```

3. **Test after deployment:**
   - Connect Gmail account (if not connected)
   - Trigger manual sync
   - Verify messages appear
   - Check error messages are helpful

---

## 🎯 Success Criteria

- ✅ Gmail connection works without errors
- ✅ Manual sync imports messages successfully
- ✅ Background sync runs every 15 minutes
- ✅ Error messages are clear and actionable
- ✅ Empty inbox shows helpful message (not error)
- ✅ Messages appear in `/admin/inbox` after sync

---

**Last Updated:** December 29, 2025  
**Status:** Fixes applied - Ready for deployment

