# Integration Map

**Last Updated:** January 2025  
**System:** The Break Agency Platform

---

## Overview

This document maps all third-party integrations, their implementation status, configuration requirements, and troubleshooting information.

---

## Integration Status Matrix

| Integration | Status | OAuth | Webhooks | Sync | Feature Flag |
|-------------|--------|-------|----------|------|--------------|
| **Gmail** | ✅ Production | ✅ | ✅ (Pub/Sub) | ✅ (15 min) | `INBOX_SCANNING_ENABLED` |
| **Google Calendar** | ✅ Production | ✅ | ❌ | ✅ (Daily) | Always enabled |
| **Google Drive** | ✅ Production | ✅ | ❌ | ❌ | `GOOGLE_DRIVE_INTEGRATION_ENABLED` |
| **Stripe** | ✅ Production | ❌ | ✅ | ❌ | Always enabled |
| **PayPal** | ✅ Production | ❌ | ✅ | ❌ | Always enabled |
| **Xero** | ✅ Production | ✅ | ❌ | ✅ (Manual) | `XERO_INTEGRATION_ENABLED` |
| **DocuSign** | ✅ Production | ✅ | ✅ | ❌ | `CONTRACT_SIGNING_ENABLED` |
| **Slack** | ✅ Production | ❌ | ✅ (Webhook URL) | ❌ | `SLACK_INTEGRATION_ENABLED` |
| **Notion** | ✅ Production | ✅ | ❌ | ✅ (Manual) | `NOTION_INTEGRATION_ENABLED` |
| **Instagram** | ⚠️ Partial | ✅ | ❌ | ⚠️ (Disabled) | `INSTAGRAM_INTEGRATION_ENABLED` |
| **TikTok** | ⚠️ Partial | ✅ | ❌ | ⚠️ (Disabled) | `TIKTOK_INTEGRATION_ENABLED` |
| **YouTube** | ⚠️ Partial | ✅ | ❌ | ⚠️ (Disabled) | `YOUTUBE_INTEGRATION_ENABLED` |
| **WhatsApp** | 🚧 Placeholder | ❌ | ❌ | ❌ | `WHATSAPP_INBOX_ENABLED` |

**Legend:**
- ✅ Production Ready
- ⚠️ Partial Implementation
- 🚧 Placeholder/Stub
- ❌ Not Implemented

---

## Gmail Integration

### Overview
Gmail integration provides inbox scanning, email classification, and CRM auto-linking.

### Configuration

**Environment Variables:**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL

**OAuth Scopes:**
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`

### Implementation

**Service:** `apps/api/src/services/gmail/syncInbox.ts`
- `syncInboxForUser(userId)` - Syncs last 100 messages
- `linkEmailToCrm()` - Auto-links emails to brands/contacts/deals

**Routes:**
- `GET /api/gmail/auth/url` - Get OAuth URL
- `GET /api/gmail/auth/callback` - OAuth callback
- `GET /api/gmail/inbox` - List inbox threads
- `POST /api/gmail/inbox/sync` - Manual sync trigger

**Database:**
- `gmailToken` - Stores OAuth tokens
- `inboxMessage` - Inbox threads
- `inboundEmail` - Individual emails

**Sync Schedule:**
- Cron job: Every 15 minutes
- Manual trigger: Via `/api/gmail/inbox/sync`

**Token Refresh:**
- Automatic via `oauth2Client.on("tokens")` event
- Persisted to `gmailToken` table
- Handles expiry gracefully

### Troubleshooting

**Issue:** Gmail not syncing
- Check `gmailToken` table for user
- Verify `refreshToken` exists
- Check `lastError` field in `gmailToken`
- Review cron job logs

**Issue:** OAuth callback fails
- Verify `GOOGLE_REDIRECT_URI` matches Google Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Review callback route logs

---

## Google Calendar Integration

### Overview
Google Calendar integration syncs events and detects conflicts.

### Configuration

**Environment Variables:**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL

**OAuth Scopes:**
- `https://www.googleapis.com/auth/calendar.readonly`

### Implementation

**Service:** `apps/api/src/lib/google.ts`
- `getGoogleCalendarClient(userId)` - Get authenticated client
- `syncGoogleCalendarEvents(userId, calendar)` - Sync events

**Routes:**
- `GET /api/calendar` - List events
- `POST /api/calendar/sync` - Manual sync trigger

**Database:**
- `googleAccount` - Stores OAuth tokens
- `calendarEvent` - Calendar events

**Sync Schedule:**
- Cron job: Daily
- Manual trigger: Via `/api/calendar/sync`

