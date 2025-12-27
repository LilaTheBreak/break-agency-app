# PRODUCTION ROLLOUT CHECKLIST

**Last Updated:** December 26, 2025  
**For:** Platform Administrators & DevOps

---

## PRE-DEPLOYMENT CHECKLIST

### 1. ENVIRONMENT VARIABLES ✅

**Required (Critical):**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/database

# Authentication
SESSION_SECRET=your-random-32+-char-string
JWT_SECRET=your-random-32+-char-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.breakagency.com/api/auth/google/callback
GMAIL_REDIRECT_URI=https://api.breakagency.com/api/gmail/auth/callback

# Frontend
FRONTEND_ORIGIN=https://app.breakagency.com
NODE_ENV=production
```

**Monitoring (Highly Recommended):**
```bash
# Error Tracking
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ALERT_EMAILS=admin@breakagency.com,devops@breakagency.com
```

**Optional (Feature-Specific):**
```bash
# AI Features
OPENAI_API_KEY=sk-your-openai-key

# Payments
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# File Storage
S3_BUCKET_NAME=break-agency-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Queue System (if using)
REDIS_URL=redis://user:pass@host:6379

# Email (if using)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
ALERT_FROM_EMAIL=alerts@breakagency.com
```

**Verify All Required Variables:**
```bash
# Run this to check for missing variables
curl https://api.breakagency.com/health/detailed
# Check "environment" section for missing variables
```

---

### 2. FEATURE FLAGS 🚩

**Production-Ready Features (ENABLED):**
```bash
FEATURE_GMAIL_INBOX=true         # Gmail integration
FEATURE_CRM=true                 # CRM system
FEATURE_CONTRACTS=true           # Contract management
FEATURE_CAMPAIGNS=true           # Campaign management
FEATURE_OUTREACH=true            # Basic outreach
FEATURE_MONITORING=true          # Health checks & monitoring
```

**Beta Features (DISABLED by default):**
```bash
FEATURE_EXCLUSIVE_ANALYTICS=false     # Exclusive talent analytics
FEATURE_CAMPAIGN_AUTO=false           # Auto campaign builder
FEATURE_OUTREACH_SEQUENCES=false      # Advanced outreach sequences
FEATURE_AI_DECK_GENERATION=false      # AI-powered deck creation
```

**How to Enable Beta Features:**
1. Set environment variable to `true`
2. Restart server
3. Feature appears in relevant dashboards
4. Monitor for issues (check logs, Sentry)

**When to Enable Beta Features:**
- After 2 weeks of stable production
- With pilot users only
- When ready to handle bug reports
- After testing in staging environment

---

### 3. DATABASE SETUP ✅

**Verify Database:**
```bash
# Test connection
curl https://api.breakagency.com/health
# Should return: { "database": "connected" }
```

**Run Migrations:**
```bash
cd apps/api
npx prisma migrate deploy
```

**Seed Data (Optional):**
```bash
# Only if you need initial data
npx prisma db seed
```

**Backup Strategy:**
- Daily automated backups (check hosting provider)
- Point-in-time recovery enabled
- Test restore procedure before launch

---

### 4. GOOGLE OAUTH SETUP ✅

**Verify OAuth Credentials:**
1. Visit https://console.cloud.google.com
2. Check OAuth consent screen:
   - App name: "Break Agency"
   - Support email: support@breakagency.com
   - Authorized domains: `breakagency.com`
3. Check OAuth 2.0 Client:
   - Authorized redirect URIs:
     - `https://api.breakagency.com/api/auth/google/callback`
     - `https://api.breakagency.com/api/gmail/auth/callback`
4. Enable Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search "Gmail API"
   - Click "Enable"

**Test OAuth Flow:**
1. Visit `https://app.breakagency.com`
2. Click "Sign in with Google"
3. Complete authorization
4. Verify redirect back to app
5. Check user created in database

---

### 5. MONITORING SETUP 📊

**Sentry (Error Tracking):**
1. Create projects at https://sentry.io:
   - Frontend project (React)
   - Backend project (Node.js)
2. Copy DSN values to environment variables
3. Verify errors are being captured:
   - Check Sentry dashboard
   - Trigger test error
   - Confirm error appears in Sentry

**Uptime Monitoring:**
1. Choose service (UptimeRobot, Better Uptime, Pingdom)
2. Add health endpoint: `https://api.breakagency.com/health`
3. Set check interval: 5 minutes
4. Configure alerts:
   - Email: devops@breakagency.com
   - Slack: #alerts channel
   - SMS: For critical alerts

