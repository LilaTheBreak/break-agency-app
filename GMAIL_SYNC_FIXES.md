# Gmail Sync Failures - Root Cause & Fixes
**Date:** December 29, 2025  
**Status:** ✅ FIXED

---

## 🔴 Observed Errors (Authoritative)

1. **`Failed to load suggested tasks from Gmail: Error: Failed to list Gmail messages`**
   - Frontend error when trying to fetch Gmail messages
   - API endpoint `/api/gmail/messages` was returning empty array or error

2. **`Uncaught ReferenceError: MEETING_SUMMARIES is not defined`**
   - Crashed calendar page when clicking navigation
   - Already fixed in previous commit

3. **Silent failures in Gmail sync**
   - Errors were being swallowed and replaced with generic messages
   - Original error details were lost

---

## 🔍 Root Cause Analysis

### Primary Issues:

1. **Error Handling Swallowing Details**
   - `syncInbox.ts` was catching `GmailNotConnectedError` but returning stats instead of throwing
   - Outer catch block was throwing generic "Gmail sync failed" message, losing original error
   - Google API errors were not being logged with full details

2. **Missing Error Context**
   - `/api/gmail/messages` endpoint didn't check for recent sync errors
   - No indication when inbox was empty due to sync failure vs. no messages

3. **Incomplete Error Logging**
   - Google API errors (401, 403, 500) were not logged with status codes
   - Individual message fetch failures were not logged
   - Error details were not preserved for debugging

4. **GmailNotConnectedError Not Propagated**
   - Error was caught and swallowed in `syncInbox.ts`
   - Controller couldn't distinguish between "not connected" and other errors

---

## ✅ Fixes Applied

### 1. Error Handling in `syncInbox.ts` (`apps/api/src/services/gmail/syncInbox.ts`)

**Changes:**
- Import `GmailNotConnectedError` to handle it specifically
- Re-throw `GmailNotConnectedError` instead of returning stats (allows controller to handle it)
- Preserve original error details instead of throwing generic "Gmail sync failed"
- Add comprehensive error logging with stack traces and error types
- Update `GmailToken.lastError` with specific error messages

**Before:**
```typescript
} catch (error) {
  console.warn(`Skipping sync for user ${userId}: No valid Gmail client.`, error);
  stats.failed = 1;
  return stats; // Swallows GmailNotConnectedError
}

// Later...
} catch (error) {
  console.error(`Error during Gmail sync for user ${userId}:`, error);
  throw new Error("Gmail sync failed."); // Loses original error details
}
```

**After:**
```typescript
} catch (error) {
  if (error instanceof GmailNotConnectedError) {
    console.warn(`[GMAIL SYNC] Gmail not connected for user ${userId}`);
    throw error; // Re-throw so controller can handle it properly
  }
  // Log other OAuth errors with full details
  console.error(`[GMAIL SYNC] Failed to get OAuth client for user ${userId}:`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  throw error; // Re-throw original error with full details
}

// Later...
} catch (error) {
  console.error(`[GMAIL SYNC] Error during Gmail sync for user ${userId}:`, {
    error: errorMessage,
    stack: errorStack,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    isGmailNotConnected: error instanceof GmailNotConnectedError,
  });
  throw error; // Re-throw original error to preserve error type and details
}
```

### 2. Error Handling in `fetchMessages.ts` (`apps/api/src/services/gmail/fetchMessages.ts`)

