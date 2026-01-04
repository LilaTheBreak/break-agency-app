# Architecture Overview

**Last Updated:** January 2025  
**System:** The Break Agency Platform

---

## Executive Summary

The Break Agency Platform is a full-stack SaaS application built as a monorepo using modern web technologies. It provides CRM, deal management, inbox integration, AI-powered features, and financial tracking for influencer marketing agencies.

**Tech Stack:**
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Storage:** Google Cloud Storage (GCS)
- **Queue System:** BullMQ
- **Monitoring:** Sentry

---

## Monorepo Structure

```
break-agency-app/
├── apps/
│   ├── api/              # Backend Express server
│   │   ├── src/
│   │   │   ├── routes/    # API route handlers
│   │   │   ├── services/  # Business logic services
│   │   │   ├── middleware/# Auth, rate limiting, etc.
│   │   │   ├── controllers/# Request/response handlers
│   │   │   ├── cron/      # Scheduled jobs
│   │   │   ├── worker/    # Background job processors
│   │   │   └── server.ts  # Express app entry point
│   │   └── prisma/        # Database schema & migrations
│   └── web/               # Frontend React app
│       ├── src/
│       │   ├── pages/     # Page components
│       │   ├── components/# Reusable components
│       │   ├── services/  # API client utilities
│       │   └── config/    # Feature flags, env config
│       └── public/         # Static assets
└── packages/
    └── shared/            # Shared TypeScript types
```

---

## System Architecture

### Request Flow

```
User Request
    ↓
Frontend (React)
    ↓
API Client (apiFetch)
    ↓
Express Server (server.ts)
    ↓
Middleware Stack:
  - CORS
  - Helmet (security)
  - Cookie Parser
  - Request Context
  - Auth Middleware
  - Rate Limiting
  - Audit Logging
    ↓
Route Handler
    ↓
Controller / Service Layer
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

### Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Frontend calls GET /api/auth/google/url
   ↓
3. Backend generates OAuth URL with state=userId
   ↓
4. User redirected to Google OAuth
   ↓
5. Google redirects to /api/auth/google/callback
   ↓
6. Backend exchanges code for tokens
   ↓
7. Backend creates/updates User record
   ↓
8. Backend signs JWT session token
   ↓
9. Backend sets httpOnly cookie (break_session)
   ↓
10. Backend redirects to frontend dashboard
```

**Session Management:**
- JWT tokens stored in httpOnly cookies
- Cookie name: `break_session`
- SameSite: Lax (production), None (development)
- Secure: true (HTTPS only)
- Expiry: 7 days

---

## Core Domains

### 1. CRM System

**Models:**
- `Brand` - Brand/company records
- `CrmBrandContact` - Contacts associated with brands
- `Deal` - Deals/opportunities
- `Campaign` - Marketing campaigns
- `Contract` - Contract documents
- `Event` - Calendar events/tasks
- `Task` - Task management

**Key Relationships:**
- Brand ↔ Contacts (one-to-many)
- Brand ↔ Deals (one-to-many)
- Brand ↔ Campaigns (one-to-many)
- Deal ↔ Campaign (many-to-many)
- Deal ↔ Contract (one-to-many)
- Deal ↔ Talent (many-to-many)

**API Routes:**
- `/api/crm-brands` - Brand CRUD
- `/api/crm-contacts` - Contact CRUD
- `/api/crm-deals` - Deal CRUD
- `/api/crm-campaigns` - Campaign CRUD
- `/api/crm-contracts` - Contract CRUD

### 2. Inbox & Communication

**Models:**
- `InboxMessage` - Unified inbox threads
- `InboundEmail` - Individual email messages
- `GmailToken` - Gmail OAuth tokens
- `EmailTracking` - Email open/click tracking

**Services:**
- `syncInboxForUser()` - Gmail sync service
- `linkEmailToCrm()` - Auto-link emails to CRM
- `classifyMessage()` - AI email classification
- `inboxPrioritiser` - Priority scoring

**API Routes:**
- `/api/gmail/inbox` - List inbox threads
- `/api/gmail/inbox/sync` - Manual sync trigger
- `/api/inbox/scan` - Unified inbox scan
- `/api/inbox/tracking/*` - Email tracking