**Slack Alerts:**
1. Create Slack incoming webhook
2. Add `SLACK_WEBHOOK_URL` to environment
3. Test alert:
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test alert from Break Agency"}'
   ```
4. Verify message received in Slack

**Email Alerts (Optional):**
1. Configure SMTP settings
2. Add `ALERT_EMAILS` to environment
3. Test email delivery
4. Verify emails not going to spam

---

### 6. CRON JOBS ⏰

**Verify Cron Jobs Running:**
```bash
curl https://api.breakagency.com/api/cron/status
```

**Expected Jobs:**
- `gmail-sync` - Runs every 5 minutes
- `webhook-renewal` - Runs daily at midnight
- `daily-error-summary` - Runs daily at 9 AM (if configured)

**Check Cron Status:**
- `lastRun` should be recent
- `lastStatus` should be "success"
- `lastError` should be null

**If Cron Jobs Not Running:**
1. Check server logs for "[CRON]" messages
2. Verify cron jobs registered: `markCronJobsRegistered()` called
3. Check Railway/hosting provider cron support
4. Manual trigger: Call endpoint if cron not supported

---

### 7. SECURITY CHECKLIST 🔒

**Secrets:**
- ✅ All secrets in environment variables (not in code)
- ✅ `SESSION_SECRET` is random 32+ chars
- ✅ `JWT_SECRET` is random 32+ chars
- ✅ Database credentials are secure
- ✅ Google OAuth secrets are secure

**HTTPS:**
- ✅ All domains use HTTPS
- ✅ HTTP redirects to HTTPS
- ✅ SSL certificate valid (not expired)
- ✅ Certificate auto-renewal configured

**CORS:**
- ✅ `FRONTEND_ORIGIN` set correctly
- ✅ No wildcard origins in production
- ✅ Credentials enabled for frontend domain only

**Headers:**
- ✅ Helmet middleware enabled
- ✅ Content Security Policy configured
- ✅ X-Frame-Options set
- ✅ X-Content-Type-Options set

**Rate Limiting:**
- ✅ Rate limiting enabled (if implemented)
- ✅ Login attempts limited
- ✅ API endpoints rate-limited

---

### 8. PERFORMANCE OPTIMIZATION ⚡

**Frontend:**
- ✅ Assets minified (JS, CSS)
- ✅ Images optimized
- ✅ Code splitting enabled
- ✅ Lazy loading for routes
- ✅ CDN configured (if applicable)

**Backend:**
- ✅ Database connection pooling
- ✅ Query optimization
- ✅ Indexes on frequently queried fields
- ✅ Caching strategy (if implemented)

**Database:**
- ✅ Connection pool size appropriate (10-20)
- ✅ Query timeout set
- ✅ Slow query logging enabled

---

### 9. DOCUMENTATION 📚

**Admin Guides Available:**
- ✅ `/docs/ADMIN_DASHBOARD_GUIDE.md`
- ✅ `/docs/USER_APPROVAL_GUIDE.md`
- ✅ `/docs/GMAIL_INBOX_GUIDE.md`
- ✅ `/docs/OUTREACH_DEAL_CONTRACT_FLOW.md`

**Monitoring Guides:**
- ✅ `/MONITORING_SETUP_GUIDE.md`
- ✅ `/MONITORING_QUICK_REFERENCE.md`

**Deployment Docs:**
- ✅ `/DEPLOYMENT_CHECKLIST.md` (this file)
- ✅ `/PRODUCTION_ENV_SETUP.md`

**Phase Completion Docs:**
- ✅ Phase 6: Feature Boundary Enforcement
- ✅ Phase 7: UX Trust & Performance Feedback
- ✅ Phase 8: Monitoring & Operational Safety
- ✅ Phase 9: Documentation & Rollout Readiness

---

## DEPLOYMENT PROCEDURE

### Step 1: Pre-Deployment Testing

**Staging Environment:**
1. Deploy to staging first
2. Run smoke tests:
   - User login (Google OAuth)
   - Gmail connection
   - Create contact
   - Create deal
   - Generate contract
3. Check health endpoints
4. Review error logs
5. Verify cron jobs running

**Load Testing (Optional):**
```bash
# Test API performance
ab -n 1000 -c 10 https://api.breakagency.com/health
```

---

### Step 2: Deploy to Production

**Backend Deployment:**
1. Build backend:
   ```bash
   cd apps/api
   npm run build
   ```
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Deploy to hosting (Railway, Heroku, etc.)
4. Verify environment variables set
5. Check server logs for startup errors
6. Test health endpoint: `curl https://api.breakagency.com/health`

