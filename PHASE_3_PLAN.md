# Phase 3: Data Layer Completion & System Hardening

**Date:** December 18, 2025  
**Status:** 🚀 STARTING  
**Previous Phases:**
- ✅ Phase 0: Feature gating system complete
- ✅ Phase 1: Discovery of missing campaign models
- ✅ Phase 2 Option A: Campaign models added to database

---

## 🎯 Phase 3 Objectives

**Primary Goal:** Remove all remaining mock/hardcoded data and wire features to real backend APIs

**Success Criteria:**
1. ✅ All mock data constants removed or clearly labeled as test fixtures
2. ✅ All features show real data from API or honest empty states
3. ✅ No misleading "fake" metrics or numbers visible to users
4. ✅ Auth flow fully functional (cookie persistence working)
5. ✅ Production environment configured and tested

---

## 📋 Phase 3 Tasks

### Track 1: Mock Data Removal (Highest Priority)

#### 🔴 Priority 1: High Visibility Fakes (Misleading Users)

**1.1 AI Automations (BrandDashboard)**
- **Location:** `apps/web/src/pages/BrandDashboard.jsx` lines ~45-77
- **Issue:** Displays extensive fake AI features that don't exist:
  - "Next steps" suggestions
  - "Risk alerts" 
  - "Recommendations"
  - "Contract summaries"
  - "Brief generation"
  - "Suggested pricing"
  - "Content scoring"
- **Action:** Remove entire `AI_AUTOMATIONS` section, replace with:
  ```jsx
  <EmptyDataState message="AI features coming soon">
    <p className="mt-2 text-xs">Advanced AI automations are under development</p>
  </EmptyDataState>
  ```
- **Estimated Time:** 30 minutes

**1.2 Creator Match Pool (BrandDashboard)**
- **Location:** `apps/web/src/pages/BrandDashboard.jsx` lines ~341-386
- **Issue:** Extensive fake creator profiles with:
  - Names, avatars, follower counts
  - Verticals, performance ratings
  - Revenue projections (30-day, 90-day)
  - Response rates, booking availability
- **Action:** Remove `CREATOR_MATCH_POOL`, replace with real Talent API query or empty state
- **API Check:** Does `/api/talent` or `/api/users?role=CREATOR` exist?
- **Estimated Time:** 2 hours

**1.3 Opportunity Pipelines**
- **Location:** 
  - CreatorDashboard: `CREATOR_OPPORTUNITY_PIPELINE` lines ~70-180
  - BrandDashboard: `OPPORTUNITY_PIPELINE` lines ~299-340
- **Issue:** Shows fake opportunities with brands, payouts, deliverables
- **Action:** 
  - Check if Opportunity model exists in schema (✓ it does - line 611-625)
  - Wire to `/api/opportunities` endpoint
  - If no API route exists, create it or show empty state
- **Estimated Time:** 3 hours

#### 🟡 Priority 2: Creator & Brand Data

**2.1 Creator Roster (BrandDashboard)**
- **Location:** `apps/web/src/pages/BrandDashboard.jsx` lines ~14-19
- **Issue:** Hardcoded list of creator names
- **Action:** Replace with query to Talent table
- **API:** Use `/api/talent` or create if missing
- **Estimated Time:** 1 hour

**2.2 Social Media Data (BrandDashboard)**
- **Location:** `BRAND_SOCIALS` lines ~293-298
- **Issue:** Fake social accounts with follower counts
- **Action:** 
  - Check if SocialAccountConnection model is populated
  - Wire to real social data or remove section
- **Estimated Time:** 2 hours

**2.3 Talent Sample Socials (ExclusiveTalentDashboard)**
- **Location:** Unknown lines
- **Issue:** Fake social media profiles
- **Action:** Find and remove, replace with SocialAccountConnection queries
- **Estimated Time:** 1 hour

#### 🟢 Priority 3: Supporting Data

**3.1 Campaign Reports (BrandDashboard)**
- **Location:** Lines ~20-25
- **Issue:** Mock campaign report data
- **Action:** Remove or wire to campaign analytics if implemented
- **Estimated Time:** 1 hour

