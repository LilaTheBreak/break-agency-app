# Pre-Deployment Test Checklist
**Date:** 2025-01-02  
**Purpose:** Comprehensive feature testing before production deployment

## Automated Checks ✅

### Build Verification
- ✅ Frontend build passes (`npm run build`)
- ✅ Backend TypeScript compiles
- ✅ No critical linter errors
- ✅ All routes properly defined

### Code Quality
- ✅ Error handling in place
- ✅ Feature flags enforced
- ✅ Navigation verified
- ✅ API contracts standardized

## Manual Testing Required

### 🔐 Authentication & Authorization

#### Login Flow
- [ ] Login with Google OAuth works
- [ ] Session persists after page refresh
- [ ] Logout works correctly
- [ ] Redirects to correct dashboard after login

#### Role Enforcement
- [ ] Admin users see admin dashboard
- [ ] Non-admin users cannot access `/admin/*` routes
- [ ] Brand users see brand dashboard
- [ ] Creator users see creator dashboard
- [ ] Exclusive talent see exclusive dashboard

### 👤 Admin Dashboard

#### Navigation
- [ ] All sidebar menu items clickable
- [ ] All routes load without errors
- [ ] No console errors on navigation
- [ ] User name click goes to profile (not dropdown)

#### Overview Page (`/admin/dashboard`)
- [ ] Page loads without errors
- [ ] Activity feed displays (or shows empty state)
- [ ] Revenue metrics display (or show empty state)
- [ ] Opportunities card displays (or shows empty state)
- [ ] No console errors

#### Talent Management (`/admin/talent`)
- [ ] Talent list loads
- [ ] "Add New Talent" button works
- [ ] Talent detail page loads (`/admin/talent/:id`)
- [ ] All tabs in talent detail work (Overview, Opportunities, Deals, etc.)
- [ ] Link/unlink user functionality works
- [ ] No 500 errors

#### Brands (`/admin/brands`)
- [ ] Brand list loads
- [ ] Create/edit/delete brand works
- [ ] No console errors

#### Contacts (`/admin/contacts`)
- [ ] Page loads (should show "Coming Soon")
- [ ] No errors

#### Opportunities (`/admin/opportunities`)
- [ ] Opportunities list loads
- [ ] Create/edit opportunity works
- [ ] No console errors

#### Deals (`/admin/deals`)
- [ ] Deals list loads
- [ ] Create/edit/delete deal works
- [ ] No console errors

#### Campaigns (`/admin/campaigns`)
- [ ] Campaigns list loads
- [ ] Create/edit campaign works
- [ ] No console errors

#### Messaging (`/admin/messaging`)
- [ ] Inbox loads
- [ ] Gmail sync button works
- [ ] Sync shows accurate status (not misleading success)
- [ ] Messages display correctly
- [ ] No console errors

#### Calendar (`/admin/calendar`)
- [ ] Calendar loads
- [ ] Events display
- [ ] No MEETING_SUMMARIES errors

#### Events (`/admin/events`)
- [ ] Events list loads
- [ ] Create/edit/delete event works
- [ ] No console errors

#### Tasks (`/admin/tasks`)
- [ ] Tasks list loads
- [ ] Create/edit/complete task works
- [ ] Gmail task suggestions work (or show empty state)
- [ ] No console errors

#### Finance (`/admin/finance`)
- [ ] Finance dashboard loads
- [ ] Summary metrics display
- [ ] Payouts list loads
- [ ] Invoices list loads
- [ ] Xero integration shows 503 if disabled
- [ ] No console errors

#### Reports (`/admin/reports`)
- [ ] Page loads (should show "Coming Soon")
- [ ] No errors

#### Settings (`/admin/settings`)
- [ ] Settings page loads
- [ ] No console errors

### 🎨 Creator/Talent Dashboard

#### Creator Dashboard
- [ ] Dashboard loads
- [ ] Opportunities card displays
- [ ] Revenue section displays
- [ ] No admin links visible
- [ ] No console errors

#### Opportunities
- [ ] Opportunities list loads
- [ ] Apply to opportunity works
- [ ] Application status displays
- [ ] No console errors

#### Messaging
- [ ] Inbox loads
- [ ] Messages display
- [ ] No console errors

### 🏢 Brand Dashboard

#### Brand Dashboard
- [ ] Dashboard loads
- [ ] Opportunities management visible
- [ ] Contacts visible
- [ ] No admin links visible
- [ ] No console errors

#### Opportunities Management
- [ ] Create opportunity works
- [ ] View applications works
- [ ] No console errors

### 🔧 API Endpoints

#### Critical Endpoints
- [ ] `/api/campaigns/user/all` - Returns 200 (not 503)
- [ ] `/api/opportunities` - Returns 200 (not 500)
- [ ] `/api/admin/talent` - Returns 200 (not 500)
- [ ] `/api/crm-events` - Returns 200 (not 500)
- [ ] `/api/crm-contracts` - Returns 200 (not 500)
- [ ] `/api/activity` - Returns 200 (not 500)

#### Feature-Gated Endpoints
- [ ] `/api/briefs/*` - Returns 503 when `BRIEFS_ENABLED=false`
- [ ] `/api/admin/finance/xero/*` - Returns 503 when `XERO_INTEGRATION_ENABLED=false`
- [ ] `/api/auth/tiktok/*` - Returns 503 when `TIKTOK_INTEGRATION_ENABLED=false`
- [ ] `/api/auth/instagram/*` - Returns 503 when `INSTAGRAM_INTEGRATION_ENABLED=false`

### 🚨 Error Handling

#### Console Errors
- [ ] No repeated console errors
- [ ] No "Failed to fetch" errors on page load
- [ ] No "MEETING_SUMMARIES is not defined" errors
- [ ] No "filter is not a function" errors

#### User Experience
- [ ] Empty states show "No data" (not errors)
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful
- [ ] Success messages are accurate (not misleading)

### 🔒 Feature Flags

#### Gated Features
- [ ] Disabled features show "Coming Soon" or are hidden
- [ ] No clickable dead ends
- [ ] No partially rendered features
- [ ] Feature status is clear to users

## Test Results

### Pass Criteria
- ✅ All critical flows work
- ✅ No console errors
- ✅ No 500 errors on page load
- ✅ Feature flags respected
- ✅ Navigation works correctly

### Blockers
- [ ] List any blocking issues found during testing

### Notes
- [ ] Document any non-blocking issues
- [ ] Document any unexpected behavior

## Sign-Off

**Tester:** _________________  
**Date:** _________________  
**Status:** ⬜ PASS ⬜ FAIL ⬜ NEEDS REWORK

**Deployment Approved:** ⬜ YES ⬜ NO

