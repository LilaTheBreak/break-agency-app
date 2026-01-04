# Runbook: Inbox Not Syncing

**Last Updated:** January 2025  
**Severity:** Medium  
**Estimated Resolution Time:** 15-30 minutes

---

## Symptoms

- No new emails appearing in inbox
- Last sync timestamp not updating
- Users reporting missing emails
- Inbox shows "Last synced: [old timestamp]"

---

## Quick Diagnosis

### Step 1: Check User's Gmail Connection

**Query:**
```sql
SELECT 
  userId,
  lastSyncedAt,
  lastError,
  lastErrorAt,
  expiryDate,
  refreshToken IS NOT NULL as has_refresh_token
FROM "gmailToken"
WHERE userId = '<USER_ID>';
```

**Expected:**
- `lastSyncedAt` should be recent (< 15 minutes ago)
- `lastError` should be NULL
- `has_refresh_token` should be true
- `expiryDate` should be in the future

**If Issues Found:**
- Missing `refreshToken` → User needs to reconnect Gmail
- `lastError` populated → See "Common Errors" section
- `expiryDate` in past → Token expired (should auto-refresh)

### Step 2: Check Cron Job Status

**Query:**
```sql
SELECT 
  action,
  metadata,
  createdAt
FROM "AuditLog"
WHERE action = 'GMAIL_SYNC_STARTED'
ORDER BY createdAt DESC
LIMIT 10;
```

**Expected:**
- Recent entries (< 15 minutes ago)
- No error entries

**If No Entries:**
- Cron job may not be running
- Check cron job configuration

### Step 3: Check Manual Sync Endpoint

**Test:**
```bash
curl -X POST https://api.example.com/api/gmail/inbox/sync \
  -H "Cookie: break_session=<SESSION_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "imported": 5,
  "updated": 2,
  "skipped": 10,
  "failed": 0
}
```

**If Error:**
- Check error message
- See "Common Errors" section

---

## Root Cause Analysis

### 1. Gmail Not Connected

**Symptoms:**
- `gmailToken` record missing for user
- `refreshToken` is NULL

**Resolution:**
1. User must reconnect Gmail:
   - Go to `/admin/settings`
   - Click "Connect Gmail"
   - Complete OAuth flow
2. After reconnection, sync should trigger automatically

**Prevention:**
- Monitor `gmailToken` table for missing refresh tokens
- Alert on OAuth callback failures

### 2. Token Expired / Invalid

**Symptoms:**
- `lastError` contains "invalid_grant" or "401"
- `lastErrorAt` is recent
- `expiryDate` in past

**Resolution:**
1. Check if auto-refresh is working:
   ```sql
   SELECT 
     userId,
     lastSyncedAt,
     lastError,
     expiryDate,
     NOW() - expiryDate as expired_ago
   FROM "gmailToken"
   WHERE expiryDate < NOW();
   ```

2. If auto-refresh failing:
   - User needs to reconnect Gmail
   - Check Google OAuth credentials

**Prevention:**
- Monitor token expiry
- Alert on refresh failures

### 3. Cron Job Not Running

**Symptoms:**
- No recent `GMAIL_SYNC_STARTED` entries in `AuditLog`
- Manual sync works

**Resolution:**
1. Check cron job configuration:
   ```typescript
   // apps/api/src/cron/index.ts
   // Should have: syncGmailInbox job
   ```

2. Check cron job logs:
   - Review server logs for cron errors
   - Check if cron process is running

3. Restart cron service if needed

**Prevention:**
- Monitor cron job execution
- Alert on missed cron runs

### 4. Rate Limiting

**Symptoms:**
- `lastError` contains "429" or "rate limit"
- Sync works intermittently

**Resolution:**
1. Check Gmail API quota:
   - Google Cloud Console → APIs & Services → Gmail API
   - Review quota usage

2. Reduce sync frequency:
   - Update cron schedule (e.g., every 30 min instead of 15 min)
   - Limit messages per sync (currently 100)

**Prevention:**
- Monitor API quota usage
- Implement exponential backoff

### 5. Database Connection Issues

**Symptoms:**
- Sync errors in logs
- Database timeout errors

**Resolution:**
1. Check database connection:
   ```sql
   SELECT NOW(); -- Should return current timestamp
   ```