**3.2 Contract Data (Multiple Dashboards)**
- **Location:** `SEED_CONTRACTS` in `apps/web/src/components/ContractsPanel.jsx` line 25
- **Issue:** Mock contract data
- **Action:** Check if Contract model exists, wire to API or gate feature
- **Note:** CONTRACT_SIGNING_ENABLED already set to false in Phase 0
- **Estimated Time:** 30 minutes (just clean up seed data)

**3.3 Submissions & Deliverables (CreatorDashboard)**
- **Location:** `SUBMISSION_PAYLOADS` lines ~141-225
- **Issue:** Fake content submissions
- **Action:** Constants already not imported - delete entirely from file
- **Estimated Time:** 15 minutes

**3.4 Unused Constants Cleanup**
- **Action:** Delete these fully removed constants:
  - `CREATOR_OPPORTUNITY_PIPELINE` (CreatorDashboard)
  - `SUBMISSION_PAYLOADS` (CreatorDashboard)
  - Any other constants not in imports
- **Estimated Time:** 30 minutes

#### 🔵 Priority 4: Configuration vs Mock Data

**4.1 Workflow Stage Configuration**
- **Location:** 
  - `OPPORTUNITY_STAGE_FLOW` (CreatorDashboard lines ~52-58)
  - `STAGE_ACTIONS` (CreatorDashboard lines ~60-67)
  - `SUBMISSION_TABS` (CreatorDashboard line ~139)
- **Action:** Determine if these are config or mock:
  - If config → Move to `apps/web/src/config/workflows.js`
  - If mock → Remove
- **Estimated Time:** 1 hour

---

### Track 2: Auth Flow Fix (Critical for Testing)

**Issue:** Cookie persistence broken, preventing login/testing

**Root Cause (from PROJECT_STATUS.md):**
- `break_session` cookie not stored after Google OAuth callback
- SameSite/Secure misconfiguration for dev vs prod
- Cookie never persists → `/api/auth/me` returns null → dashboards show blank

**2.1 Fix Cookie Configuration**
- **Location:** `apps/api/src/lib/auth.js` or cookie middleware
- **Action:**
  - Dev: `secure=false`, `sameSite="lax"`, no `domain`
  - Prod: `secure=true`, `sameSite="none"`, `domain=".tbctbctbc.online"`
- **Testing:** Verify cookie appears in Chrome DevTools after login
- **Estimated Time:** 2 hours

**2.2 Verify OAuth Callback Flow**
- **Action:**
  - Run OAuth flow locally
  - Capture network requests
  - Confirm `res.cookie("break_session", ...)` is called
  - Verify cookie attributes match environment
- **Estimated Time:** 1 hour

**2.3 Test Session Hydration**
- **Action:**
  - After login, call `/api/auth/me`
  - Verify returns `{ user: {...} }`
  - Confirm React AuthContext receives user
  - Test dashboard redirects work
- **Estimated Time:** 1 hour

**Total Auth Track:** 4 hours

---

### Track 3: API Endpoint Verification

**Verify these endpoints exist and work:**

| Endpoint | Exists? | Working? | Action |
|----------|---------|----------|--------|
| `/api/campaigns` | ✅ | ✅ | Tested in Phase 2 |
| `/api/crm-campaigns` | ✅ | ✅ | Tested in Phase 2 |
| `/api/opportunities` | ❓ | ❓ | Need to verify |
| `/api/talent` | ❓ | ❓ | Need to verify |
| `/api/users` | ✅ | ✅ | Likely exists |
| `/api/brands` | ✅ | ✅ | Used in AdminBrandsPage |
| `/api/deals` | ✅ | ✅ | Used in AdminDealsPage |
| `/api/contracts` | ❓ | ❓ | Need to verify |
| `/api/deliverables` | ❓ | ❓ | Need to verify |

**Action:** For each endpoint:
1. Check if route file exists in `apps/api/src/routes/`
2. Test with curl or Postman
3. If missing, create basic CRUD routes
4. If broken, fix Prisma queries
5. Document in API.md

**Estimated Time:** 6 hours (1 hour per missing/broken endpoint)

---

### Track 4: Production Environment Setup

**4.1 Environment Variables**
- **Prod API:** Set on Render/Railway
  ```
  GOOGLE_REDIRECT_URI=https://tbctbctbc.online/api/auth/google/callback
  FRONTEND_ORIGIN=https://tbctbctbc.online
  NODE_ENV=production
  DATABASE_URL=[Neon production URL]
  ```