**Sync Flow:**
```
1. User connects Gmail (OAuth)
   ↓
2. Tokens stored in gmailToken table
   ↓
3. Cron job triggers sync (every 15 min)
   ↓
4. syncInboxForUser() fetches last 100 messages
   ↓
5. Messages upserted to InboxMessage + InboundEmail
   ↓
6. Auto-link to CRM (brands/contacts/deals)
   ↓
7. AI classification runs (if enabled)
```

### 3. Finance & Payments

**Models:**
- `Invoice` - Invoice records
- `Commission` - Commission calculations
- `Payout` - Payout records
- `Payment` - Payment transactions

**Services:**
- `commissionService` - Commission calculation
- `revenueCalculationService` - Revenue tracking
- `stripeService` - Stripe integration

**API Routes:**
- `/api/payments/*` - Payment processing
- `/api/payments/stripe/webhook` - Stripe webhooks
- `/api/admin/finance` - Finance dashboard

**Payment Flow:**
```
1. Deal moves to "Closed Won"
   ↓
2. Invoice automatically created
   ↓
3. Commission calculated (per agent/deal)
   ↓
4. Stripe webhook received (payment succeeded)
   ↓
5. Invoice status updated to "paid"
   ↓
6. Payout record created
```

### 4. AI Features

**Services:**
- `aiAssistant` - Role-based AI assistant
- `aiDealExtractor` - Extract deals from emails
- `inboxAiReply` - Email reply suggestions
- `dealIntelligenceService` - Deal negotiation insights
- `contractReader` - Contract analysis

**API Routes:**
- `/api/ai/:role` - AI assistant chat
- `/api/ai/reply` - Email reply generation
- `/api/ai/deal/extract` - Deal extraction
- `/api/ai/deal/negotiation` - Negotiation insights

**AI Flow:**
```
1. User request → API endpoint
   ↓
2. Service builds context (deals, emails, etc.)
   ↓
3. OpenAI API call (GPT-4o)
   ↓
4. Response parsed and validated
   ↓
5. Token usage tracked
   ↓
6. Response returned to user
```

### 5. Calendar & Availability

**Models:**
- `CalendarEvent` - Calendar events
- `GoogleAccount` - Google Calendar OAuth tokens

**Services:**
- `calendarSyncService` - Google Calendar sync
- `calendarConflictService` - Conflict detection

**API Routes:**
- `/api/calendar/*` - Calendar management
- `/api/calendar/sync` - Manual sync trigger

**Sync Flow:**
```
1. User connects Google Calendar (OAuth)
   ↓
2. Tokens stored in GoogleAccount table
   ↓
3. Cron job triggers sync (daily)
   ↓
4. Events fetched from Google Calendar API
   ↓
5. Events upserted to CalendarEvent table
   ↓
6. Conflicts detected and flagged
```

---

## Background Jobs

### Cron Jobs

**Location:** `apps/api/src/cron/index.ts`

**Jobs:**
- `syncGmailInbox` - Gmail sync (every 15 min)
- `syncGoogleCalendar` - Calendar sync (daily)
- `refreshSocialTokens` - Social token refresh (daily)
- `updateSocialStats` - Social analytics sync (hourly)
- `processEmailQueue` - Email queue processing (every 5 min)

### BullMQ Queues

**Location:** `apps/api/src/worker/queues.ts`

**Queues:**
- `emailQueue` - Email sending
- `inboxSyncQueue` - Inbox synchronization
- `aiTaskQueue` - AI processing tasks
- `socialSyncQueue` - Social media sync
- `dealAutomationQueue` - Deal automation

**Retry Policy:**
- Default: 3 attempts
- Exponential backoff
- Failed jobs logged to `AuditLog`

---

## Third-Party Integrations

### OAuth Integrations

| Integration | OAuth Provider | Token Storage | Refresh Logic |
|-------------|----------------|---------------|---------------|
| **Gmail** | Google | `gmailToken` | Automatic via `client.on("tokens")` |
| **Google Calendar** | Google | `googleAccount` | Automatic via `client.on("tokens")` |
| **Google Drive** | Google | `integrationConnection` | Automatic via `client.on("tokens")` |
| **Xero** | Xero | `xeroConnection` | Manual (5-min buffer) |
| **DocuSign** | DocuSign | `xeroConnection` (reused) | Manual (5-min buffer) |
| **Instagram** | Meta | `socialAccountConnection` | Daily cron refresh |
| **TikTok** | TikTok | `socialAccountConnection` | Reactive refresh |
| **YouTube** | Google | `socialAccountConnection` | Proactive refresh |
| **Notion** | Notion | `integrationConnection` | 401 error handling |
| **Slack** | Slack (webhook) | `integrationConnection` | N/A (webhook URLs) |