**Token Refresh:**
- Automatic via `oauth2Client.on("tokens")` event
- Persisted to `googleAccount` table

---

## Google Drive Integration

### Overview
Google Drive integration links external files to CRM records.

### Configuration

**Environment Variables:**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL
- `GOOGLE_DRIVE_INTEGRATION_ENABLED=true`

### Implementation

**Service:** `apps/api/src/services/integrations/googleDriveService.ts`
- `linkDriveFileToRecord()` - Link file to CRM record
- `listDriveFiles()` - List user's Drive files

**Routes:**
- `POST /api/integrations/google_drive/connect` - Connect Drive
- `POST /api/integrations/google_drive/link` - Link file

**Database:**
- `integrationConnection` - Stores OAuth tokens (platform: "google_drive")
- `File` - File records linked to CRM

**Token Refresh:**
- Automatic via `oauth2Client.on("tokens")` event
- Persisted to `integrationConnection` table

---

## Stripe Integration

### Overview
Stripe integration handles payment processing, invoices, and payouts.

### Configuration

**Environment Variables:**
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

### Implementation

**Service:** `apps/api/src/services/stripeService.ts`
- `handleStripeEvent()` - Process webhook events
- `createPaymentIntent()` - Create payment intent
- `createInvoice()` - Create invoice

**Routes:**
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/invoice` - Create invoice
- `POST /api/payments/payout` - Create payout
- `POST /api/payments/stripe/webhook` - Webhook handler

**Database:**
- `Invoice` - Invoice records
- `Payment` - Payment transactions
- `Payout` - Payout records

**Webhook Events:**
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payout.paid`
- `payout.failed`

**Webhook Security:**
- HMAC signature validation
- Idempotency check (Event ID)

---

## PayPal Integration

### Overview
PayPal integration handles payment processing via PayPal.

### Configuration

**Environment Variables:**
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `PAYPAL_WEBHOOK_SECRET` - Webhook signing secret

### Implementation

**Service:** `apps/api/src/routes/payments.ts`
- `processPayPalEvent()` - Process webhook events

**Routes:**
- `POST /api/payments/paypal/webhook` - Webhook handler

**Database:**
- `Invoice` - Invoice records
- `Payment` - Payment transactions

**Webhook Security:**
- HMAC signature validation
- Idempotency check (Event ID)

---

## Xero Integration

### Overview
Xero integration syncs invoices and payment status.

### Configuration

**Environment Variables:**
- `XERO_CLIENT_ID` - Xero OAuth client ID
- `XERO_CLIENT_SECRET` - Xero OAuth client secret
- `XERO_REDIRECT_URI` - OAuth callback URL
- `XERO_INTEGRATION_ENABLED=true`

### Implementation

**Service:** `apps/api/src/services/xero/xeroAuth.ts`
- `getXeroToken()` - Get/refresh access token
- `syncInvoicesToXero()` - Push invoices to Xero
- `syncPaymentsFromXero()` - Pull payment status

**Routes:**
- `POST /api/xero/connect` - Connect Xero
- `POST /api/xero/sync` - Manual sync trigger

**Database:**
- `xeroConnection` - Stores OAuth tokens + tenant ID
- `Invoice` - Invoice records (synced with Xero)

**Token Refresh:**
- Manual refresh with 5-minute buffer
- Marks connection as disconnected on failure

---

## DocuSign Integration

### Overview
DocuSign integration handles contract e-signatures.

### Configuration

**Environment Variables:**
- `DOCUSIGN_CLIENT_ID` - DocuSign OAuth client ID
- `DOCUSIGN_CLIENT_SECRET` - DocuSign OAuth client secret
- `DOCUSIGN_ACCOUNT_ID` - DocuSign account ID
- `DOCUSIGN_WEBHOOK_SECRET` - Webhook signing secret
- `CONTRACT_SIGNING_ENABLED=true`

### Implementation

**Service:** `apps/api/src/services/signature/docusignAuth.ts`
- `getDocuSignToken()` - Get/refresh access token
- `initiateSignature()` - Send contract for signature

**Routes:**
- `POST /api/signature/send` - Send contract for signature
- `POST /api/webhooks/signature` - Webhook handler

**Database:**
- `xeroConnection` (reused) - Stores OAuth tokens (id: "docusign_main")
- `signatureRequest` - Signature request tracking
- `Contract` - Contract records

**Token Refresh:**
- Manual refresh with 5-minute buffer

**Webhook Security:**
- HMAC signature validation
- Idempotency check (Envelope status)

---

## Slack Integration

### Overview
Slack integration sends notifications for deals, invoices, and approvals.

### Configuration

**Environment Variables:**
- `SLACK_INTEGRATION_ENABLED=true`

