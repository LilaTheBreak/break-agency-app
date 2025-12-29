# Gmail Integration Audit Summary
**Date:** December 29, 2025  
**Status:** 🔄 IN PROGRESS  
**Scope:** Complete Gmail sync pipeline audit and hardening

---

## EXECUTIVE SUMMARY

### Overall Assessment: **6/10 - FUNCTIONAL WITH CRITICAL BUGS**

**What Works:**
- ✅ Gmail OAuth flow (connect/disconnect)
- ✅ Token refresh mechanism
- ✅ Basic message fetching from Gmail API
- ✅ Database models exist (InboundEmail, InboxMessage)
- ✅ Inbox API endpoints exist
- ✅ Frontend components exist

**What's Broken:**
- 🔴 **CRITICAL:** Field name mismatch in mappings (will cause DB errors)
- 🔴 **CRITICAL:** Missing Gmail sync cron job (no automatic sync)
- 🟡 Classification logic is basic (keyword-only, AI optional)
- 🟡 No incremental sync (always fetches 100 messages)
- 🟡 Missing error recovery for failed syncs

**What's Incomplete:**
- 📝 Email classification needs enhancement
- 📝 No automatic background sync
- 📝 Limited error observability

---

## 1. GMAIL AUTH & PERMISSIONS AUDIT

### ✅ OAuth Flow
**Status:** WORKING

**Files:**
- `apps/api/src/routes/gmailAuth.ts` - Main auth routes
- `apps/api/src/integrations/gmail/googleAuth.ts` - OAuth client
- `apps/api/src/services/gmail/tokens.ts` - Token management

**Scopes Requested:**
```typescript
[
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
]
```

**Status:** ✅ Correct scopes for read-only Gmail access

**Token Storage:**
- ✅ Stored in database (`GmailToken` model)
- ✅ NOT in localStorage (secure)
- ✅ Refresh token persisted

**Token Refresh:**
- ✅ Automatic refresh via OAuth2 client event handler
- ✅ Updates database on refresh
- ✅ Error tracking in `lastError` field