- **Prod Web:** Set on Vercel
  ```
  VITE_API_URL=https://api.tbctbctbc.online
  ```
- **Estimated Time:** 1 hour

**4.2 CORS Configuration**
- **Location:** `apps/api/src/server.ts`
- **Action:** 
  - Verify CORS allows `https://tbctbctbc.online`
  - Set `credentials: true`
  - Test OPTIONS preflight
- **Estimated Time:** 30 minutes

**4.3 Cookie Domain Configuration**
- **Action:**
  - Set `domain=".tbctbctbc.online"` for production
  - Verify cookies work cross-subdomain (if API is on subdomain)
- **Estimated Time:** 1 hour

**4.4 End-to-End Production Test**
- **Action:**
  - Deploy to production
  - Test full OAuth flow
  - Verify dashboard loads
  - Test campaign creation
  - Confirm real data appears
- **Estimated Time:** 2 hours

**Total Production Track:** 4.5 hours

---

### Track 5: Data Migration & Seeding

**5.1 Production Data Seed**
- **Action:**
  - Run seed script on production database
  - Create test users (admin, brand, creator)
  - Create test campaigns, deals, brands
  - Verify data appears in dashboards
- **Estimated Time:** 1 hour

**5.2 localStorage Migration**
- **Issue:** Some users may have CRM data in localStorage
- **Action:**
  - AdminCampaignsPage checks for migration (already implemented)
  - Provide migration flow or clear instructions
- **Estimated Time:** 30 minutes (documentation)

---

## 📊 Time Estimates

| Track | Priority | Estimated Time |
|-------|----------|---------------|
| **Track 1: Mock Data Removal** | 🔴 | **13 hours** |
| - Priority 1 (High Visibility) | | 5.5 hours |
| - Priority 2 (Creator/Brand Data) | | 4 hours |
| - Priority 3 (Supporting Data) | | 2.25 hours |
| - Priority 4 (Config Cleanup) | | 1 hour |
| **Track 2: Auth Flow Fix** | 🔴 | **4 hours** |
| **Track 3: API Verification** | 🟡 | **6 hours** |
| **Track 4: Production Setup** | 🟡 | **4.5 hours** |
| **Track 5: Data Migration** | 🟢 | **1.5 hours** |
| **TOTAL** | | **29 hours** |

**Realistic Timeline:** 4-5 days (assuming 6-7 hours/day)

---

## 🔄 Implementation Order

### Week 1: Days 1-2 (Core Functionality)
1. ✅ Fix auth flow (Track 2) - **CRITICAL**
2. Remove Priority 1 mock data (Track 1.1-1.3)
3. Verify/create missing API endpoints (Track 3)

### Week 1: Days 3-4 (Data Cleanup)
4. Remove Priority 2 mock data (Track 1, items 2.1-2.3)
5. Clean up Priority 3 supporting data (Track 1, items 3.1-3.4)
6. Review and categorize Priority 4 configs (Track 1, item 4.1)

### Week 1: Day 5 (Production)
7. Set up production environment (Track 4)
8. Seed production data (Track 5)
9. Test end-to-end production flow
10. Document remaining work

---

## ✅ Definition of Done

**Phase 3 is complete when:**

1. ✅ Auth flow works: Users can log in and stay logged in
2. ✅ All Priority 1 mock data removed (no misleading fake features)
3. ✅ All Priority 2 creator/brand data is real or shows empty states
4. ✅ Campaign dashboards load real data from database
5. ✅ At least 80% of mock data constants removed
6. ✅ Production environment configured and tested
7. ✅ End-to-end user flow works in production:
   - User signs up with Google
   - User gets approved
   - User sees their dashboard
   - User can create campaigns/deals
   - Data persists and loads correctly

---

## 🚨 Blockers & Dependencies

### Current Blockers
1. **Auth cookie persistence** - Must fix before extensive testing
2. **Unknown API endpoints** - Need to verify what exists
3. **Production deployment access** - Need credentials for Vercel/Render

### Dependencies
- Phase 0 feature gates (✅ Complete)
- Phase 1 discovery (✅ Complete)
- Phase 2 campaign models (✅ Complete)
- Database access (✅ Available - Neon cloud)
- API server running (✅ Working)
- Frontend server running (✅ Working)

---

## 📝 Testing Strategy

