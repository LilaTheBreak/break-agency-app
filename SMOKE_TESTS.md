# Smoke Tests - Manual Testing Checklist

**Purpose:** Verify critical user flows work end-to-end without regressions.

**When to Run:** 
- Before production deployments
- After major backend changes
- After dependency updates
- When troubleshooting production issues

**Target Runtime:** 5-10 minutes for full suite

---

## Test Environment Setup

### Prerequisites
✅ Backend server running on port 5001  
✅ Frontend dev server running on port 5173  
✅ Database seeded with test data  
✅ `.env` file with all required variables:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `DATABASE_URL`
- `SESSION_SECRET`
- `FRONTEND_ORIGIN`

### Test User Accounts
For each test, use one of these:
- **Admin User:** admin@breakagency.com
- **Brand User:** brand@example.com
- **Creator User:** creator@example.com

---

## Critical Path Tests

### 🔐 Test 1: Login Flow (Google OAuth)

**Goal:** Verify users can authenticate successfully

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click "Sign in with Google" button
3. Verify redirect to Google OAuth consent screen
4. Select test account (or sign in)
5. Grant permissions
6. Verify redirect back to app
7. Verify user lands on appropriate dashboard:
   - Admin → Admin Dashboard
   - Brand → Brand Dashboard  
   - Creator → Creator Dashboard

**Expected Results:**
- ✅ No console errors
- ✅ Cookie/session is set
- ✅ User menu shows correct name/email
- ✅ Dashboard loads without error boundaries

**Common Failures:**
- ❌ CORS error → Check `FRONTEND_ORIGIN` in `.env`
- ❌ Redirect loop → Check `GOOGLE_REDIRECT_URI` matches OAuth config
- ❌ "Invalid credentials" → Check `GOOGLE_CLIENT_SECRET`

---

### 📊 Test 2: Admin Dashboard Loads

**Goal:** Verify admin dashboard components render without crashes

**Steps:**
1. Log in as admin user
2. Navigate to `/admin` (or lands automatically)
3. Wait for all components to load (3-5 seconds)
4. Scroll through dashboard sections

**Expected Results:**
- ✅ No error boundaries triggered
- ✅ No console errors (warnings OK)
- ✅ Key sections visible:
  - User approval requests (if any)
  - Platform metrics
  - Recent activity
  - Quick actions menu
- ✅ Loading states appear and resolve
- ✅ All API calls complete (check Network tab)

**Common Failures:**
- ❌ Error boundary → Check API routes in server.ts
- ❌ Blank sections → Check database has seed data
- ❌ 403 errors → Check user role in database

---

### 📧 Test 3: Gmail Connect Flow

**Goal:** Verify Gmail OAuth integration initiates correctly

**Steps:**
1. Log in as any user type
2. Navigate to Inbox page (`/inbox`)
3. If Gmail not connected, click "Connect Gmail" button
4. Verify redirect to Gmail OAuth consent screen
5. Grant Gmail permissions (read/send/modify)
6. Verify redirect back to app
7. Check inbox loads threads

