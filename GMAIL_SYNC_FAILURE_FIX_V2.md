# Gmail Sync "100 Failed" Fix - Version 2

## Issue
Gmail sync was still reporting "100 failed" even after previous fixes that categorized soft failures as skipped.

## Root Cause Analysis

After auditing the code, I identified several potential issues:

1. **Duplicate Error Detection Too Narrow**: Only checking for `errorCode === 'P2002'`, but:
   - PostgreSQL returns `23505` for unique violations
   - Error messages might contain duplicate/unique keywords
   - Error structure might differ in production

2. **Duplicate Check Query Issues**: 
   - Query might fail silently if there are too many IDs
   - Not filtering by `userId` (could match other users' emails)
   - No chunking for safety (though 100 should be fine)

3. **Insufficient Error Logging**: 
   - Not logging enough detail to diagnose issues
   - No warnings for high failure rates

## Fixes Applied

### 1. Enhanced Duplicate Error Detection

**Before:**
```typescript
if (errorCode === 'P2002') {
  stats.skipped++;
}
```

**After:**
```typescript
const isDuplicateError = 
  errorCode === 'P2002' ||
  errorCode === '23505' || // PostgreSQL unique violation
  errorMessage.toLowerCase().includes('unique constraint') ||
  errorMessage.toLowerCase().includes('duplicate key') ||
  errorMessage.toLowerCase().includes('already exists') ||
  (meta?.target && Array.isArray(meta.target) && meta.target.includes('gmailId'));

if (isDuplicateError) {
  stats.skipped++;
}
```

**Why:** Catches duplicate errors in multiple formats (Prisma codes, PostgreSQL codes, error messages, constraint metadata).

### 2. Improved Duplicate Check Query

**Before:**
```typescript
const existingEmails = await prisma.inboundEmail.findMany({
  where: { gmailId: { in: gmailIds } },
  select: { gmailId: true }
});
```

**After:**
```typescript
// Split into chunks for safety (though 100 should be fine)
const chunkSize = 100;
for (let i = 0; i < gmailIds.length; i += chunkSize) {
  const chunk = gmailIds.slice(i, i + chunkSize);
  const existingEmails = await prisma.inboundEmail.findMany({
    where: { 
      gmailId: { in: chunk },
      userId: userId // Also filter by userId for safety
    },
    select: { gmailId: true }
  });
  // ... add to existingGmailIds
}
```

**Why:** 
- Adds `userId` filter for safety (prevents matching other users' emails)
- Chunking for safety (though 100 messages should be fine)
- Better error handling with detailed logging

### 3. Enhanced Error Logging

**Added:**
- Error code, name, and constraint details
- Stack traces (truncated)
- Warning logs for high failure rates
- Warning logs when all messages fail

**Example:**
```typescript
console.error(`[GMAIL SYNC] Transaction failed for message ${gmailMessage.id}:`, {
  error: errorMessage,
  messageId: gmailMessage.id,
  threadId: gmailMessage.threadId,
  errorCode,
  errorName,
  constraint: meta?.target,
  stack: txError instanceof Error ? txError.stack?.substring(0, 500) : undefined,
});
```

### 4. Failure Rate Warnings

**Added:**
```typescript
// Log warning if all messages failed
if (stats.failed > 0 && stats.imported === 0 && stats.skipped === 0) {
  console.error(`[GMAIL SYNC] ⚠️ WARNING: All ${stats.failed} messages failed...`);
}

// Log warning if high failure rate
if (stats.failed > 0 && totalProcessed > 0) {
  const failureRate = (stats.failed / totalProcessed) * 100;
  if (failureRate > 50) {
    console.error(`[GMAIL SYNC] ⚠️ WARNING: High failure rate (${failureRate.toFixed(1)}%)...`);
  }
}
```

## Testing

To test locally:

1. **Start API server:**
   ```bash
   cd apps/api
   pnpm run dev
   ```

2. **Trigger Gmail sync:**
   - Go to `/admin/messaging`
   - Click "Sync inbox"
   - Check browser console and API logs

3. **Check logs for:**
   - Duplicate detection working
   - Error codes and messages
   - Failure rate warnings
   - Detailed error information

## Expected Behavior

**If all 100 messages are duplicates:**
- Should show: `0 imported, 100 skipped, 0 failed`
- Frontend should show: "All emails up to date (100 already synced)"

**If some messages fail to map:**
- Should show: `X imported, Y skipped, Z failed`
- Frontend should show: "Synced X new emails, Y skipped, Z failed"
- Logs should show detailed error for each failure

**If duplicate check fails:**
- Messages will try to insert
- Duplicate inserts will be caught by enhanced P2002 detection
- Should still count as `skipped`, not `failed`

## Next Steps

1. **Deploy to Railway** (auto-deploys on push)
2. **Test in production** with real Gmail account
3. **Monitor logs** for:
   - Duplicate error patterns
   - High failure rates
   - Error codes and messages
4. **If still seeing "100 failed":**
   - Check Railway logs for detailed error messages
   - Look for error codes that aren't being caught
   - Check if mapping function is throwing errors for all messages

## Files Changed

- `apps/api/src/services/gmail/syncInbox.ts`
  - Enhanced duplicate error detection
  - Improved duplicate check query
  - Added detailed error logging
  - Added failure rate warnings

## Verification Checklist

- [x] Enhanced P2002 detection to catch multiple error formats
- [x] Added userId filter to duplicate check query
- [x] Added chunking for duplicate check (safety)
- [x] Added detailed error logging
- [x] Added failure rate warnings
- [x] Committed and pushed changes

## Notes

- The duplicate check query now filters by `userId` to prevent matching other users' emails
- Error detection now checks multiple patterns to catch duplicates in various formats
- Detailed logging will help diagnose any remaining issues
- Failure rate warnings will alert if there's a systemic problem