### Webhook Integrations

| Integration | Webhook Endpoint | Signature Validation | Idempotency |
|-------------|------------------|---------------------|-------------|
| **Stripe** | `/api/payments/stripe/webhook` | HMAC signature | Event ID check |
| **PayPal** | `/api/payments/paypal/webhook` | HMAC signature | Event ID check |
| **DocuSign** | `/api/webhooks/signature` | HMAC signature | Envelope status check |
| **Gmail** | Google Pub/Sub | Pub/Sub verification | HistoryId check |
| **Meta** | `/api/webhooks/meta` | HMAC signature | Event ID check |

---

## Database Schema

### Key Models

**User Management:**
- `User` - User accounts
- `Role` - User roles (ADMIN, SUPERADMIN, CREATOR, etc.)

**CRM:**
- `Brand`, `CrmBrandContact`, `Deal`, `Campaign`, `Contract`

**Talent:**
- `Talent` - Creator/talent profiles
- `SocialAccountConnection` - Social media connections

**Finance:**
- `Invoice`, `Commission`, `Payout`, `Payment`

**Inbox:**
- `InboxMessage`, `InboundEmail`, `GmailToken`

**Calendar:**
- `CalendarEvent`, `GoogleAccount`

**AI:**
- `AIPromptHistory`, `AIAgentTask`

**Audit:**
- `AuditLog` - System audit trail
- `WebhookLog` - Webhook event logs

**Total Models:** 84+ across 12 domains

---

## Security

### Authentication
- JWT tokens in httpOnly cookies
- Google OAuth for login
- Role-based access control (RBAC)
- Session expiry: 7 days

### Authorization
- Middleware: `requireAuth`, `requireRole`, `requireAdmin`
- Route-level permission checks
- Resource-level ownership checks

### Rate Limiting
- OAuth routes: 10 requests / 5 minutes
- Inbox sync: 5 requests / 10 minutes
- AI endpoints: 20 requests / 1 minute
- General API: 100 requests / 1 minute

### Data Protection
- Helmet.js security headers
- CORS configuration
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (React auto-escaping)

---

## Error Handling

### Error Logging
- Sentry integration for production errors
- Console logging for development
- Audit log for critical actions
- Error tracking in database (`lastError`, `lastErrorAt` fields)

### Error Recovery
- Automatic token refresh for OAuth
- Retry logic for background jobs (3 attempts)
- Graceful degradation (features fail safely)
- User-friendly error messages

---

## Deployment

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

**Optional:**
- `OPENAI_API_KEY` - AI features
- `STRIPE_SECRET_KEY` - Payment processing
- `SENTRY_DSN` - Error monitoring
- Feature flags (see Feature Flag Matrix)

### Deployment Platforms
- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** Railway PostgreSQL
- **Storage:** Google Cloud Storage

---

## Monitoring & Observability

### Error Monitoring
- Sentry for frontend + backend
- Error tracking with stack traces
- User context attached to errors

### Logging
- Structured logging via `logError()`
- Audit trail in `AuditLog` table
- Webhook logs in `WebhookLog` table

### Diagnostics
- `/api/admin/diagnostics/integrations` - Integration status
- `/api/admin/diagnostics/background-jobs` - Job status
- `/api/admin/diagnostics/rate-limits` - Rate limit stats

---

## Performance

### Caching
- No explicit caching layer (future: Redis)
- Database query optimization via Prisma indexes

### Database Indexes
- All foreign keys indexed
- Common query fields indexed (userId, status, createdAt)
- Composite indexes for complex queries

### Background Processing
- BullMQ for async job processing
- Cron jobs for scheduled tasks
- Queue-based processing

---

## Future Architecture Considerations

### Scalability
- **Current:** Single server deployment
- **Future:** Horizontal scaling with load balancer
- **Future:** Redis for rate limiting and caching
- **Future:** CDN for static assets

### Testing
- **Current:** Minimal test coverage
- **Future:** Unit tests for services
- **Future:** Integration tests for API routes
- **Future:** E2E tests for critical workflows

### Observability
- **Current:** Sentry + console logs
- **Future:** Structured logging (JSON)
- **Future:** Metrics collection (Prometheus)
- **Future:** Distributed tracing

---

**Document Status:** ✅ Complete  
**Maintained By:** Engineering Team  
**Last Review:** January 2025