**Expected Results:**
- ✅ OAuth redirect includes correct scopes:
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/gmail.modify`
- ✅ After auth, tokens stored in database
- ✅ Inbox page shows loading state
- ✅ Threads appear (or "No threads" if empty)
- ✅ No console errors

**Common Failures:**
- ❌ "Invalid scope" → Check Gmail API enabled in Google Console
- ❌ 401 after connection → Check token refresh logic
- ❌ No threads appear → Run manual inbox sync via cron endpoint

---

### 🔔 Test 4: Feature Flags Respect Disabled Features

**Goal:** Verify incomplete features show "Coming soon" instead of errors

**Steps:**
1. Log in as any user
2. Navigate to Creator Dashboard
3. Look for sections that use incomplete features:
   - Top Performing Posts
   - Social Analytics
   - Deal Packages
4. Verify each shows disabled message (not error)

**Expected Results:**
- ✅ Disabled features show user-friendly message
- ✅ No API calls to disabled endpoints (check Network tab)
- ✅ No console errors
- ✅ Message format: "This feature will be available once [condition]"

**Common Failures:**
- ❌ Component crashes → Feature flag not checked
- ❌ 404/501 errors → API call made despite flag being false
- ❌ Blank section → Missing disabled message

---

### 💬 Test 5: Messaging System (Unified Mode)

**Goal:** Verify unified messaging mode works

**Steps:**
1. Log in as admin or brand user
2. Navigate to Messages page
3. Click "New Message" button
4. Select recipient from dropdown
5. Type message and send
6. Verify message appears in thread
7. Check recipient can see message (optional)

**Expected Results:**
- ✅ Modal opens correctly
- ✅ Recipient dropdown loads users
- ✅ Message sends without errors
- ✅ Thread updates with new message
- ✅ Toast notification confirms send

**Common Failures:**
- ❌ Two modal systems → Check Modal.jsx is used consistently
- ❌ Message doesn't appear → Check database write succeeded
- ❌ Recipient dropdown empty → Check user approval status

---

### 📝 Test 6: CRM Brand Creation

**Goal:** Verify CRM brand creation flow works

**Steps:**
1. Log in as admin user
2. Navigate to CRM → Brands
3. Click "Add Brand" button
4. Fill in brand details:
   - Name
   - Industry (optional)
   - Website (optional)
5. Click "Save"
6. Verify brand appears in list

**Expected Results:**
- ✅ Form validates required fields
- ✅ Brand saves to database
- ✅ List updates with new brand
- ✅ Toast confirms success
- ✅ No console errors

**Common Failures:**
- ❌ 403 error → User not approved or wrong role
- ❌ Brand not visible → Check filters/search
- ❌ Duplicate error → Brand name already exists

---

### 🎯 Test 7: Deal AI Extraction (Phase 4 Feature)

**Goal:** Verify Deal AI panel shows extraction results

**Steps:**
1. Log in as admin user
2. Navigate to Inbox
3. Select a thread with deal-related content
4. Look for "Deal Insights" panel on right side
5. Check extraction results (if any)

**Expected Results:**
- ✅ Panel renders without errors
- ✅ Shows "No deal details detected" if no deal content
- ✅ Shows extracted deal terms if present:
  - Brand name
  - Deliverables
  - Timeline
  - Budget
- ✅ "Create Deal" button enabled if extraction found

**Common Failures:**
- ❌ Panel doesn't appear → Check `AI_ENABLED` flag
- ❌ Always shows "No deal" → Check OpenAI API key
- ❌ Error boundary → Check API route exists

---

## Quick Regression Tests

### ⚡ Fast Checks (1 minute each)

**1. Health Endpoint**
```bash
curl http://localhost:5001/health
# Expected: {"status":"ok"}
```

**2. API Base Route**
```bash
curl http://localhost:5001/
# Expected: {"status":"ok","message":"Break Agency API is running"}
```

**3. Session Cookie Set**
1. Open DevTools → Application → Cookies
2. Check for `connect.sid` cookie after login
3. Verify it has HttpOnly and Secure flags (production only)

**4. Error Boundaries Don't Trigger**
1. Navigate through all main pages:
   - `/admin`
   - `/inbox`
   - `/crm/brands`
   - `/campaigns`
   - `/resources`
2. None should show error boundary fallback

**5. Console is Clean**
1. Open DevTools → Console
2. Navigate through app
3. Should see only:
   - ✅ Info/log messages (blue)
   - ⚠️ Warnings (yellow) - acceptable if not critical
   - ❌ NO red errors

---

## Test Results Template

Copy this template to document test runs:

```
# Smoke Test Results - [DATE]

**Environment:** Development / Staging / Production  
**Tester:** [Your Name]  
**Commit SHA:** [git commit hash]  
**Duration:** [X minutes]

## Results

- [ ] Test 1: Login Flow - ✅ PASS / ❌ FAIL
- [ ] Test 2: Admin Dashboard - ✅ PASS / ❌ FAIL
- [ ] Test 3: Gmail Connect - ✅ PASS / ❌ FAIL
- [ ] Test 4: Feature Flags - ✅ PASS / ❌ FAIL
- [ ] Test 5: Messaging System - ✅ PASS / ❌ FAIL
- [ ] Test 6: CRM Brand Creation - ✅ PASS / ❌ FAIL
- [ ] Test 7: Deal AI Extraction - ✅ PASS / ❌ FAIL

## Issues Found

[List any failures, with screenshots if helpful]

## Notes

[Any observations, warnings, or recommendations]
```

---

## Automated Tests (Future)

**When Test Suite Exists:**
```bash
# Run all smoke tests
pnpm test:smoke

# Run specific test
pnpm test:smoke -- --testNamePattern="Login Flow"
```

**Framework Recommendation:** Playwright or Cypress for E2E tests
- Playwright: Better for multi-browser testing
- Cypress: Better DX, easier to debug

---

## Troubleshooting

### Test Failures

**"CORS Error" on Login**
- Check `FRONTEND_ORIGIN` in API `.env`
- Should match exact frontend URL (including port)
- No trailing slash

**"Session Not Found" After Login**
- Check `SESSION_SECRET` is set
- Verify cookies are enabled in browser
- Check browser isn't blocking third-party cookies

**"Gmail API Not Enabled"**
- Go to Google Cloud Console
- Enable Gmail API for your project
- Wait 1-2 minutes for propagation

**"OpenAI API Error"**
- Check `OPENAI_API_KEY` in `.env`
- Verify API key has credits
- Check rate limits not exceeded

---

## Next Steps

**After Manual Testing:**
1. ✅ Document any new failure patterns
2. ✅ Update this checklist if new critical flows added
3. ✅ Consider automating most common tests (Playwright)
4. ✅ Set up CI/CD pipeline to run automated tests

**When Automated Tests Exist:**
1. Run before every production deploy
2. Run nightly on staging
3. Block PRs if smoke tests fail
4. Add new test for each new critical feature