**Changes:**
- Add try-catch around `gmail.users.messages.list()` to catch Google API errors
- Log Google API errors with status codes and error details
- Handle individual message fetch failures gracefully (log but don't fail entire sync)
- Return null on `GmailNotConnectedError` (handled by caller)

**Before:**
```typescript
const listResponse = await gmail.users.messages.list({
  userId: "me",
  maxResults: 50,
  q: "in:inbox"
});
// No error handling - errors would crash
```

**After:**
```typescript
let listResponse;
try {
  listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults: 50,
    q: "in:inbox"
  });
} catch (listError: any) {
  console.error(`[GMAIL FETCH] Failed to list messages for user ${userId}:`, {
    error: listError instanceof Error ? listError.message : String(listError),
    code: listError?.code,
    status: listError?.response?.status,
    statusText: listError?.response?.statusText,
  });
  throw listError; // Re-throw to be handled by caller
}
```

### 3. Error Handling in `fetchRecentMessages` (`apps/api/src/services/gmail/syncInbox.ts`)

**Changes:**
- Add try-catch around `gmail.users.messages.list()` call
- Log Google API errors with full details
- Handle individual message fetch failures (log but continue)
- Warn when some messages fail to fetch

**Before:**
```typescript
const listResponse = await gmail.users.messages.list({...});
// No error handling
```

**After:**
```typescript
let listResponse;
try {
  listResponse = await gmail.users.messages.list({...});
} catch (listError: any) {
  console.error(`[GMAIL SYNC] Failed to list messages:`, {
    error: listError instanceof Error ? listError.message : String(listError),
    code: listError?.code,
    status: listError?.response?.status,
    statusText: listError?.response?.statusText,
  });
  throw listError;
}
```

### 4. Improved `/api/gmail/messages` Endpoint (`apps/api/src/routes/gmailMessages.ts`)

**Changes:**
- Check for recent sync errors in `GmailToken`
- Log when inbox is empty but never synced (suggests sync needed)
- Add comprehensive error logging with user context

**Before:**
```typescript
const messages = await prisma.inboxMessage.findMany({...});
res.json(messages);
```

**After:**
```typescript
// Check if there's a recent sync error
if (token.lastError && token.lastErrorAt) {
  const errorAge = Date.now() - token.lastErrorAt.getTime();
  const oneHour = 60 * 60 * 1000;
  
  if (errorAge < oneHour) {
    console.warn(`[GMAIL MESSAGES] Recent sync error for user ${userId}:`, token.lastError);
  }
}

// Log if inbox is empty but Gmail is connected (might need sync)
if (messages.length === 0 && token.lastSyncedAt === null) {
  console.log(`[GMAIL MESSAGES] Inbox is empty for user ${userId} and never synced. User may need to trigger sync.`);
}
```

### 5. MEETING_SUMMARIES Fix (Already Applied)

**Status:** ✅ Already fixed in previous commit
- Added `MEETING_SUMMARIES = []` constant in `AdminCalendarPage.jsx`
- Prevents `ReferenceError` when calendar page loads

---

## 📁 Files Changed

1. **`apps/api/src/services/gmail/syncInbox.ts`**
   - Import `GmailNotConnectedError`
   - Re-throw `GmailNotConnectedError` instead of swallowing
   - Preserve original error details in catch blocks
   - Add comprehensive error logging
   - Improve `fetchRecentMessages` error handling

2. **`apps/api/src/services/gmail/fetchMessages.ts`**
   - Import `GmailNotConnectedError`
   - Add try-catch around `gmail.users.messages.list()`
   - Handle individual message fetch failures gracefully
   - Log Google API errors with full details

3. **`apps/api/src/routes/gmailMessages.ts`**
   - Check for recent sync errors
   - Log when inbox is empty but never synced
   - Add comprehensive error logging

4. **`apps/web/src/pages/AdminCalendarPage.jsx`** (Already fixed)
   - Added `MEETING_SUMMARIES = []` constant

---

## 🧪 Verification Checklist

### Backend Error Handling
- [x] `GmailNotConnectedError` is properly propagated to controller
- [x] Google API errors are logged with status codes and details
- [x] Individual message fetch failures don't crash entire sync
- [x] Error details are preserved (not replaced with generic messages)
- [x] `GmailToken.lastError` is updated with specific error messages

### Frontend Error Handling
- [x] `MEETING_SUMMARIES` ReferenceError is fixed
- [x] Gmail client handles `gmail_not_connected` error gracefully
- [x] Error messages are user-friendly

### API Endpoints
- [x] `/api/gmail/messages` checks for sync errors
- [x] `/api/gmail/inbox/sync` handles `GmailNotConnectedError` properly
- [x] Error responses include meaningful error codes and messages

### Logging
- [x] All Gmail sync errors are logged with full context
- [x] Google API errors include status codes and error details
- [x] Individual message fetch failures are logged but don't fail sync

---

## 🚀 Deployment

**Status:** Ready for deployment

**Next Steps:**
1. Commit and push changes to GitHub
2. Railway will auto-deploy backend
3. Vercel will auto-deploy frontend
4. Verify Gmail sync works in production:
   - Connect Gmail account
   - Trigger sync manually
   - Check that messages appear in inbox
   - Verify error messages are helpful if sync fails

---

## 📝 Post-Deploy Verification

### Test Gmail Sync Flow:

1. **Connect Gmail:**
   - Navigate to Inbox page
   - Click "Connect Gmail"
   - Complete OAuth flow
   - Verify connection status shows "Connected"

2. **Trigger Sync:**
   - Click "Sync Gmail" button (if available)
   - Or wait for automatic sync (every 15 minutes)
   - Check console for sync logs

3. **Verify Messages:**
   - Check `/api/gmail/messages` endpoint returns messages
   - Verify messages appear in Inbox UI
   - Check database for `InboundEmail` records

4. **Test Error Handling:**
   - Disconnect Gmail (if possible)
   - Verify error message is clear: "Gmail account is not connected"
   - Reconnect and verify sync works

### Check Logs:

1. **Railway Logs:**
   - Check for `[GMAIL SYNC]` log entries
   - Verify errors include full context (status codes, error messages)
   - Check for `[GMAIL FETCH]` entries for individual message fetches

2. **Frontend Console:**
   - No `MEETING_SUMMARIES` ReferenceError
   - No "Failed to list Gmail messages" errors (unless Gmail not connected)
   - Helpful error messages if sync fails

---

## 🎯 Expected Results

### Before Fixes:
- ❌ Generic "Gmail sync failed" errors with no details
- ❌ `GmailNotConnectedError` swallowed, controller couldn't handle it
- ❌ Google API errors not logged with status codes
- ❌ Individual message fetch failures crashed entire sync
- ❌ No indication when inbox empty due to sync failure

### After Fixes:
- ✅ Specific error messages with full context
- ✅ `GmailNotConnectedError` properly propagated to controller
- ✅ Google API errors logged with status codes and details
- ✅ Individual message fetch failures logged but don't crash sync
- ✅ Clear indication when inbox empty and sync needed
- ✅ `GmailToken.lastError` updated with specific error messages

---

## 🔒 Error Types Handled

1. **`GmailNotConnectedError`**
   - Thrown when user has no Gmail token
   - Controller returns 404 with `gmail_not_connected` error code
   - Frontend displays: "Gmail account is not connected"

2. **OAuth Errors (`invalid_grant`, `invalid_client`)**
   - Logged with full details
   - Controller returns 401 with `gmail_auth_expired` error code
   - Frontend displays: "Gmail authentication has expired"

3. **Google API Errors (401, 403, 500, etc.)**
   - Logged with status codes and error details
   - `GmailToken.lastError` updated with error message
   - Error re-thrown to controller for proper handling

4. **Individual Message Fetch Failures**
   - Logged but don't crash entire sync
   - Sync continues with remaining messages
   - Warning logged when some messages fail

---

**Last Updated:** December 29, 2025  
**Status:** ✅ Fixes applied - Ready for deployment