2. Check database load:
   - Review slow queries
   - Check connection pool usage

3. Restart database connection pool if needed

**Prevention:**
- Monitor database performance
- Alert on connection pool exhaustion

---

## Common Errors

### Error: "Gmail not connected"

**Cause:** User hasn't connected Gmail or token missing

**Resolution:**
- User must reconnect Gmail via `/admin/settings`

### Error: "invalid_grant"

**Cause:** Refresh token revoked or expired

**Resolution:**
- User must reconnect Gmail
- Check Google OAuth app configuration

### Error: "401 Unauthorized"

**Cause:** Access token expired and refresh failed

**Resolution:**
- User must reconnect Gmail
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Error: "429 Too Many Requests"

**Cause:** Gmail API quota exceeded

**Resolution:**
- Wait for quota reset (usually 1 hour)
- Reduce sync frequency
- Request quota increase from Google

### Error: "Database connection timeout"

**Cause:** Database overloaded or connection pool exhausted

**Resolution:**
- Check database performance
- Increase connection pool size
- Optimize slow queries

---

## Resolution Steps

### Step 1: Identify Affected Users

```sql
SELECT 
  userId,
  lastSyncedAt,
  lastError,
  CASE 
    WHEN lastSyncedAt IS NULL THEN 'Never synced'
    WHEN lastSyncedAt < NOW() - INTERVAL '1 hour' THEN 'Stale sync'
    WHEN lastError IS NOT NULL THEN 'Error: ' || lastError
    ELSE 'OK'
  END as status
FROM "gmailToken"
WHERE 
  lastSyncedAt IS NULL 
  OR lastSyncedAt < NOW() - INTERVAL '1 hour'
  OR lastError IS NOT NULL;
```

### Step 2: Check Integration Status

**Endpoint:** `GET /api/admin/diagnostics/integrations`

**Response:**
```json
{
  "success": true,
  "data": {
    "gmail": [
      {
        "userId": "user_123",
        "connected": true,
        "lastSyncedAt": "2025-01-15T10:00:00Z",
        "lastError": null,
        "expiresAt": "2025-01-16T10:00:00Z"
      }
    ]
  }
}
```

### Step 3: Trigger Manual Sync

**For Single User:**
```bash
curl -X POST https://api.example.com/api/gmail/inbox/sync \
  -H "Cookie: break_session=<SESSION_TOKEN>"
```

**For All Users (Admin):**
- Review cron job logs
- Manually trigger sync via admin panel (if available)

### Step 4: Verify Fix

**Check:**
1. `lastSyncedAt` updated in `gmailToken` table
2. New emails appear in inbox
3. No errors in `lastError` field

---

## Prevention

### Monitoring

**Set Up Alerts For:**
- `lastSyncedAt` > 1 hour old
- `lastError` not NULL
- Cron job failures
- Gmail API quota usage > 80%

**Query for Alerting:**
```sql
SELECT 
  COUNT(*) as users_with_stale_sync
FROM "gmailToken"
WHERE 
  lastSyncedAt < NOW() - INTERVAL '1 hour'
  OR lastError IS NOT NULL;
```

### Regular Maintenance

**Weekly:**
- Review sync statistics
- Check for users with persistent errors
- Verify cron job execution

**Monthly:**
- Review Gmail API quota usage
- Check token expiry patterns
- Optimize sync performance

---

## Escalation

**If Issue Persists After 30 Minutes:**
1. Check Google Cloud Console for Gmail API status
2. Review server logs for detailed error messages
3. Check database performance metrics
4. Contact Google Support if quota issue

**If Multiple Users Affected:**
1. Check system-wide issues (database, API keys)
2. Review recent deployments for breaking changes
3. Check rate limiting configuration

---

## Related Documentation

- [Integration Map](../DOCS/INTEGRATION_MAP.md#gmail-integration)
- [Architecture Overview](../DOCS/ARCHITECTURE_OVERVIEW.md#inbox--communication)
- [Gmail Sync Service](../../apps/api/src/services/gmail/syncInbox.ts)

---

**Document Status:** ✅ Complete  
**Maintained By:** Engineering Team  
**Last Review:** January 2025