### For Each Mock Data Removal:
1. **Before:** Screenshot showing mock data
2. **Remove:** Delete constant, update component
3. **After:** Screenshot showing empty state or real data
4. **Verify:** No console errors, no broken UI
5. **Document:** Note in commit message

### For API Endpoints:
1. **Verify route exists:** Check `apps/api/src/routes/`
2. **Test with curl:** `curl http://localhost:5001/api/[endpoint]`
3. **Verify Prisma query:** Check for schema model
4. **Test frontend:** Verify data loads in UI
5. **Document:** Add to API documentation

### For Auth Flow:
1. **Clear cookies:** Start fresh
2. **Run OAuth:** Click "Sign in with Google"
3. **Check DevTools:** Verify cookie appears
4. **Call /api/auth/me:** Verify user returns
5. **Test dashboard:** Verify redirect works
6. **Document:** Note cookie settings used

---

## 📁 Files to Modify

### High Priority (Track 1)
- `apps/web/src/pages/BrandDashboard.jsx` - Remove AI_AUTOMATIONS, CREATOR_MATCH_POOL, OPPORTUNITY_PIPELINE, BRAND_SOCIALS, CREATOR_ROSTER, CAMPAIGN_REPORTS
- `apps/web/src/pages/CreatorDashboard.jsx` - Remove CREATOR_OPPORTUNITY_PIPELINE, SUBMISSION_PAYLOADS, verify OPPORTUNITY_STAGE_FLOW
- `apps/web/src/pages/ExclusiveTalentDashboard.jsx` - Remove TALENT_SAMPLE_SOCIALS
- `apps/web/src/components/ContractsPanel.jsx` - Clean up SEED_CONTRACTS

### Auth Flow (Track 2)
- `apps/api/src/lib/auth.js` - Fix cookie configuration
- `apps/api/src/routes/auth.ts` - Verify callback flow
- `apps/api/src/middleware/auth.ts` - Verify cookie reading

### API Routes (Track 3)
- Create if missing:
  - `apps/api/src/routes/opportunities.ts`
  - `apps/api/src/routes/talent.ts`
  - `apps/api/src/routes/deliverables.ts`
- Verify existing:
  - `apps/api/src/routes/contracts.ts`
  - `apps/api/src/routes/users.ts`

### Configuration (Track 4)
- `apps/api/.env` - Production environment variables
- `apps/web/.env` - Production API URL
- `apps/api/src/server.ts` - CORS configuration
- Deployment configs (vercel.json, railway.json)

---

## 🎯 Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Mock data constants removed | 100% Priority 1 | 0% | 🔴 Not started |
| Feature gates working | 100% | 100% | ✅ Complete |
| Campaign models in DB | 3 models | 3 models | ✅ Complete |
| Campaign API functional | 100% | 100% | ✅ Complete |
| Auth flow working | Login + persist | Cookie broken | 🔴 Blocked |
| Production deployed | Working | Not deployed | 🔴 Not started |
| API endpoints verified | 80%+ | 60%~ | 🟡 Partial |
| Empty states honest | 100% | 90% | 🟡 Mostly done |

---

## 📚 Documentation to Create

1. **API.md** - Document all endpoints, parameters, responses
2. **MOCK_DATA_REMOVAL.md** - Track what was removed and why
3. **AUTH_FLOW.md** - Document cookie configuration and OAuth flow
4. **DEPLOYMENT.md** - Production deployment steps
5. **TESTING.md** - Manual testing checklist
6. **PHASE_3_COMPLETE.md** - Final status report (this template)

---

## 🔄 Next Steps After Phase 3

### Phase 4: Polish & Performance
- Add loading states to all API calls
- Implement error boundaries
- Add retry logic to failed requests
- Optimize bundle size
- Add analytics/monitoring

### Phase 5: User Onboarding
- Improve signup flow
- Add welcome tour
- Create help documentation
- Add tooltips for complex features

### Phase 6: Advanced Features
- Enable AI features once OpenAI integrated
- Enable social integrations once OAuth configured
- Enable file uploads once storage configured
- Enable contract signing once DocuSign integrated

---

**Status:** Ready to start Track 1 (Mock Data Removal)  
**Next Action:** Remove AI_AUTOMATIONS from BrandDashboard  
**Estimated Completion:** December 22-23, 2025
