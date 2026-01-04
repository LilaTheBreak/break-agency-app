# Feature Flag Matrix

**Last Updated:** January 2025  
**System:** The Break Agency Platform

---

## Overview

This document provides a comprehensive matrix of all feature flags, their current status, dependencies, and how to enable/disable them.

**Feature Flag Locations:**
- **Backend:** `apps/api/src/config/features.ts`
- **Frontend:** `apps/web/src/config/features.js`

**Important:** Frontend and backend flags must be kept in sync. Always update both files.

---

## Feature Flag Categories

### 1. AI Features

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `AI_ENABLED` | ✅ | ✅ | `true` | ✅ Production | `OPENAI_API_KEY` |
| `AI_INSIGHTS` | ✅ | ✅ | `true` | ✅ Production | `OPENAI_API_KEY` |
| `AI_ASSISTANT` | ✅ | ✅ | `true` | ✅ Production | `OPENAI_API_KEY` |
| `AI_REPLY_SUGGESTIONS` | ✅ | ✅ | `true` | ✅ Production | `OPENAI_API_KEY` |
| `AI_DEAL_EXTRACTION` | ✅ | ✅ | `true` | ✅ Production | `OPENAI_API_KEY` |
| `AI_SOCIAL_INSIGHTS` | ✅ | ✅ | `false` | ❌ Not Implemented | - |

**Enable:**
```bash
# Backend: Already enabled (no env var needed)
# Frontend: Already enabled
```

**Disable:**
```javascript
// apps/web/src/config/features.js
AI_ENABLED: false,
```

---

### 2. Inbox & Communication

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `INBOX_SCANNING_ENABLED` | ✅ | ✅ | `true` | ✅ Production | Gmail OAuth |
| `EMAIL_CLASSIFICATION_ENABLED` | ✅ | ✅ | `false` | ❌ Not Implemented | - |
| `INSTAGRAM_INBOX_ENABLED` | ✅ | ✅ | `false` | ⚠️ Partial | Instagram OAuth |
| `TIKTOK_INBOX_ENABLED` | ✅ | ✅ | `false` | ⚠️ Partial | TikTok OAuth |
| `WHATSAPP_INBOX_ENABLED` | ✅ | ✅ | `false` | 🚧 Placeholder | - |

**Enable Gmail Inbox:**
```bash
# Already enabled by default
# Requires: Gmail OAuth connection
```

**Enable Platform Inboxes:**
```bash
# Backend
INSTAGRAM_INBOX_ENABLED=true
TIKTOK_INBOX_ENABLED=true

# Frontend: Update apps/web/src/config/features.js
INSTAGRAM_INBOX_ENABLED: true,
TIKTOK_INBOX_ENABLED: true,
```

---

### 3. Finance & Payments

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `REVENUE_DASHBOARD_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `FINANCE_METRICS_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `PAYOUT_TRACKING_ENABLED` | ✅ | ✅ | `true` | ✅ Production | Stripe |
| `XERO_INTEGRATION_ENABLED` | ✅ | ✅ | `false` | ✅ Production | Xero OAuth |

**Enable Xero:**
```bash
# Backend
XERO_INTEGRATION_ENABLED=true

# Frontend: Update apps/web/src/config/features.js
XERO_INTEGRATION_ENABLED: true,
```

---

### 4. Contract Management

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `CONTRACT_GENERATION_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `CONTRACT_MANUAL_TRACKING_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `CONTRACT_SIGNING_ENABLED` | ✅ | ✅ | `true` | ✅ Production | DocuSign OAuth |
| `CONTRACT_ANALYSIS_ENABLED` | ✅ | ✅ | `false` | ❌ Not Implemented | - |

**Enable E-Signature:**
```bash
# Backend
CONTRACT_SIGNING_ENABLED=true

# Frontend: Already enabled
# Requires: DocuSign OAuth connection
```

---

### 5. Social Media Integrations

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `SOCIAL_ANALYTICS_ENABLED` | ✅ | ✅ | `true` | ✅ Production | Platform OAuth |
| `SOCIAL_INSIGHTS_ENABLED` | ✅ | ✅ | `false` | ❌ Not Implemented | - |
| `INSTAGRAM_INTEGRATION_ENABLED` | ✅ | ✅ | `false` | ⚠️ Partial | Instagram OAuth |
| `TIKTOK_INTEGRATION_ENABLED` | ✅ | ✅ | `false` | ⚠️ Partial | TikTok OAuth |
| `YOUTUBE_INTEGRATION_ENABLED` | ✅ | ✅ | `false` | ⚠️ Partial | YouTube OAuth |

**Enable Social Analytics:**
```bash
# Backend
SOCIAL_ANALYTICS_ENABLED=true

# Frontend: Already enabled
# Requires: Platform OAuth connections
```

---

### 6. Productivity Integrations (V1.1)

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `SLACK_INTEGRATION_ENABLED` | ✅ | ✅ | `true` | ✅ Production | Slack webhook URL |
| `NOTION_INTEGRATION_ENABLED` | ✅ | ✅ | `true` | ✅ Production | Notion OAuth |
| `GOOGLE_DRIVE_INTEGRATION_ENABLED` | ✅ | ✅ | `true` | ✅ Production | Google OAuth |

