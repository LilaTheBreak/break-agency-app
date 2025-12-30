# Phase 5: Advanced Features & Power Tools

**Status:** Planning & Design Phase  
**Goal:** Add high-leverage, optional features for power users without impacting core workflows

## 🎯 Phase 5 Philosophy

- **Optional:** Every feature is opt-in
- **Independent:** Each feature can be deployed separately
- **Gated:** All features behind feature flags (disabled by default)
- **Safe:** Zero impact when disabled
- **Conservative:** No modifications to core CRM flows

---

## 📋 PHASE 5 FEATURE LIST

### 1. Global Search (Advanced) 🔍

**Feature Name:** Global Search API  
**Flag Name:** `GLOBAL_SEARCH_ENABLED`  
**Risk Level:** 🟡 Medium  
**Default:** `false`

**Objective:**
Enable fast, scoped search across entities for admins and power users.

**Current State:**
- ❌ No global search API exists
- ✅ Client-side filtering exists per entity (Brands, Campaigns, Deals, Tasks)
- ✅ Gmail inbox search exists (`/api/gmail/inbox/search`)
- ✅ Creative hub search exists (`/api/creative-hub/search`)

**Implementation Plan:**

**Backend:**
- Create `GET /api/search` endpoint
- Support search across:
  - Brands (`CrmBrand`)
  - Contacts (`CrmBrandContact`)
  - Deals (`CrmDeal`)
  - Campaigns (`CrmCampaign`)
  - Tasks (`CrmTask`)
  - Events (`CrmEvent`)
  - Contracts (`CrmContract`)
- Implement role-based scoping:
  - Admin/Superadmin: All entities
  - Brand: Own brands + related entities
  - Creator: Own deals, tasks, events
- Use Prisma `OR` queries with `contains` (case-insensitive)
- Limit results per entity type (e.g., 10 per type, 50 total)
- Return grouped results by entity type

**Frontend:**
- Add global search input in `SiteChrome` (admin only)
- Show search results in dropdown/modal
- Group results by entity type
- Link to entity detail pages
- Debounce search (500ms)

**Constraints:**
- Read-only (no write operations)
- No cross-role data leaks
- No performance-heavy joins without indexing
- Timeout after 2 seconds

**Files to Create/Modify:**
- `apps/api/src/routes/search.ts` (new)
- `apps/api/src/services/searchService.ts` (new)
- `apps/web/src/components/GlobalSearch.jsx` (new)
- `apps/web/src/components/SiteChrome.jsx` (add search input)
- `apps/web/src/config/features.js` (add flag)

**Dependencies:**
- None (uses existing Prisma)

**Rollback Plan:**
- Set `GLOBAL_SEARCH_ENABLED: false`
- Remove search input from `SiteChrome`
- API endpoint returns 501 when disabled

---

### 2. Trending Content & Intelligence Feeds 📈

**Feature Name:** Trending Content Feed  
**Flag Name:** `TRENDING_CONTENT_ENABLED`  
**Risk Level:** 🟢 Low  
**Default:** `false`

**Objective:**
Surface trends, insights, and content intelligence without manual work.

**Current State:**
- ❌ Not implemented
- ✅ `EXCLUSIVE_TRENDING_CONTENT_ENABLED: false` (flag exists)
- ✅ Social analytics data exists (`SocialAccountConnection`, `SocialPost`)
- ✅ Content data exists (`AssetGeneration`, `Submission`)

**Implementation Plan:**

**Backend:**
- Create `GET /api/trending/content` endpoint
- Aggregate from existing data:
  - Top performing posts (by engagement)
  - Trending creators (by follower growth)
  - Popular content types (by submission count)
  - Recent high-engagement content
- Use background job (cron) to pre-calculate trends daily
- Cache results for 1 hour
- Return JSON with:
  - Top posts (last 30 days)
  - Trending creators (growth rate)
  - Content insights (platform distribution)

**Frontend:**
- Add "Trending Content" section to Exclusive Talent Dashboard
- Display cards with:
  - Post thumbnail
  - Creator name
  - Engagement metrics
  - Growth indicators
- Gate behind `TRENDING_CONTENT_ENABLED` flag

**Constraints:**
- Read-only aggregation
- Uses existing data only
- No external API calls
- Background job runs daily (low frequency)

**Files to Create/Modify:**
- `apps/api/src/routes/trending.ts` (new)
- `apps/api/src/services/trendingService.ts` (new)
- `apps/api/src/cron/trendingContent.ts` (new cron job)
- `apps/web/src/pages/ExclusiveTalentDashboard.jsx` (add section)
- `apps/web/src/config/features.js` (add flag)