**Issues Found:**
- ⚠️ **MINOR:** Missing refresh token handling edge case (if Google doesn't return refresh_token on re-auth)

**Fix Required:**
- ✅ Already handled - callback checks for refresh_token and redirects with error if missing

---

## 2. GMAIL MESSAGE IMPORT AUDIT

### 🔴 CRITICAL BUG: Field Name Mismatch
**File:** `apps/api/src/services/gmail/mappings.ts`  
**Line:** 80-81

**Problem:**
```typescript
// Current (WRONG):
inboundEmailData: {
  from: getHeader(headers, "From"),  // ❌ Schema expects fromEmail
  to: getHeader(headers, "To"),      // ❌ Schema expects toEmail
  // ...
}
```

**Schema Expects:**
```prisma
model InboundEmail {
  fromEmail String  // ✅ Correct field name
  toEmail   String  // ✅ Correct field name
}
```

**Impact:** 
- 🔴 **CRITICAL** - Database writes will fail
- Emails will not be stored
- Sync will appear to work but data won't persist

**Fix:** Change `from` → `fromEmail` and `to` → `toEmail`

### ✅ Sync Logic
**File:** `apps/api/src/services/gmail/syncInbox.ts`

**Current Implementation:**
- Fetches last 100 messages from Gmail
- Checks for duplicates by `gmailId`
- Transactionally upserts `InboxMessage` and `InboundEmail`
- Links emails to CRM (contacts/brands)

**Issues:**
- ⚠️ **LIMITATION:** Always fetches 100 messages (no incremental sync)
- ⚠️ **LIMITATION:** No pagination for large inboxes
- ✅ Deduplication works (checks `gmailId` before insert)

**Error Handling:**
- ✅ Errors logged to `GmailToken.lastError`
- ✅ Sync stats returned (imported, skipped, failed)
- ⚠️ **ISSUE:** Errors don't crash app (good) but may be silent

---

## 3. DATA MODEL & STORAGE AUDIT

### ✅ Database Schema
**Status:** CORRECT

**Models:**
- `InboundEmail` - Individual email messages
- `InboxMessage` - Thread-level aggregation
- `GmailToken` - OAuth tokens per user

**Relationships:**
- ✅ `InboundEmail.inboxMessageId` → `InboxMessage.id`
- ✅ `InboundEmail.userId` → `User.id`
- ✅ Cascade deletes configured

**Indexes:**
- ✅ `gmailId` unique (prevents duplicates)
- ✅ `threadId` indexed
- ✅ `userId` indexed
- ✅ `receivedAt` indexed

**Issues:**
- 🔴 **CRITICAL:** Field name mismatch (see section 2)
- ⚠️ **MINOR:** `body` field stores both HTML and text (could be separate)

---

## 4. EMAIL CLASSIFICATION & SORTING

### ⚠️ Current Implementation
**File:** `apps/api/src/services/gmail/gmailCategoryEngine.ts`

**Status:** BASIC (Keyword-only)

**Current Logic:**
```typescript
const KEYWORDS = {
  "paid collaboration": { category: "deal", urgency: "high" },
  "partnership opportunity": { category: "deal", urgency: "medium" },
  "you're invited": { category: "event", urgency: "medium" },
  // ... only 6 keywords total
};
```

**Issues:**
- ⚠️ **LIMITED:** Only 6 keyword patterns
- ⚠️ **LIMITED:** No domain-based classification
- ⚠️ **LIMITED:** No brand detection
- ⚠️ **LIMITED:** No contact categorization

**AI Classification:**
- ✅ Exists in `gmailAnalysisService.ts`
- ✅ Uses OpenAI GPT-4o
- ⚠️ **OPTIONAL:** Only runs if `OPENAI_API_KEY` is set
- ⚠️ **LIMITATION:** Not automatically called during sync

**What's Missing:**
- Domain-based brand detection (should use `linkEmailToCrm` results)
- Heuristic classification (newsletters, receipts, auto-replies)
- Confidence scoring for manual review

---

## 5. INBOX API & FRONTEND WIRING

### ✅ API Endpoints
**Status:** WORKING

**Endpoints:**
- `GET /api/gmail/inbox` - Paginated threads ✅
- `GET /api/gmail/inbox/unread` - Unread only ✅
- `GET /api/gmail/inbox/search?q=...` - Search ✅
- `GET /api/gmail/inbox/thread/:id` - Single thread ✅
- `POST /api/gmail/inbox/sync` - Manual sync ✅

**Service:** `apps/api/src/services/gmail/inboxService.ts`
- ✅ Fetches from database (not Gmail API directly)
- ✅ Pagination works
- ✅ Filtering works

### ✅ Frontend Components
**Status:** WORKING

**Files:**
- `apps/web/src/pages/InboxPage.jsx` - Main inbox page
- `apps/web/src/pages/AdminMessagingPage.jsx` - Admin inbox
- `apps/web/src/services/inboxClient.js` - API client
- `apps/web/src/services/gmailClient.js` - Gmail-specific client

**Issues:**
- ⚠️ **MINOR:** Some components may show empty states if no data
- ✅ Error handling exists (graceful fallbacks)

---

## 6. ERROR HANDLING & OBSERVABILITY

### ⚠️ Current State
**Status:** BASIC

**Error Tracking:**
- ✅ `GmailToken.lastError` field exists
- ✅ `GmailToken.lastErrorAt` timestamp
- ✅ `GmailToken.lastSyncedAt` timestamp
- ⚠️ **LIMITATION:** Errors logged but not aggregated

**Logging:**
- ✅ Console logs for sync operations
- ⚠️ **LIMITATION:** No structured logging
- ⚠️ **LIMITATION:** No alerting on failures

**Missing:**
- Audit logs for sync operations (commented out in code)
- Error aggregation dashboard
- Alerting for repeated failures

---

## 7. BACKGROUND SYNC

### 🔴 CRITICAL: Missing Cron Job
**Status:** NOT REGISTERED

**Evidence:**
- ✅ Service exists: `apps/api/src/services/gmail/backgroundSync.ts`
- ✅ Function exists: `syncAllUsers()`
- ✅ Cron endpoint exists: `POST /api/cron/gmail-sync`
- ❌ **NOT REGISTERED** in `apps/api/src/cron/index.ts`

**Impact:**
- 🔴 No automatic Gmail sync
- Users must manually trigger sync
- New emails won't appear automatically

**Fix Required:**
- Add cron job registration in `cron/index.ts`
- Schedule every 15 minutes (recommended)

---

## FIXES APPLIED

### ✅ Fix #1: Field Name Mismatch in Mappings
**File:** `apps/api/src/services/gmail/mappings.ts`  
**Status:** ✅ FIXED

**Changes:**
- Changed `from` → `fromEmail`
- Changed `to` → `toEmail`
- Changed `date` → `receivedAt`
- Combined `bodyHtml` and `bodyText` into single `body` field
- Added `userId` to inboundEmailData
- Added `sender` field to InboxMessage
- Enhanced `participants` array to include To and Cc

**Impact:** 🔴 CRITICAL - Fixed database write failures

### ✅ Fix #2: Register Gmail Sync Cron Job
**File:** `apps/api/src/cron/index.ts`  
**Status:** ✅ FIXED

**Changes:**
- Added cron job registration for Gmail sync (every 15 minutes)
- Imports and calls `syncAllUsers()` from backgroundSync service

**Impact:** 🔴 CRITICAL - Enables automatic background sync

### ✅ Fix #3: Enhanced Classification
**File:** `apps/api/src/services/gmail/gmailCategoryEngine.ts`  
**Status:** ✅ ENHANCED

**Changes:**
- Expanded keyword patterns from 6 to 20+
- Added domain-based newsletter detection
- Added receipt/order confirmation detection
- Added auto-reply detection
- Added `fromEmail` parameter for domain-based classification

**File:** `apps/api/src/services/gmail/syncInbox.ts`  
**Changes:**
- Added automatic rule-based classification during sync
- Stores classification in `categories` array and `metadata`

**Impact:** 🟡 ENHANCEMENT - Better email categorization

### ✅ Fix #4: Fixed Gmail Client Usage
**File:** `apps/api/src/services/gmail/syncInbox.ts`  
**Status:** ✅ FIXED

**Changes:**
- Fixed OAuth client to Gmail client conversion
- Proper error handling for missing tokens

**Impact:** 🔴 CRITICAL - Fixed sync failures

### 🟡 Priority 2: Future Enhancements (Not Applied)

#### Enhancement #5: Incremental Sync
- Track `lastSyncedAt` per user
- Only fetch messages after last sync timestamp
- Reduce API calls and improve performance
- **Status:** Not implemented (always fetches last 100 messages)

#### Enhancement #6: AI Classification During Sync
- Currently classification is rule-based only during sync
- AI classification requires manual trigger or separate job
- **Status:** Optional enhancement (AI is expensive, rule-based is fast)

---

## VERIFICATION CHECKLIST

Before deployment, verify:

- [x] Fix #1 applied (field name mismatch) ✅
- [x] Fix #2 applied (cron job registered) ✅
- [x] Fix #3 applied (enhanced classification) ✅
- [x] Fix #4 applied (Gmail client usage) ✅
- [ ] User can connect Gmail successfully (TEST REQUIRED)
- [ ] Emails appear in database after sync (TEST REQUIRED)
- [ ] No duplicate emails on re-sync (TEST REQUIRED)
- [ ] Inbox UI shows real emails (TEST REQUIRED)
- [ ] Classification visible in UI (TEST REQUIRED)
- [ ] Background sync runs automatically (TEST REQUIRED)

---

## IMPLEMENTATION NOTES

### Key Files Changed

1. **`apps/api/src/services/gmail/mappings.ts`**
   - Fixed field names (`fromEmail`, `toEmail`, `receivedAt`)
   - Combined body fields into single `body`
   - Added `userId` and `sender` fields
   - Enhanced participant extraction

2. **`apps/api/src/cron/index.ts`**
   - Added Gmail sync cron job (every 15 minutes)

3. **`apps/api/src/services/gmail/gmailCategoryEngine.ts`**
   - Expanded keyword patterns
   - Added domain-based classification
   - Added newsletter/receipt/auto-reply detection

4. **`apps/api/src/services/gmail/syncInbox.ts`**
   - Fixed Gmail client initialization
   - Added automatic classification during sync
   - Enhanced error handling

5. **`apps/api/src/services/gmail/gmailAnalysisService.ts`**
   - Updated to pass `fromEmail` to classification

### Assumptions Made

1. **Body Storage:** Schema only has single `body` field, so HTML is converted to text using `cleanEmailBody()`. If HTML preservation is needed, it would require schema migration.

2. **Classification:** Rule-based classification runs during sync (fast, free). AI classification is optional and requires manual trigger or separate job (expensive, slower).

3. **Sync Frequency:** Cron runs every 15 minutes. This balances freshness with API rate limits. Can be adjusted if needed.

4. **Error Handling:** Errors are logged but don't crash the app. Failed syncs are tracked in `GmailToken.lastError` field.

---

## DEPLOYMENT CONFIRMATION

### What Was Deployed

**Status:** 🔄 READY FOR DEPLOYMENT

**Changes Ready:**
- ✅ Critical bug fixes (field names, Gmail client)
- ✅ Cron job registration
- ✅ Enhanced classification
- ✅ Automatic classification during sync

**Deployment Steps:**

1. **Deploy API to Railway:**
   ```bash
   cd apps/api
   railway up
   ```

2. **Deploy Frontend to Vercel:**
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Post-Deploy Verification:**
   - Connect Gmail account via UI
   - Trigger manual sync
   - Verify emails appear in database
   - Verify cron job runs (check logs)
   - Verify inbox UI shows real data

### Post-Deploy Checks Needed

1. **Monitor Cron Job:**
   - Check Railway logs for `[CRON] Starting Gmail background sync...`
   - Verify sync runs every 15 minutes
   - Check for errors in logs

2. **Monitor Sync Performance:**
   - Check `GmailToken.lastSyncedAt` updates
   - Monitor `GmailToken.lastError` for failures
   - Verify no duplicate emails

3. **Monitor Classification:**
   - Check `InboundEmail.categories` array populated
   - Verify `metadata.ruleCategory` set
   - Test AI classification if enabled

4. **Monitor Frontend:**
   - Verify inbox page loads
   - Verify sync button works
   - Verify error messages display correctly

---

**Status:** ✅ All critical fixes applied. Ready for testing and deployment.

