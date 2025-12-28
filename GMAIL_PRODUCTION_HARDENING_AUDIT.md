# GMAIL → CRM PRODUCTION HARDENING AUDIT

**Date:** 29 December 2025  
**Status:** 🔍 IN PROGRESS  
**Engineer:** Production Hardening Team

---

## PHASE 1: PIPELINE AUDIT

### 1.1 OAuth & Token Management

| Component | Status | Notes |
|-----------|--------|-------|
| Environment variables | ⚠️ **RISKY** | No validation on boot - accepts "test" values |
| Token storage | ✅ **WORKING** | Persisted in `GmailToken` table |
| Token refresh | ⚠️ **RISKY** | Errors logged but not surfaced to status API |
| Redirect URI | ⚠️ **RISKY** | Fallback to localhost if not set |
| Client validation | ❌ **MISSING** | No check for "test" credentials |

**Critical Issues:**
1. ❌ Server boots with `GOOGLE_CLIENT_ID=test` without error
2. ❌ Token refresh failures silent (no `lastError` field)
3. ❌ No production credential validation

---

### 1.2 Gmail API Integration

| Component | Status | Notes |
|-----------|--------|-------|
| Message fetching | ✅ **WORKING** | Pagination implemented |
| Deduplication | ✅ **WORKING** | By `gmailId` unique constraint |
| Error handling | ⚠️ **RISKY** | Some errors swallowed |
| Partial failures | ✅ **WORKING** | Don't rollback successful imports |
| INBOX filtering | ⚠️ **INCOMPLETE** | Only fetches INBOX, not SENT |

**Critical Issues:**
1. ⚠️ Only syncs INBOX - misses sent emails (affects CRM completeness)
2. ❌ No handling of Gmail API rate limits
3. ⚠️ Missing historyId-based incremental sync

---

### 1.3 CRM Auto-Creation

| Component | Status | Notes |
|-----------|--------|-------|
| Contact deduplication | ⚠️ **RISKY** | No unique constraint on email |
| Brand deduplication | ⚠️ **RISKY** | No unique constraint on brandName |
| Email normalization | ✅ **WORKING** | Lowercase + trim |
| Domain parsing | ✅ **WORKING** | Free provider filtering |
| Race conditions | ❌ **UNSAFE** | No locking on parallel syncs |

**Critical Issues:**
1. ❌ **DUPLICATE RISK:** No unique constraint on `CrmBrandContact.email`
2. ❌ **DUPLICATE RISK:** No unique constraint on `CrmBrand.brandName`
3. ❌ Race condition: concurrent syncs can create duplicate contacts
4. ⚠️ Subdomain handling incomplete (www.nike.com vs nike.com)

---

### 1.4 Audit Logging

| Component | Status | Notes |
|-----------|--------|-------|
| Sync events | ✅ **WORKING** | START/COMPLETE/FAILED logged |
| Contact creation | ✅ **WORKING** | Logged with metadata |
| Brand creation | ✅ **WORKING** | Logged with metadata |
| Token refresh | ❌ **MISSING** | Not logged |
| OAuth failures | ❌ **MISSING** | Not logged |

**Critical Issues:**
1. ❌ Token refresh failures not logged
2. ❌ OAuth failures not logged to AuditLog

---

### 1.5 Error Visibility

| Component | Status | Notes |
|-----------|--------|-------|
| Status API | ⚠️ **INCOMPLETE** | No `lastError` field |
| Frontend error UI | ❌ **MISSING** | Need to verify |
| Empty state handling | ❌ **MISLEADING** | Zero emails = success OR failure |
| Sync failure alerts | ❌ **MISSING** | No visible alerts |

**Critical Issues:**
1. ❌ Status API missing `lastError` and `connectionStatus` fields
2. ❌ Frontend likely shows "connected" even when broken
3. ❌ Empty inbox indistinguishable from sync failure

---

## PHASE 2: CRITICAL FIXES REQUIRED

### Priority 1: Database Schema Hardening

**Issue:** No unique constraints on contact email or brand name  
**Risk:** CRITICAL - Duplicate CRM entities  
**Fix:** Add unique constraints + handle conflicts

### Priority 2: Environment Variable Validation

**Issue:** Server boots with test credentials  
**Risk:** CRITICAL - Production misconfiguration  
**Fix:** Validate on boot, fail if credentials are "test"

### Priority 3: Token Refresh Error Handling

**Issue:** Refresh failures logged but not tracked  
**Risk:** HIGH - Users see "connected" when broken  
**Fix:** Add `lastError` field to GmailToken, update status API

### Priority 4: Frontend Error Visibility

**Issue:** No error UI for sync failures  
**Risk:** HIGH - Silent failures  
**Fix:** Add error state to status endpoint, display in UI

### Priority 5: Race Condition Prevention

**Issue:** Concurrent syncs can duplicate contacts  
**Risk:** HIGH - Data integrity  
**Fix:** Add database locking or sync queue

---

## FIXES IN PROGRESS...