**Frontend Deployment:**
1. Build frontend:
   ```bash
   cd apps/web
   npm run build
   ```
2. Deploy to hosting (Vercel, Netlify, etc.)
3. Verify environment variables set
4. Test login flow
5. Check browser console for errors

---

### Step 3: Post-Deployment Verification

**Smoke Tests:**
- [ ] Health endpoint returns 200: `curl https://api.breakagency.com/health`
- [ ] Detailed health check passes: `curl https://api.breakagency.com/health/detailed`
- [ ] Frontend loads without errors
- [ ] Google OAuth login works
- [ ] Gmail connection flow works
- [ ] Cron jobs running: `curl https://api.breakagency.com/api/cron/status`

**Monitor for 1 Hour:**
- [ ] Check Sentry for errors
- [ ] Review server logs
- [ ] Monitor response times
- [ ] Verify cron jobs execute
- [ ] Check Slack for alerts

---

### Step 4: Enable Monitoring

**Set Up Alerts:**
1. Add health endpoint to uptime monitor
2. Configure alert thresholds
3. Test alert delivery (trigger intentional failure)
4. Verify alerts reach correct channels

**Daily Monitoring:**
1. Schedule daily health check review (9 AM)
2. Set up daily error summary (9 AM)
3. Add cron status check to daily routine

---

## POST-DEPLOYMENT CHECKLIST

### Day 1 (Launch Day)

**Morning (9 AM):**
- [ ] Check health endpoint (all systems green)
- [ ] Review Sentry errors (should be minimal)
- [ ] Verify cron jobs ran overnight
- [ ] Check uptime monitor (no downtime alerts)
- [ ] Test user login flow

**Midday (12 PM):**
- [ ] Review user activity (registrations, logins)
- [ ] Check for performance issues
- [ ] Monitor memory usage (should be stable)
- [ ] Review error rates (should be < 1%)

**Evening (5 PM):**
- [ ] Daily metrics review
- [ ] Check Gmail sync status
- [ ] Review any user-reported issues
- [ ] Prepare tomorrow's monitoring plan

---

### Week 1 (Days 2-7)

**Daily Tasks:**
- [ ] Morning health check
- [ ] Review Sentry errors
- [ ] Check cron job status
- [ ] Monitor user growth
- [ ] Respond to user issues

**Weekly Review (Friday):**
- [ ] Analyze error trends
- [ ] Review uptime percentage (target: 99.9%)
- [ ] Check response time averages
- [ ] Review user feedback
- [ ] Plan improvements for Week 2

---

### Month 1 (Weeks 2-4)

