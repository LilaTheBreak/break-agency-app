# Required Environment Variables

**Purpose:** Complete reference of all environment variables used by the Break Agency platform.

**Last Updated:** Phase 5 Hardening  
**Status:** ✅ Complete audit of all `process.env` references

---

## 🔴 CRITICAL - Required for Basic Operation

These variables MUST be set or the app will not function correctly.

### Database

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
```
**Used by:** Prisma ORM, all database operations  
**Format:** PostgreSQL connection string  
**Failure Mode:** App crashes on startup if missing  
**Example:** `postgresql://admin:secret@localhost:5432/breakagency`

---

### Google OAuth (Login)

```bash
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123_secret"
GOOGLE_REDIRECT_URI="https://api.yoursite.com/api/auth/google/callback"
```

**Alternative naming (legacy):**
```bash
GOOGLE_OAUTH_CLIENT_ID="..."  # Same as GOOGLE_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET="..."  # Same as GOOGLE_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI="..."  # Same as GOOGLE_REDIRECT_URI
```

**Used by:** User authentication flow  
**Failure Mode:** Login button doesn't work, users can't sign in  
**How to Get:** 
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-api-url/api/auth/google/callback`

**⚠️ IMPORTANT:** The redirect URI must EXACTLY match what's configured in Google Console (including http vs https, trailing slash, port number)

---

### Gmail Integration

```bash
GMAIL_REDIRECT_URI="https://api.yoursite.com/api/gmail/auth/callback"
```

**Used by:** Gmail OAuth for inbox sync  
**Failure Mode:** "Connect Gmail" button fails  
**How to Get:** 
1. Use same Google Cloud project as above
2. Enable Gmail API
3. Add this redirect URI to OAuth consent screen
4. Use same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**Note:** This is a separate callback from main login to handle Gmail-specific scopes.

---

### Session & Security

```bash
SESSION_SECRET="long-random-string-at-least-32-characters"
JWT_SECRET="another-long-random-string-for-tokens"
```

**Used by:** Session management, cookie signing, JWT tokens  
**Failure Mode:** Users can't stay logged in, sessions fail  
**How to Generate:** 
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Frontend URL

```bash
FRONTEND_ORIGIN="https://app.yoursite.com"
```

**Alternative naming (legacy):**
```bash
WEB_APP_URL="https://app.yoursite.com"  # Same as FRONTEND_ORIGIN
WEB_URL="https://app.yoursite.com"      # Same as FRONTEND_ORIGIN
```

**Used by:** CORS, OAuth redirects, email links  
**Failure Mode:** CORS errors, can't log in from frontend  
**Format:** Full URL including protocol, NO trailing slash  
**Examples:**
- Development: `http://localhost:5173`
- Production: `https://app.breakagency.com`

**⚠️ Multiple Origins:** Can specify comma-separated list:
```bash
FRONTEND_ORIGIN="https://app.com,https://staging.app.com"
```

---

### API URL (Backend)

```bash
BACKEND_URL="https://api.yoursite.com"
```

**Alternative naming (legacy):**
```bash
API_URL="https://api.yoursite.com"  # Same as BACKEND_URL
```

**Used by:** Gmail webhooks, email tracking pixels  
**Failure Mode:** Gmail notifications don't work, tracking broken  
**Format:** Full URL including protocol, NO trailing slash  
**Examples:**
- Development: `http://localhost:5001`
- Production: `https://api.breakagency.com`

---

### Port

```bash
PORT=5001
```

**Used by:** Express server  
**Default:** 5001 if not set  
**Failure Mode:** None (uses default)  
**Note:** On Railway, this is set automatically

---

## 🟡 IMPORTANT - Core Features Require These

These variables are needed for key features but app won't crash without them.

### OpenAI (AI Features)

```bash
OPENAI_API_KEY="sk-proj-abc123..."
```

**Used by:** 
- Deal extraction from emails
- Email classification
- Smart inbox categories
- Content generation
- Sentiment analysis

**Failure Mode:** AI features return "AI not configured" errors  
**Feature Flags Affected:**
- `AI_ENABLED`
- `SMART_CATEGORIES_ENABLED`
- `DEAL_AI_ENABLED`