**Dependencies:**
- None (uses existing data)

**Rollback Plan:**
- Set `TRENDING_CONTENT_ENABLED: false`
- Disable cron job
- Remove section from dashboard
- API returns empty array when disabled

---

### 3. Advanced Analytics & Reporting 📊

**Feature Name:** Backend Analytics Aggregation  
**Flag Name:** `ADVANCED_ANALYTICS_ENABLED`  
**Risk Level:** 🟡 Medium  
**Default:** `false`

**Objective:**
Move client-side analytics calculations to backend aggregation.

**Current State:**
- ⚠️ Some client-side calculations in `AdminFinancePage.jsx`:
  - Cash flow series (by month)
  - Payouts by creator
  - Invoices by status
- ✅ Some analytics already backend (`/api/analytics/*`)
- ✅ Revenue dashboard uses backend (`useRevenue` hook)

**Implementation Plan:**

**Backend:**
- Create `GET /api/analytics/finance` endpoint
- Aggregate:
  - Cash flow (in/out by month)
  - Payouts by creator (top N)
  - Invoices by status (totals)
  - Overdue items
  - Delayed payouts
- Use Prisma aggregations (`_sum`, `_count`, `groupBy`)
- Return pre-calculated JSON

**Frontend:**
- Replace client-side `useMemo` calculations in `AdminFinancePage.jsx`
- Use new analytics endpoint
- Keep existing UI/UX unchanged

**Export Functionality:**
- Add `GET /api/analytics/finance/export?format=csv` endpoint
- Generate CSV from aggregated data
- Return downloadable file

**Constraints:**
- Do not rework stable dashboards
- Only move calculations that are client-side
- Maintain existing UI behavior
- Export is optional (can be added later)

**Files to Create/Modify:**
- `apps/api/src/routes/analytics.ts` (add finance endpoint)
- `apps/api/src/services/analyticsService.ts` (add finance aggregation)
- `apps/web/src/pages/AdminFinancePage.jsx` (replace client-side calculations)
- `apps/web/src/config/features.js` (add flag)

**Dependencies:**
- None (uses existing Prisma)

**Rollback Plan:**
- Set `ADVANCED_ANALYTICS_ENABLED: false`
- Revert to client-side calculations
- API endpoint returns 501 when disabled

---

### 4. Optional Integrations 🔌

**Feature Name:** Slack, Notion, Google Drive Integrations  
**Flag Names:** 
- `SLACK_INTEGRATION_ENABLED`
- `NOTION_INTEGRATION_ENABLED`
- `GOOGLE_DRIVE_INTEGRATION_ENABLED`  
**Risk Level:** 🟡 Medium (each)  
**Default:** `false` (all)

**Objective:**
Enable power-user workflows via external tools.

**Current State:**
- ❌ Slack integration not implemented
- ❌ Notion integration not implemented
- ❌ Google Drive integration not implemented
- ✅ Settings page has placeholders (`/admin/settings`)
- ✅ Gmail integration exists (reference implementation)

**Implementation Plan:**

#### 4a. Slack Integration

**Backend:**
- Create `POST /api/integrations/slack/connect` (OAuth)
- Create `POST /api/integrations/slack/webhook` (receive events)
- Create `POST /api/integrations/slack/notify` (send notifications)
- Store Slack tokens in `IntegrationConnection` model (if exists) or new table
- Send notifications for:
  - Deal status changes
  - Task assignments
  - Contract signatures
  - Payout completions

**Frontend:**
- Add "Connect Slack" button in `/admin/settings`
- Show connection status
- Allow disconnect

**Dependencies:**
- `@slack/web-api` package
- Slack app setup (OAuth)

**Rollback Plan:**
- Set `SLACK_INTEGRATION_ENABLED: false`
- Disable OAuth flow
- Hide UI elements
- API returns 501 when disabled

#### 4b. Notion Integration

**Backend:**
- Create `POST /api/integrations/notion/connect` (OAuth)
- Create `POST /api/integrations/notion/sync` (sync data)
- Store Notion tokens
- Sync:
  - Deals to Notion database
  - Campaigns to Notion pages
  - Tasks to Notion database

**Frontend:**
- Add "Connect Notion" button in `/admin/settings`
- Show sync status
- Allow manual sync trigger

**Dependencies:**
- `@notionhq/client` package
- Notion integration setup (OAuth)