**Weekly Reviews:**
- [ ] Error rate analysis (trending down?)
- [ ] Performance metrics (stable or improving?)
- [ ] User growth (meeting targets?)
- [ ] Feature usage (what's popular?)
- [ ] Beta feature consideration

**Monthly Tasks:**
- [ ] Security audit
- [ ] Dependency updates
- [ ] Database performance review
- [ ] Backup restore test
- [ ] Documentation updates

---

## ROLLBACK PROCEDURE

**If Critical Issues Arise:**

### Step 1: Assess Severity
- **Critical:** Site down, data loss, security breach → Rollback immediately
- **High:** Major feature broken, widespread errors → Rollback within 1 hour
- **Medium:** Minor feature issues, isolated errors → Fix forward
- **Low:** Cosmetic issues, edge cases → Schedule fix

### Step 2: Rollback (if needed)

**Backend Rollback:**
1. Revert to previous deployment
2. Run database migration rollback (if schema changed):
   ```bash
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   ```
3. Verify health endpoint
4. Check logs for errors

**Frontend Rollback:**
1. Revert to previous deployment
2. Clear CDN cache (if applicable)
3. Test login flow
4. Verify app loads correctly

### Step 3: Communicate
- [ ] Notify team of rollback
- [ ] Update status page (if have one)
- [ ] Email affected users (if necessary)
- [ ] Post incident report

### Step 4: Fix & Redeploy
1. Identify root cause
2. Implement fix in staging
3. Test thoroughly
4. Redeploy to production
5. Monitor closely

---

## USER ONBOARDING

### Admin Onboarding

**First Admin User:**
1. Create admin account manually in database
2. Set role to "admin"
3. Send welcome email with login link
4. Provide admin guides:
   - `/docs/ADMIN_DASHBOARD_GUIDE.md`
   - `/docs/USER_APPROVAL_GUIDE.md`

**Admin Training:**
- [ ] Walkthrough of admin dashboard
- [ ] Explain user approval workflow
- [ ] Show monitoring & health checks
- [ ] Demonstrate cron status review
- [ ] Explain error log interpretation

---

### Pilot User Onboarding

**Brand Users:**
1. User registers via Google OAuth
2. Admin approves within 24 hours
3. User receives welcome email (if configured)
4. User sees onboarding checklist:
   - Connect Gmail
   - Add creators
   - Create first campaign
5. Provide guide: `/docs/GMAIL_INBOX_GUIDE.md`

**Creator Users:**
1. User registers via Google OAuth
2. Admin approves within 24 hours
3. User sees onboarding checklist:
   - Complete profile
   - Browse opportunities
   - Set up payments
4. Provide creator-specific docs (if available)

---

## KNOWN LIMITATIONS (BETA FEATURES)

**Gmail Integration:**
- ✅ Sync works reliably
- ✅ Webhook renewal automated
- ⚠️ Email sending not yet implemented
- ⚠️ AI reply suggestions not available

**CRM System:**
- ✅ Contacts, deals, contracts working
- ✅ Pipeline management functional
- ⚠️ Advanced reporting limited
- ⚠️ Custom fields not configurable

**Campaign Management:**
- ✅ Basic campaign creation works
- ✅ Deliverable tracking functional
- ⚠️ Auto campaign builder in beta
- ⚠️ Performance analytics basic

**Exclusive Features:**
- ⚠️ Exclusive talent dashboard in beta
- ⚠️ Advanced analytics limited
- ⚠️ Feature flag required to enable

**AI Features:**
- ⚠️ AI deck generation in beta
- ⚠️ Requires OpenAI API key
- ⚠️ Results quality variable

---

## SUPPORT & ESCALATION

**Severity Levels:**

**P0 - Critical (Immediate):**
- Site completely down
- Data loss or corruption
- Security breach
- Payment processing broken

**Response:** Immediate (< 15 minutes)  
**Escalation:** CEO, CTO, DevOps lead

**P1 - High (< 1 hour):**
- Major feature broken (Gmail sync, login)
- Widespread errors affecting multiple users
- Performance severely degraded

**Response:** < 1 hour  
**Escalation:** DevOps lead, Backend engineer

**P2 - Medium (< 4 hours):**
- Minor feature issues
- Isolated user errors
- Non-critical cron job failures

**Response:** < 4 hours  
**Escalation:** On-call engineer

**P3 - Low (< 24 hours):**
- Cosmetic issues
- Documentation errors
- Feature requests

**Response:** < 24 hours  
**Escalation:** Product team

---

## SUCCESS METRICS

### Week 1 Targets

**Stability:**
- [ ] Uptime: 99.5%+ (target: 99.9%)
- [ ] Error rate: < 1%
- [ ] Average response time: < 500ms
- [ ] Cron job success rate: 95%+

**Usage:**
- [ ] User registrations: 10+ pilot users
- [ ] Approval rate: 80%+ within 24 hours
- [ ] Gmail connections: 50%+ of brand users
- [ ] First deal created: At least 1 user

**Monitoring:**
- [ ] Zero P0 incidents
- [ ] < 3 P1 incidents
- [ ] Sentry errors reviewed daily
- [ ] All alerts firing correctly

---

### Month 1 Targets

**Stability:**
- [ ] Uptime: 99.9%+
- [ ] Error rate: < 0.5%
- [ ] Average response time: < 300ms
- [ ] Zero data loss incidents

**Adoption:**
- [ ] 50+ active users
- [ ] 80%+ user approval rate (24 hours)
- [ ] 20+ campaigns created
- [ ] 10+ contracts generated

**Satisfaction:**
- [ ] Zero critical user complaints
- [ ] Positive user feedback
- [ ] < 5% user churn
- [ ] Admin confidence high

---

## NEXT STEPS AFTER LAUNCH

### Week 2-4 (Stabilization)
- [ ] Review all error trends
- [ ] Optimize slow queries
- [ ] Fine-tune alert thresholds
- [ ] Gather user feedback
- [ ] Plan feature improvements

### Month 2 (Beta Feature Rollout)
- [ ] Enable first beta feature for pilot users
- [ ] Monitor closely for issues
- [ ] Gather beta user feedback
- [ ] Iterate based on feedback
- [ ] Plan general availability

### Month 3 (Scaling)
- [ ] Review performance under load
- [ ] Optimize database queries
- [ ] Implement caching if needed
- [ ] Plan infrastructure scaling
- [ ] Expand user base

---

**Production Rollout Checklist** — Version 1.0  
**Status:** Ready for Launch 🚀  
**Last Updated:** December 26, 2025