**How to Get:** [OpenAI Platform](https://platform.openai.com/api-keys)

**Cost:** Pay-per-use, ~$0.002 per 1K tokens (GPT-3.5) or ~$0.03 per 1K tokens (GPT-4)

---

### Gmail Webhook (Real-time Inbox)

```bash
GMAIL_WEBHOOK_URL="https://api.yoursite.com/api/gmail/webhook/notification"
```

**Used by:** Real-time Gmail push notifications  
**Failure Mode:** Inbox updates only on manual refresh (every 5 mins via cron)  
**Default:** Constructed from `BACKEND_URL` if not set  
**Note:** Requires public HTTPS URL (can't be localhost)

---

### Cron Authentication

```bash
CRON_SECRET="random-secret-for-cron-jobs"
```

**Used by:** Protecting cron job endpoints from unauthorized access  
**Failure Mode:** Anyone can trigger expensive operations  
**Default:** `"change-me-in-production"` (INSECURE)  
**Security Risk:** HIGH if not set in production

**How to Use:**
```bash
curl https://api.com/api/cron/sync-inbox \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🟢 OPTIONAL - Enhanced Features

These enable additional features but aren't required for core functionality.

### Stripe (Payments)

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PAYMENTS_WEBHOOK_SECRET="whsec_..."  # Alternative name

# Product Price IDs (if using subscriptions)
BRAND_PREMIUM_PRICE_ID="price_..."
UGC_SUBSCRIPTION_PRICE_ID="price_..."
STRIPE_BRAND_PREMIUM_PRICE_ID="price_..."  # Alternative name
STRIPE_UGC_PRICE_ID="price_..."            # Alternative name
```

**Used by:** Payment processing, subscriptions, invoices  
**Failure Mode:** Payment features show "Not configured"  
**Feature Flag:** `PAYMENTS_ENABLED`

---

### PayPal (Alternative Payments)

```bash
PAYPAL_WEBHOOK_SECRET="your-webhook-secret"
PAYPAL_WEBHOOK_ID="your-webhook-id"
```

**Used by:** PayPal payment processing  
**Failure Mode:** PayPal payments don't work  
**Status:** Partially implemented

---

### AWS S3 (File Storage)

```bash
S3_BUCKET="your-bucket-name"
S3_REGION="us-east-1"
S3_ACCESS_KEY="AKIA..."
S3_SECRET_KEY="your-secret-key"
S3_ENDPOINT="https://s3.amazonaws.com"  # Optional, for S3-compatible services
S3_FORCE_PATH_STYLE="false"              # Set to "true" for MinIO/DigitalOcean
```

**Used by:** File uploads, resource hub, contract storage  
**Failure Mode:** Falls back to local filesystem (uploads/ directory)  
**Feature Flag:** `FILE_UPLOADS_ENABLED`

---

### Redis (Queue/Cache)

```bash
REDIS_URL="redis://localhost:6379"
```

**Used by:** BullMQ job queue, caching  
**Failure Mode:** Background jobs don't work  
**Status:** Optional - app works without it but queues won't function

---

### Email Notifications

```bash
FINANCE_ALERT_EMAILS="finance@company.com,admin@company.com"
```

**Used by:** Overdue invoice notifications  
**Format:** Comma-separated list of emails  
**Failure Mode:** Admins don't get financial alerts

---

### Xero Integration

```bash
XERO_CLIENT_ID="your-client-id"
XERO_CLIENT_SECRET="your-client-secret"
```

**Used by:** Xero accounting integration  
**Status:** NOT YET IMPLEMENTED  
**Feature Flag:** `XERO_INTEGRATION_ENABLED` (currently false)

---

### DocuSign

```bash
DOCUSIGN_API_KEY="your-api-key"
```

**Used by:** Electronic signature integration  
**Status:** PARTIALLY IMPLEMENTED  
**Failure Mode:** Digital signing features don't work

---

## 🔵 DEVELOPMENT ONLY

These are for development/testing and should NOT be set in production.

### Dev Auth (Skip Google OAuth)

```bash
TEST_LOGIN_EMAIL="admin@test.com"
TEST_LOGIN_PASSWORD="password123"
```

**Used by:** `/api/dev-auth` endpoint for quick login during development  
**Security Risk:** CRITICAL - automatically disabled in production  
**Default:** `admin@breakagency.com` / `breakbreak`

---

### Environment Flag

```bash
NODE_ENV="development"  # or "production"
```

**Used by:** Determines which features are enabled  
**Effects:**
- `development`: Shows debug logs, stack traces, dev-only routes
- `production`: Hides sensitive info, disables dev routes, stricter security

---

### Cookie Settings

```bash
COOKIE_DOMAIN=".yoursite.com"  # For subdomain sharing
COOKIE_SECURE="true"           # Force HTTPS-only cookies
SESSION_COOKIE_NAME="break_session"  # Custom cookie name
```

**Used by:** Session cookie configuration  
**Default:** Auto-configured based on environment  
**Production:** `COOKIE_SECURE=true` automatically in production

---

## 📋 Quick Setup Checklists

### Minimal Setup (Local Development)

```bash
# .env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://user:pass@localhost:5432/breakagency
SESSION_SECRET=your-random-secret-here
JWT_SECRET=another-random-secret-here

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback
GMAIL_REDIRECT_URI=http://localhost:5001/api/gmail/auth/callback

FRONTEND_ORIGIN=http://localhost:5173
BACKEND_URL=http://localhost:5001
```

**This gives you:**
- ✅ Login works
- ✅ Database works
- ✅ Basic session management
- ❌ No AI features
- ❌ No file uploads
- ❌ No payments

---

### Full Setup (Production)

```bash
# .env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://...  # Production DB
SESSION_SECRET=...  # 32+ char random string
JWT_SECRET=...      # 32+ char random string
CRON_SECRET=...     # 32+ char random string

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://api.yoursite.com/api/auth/google/callback
GMAIL_REDIRECT_URI=https://api.yoursite.com/api/gmail/auth/callback

# URLs
FRONTEND_ORIGIN=https://app.yoursite.com
BACKEND_URL=https://api.yoursite.com

# AI Features
OPENAI_API_KEY=sk-proj-...

# File Storage (choose one)
S3_BUCKET=...
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Optional: Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Queue
REDIS_URL=redis://...
```

**This gives you:**
- ✅ Full authentication
- ✅ AI features (deal extraction, smart categories)
- ✅ File uploads
- ✅ Payment processing (if Stripe configured)
- ✅ Real-time inbox updates
- ✅ Background job queue

---

## 🔍 Debugging Environment Variables

### Check what's loaded:

The API server logs these on startup:
```
>>> ENV LOADED FROM = .env
>>> PROCESS CWD = /path/to/app
>>> GOOGLE_CLIENT_ID = 123456789-abcd.apps.googleusercontent.com
>>> GOOGLE_CLIENT_SECRET = GOCS****
>>> GOOGLE_REDIRECT_URI = http://localhost:5001/api/auth/google/callback
```

### Common Issues:

**"CORS Error"**
- Check `FRONTEND_ORIGIN` exactly matches your frontend URL
- No trailing slash
- Include port number for localhost

**"OAuth redirect_uri_mismatch"**
- Check `GOOGLE_REDIRECT_URI` exactly matches Google Console
- http vs https matters
- Port number matters
- Trailing slash matters

**"Session not found after login"**
- Check `SESSION_SECRET` is set
- Check cookies are enabled
- Check `COOKIE_SECURE` matches your protocol (false for http, true for https)

**"AI features not working"**
- Check `OPENAI_API_KEY` is set
- Check API key has credits
- Check feature flag `AI_ENABLED` is true

---

## 📊 Feature Flag Requirements

This table shows which env vars are needed for each feature flag:

| Feature Flag | Required Env Vars |
|-------------|-------------------|
| `AI_ENABLED` | `OPENAI_API_KEY` |
| `MESSAGING_ENABLED` | None (always enabled) |
| `CAMPAIGN_ANALYTICS` | None |
| `INSTAGRAM_INTEGRATION` | Instagram API keys (not yet implemented) |
| `TIKTOK_INTEGRATION` | TikTok API keys (not yet implemented) |
| `PAYMENTS_ENABLED` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `FILE_UPLOADS_ENABLED` | `S3_*` vars or local filesystem |
| `XERO_INTEGRATION_ENABLED` | `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` (not yet implemented) |
| `SOCIAL_ANALYTICS_ENABLED` | Social platform tokens (feature removed) |
| `SMART_CATEGORIES_ENABLED` | `OPENAI_API_KEY` |
| `DEAL_AI_ENABLED` | `OPENAI_API_KEY` |

---

## 🛡️ Security Best Practices

### ✅ DO:
- Use different secrets for dev/staging/prod
- Rotate secrets regularly (quarterly)
- Use environment variables, never commit secrets to git
- Use Railway Secrets for deployment
- Set `CRON_SECRET` to random string in production
- Use HTTPS in production (`COOKIE_SECURE=true`)

### ❌ DON'T:
- Commit `.env` files to git (already in `.gitignore`)
- Share production secrets in Slack/email
- Use default/example secrets in production
- Reuse secrets across environments
- Store secrets in code or config files

---

## 📝 Template Files

### `.env.development` (Copy this for local dev)

```bash
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://user:pass@localhost:5432/breakagency_dev
SESSION_SECRET=dev-secret-change-in-production
JWT_SECRET=dev-jwt-secret-change-in-production

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback
GMAIL_REDIRECT_URI=http://localhost:5001/api/gmail/auth/callback

FRONTEND_ORIGIN=http://localhost:5173
BACKEND_URL=http://localhost:5001

# Optional for development
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
```

### `.env.production` (Template for deployment)

```bash
NODE_ENV=production
PORT=${PORT}  # Set by host (Railway)
DATABASE_URL=${DATABASE_URL}  # Set by database provider
SESSION_SECRET=${SESSION_SECRET}  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=${JWT_SECRET}  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=${CRON_SECRET}  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URI=https://your-api-domain.com/api/auth/google/callback
GMAIL_REDIRECT_URI=https://your-api-domain.com/api/gmail/auth/callback

FRONTEND_ORIGIN=https://your-frontend-domain.com
BACKEND_URL=https://your-api-domain.com

OPENAI_API_KEY=${OPENAI_API_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

S3_BUCKET=${S3_BUCKET}
S3_REGION=us-east-1
S3_ACCESS_KEY=${S3_ACCESS_KEY}
S3_SECRET_KEY=${S3_SECRET_KEY}
```

---

## 🆘 Help & Support

**Missing required variable?**
1. Check server startup logs for which variable is missing
2. Reference this document for what it does
3. Follow "How to Get" instructions for that variable

**Variable set but not working?**
1. Check spelling/formatting
2. Verify no extra spaces or quotes
3. Restart server after changing `.env`
4. Check server logs for "ENV LOADED FROM" confirmation

**Still stuck?**
- Check `SMOKE_TESTS.md` for troubleshooting steps
- Review `PRODUCTION_READY_FEATURES.md` for feature status
- Check Railway logs for environment variable issues