**Rollback Plan:**
- Set `NOTION_INTEGRATION_ENABLED: false`
- Disable OAuth flow
- Hide UI elements
- API returns 501 when disabled

#### 4c. Google Drive Integration

**Backend:**
- Create `POST /api/integrations/drive/connect` (OAuth)
- Create `GET /api/integrations/drive/files` (list files)
- Create `POST /api/integrations/drive/link` (link file to entity)
- Store Drive tokens (reuse Google OAuth if possible)
- Link files to:
  - Contracts
  - Campaigns
  - Deals

**Frontend:**
- Add "Connect Google Drive" button in `/admin/settings`
- Show file picker in entity detail pages
- Link external files

**Dependencies:**
- `googleapis` package (already installed)
- Google Drive API enabled

**Rollback Plan:**
- Set `GOOGLE_DRIVE_INTEGRATION_ENABLED: false`
- Disable OAuth flow
- Hide UI elements
- API returns 501 when disabled

**Files to Create/Modify:**
- `apps/api/src/routes/integrations/slack.ts` (new)
- `apps/api/src/routes/integrations/notion.ts` (new)
- `apps/api/src/routes/integrations/drive.ts` (new)
- `apps/api/src/services/integrations/slackService.ts` (new)
- `apps/api/src/services/integrations/notionService.ts` (new)
- `apps/api/src/services/integrations/driveService.ts` (new)
- `apps/web/src/pages/AdminSettingsPage.jsx` (add connection UI)
- `apps/web/src/config/features.js` (add flags)