**Enable Productivity Integrations:**
```bash
# Backend
SLACK_INTEGRATION_ENABLED=true
NOTION_INTEGRATION_ENABLED=true
GOOGLE_DRIVE_INTEGRATION_ENABLED=true

# Frontend: Already enabled
```

---

### 7. Deal Intelligence

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `DEAL_INTELLIGENCE_ENABLED` | ✅ | ✅ | `true` | ✅ Production | `OPENAI_API_KEY` |

**Enable:**
```bash
# Backend: Already enabled
# Frontend: Already enabled
# Requires: OPENAI_API_KEY
```

---

### 8. Campaign Features

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `CAMPAIGN_ANALYTICS_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `CAMPAIGN_AUTOPLAN_ENABLED` | ✅ | ✅ | `false` | ❌ Not Implemented | - |

---

### 9. Dashboard Features

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `DASHBOARD_AGGREGATION_ENABLED` | ✅ | ✅ | `false` | ❌ Not Implemented | - |
| `CREATOR_ROSTER_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `BRAND_OPPORTUNITIES_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `BRAND_CREATOR_MATCHES_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `CREATOR_OPPORTUNITIES_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `CREATOR_SUBMISSIONS_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `EXCLUSIVE_TASKS_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `EXCLUSIVE_SOCIAL_ANALYTICS_ENABLED` | ✅ | ✅ | `true` | ✅ Production | Platform OAuth |
| `EXCLUSIVE_OPPORTUNITIES_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `EXCLUSIVE_FINANCIAL_SUMMARY_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `EXCLUSIVE_MESSAGES_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `EXCLUSIVE_ALERTS_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |

---

### 10. Advanced Features

| Flag | Backend | Frontend | Default | Status | Dependencies |
|------|---------|----------|---------|--------|--------------|
| `GLOBAL_SEARCH_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `TRENDING_CONTENT_ENABLED` | ✅ | ✅ | `false` | ❌ Not Implemented | - |
| `ADVANCED_ANALYTICS_ENABLED` | ✅ | ✅ | `false` | ❌ Not Implemented | - |
| `BRIEFS_ENABLED` | ✅ | ✅ | `false` | ⚠️ Partial | - |
| `BRIEF_APPLICATIONS_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `CREATOR_FIT_BATCH_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |
| `OUTREACH_LEADS_ENABLED` | ✅ | ✅ | `false` | ❌ Not Implemented | - |
| `DELIVERABLES_WORKFLOW_ENABLED` | ✅ | ✅ | `true` | ✅ Production | - |

---

## Feature Flag Management

### How to Enable a Feature

1. **Check Dependencies:**
   - Review flag dependencies (OAuth, API keys, etc.)
   - Ensure required services are configured

2. **Update Backend:**
   ```typescript
   // apps/api/src/config/features.ts
   export const features = {
     FEATURE_NAME: process.env.FEATURE_NAME === "true",
   };
   ```

3. **Set Environment Variable:**
   ```bash
   # .env or production environment
   FEATURE_NAME=true
   ```

4. **Update Frontend:**
   ```javascript
   // apps/web/src/config/features.js
   export const features = {
     FEATURE_NAME: true,
   };
   ```

5. **Deploy:**
   - Deploy backend with new env var
   - Deploy frontend with updated flag

6. **Verify:**
   - Test feature in staging
   - Monitor error logs
   - Check feature flag status in diagnostics

### How to Disable a Feature

1. **Update Backend:**
   ```typescript
   // apps/api/src/config/features.ts
   export const features = {
     FEATURE_NAME: false, // or remove env var
   };
   ```

2. **Update Frontend:**
   ```javascript
   // apps/web/src/config/features.js
   export const features = {
     FEATURE_NAME: false,
   };
   ```

3. **Deploy:**
   - Deploy both backend and frontend
   - Feature will be hidden/disabled

### Feature Flag Best Practices

1. **Always Update Both Files:**
   - Backend and frontend flags must match
   - Mismatched flags cause inconsistent behavior

2. **Use Environment Variables:**
   - Backend flags should read from env vars
   - Allows per-environment configuration

3. **Document Dependencies:**
   - List required services/credentials
   - Document enable/disable steps

4. **Test Before Enabling:**
   - Verify dependencies are met
   - Test in staging first
   - Monitor error logs after enabling

5. **Graceful Degradation:**
   - Features should fail safely when disabled
   - Show user-friendly messages
   - Don't crash the app

---

## Feature Flag Status Summary

**Total Flags:** 50+

**Production Ready:** 35+  
**Partial Implementation:** 5+  
**Not Implemented:** 10+

**Most Critical Flags:**
- `AI_ENABLED` - Core AI features
- `INBOX_SCANNING_ENABLED` - Gmail integration
- `REVENUE_DASHBOARD_ENABLED` - Finance tracking
- `CONTRACT_SIGNING_ENABLED` - E-signatures
- `DEAL_INTELLIGENCE_ENABLED` - Deal insights

---

## Feature Flag Diagnostics

**Endpoint:** `GET /api/admin/diagnostics/features` (if implemented)

**Manual Check:**
```javascript
// Frontend
import { features } from './config/features.js';
console.log(features.AI_ENABLED); // true/false

// Backend
import { features } from './config/features.js';
console.log(features.AI_ENABLED); // true/false
```

---

**Document Status:** ✅ Complete  
**Maintained By:** Engineering Team  
**Last Review:** January 2025

