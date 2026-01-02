# Meta (Instagram) Webhook Verification - Implementation Summary

## Overview
This document describes the Meta webhook verification endpoint implementation for Instagram Graph API app review compliance.

## Endpoint Details

**URL:** `GET /api/webhooks/meta`

**Production URL:** `https://breakagencyapi-production.up.railway.app/api/webhooks/meta`

**Purpose:** Handles Meta's webhook verification challenge during Instagram API setup. This is a **compliance-only stub** - we do NOT enable webhook subscriptions or process POST events.

## Implementation

### Route Handler
- **File:** `apps/api/src/routes/metaWebhook.ts`
- **Method:** GET only (no POST handler)
- **Authentication:** None (public endpoint - Meta needs to verify)
- **Middleware:** No auth middleware applied

### Verification Flow

1. Meta sends GET request with query parameters:
   - `hub.mode=subscribe`
   - `hub.verify_token=<your_token>`
   - `hub.challenge=<random_string>`

2. Handler validates:
   - `hub.mode` must be `"subscribe"`
   - `hub.verify_token` must match `WEBHOOK_VERIFY_TOKEN` env var
   - `hub.challenge` must be present

3. If valid:
   - Returns HTTP 200
   - Response body is **plain text** (the challenge string)
   - NOT JSON

4. If invalid:
   - Returns HTTP 400/403 with error details

## Environment Variable

**Required:** `WEBHOOK_VERIFY_TOKEN`

**Description:** Secret token that Meta will use to verify the webhook endpoint. This must match the token you configure in Meta's App Dashboard.

**Setup:**
1. Generate a secure random token (e.g., `openssl rand -hex 32`)
2. Set in Railway environment variables: `WEBHOOK_VERIFY_TOKEN=<your_token>`
3. Use the same token in Meta's App Dashboard webhook configuration

**Validation:**
- Server logs a warning at startup if `WEBHOOK_VERIFY_TOKEN` is missing
- Handler returns 503 if token is not configured

## Testing

### Local Test (requires server running)

```bash
# Test with correct token (replace with your actual token)
curl -X GET "http://localhost:5001/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Expected response: "test123" (plain text, HTTP 200)

# Test with wrong token
curl -X GET "http://localhost:5001/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test123"

# Expected response: HTTP 403 with error JSON

# Test with missing challenge
curl -X GET "http://localhost:5001/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN"

# Expected response: HTTP 400 with error JSON
```

### Production Test

```bash
# Replace YOUR_TOKEN with your actual WEBHOOK_VERIFY_TOKEN
curl -X GET "https://breakagencyapi-production.up.railway.app/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

## Meta App Dashboard Configuration

1. Go to Meta App Dashboard → Instagram Graph API → Webhooks
2. Set **Callback URL:** `https://breakagencyapi-production.up.railway.app/api/webhooks/meta`
3. Set **Verify Token:** (same value as `WEBHOOK_VERIFY_TOKEN` env var)
4. Click **"Verify and Save"**

Meta will send a GET request to verify the endpoint. If successful, you'll see "Verified" in the dashboard.

## Logging

The handler includes comprehensive diagnostic logging:

- `[META_WEBHOOK] Verification request received` - Request received
- `[META_WEBHOOK] Query params:` - All query parameters
- `[META_WEBHOOK] Mode:` - hub.mode value
- `[META_WEBHOOK] Verify token received:` - Masked token (first 4 chars)
- `[META_WEBHOOK] Challenge:` - Challenge string
- `[META_WEBHOOK] ✅ Verification successful` - Success
- `[META_WEBHOOK] ERROR/WARN:` - Errors and warnings

Check Railway logs to troubleshoot verification failures.

## Important Notes

### ✅ What This Implementation Does
- Handles Meta's verification challenge
- Validates verify token
- Returns challenge string as plain text
- Logs all verification attempts
- Validates environment variable at startup

### ❌ What This Implementation Does NOT Do
- **Does NOT** enable webhook subscriptions
- **Does NOT** handle POST webhook events
- **Does NOT** process Instagram data updates
- **Does NOT** require authentication (Meta needs public access)
- **Does NOT** store webhook data in database

This is a **minimal stub for compliance only**. We use OAuth + read-only API access, not webhooks.

## Troubleshooting

### "The callback URL or verify token couldn't be validated"

**Possible causes:**
1. `WEBHOOK_VERIFY_TOKEN` not set in Railway
2. Token mismatch between Railway env var and Meta dashboard
3. Endpoint not accessible (check Railway deployment)
4. Route not mounted correctly (check server.ts)

**Debug steps:**
1. Check Railway logs for `[META_WEBHOOK]` entries
2. Verify `WEBHOOK_VERIFY_TOKEN` is set in Railway environment variables
3. Test endpoint manually with curl (see Testing section)
4. Verify route is mounted before auth middleware in server.ts

### "503 Webhook verification not configured"

**Cause:** `WEBHOOK_VERIFY_TOKEN` environment variable is missing.

**Fix:** Set `WEBHOOK_VERIFY_TOKEN` in Railway environment variables.

### "403 Invalid verify token"

**Cause:** Token in Meta dashboard doesn't match `WEBHOOK_VERIFY_TOKEN` in Railway.

**Fix:** Update Meta dashboard or Railway env var to match.

## Files Modified

- `apps/api/src/routes/metaWebhook.ts` (new file)
- `apps/api/src/server.ts` (added route mount and env validation)

## Deployment Checklist

- [x] Route handler created
- [x] Route mounted in server.ts
- [x] Environment variable validation added
- [x] Diagnostic logging implemented
- [ ] `WEBHOOK_VERIFY_TOKEN` set in Railway
- [ ] Endpoint tested in production
- [ ] Meta dashboard configured
- [ ] Meta verification successful

## Next Steps

1. **Set `WEBHOOK_VERIFY_TOKEN` in Railway:**
   - Go to Railway dashboard → Environment variables
   - Add `WEBHOOK_VERIFY_TOKEN` with a secure random value
   - Redeploy if needed

2. **Configure Meta Dashboard:**
   - Set callback URL: `https://breakagencyapi-production.up.railway.app/api/webhooks/meta`
   - Set verify token: (same as Railway `WEBHOOK_VERIFY_TOKEN`)
   - Click "Verify and Save"

3. **Verify Success:**
   - Check Railway logs for `[META_WEBHOOK] ✅ Verification successful`
   - Meta dashboard should show "Verified" status