**Constraints:**
- All integrations opt-in
- Fail-safe (errors don't break core flows)
- Non-blocking (can be disabled anytime)

---

### 5. Advanced Admin Tools 🛠️

**Feature Name:** User Impersonation & Force Logout  
**Flag Names:**
- `USER_IMPERSONATION_ENABLED`
- `USER_FORCE_LOGOUT_ENABLED`  
**Risk Level:** 🔴 High  
**Default:** `false` (both)

**Objective:**
Improve internal efficiency without exposing security risk.

**Current State:**
- ❌ User impersonation not implemented
- ❌ Force logout not implemented
- ✅ User management exists (`/admin/users`)
- ✅ Audit logging exists (`AuditLog` model)

**Implementation Plan:**

#### 5a. User Impersonation

**Backend:**
- Create `POST /api/admin/users/:id/impersonate` endpoint
- Require:
  - `SUPERADMIN` role only
  - Environment check (`NODE_ENV !== 'production'` OR explicit allowlist)
- Create temporary session with impersonated user
- Log impersonation in `AuditLog`:
  - Action: `USER_IMPERSONATED`
  - Impersonator ID
  - Impersonated user ID
  - Timestamp
- Return new session token
- Add `X-Impersonated-By` header to all requests

**Frontend:**
- Add "Impersonate" button in user detail page (superadmin only)
- Show banner: "You are impersonating [User Name]"
- Add "Exit Impersonation" button
- Gate behind `USER_IMPERSONATION_ENABLED` flag

**Security Constraints:**
- Superadmin only
- Environment gated (dev/staging only, or explicit allowlist)
- Full audit logging
- Session timeout (1 hour max)
- Cannot impersonate other superadmins

**Files to Create/Modify:**
- `apps/api/src/routes/admin/users.ts` (add impersonate endpoint)
- `apps/api/src/middleware/impersonation.ts` (new)
- `apps/web/src/pages/AdminUsersPage.jsx` (add impersonate button)
- `apps/web/src/components/ImpersonationBanner.jsx` (new)
- `apps/web/src/config/features.js` (add flag)

**Dependencies:**
- None (uses existing auth)

**Rollback Plan:**
- Set `USER_IMPERSONATION_ENABLED: false`
- Remove impersonate endpoint
- Remove UI elements
- API returns 403 when disabled

#### 5b. Force Logout

**Backend:**
- Create `POST /api/admin/users/:id/force-logout` endpoint
- Require:
  - `ADMIN` or `SUPERADMIN` role
- Invalidate all user sessions:
  - Delete session cookies
  - Invalidate JWT tokens (if using)
  - Clear Redis sessions (if using)
- Log action in `AuditLog`:
  - Action: `USER_FORCE_LOGOUT`
  - Admin ID
  - Target user ID
  - Timestamp

**Frontend:**
- Add "Force Logout" button in user detail page (admin only)
- Show confirmation dialog
- Gate behind `USER_FORCE_LOGOUT_ENABLED` flag

**Security Constraints:**
- Admin+ only
- Full audit logging
- Confirmation required

**Files to Create/Modify:**
- `apps/api/src/routes/admin/users.ts` (add force-logout endpoint)
- `apps/web/src/pages/AdminUsersPage.jsx` (add force-logout button)
- `apps/web/src/config/features.js` (add flag)

**Dependencies:**
- None (uses existing auth)

**Rollback Plan:**
- Set `USER_FORCE_LOGOUT_ENABLED: false`
- Remove force-logout endpoint
- Remove UI elements
- API returns 403 when disabled

---

## 📊 Feature Summary Table

| Feature | Flag | Risk | Dependencies | Effort | Priority |
|---------|------|------|--------------|--------|----------|
| Global Search | `GLOBAL_SEARCH_ENABLED` | 🟡 Medium | None | 4-6h | High |
| Trending Content | `TRENDING_CONTENT_ENABLED` | 🟢 Low | None | 3-4h | Medium |
| Advanced Analytics | `ADVANCED_ANALYTICS_ENABLED` | 🟡 Medium | None | 2-3h | Medium |
| Slack Integration | `SLACK_INTEGRATION_ENABLED` | 🟡 Medium | Slack app | 4-6h | Low |
| Notion Integration | `NOTION_INTEGRATION_ENABLED` | 🟡 Medium | Notion app | 4-6h | Low |
| Google Drive Integration | `GOOGLE_DRIVE_INTEGRATION_ENABLED` | 🟡 Medium | Google API | 3-4h | Low |
| User Impersonation | `USER_IMPERSONATION_ENABLED` | 🔴 High | None | 2-3h | Low |
| Force Logout | `USER_FORCE_LOGOUT_ENABLED` | 🔴 High | None | 1-2h | Low |

**Total Estimated Effort:** 23-32 hours

---

## 🚦 Implementation Rules

### Must Follow
1. ✅ All features disabled by default
2. ✅ Zero impact when flags are `false`
3. ✅ Independent deployment (no cross-feature dependencies)
4. ✅ Fail-safe (errors don't break core flows)
5. ✅ Full audit logging for admin tools
6. ✅ Role-based access control

### Must NOT Do
1. ❌ Modify existing core flows
2. ❌ Refactor stable code
3. ❌ Remove feature flags
4. ❌ Add required dependencies
5. ❌ Block core workflows
6. ❌ Expose security risks

---

## 📄 Rollback Plans

### Quick Disable (All Features)
Set all Phase 5 flags to `false` in `apps/web/src/config/features.js`:

```javascript
GLOBAL_SEARCH_ENABLED: false,
TRENDING_CONTENT_ENABLED: false,
ADVANCED_ANALYTICS_ENABLED: false,
SLACK_INTEGRATION_ENABLED: false,
NOTION_INTEGRATION_ENABLED: false,
GOOGLE_DRIVE_INTEGRATION_ENABLED: false,
USER_IMPERSONATION_ENABLED: false,
USER_FORCE_LOGOUT_ENABLED: false,
```

### Per-Feature Rollback
Each feature's rollback plan is documented in its section above.

### Emergency Rollback
1. Set all Phase 5 flags to `false`
2. Deploy frontend
3. API endpoints return 501/403 when disabled
4. No data loss (all features are read-only or opt-in)

---

## 🧪 Validation Checklist

Before enabling any Phase 5 feature:

- [ ] Feature flag is `false` by default
- [ ] API endpoint returns 501/403 when disabled
- [ ] Frontend UI is hidden when disabled
- [ ] No core workflows depend on feature
- [ ] Feature can be disabled without data loss
- [ ] Error handling is graceful
- [ ] Audit logging is in place (for admin tools)
- [ ] Role-based access is enforced
- [ ] Performance impact is acceptable
- [ ] Documentation is updated

---

## 📝 Next Steps

1. **Review & Approve:** Review this plan with stakeholders
2. **Prioritize:** Choose which features to implement first
3. **Implement:** Build features incrementally
4. **Test:** Verify each feature independently
5. **Enable:** Set flags to `true` after testing
6. **Monitor:** Watch for issues after enabling

---

## 🎯 Recommended Implementation Order

1. **Global Search** (High value, low risk, no dependencies)
2. **Advanced Analytics** (Improves performance, no dependencies)
3. **Trending Content** (Low risk, uses existing data)
4. **Force Logout** (Simple, useful for support)
5. **Integrations** (Require external setup, lower priority)
6. **User Impersonation** (High risk, requires careful review)

---

**Phase 5 Status:** ✅ Planning Complete - Ready for Implementation