**Setup:**
- User provides webhook URL (no OAuth required)
- Webhook URL stored in `integrationConnection` table

### Implementation

**Service:** `apps/api/src/services/integrations/slackService.ts`
- `sendSlackNotification()` - Send notification to Slack

**Routes:**
- `POST /api/integrations/slack/connect` - Connect Slack (store webhook URL)
- `POST /api/integrations/slack/notify` - Send notification

**Database:**
- `integrationConnection` - Stores webhook URL (platform: "slack")

**No Token Refresh:**
- Uses webhook URLs (no OAuth tokens)

---

## Notion Integration

### Overview
Notion integration syncs brand and deal summaries to Notion pages.

### Configuration

**Environment Variables:**
- `NOTION_CLIENT_ID` - Notion OAuth client ID
- `NOTION_CLIENT_SECRET` - Notion OAuth client secret
- `NOTION_INTEGRATION_ENABLED=true`

### Implementation

**Service:** `apps/api/src/services/integrations/notionService.ts`
- `syncBrandToNotion()` - Sync brand to Notion
- `syncDealToNotion()` - Sync deal to Notion

**Routes:**
- `POST /api/integrations/notion/connect` - Connect Notion
- `POST /api/integrations/notion/sync` - Manual sync trigger

**Database:**
- `integrationConnection` - Stores OAuth tokens (platform: "notion")

**Token Refresh:**
- Long-lived tokens
- 401 error handling (marks disconnected on revocation)

---

## Social Media Integrations

### Instagram

**Status:** ⚠️ Partial (OAuth works, sync disabled)

**Configuration:**
- `INSTAGRAM_INTEGRATION_ENABLED=true`
- `INSTAGRAM_APP_ID` - Meta App ID
- `INSTAGRAM_APP_SECRET` - Meta App Secret

**Implementation:**
- OAuth flow: `apps/api/src/routes/auth/instagram.ts`
- Sync service: `apps/api/src/services/channels/instagramSync.ts` (disabled)

**Database:**
- `socialAccountConnection` - Stores OAuth tokens

### TikTok

**Status:** ⚠️ Partial (OAuth works, sync disabled)

**Configuration:**
- `TIKTOK_INTEGRATION_ENABLED=true`
- `TIKTOK_CLIENT_KEY` - TikTok Client Key
- `TIKTOK_CLIENT_SECRET` - TikTok Client Secret

**Implementation:**
- OAuth flow: `apps/api/src/routes/auth/tiktok.ts`
- Sync service: `apps/api/src/services/channels/tiktokSync.ts` (disabled)

**Database:**
- `socialAccountConnection` - Stores OAuth tokens

### YouTube

**Status:** ⚠️ Partial (OAuth works, sync disabled)

**Configuration:**
- `YOUTUBE_INTEGRATION_ENABLED=true`
- Uses Google OAuth (same as Gmail/Calendar)

**Implementation:**
- OAuth flow: `apps/api/src/routes/auth/youtube.js`
- Sync service: `apps/api/src/services/youtube/` (disabled)

**Database:**
- `socialAccountConnection` - Stores OAuth tokens

---

## Integration Health Monitoring

### Admin Diagnostics

**Endpoint:** `GET /api/admin/diagnostics/integrations`

**Returns:**
- Connection status per integration
- Last sync timestamp
- Last error message
- Token expiry status

### Database Fields

**Token Storage Tables:**
- `gmailToken.lastError`, `lastErrorAt`
- `googleAccount.lastError`, `lastErrorAt`
- `xeroConnection.lastError`, `lastErrorAt`
- `integrationConnection.lastError`, `lastErrorAt`

**Connection Status:**
- `connected` boolean field in all connection tables
- Automatically set to `false` on token refresh failure

---

## Common Integration Issues

### OAuth Token Expiry

**Symptoms:**
- Integration stops working
- 401 errors in logs
- `lastError` field populated

**Resolution:**
- Google services: Automatic refresh (no action needed)
- Xero/DocuSign: Manual refresh (5-min buffer)
- Notion: Reconnect if token revoked

### Webhook Failures

**Symptoms:**
- Webhook events not processed
- Duplicate processing

**Resolution:**
- Verify webhook signature validation
- Check idempotency logs in `AuditLog`
- Review webhook endpoint logs

### Sync Failures

**Symptoms:**
- No new data synced
- Sync errors in logs

**Resolution:**
- Check connection status in diagnostics
- Verify OAuth tokens valid
- Review sync service logs
- Check rate limits

---

**Document Status:** ✅ Complete  
**Maintained By:** Engineering Team  
**Last Review:** January 2025

