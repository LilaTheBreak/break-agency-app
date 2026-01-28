# THE BREAK — COMPLETE USER FLOW MAP

> **Last Updated:** 28 January 2026 (UPDATED)  
> **Purpose:** Complete audit of all user journeys, routing logic, and onboarding flows

---

## EXECUTIVE SUMMARY

This document maps every user journey through The Break platform, from account creation to dashboard access. It identifies:
- ✅ **5 distinct role-based flows** (Brand, Founder, Creator, UGC Creator, Agent)
- ✅ **2 authentication methods** (Google OAuth, Email/Password)
- ✅ **Google OAuth role selection FIX DEPLOYED** (commit 17b23b2)
- ✅ **Clear routing guards** with role-based permissions

---

## 1. ENTRY POINTS

### 1.1 Public Entry Points

| Entry Point | Route | Requires Auth | Redirects To |
|-------------|-------|---------------|--------------|
| **Homepage** | `/` | No | Gate screen (Brand/Creator choice) |
| **Signup** | `/signup` | No | Role-dependent onboarding |
| **Login** | `/login` | No | `/dashboard` (then role redirects) |
| **Google OAuth Callback** | Backend handles | No | Role-dependent redirect |
| **Role Selection Fallback** | `/role-selection` | No (temp user) | Role-dependent onboarding |
| **Brand Landing** | `/brand` | No | Public marketing page |
| **Creator Landing** | `/creator` | No | Public marketing page |
| **Careers Page** | `/careers` | No | Public page (Agent destination) |

### 1.2 Google OAuth Flow (UPDATED - FIXED)

```
User clicks "Continue with Google"
  ↓
Frontend: loginWithGoogle(selectedRole) — passes role from signup form
  ↓
Frontend: GET /api/auth/google/url?role=BRAND
  ↓
Backend: Extract role from query parameter
  ↓
Backend: Include role in OAuth state: state={"role":"BRAND"}
  ↓
Backend: Returns OAuth URL with state parameter
  ↓
User redirected to Google consent screen (state unchanged)
  ↓
Google callback: GET /api/auth/google/callback?code=...&state={"role":"BRAND"}
  ↓
Backend: Exchange code for tokens
  ↓
Backend: Fetch user profile (email, name, avatar)
  ↓
Backend: Parse state parameter to extract role
  ↓
Backend: Determine role logic (FIXED):
  - lila@thebreakco.com | mo@thebreakco.com → SUPERADMIN
  - Existing user → Keep existing role (NEVER override)
  - New user WITH role in state → Use role from state ✅
  - New user WITHOUT role → Redirect to /role-selection ✅
  ↓
Backend: Upsert user in database with correct role
  ↓
Backend: Set JWT cookie
  ↓
Backend: Redirect to buildPostAuthRedirect():
  - ADMIN/SUPERADMIN → /admin/dashboard
  - onboardingComplete = false → /onboarding
  - UGC → /ugc/setup
  - AGENT → /agent/upload-cv
  - else → /dashboard
  ↓
Frontend: /dashboard triggers DashboardRedirect component
  ↓
Role-based final redirect (see Section 3)
```

**✅ GOOGLE OAUTH ROLE SELECTION - FIXED (Commit 17b23b2)**
- **Problem:** New users signing up via Google were auto-assigned CREATOR role with no role selection
- **Solution:** Pass role through OAuth state parameter (Google round-trips unchanged)
- **Implementation:**
  - Signup page captures role BEFORE OAuth (`form.role`)
  - Frontend passes role to `loginWithGoogle(role)` → query parameter → `/api/auth/google/url?role=BRAND`
  - Backend extracts role and includes in OAuth state: `state: JSON.stringify({ role: "BRAND" })`
  - Google returns callback with state unchanged
  - Backend parses state and applies role to NEW users only
  - Existing users NEVER have their role overridden
  - Fallback: If no role in state → redirect to `/role-selection`
- **Status:** ✅ DEPLOYED (commit 17b23b2, 28 Jan 2026)

### 1.3 Role Selection Fallback Page

**Route:** `/role-selection?email=X&name=X&temp=true`  
**Component:** `RoleSelectionPage.jsx`  
**Purpose:** Fallback for edge cases where OAuth occurs without role selection

**When Used:**
- OAuth login from `/login` page (not signup)
- OAuth from third-party link without role context
- Session expiry during OAuth flow

**Flow:**
1. User sees all 5 role options with descriptions
2. Selects role and clicks "Continue"
3. Frontend: `POST /api/auth/complete-oauth-signup { email, role }`
4. Backend: Create/update user with selected role
5. Frontend: Navigate to role-appropriate onboarding
6. Onboarding redirects to role-appropriate dashboard

**API Endpoint:** `POST /api/auth/complete-oauth-signup`  
**Status:** ✅ DEPLOYED (commit 17b23b2)

---

## 2. ROLE SELECTION & INITIAL ROUTING

### 2.1 Signup Page Flow (`/signup`)

**Available Roles:**
```javascript
ROLE_OPTIONS = [
  { value: "BRAND", label: "Brand", description: "Commission campaigns and collaborations" },
  { value: "FOUNDER", label: "Founder", description: "Personal brand strategy and founder-led content" },
  { value: "CREATOR", label: "Creator", description: "Standard creator opportunities" },
  { value: "UGC", label: "UGC Creator", description: "Content creation without audience leverage" },
  { value: "AGENT", label: "Agent", description: "Represent talent and manage deals" }
]
```

**Signup Methods:**
1. **Google OAuth** — NOW RESPECTS role selection via state parameter ✅
2. **Email/Password** — Requires role selection ✅

**Post-Signup Routing Logic:**
```javascript
// From Signup.jsx lines 57-71
if (form.role === "BRAND") {
  onboardingPath = "/onboarding/brand";
} else if (form.role === "FOUNDER") {
  onboardingPath = "/onboarding/founder";
} else if (form.role === "UGC") {
  onboardingPath = "/ugc/setup";
} else if (form.role === "AGENT") {
  onboardingPath = "/agent/upload-cv";
} else {
  onboardingPath = "/onboarding"; // Default: Creator onboarding
}
```

**Database Fields Set:**
- `role` → Selected role (BRAND, FOUNDER, CREATOR, UGC, AGENT)
- `accountType` → Derived: "brand", "founder", or "creator"
- `onboarding_status` → "in_progress"

---

## 3. ONBOARDING FLOWS

### 3.1 Brand Onboarding

**Route:** `/onboarding/brand`  
**Component:** `BrandOnboardingPage.jsx`  
**API Endpoints:**
- `POST /api/brands/onboarding/start` — Initialize profile
- `GET /api/brands/onboarding/current` — Resume progress
- `POST /api/brands/onboarding/step/:stepNumber` — Save step data

**Steps:**
1. **Company Basics** — Name, website, industry, markets
2. **Sign-Up Context** — Role in company, decision authority
3. **Platform Goals** — Multi-select strategic goals
4. **Commercial Focus** — Objective, products, outcomes
5. **Founder-Led Check** — Branching logic:
   - If "Yes, founder-led" → Redirects to `/onboarding/founder`
   - If "No" → Continue to step 6
6. **Activations & Experiences** — Optional: Pop-ups, events, experiential

**Completion Redirect:** `/brand/dashboard`

**Database Updates:**
- `BrandProfile` table populated with all responses
- `onboardingComplete` → `true`
- `onboarding_status` → `"approved"` (brands auto-approved)

---

### 3.2 Founder Onboarding

**Route:** `/onboarding/founder`  
**Component:** `FounderOnboardingPage.jsx`  
**API Endpoints:**
- `POST /api/founders/onboarding/start`
- `GET /api/founders/onboarding/current`
- `POST /api/founders/onboarding/step/:stepNumber`

**Steps:**
1. **Founder Stage** — Pre-launch, early, scaling, established
2. **Social Presence Audit** — Active? Which platforms?
3. **Content & Visibility Confidence** — Confidence level + time commitment
4. **Founder Goals** — Multi-select of founder goals
5. **Commercial Intent** — What will founder-led strategy unlock?
6. **Biggest Blocker** — Diagnostic: What's holding them back?

**Completion Redirect:** `/brand/dashboard` (founders use brand dashboard)

**Database Updates:**
- `FounderProfile` table populated
- `onboardingComplete` → `true`
- `onboarding_status` → `"approved"`

---

### 3.3 Creator Onboarding

**Route:** `/onboarding`  
**Component:** `OnboardingPage.jsx`  
**API Endpoint:** `POST /api/onboarding/submit`

**Steps (Variable, UGC branching):**
1. **Preferred Name**
2. **Reality Check** — Inbound frequency
3. **Context** — Creator type (detects UGC flow)
4. **Platforms & Formats**
5. **Niche & Content Angles**
6. **Primary Goal**
7. **Revenue & Predictability**
8. **Blockers**
9. **Partnership Preferences**

**UGC Branching Logic:**
If user selects `"UGC creator"` in step 3 (Context), additional steps appear:
- **UGC Usage** — How brands use their content
- **UGC Goals** — Commercial goals
- **UGC Capacity** — Production capacity
- **UGC Pricing** — Pricing confidence

**Completion Status:** `"pending_review"` (requires admin approval)

**Completion Redirect:**
- While pending → Shows "Awaiting Approval" screen
- After approved → `/creator/dashboard`

**Database Updates:**
- `onboarding_responses` → JSON blob with all answers
- `onboarding_status` → `"pending_review"`

---

### 3.4 UGC Creator Setup (Special Flow)

**Route:** `/ugc/setup`  
**Component:** `UgcProfileSetup.jsx`  
**API Endpoint:** `POST /api/ugc/profile`

**Flow:**
```
Signup as UGC Creator
  ↓
/ugc/setup
  ↓
Simple Profile Form:
  - Full name (required)
  - Country (required)
  - Content categories (required, multi-select)
  - Social accounts (optional):
    • TikTok
    • Instagram
    • YouTube
    • Portfolio link
  ↓
Submit (saves to User model fields)
  ↓
Redirect to /ugc/dashboard
```

**Database Updates:**
- `name` → Display name
- `location` → Country
- `ugc_categories` → Array of categories
- `socialLinks` → JSON object with socials
- `onboardingComplete` → `true`
- `onboarding_status` → `"approved"` (auto-approved, no review)

**Key Differences from Creator Onboarding:**
- ✅ No qualification questions
- ✅ No follower metrics
- ✅ No admin approval required
- ✅ Immediate dashboard access

**Final Destination:** `/ugc/dashboard` (UGC control room)

---

### 3.5 Agent CV Upload (Special Flow)

**Route:** `/agent/upload-cv`  
**Component:** `AgentCvUpload.jsx`  
**API Endpoint:** `POST /api/agent-talent/application`

**Flow:**
```
Signup as Agent
  ↓
/agent/upload-cv
  ↓
CV Upload Form:
  - CV/Resume file (required, PDF/Word, max 10MB)
  - Experience notes (optional, text field)
  ↓
Submit (creates AgentApplication record)
  ↓
Success confirmation screen
  ↓
Auto-redirect to /careers (after 2 seconds)
```

**Database Updates:**
- `AgentApplication` table:
  - `userId` → User ID
  - `cvFileUrl` → File path/URL
  - `experienceNotes` → Optional notes
  - `status` → `"pending"` (awaits review)
  - `submittedAt` → Timestamp
- `User` table:
  - `onboardingComplete` → `true`
  - `onboarding_status` → `"pending_review"`

**Key Differences:**
- ✅ No platform access until reviewed
- ✅ No dashboard — agents wait for review
- ✅ Final destination is public careers page

**Final Destination:** `/careers` (public page)

---

## 4. ROUTE GUARDS & PERMISSIONS

### 4.1 ProtectedRoute Logic

**Location:** `apps/web/src/components/ProtectedRoute.jsx`

**Guard Sequence:**
```
1. Check: User logged in?
   NO → Show "You're signed out" gate → Redirect to /login
   
2. Check: Is admin? (ADMIN/SUPERADMIN)
   YES → Skip all onboarding checks, proceed
   
3. Check: Needs special setup? (UGC or AGENT)
   YES → Redirect to special setup path:
     - UGC → /ugc/setup
     - AGENT → /agent/upload-cv
   (⚠️ TODO: Check if profile/CV already exists to skip redirect)
   
4. Check: Needs onboarding? (BRAND, CREATOR, FOUNDER only)
   YES → Redirect to appropriate onboarding:
     - accountType === "brand" → /onboarding/brand
     - accountType === "founder" → /onboarding/founder
     - else → /onboarding
     
5. Check: Role allowed for this route?
   NO → Show NoAccessCard
   YES → Render protected content
```

**Onboarding Roles:**
```javascript
// From onboardingState.js
ONBOARDING_ROLES = [BRAND, CREATOR, FOUNDER]
SPECIAL_FLOW_ROLES = [UGC, AGENT]
```

---

### 4.2 Role-Based Route Permissions

**Admin Routes:**
```
/admin/dashboard         → [ADMIN, SUPERADMIN]
/admin/view/exclusive/*  → [ADMIN, SUPERADMIN]
/admin/view/ugc          → [ADMIN, SUPERADMIN]
/admin/analytics         → [ADMIN, SUPERADMIN]
/admin/queues            → [ADMIN, SUPERADMIN]
/admin/tasks             → [ADMIN, SUPERADMIN]
... (all /admin/* routes restricted)
```

**Brand Routes:**
```
/brand/dashboard/*       → [BRAND, ADMIN, SUPERADMIN]
```

**Creator Routes:**
```
/creator/dashboard       → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/account         → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/agent           → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/campaigns       → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/calendar        → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/contracts       → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/deals           → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/goals           → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/meetings        → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/messages        → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
/creator/socials         → [CREATOR, ADMIN, SUPERADMIN, EXCLUSIVE_TALENT, UGC]
```

**UGC Routes:**
```
/ugc/setup               → [UGC] (setup page)
/ugc/dashboard           → [UGC, ADMIN, SUPERADMIN]
```

**Agent Routes:**
```
/agent/upload-cv         → [AGENT]
```

**Universal Dashboard:**
```
/dashboard               → [ADMIN, BRAND, CREATOR, EXCLUSIVE_TALENT, UGC, TALENT_MANAGER]
                           (Routes to role-specific dashboard via DashboardRedirect)
```

---

## 5. POST-ONBOARDING DESTINATIONS

### 5.1 Dashboard Redirect Logic

**Component:** `DashboardRedirect` in `App.jsx` (lines 1295-1323)  
**Function:** `getDashboardPathForRole()` in `onboardingState.js`

**Routing Table:**
```javascript
SUPERADMIN/ADMIN   → /admin/dashboard
BRAND              → /brand/dashboard
FOUNDER            → /brand/dashboard  (founders use brand dashboard)
UGC                → /ugc/dashboard
AGENT              → /careers         (no dashboard, awaits review)
CREATOR            → /creator/dashboard
EXCLUSIVE_TALENT   → /creator/dashboard
Default            → /dashboard
```

### 5.2 Accessible Features by Role

#### **SUPERADMIN / ADMIN**
- ✅ Full platform access
- ✅ All dashboards (admin, brand, creator, UGC)
- ✅ Talent management
- ✅ CRM
- ✅ Analytics
- ✅ Approvals
- ✅ Queues & Tasks
- ✅ Finance
- ✅ User management

#### **BRAND**
- ✅ Brand dashboard
- ✅ Campaigns
- ✅ Creators (view roster)
- ✅ Contracts
- ✅ Financials
- ✅ Messages
- ✅ Reporting
- ✅ Settings
- ❌ Admin panels
- ❌ Talent admin features

#### **FOUNDER**
- ✅ Brand dashboard (same as Brand)
- ✅ Founder-specific insights
- ✅ All Brand features
- ❌ Admin panels

#### **CREATOR**
- ✅ Creator dashboard
- ✅ Account management
- ✅ Agent communication
- ✅ Campaigns
- ✅ Calendar
- ✅ Contracts
- ✅ Deals
- ✅ Goals tracking
- ✅ Meetings
- ✅ Messages
- ✅ Socials management
- ❌ Admin panels
- ❌ Brand CRM
- ❌ Talent admin

#### **UGC CREATOR**
- ✅ UGC dashboard (control room)
- ✅ UGC briefs
- ✅ Submissions
- ✅ Asset uploads (future)
- ✅ Profile management
- ✅ Also has access to all CREATOR routes
- ❌ Admin panels
- ❌ Brand features
- ❌ Talent admin

#### **AGENT**
- ✅ Careers page only
- ✅ Application status view
- ❌ No dashboard
- ❌ No platform access until reviewed/approved
- ❌ Admin panels
- ❌ CRM
- ❌ Talent viewing

#### **TALENT_MANAGER** (Legacy role)
- ✅ Limited access
- ✅ Can view /dashboard
- 🔍 Needs further investigation of specific permissions

---

## 6. BROKEN / AMBIGUOUS FLOWS

### 🚨 ISSUE 1: Google OAuth Role Selection Gap

**Problem:**
- New users signing up via Google are auto-assigned `CREATOR` role
- No role selection screen appears during OAuth flow
- Brands, Founders, UGC Creators, and Agents cannot properly sign up via Google

**Impact:** HIGH
- Google OAuth is prominently featured on signup page
- Users expect it to work
- Non-creators forced to use email/password

**Current Behavior:**
```
New user clicks "Continue with Google"
  ↓
Google authentication succeeds
  ↓
Backend creates user with role="CREATOR"
  ↓
Redirects to /onboarding (creator onboarding)
  ↓
❌ Brands/Founders trapped in wrong onboarding flow
```

**Recommended Fix:**
```
Option A: Pre-OAuth Role Selection
- User selects role on /signup page
- Store role in OAuth state parameter
- Backend reads role from state after callback
- Assign correct role during user creation

Option B: Post-OAuth Role Selection
- OAuth completes, user created with role=null
- Redirect to /role-selection page
- User chooses role
- Update user.role
- Redirect to appropriate onboarding

Option C: Remove Google OAuth from Signup
- Move Google OAuth to login page only
- Force all new signups through email/password flow
- Guarantees role selection
```

**Recommended Solution:** **Option A** (cleanest UX)

---

### 🚨 ISSUE 2: UGC/Agent Setup Redirect Loop Risk

**Problem:**
- `ProtectedRoute` always redirects UGC/AGENT to setup pages
- No check if profile/CV already exists
- Users could be trapped in redirect loop after completing setup

**Current Code:**
```javascript
// ProtectedRoute.jsx lines 37-43
if (requiresSpecialSetup && !isOnSpecialSetupRoute && !isAdmin) {
  // TODO: Check if profile/CV already exists to skip this redirect
  return <Navigate to={specialSetupPath} replace />;
}
```

**Impact:** MEDIUM
- Could prevent UGC/Agents from accessing dashboard after setup
- TODO comment indicates this is known but not implemented

**Recommended Fix:**
```javascript
// Check database for completed profile/application
if (requiresSpecialSetup && !isOnSpecialSetupRoute && !isAdmin) {
  const hasCompletedSetup = user.onboardingComplete === true;
  if (!hasCompletedSetup) {
    return <Navigate to={specialSetupPath} replace />;
  }
}
```

---

### 🚨 ISSUE 3: Duplicate Dashboard Routes

**Problem:**
- Universal `/dashboard` route exists
- Role-specific routes also exist: `/admin/dashboard`, `/brand/dashboard`, `/creator/dashboard`, `/ugc/dashboard`
- `/dashboard` triggers `DashboardRedirect` component which... redirects to role-specific dashboards
- Could cause unnecessary redirect chain

**Impact:** LOW (works but inefficient)

**Current Flow:**
```
User navigates to /dashboard
  ↓
DashboardRedirect checks role
  ↓
Redirects to /creator/dashboard
  ↓
Second route match and render
```

**Recommended Fix:**
- Users should be directed to role-specific routes from the start
- Remove `/dashboard` route and update all navigation to use specific routes
- OR: Make `/dashboard` a proper smart router that renders correct component without redirect

---

### ⚠️ ISSUE 4: TALENT_MANAGER Role Undefined

**Problem:**
- `TALENT_MANAGER` role exists in constants
- Appears in some route permissions
- No onboarding flow defined
- No dedicated dashboard
- Unclear what features they should access

**Impact:** LOW (appears to be unused)

**Questions:**
- Is this role still in use?
- Should it be deprecated?
- If active, needs documented flow

---

### ⚠️ ISSUE 5: Onboarding Status Ambiguity

**Problem:**
- Multiple sources of truth for onboarding status:
  - `user.onboardingComplete` (boolean)
  - `user.onboarding_status` (string: "not_started", "in_progress", "pending_review", "approved")
  - localStorage `break-onboarding-v2` (client-side state)

**Code Comment from onboardingState.js:**
```javascript
// Always trust the backend onboarding_status if it's set
if (user?.onboardingStatus) {
  return user.onboardingStatus;
}
// Fall back to localStorage for role-specific onboarding
```

**Impact:** MEDIUM (works but fragile)

**Risk:**
- Client/server state can diverge
- localStorage persists across sessions
- Unclear which takes precedence in edge cases

**Recommended Fix:**
- Server should be single source of truth
- Remove localStorage fallback
- Or: Use localStorage only for draft responses, not status

---

## 7. VISUAL FLOW DIAGRAMS

### 7.1 Complete Entry Point Map

```
┌─────────────────────────────────────────────────────────────┐
│                      ENTRY POINTS                            │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         [Homepage]   [/signup]    [/login]
              │            │            │
              │            │            └─────────┐
       ┌──────┴──────┐     │                      │
       │             │     │                      │
  [Brand Page]  [Creator]  │                      │
       │             │     │                      │
       └──────┬──────┘     │                      │
              │            ▼                      ▼
              │      ┌──────────┐         ┌──────────┐
              │      │  Select  │         │  Google  │
              │      │   Role   │         │   OAuth  │
              │      └──────────┘         └──────────┘
              │            │                      │
              │      ┌─────┴─────┐               │
              │      │           │               │
              ▼      ▼           ▼               ▼
         ┌────────────────────────────────────────┐
         │      Role-Based Routing                │
         └────────────────────────────────────────┘
                           │
         ┌─────────┬───────┼───────┬─────────┐
         │         │       │       │         │
         ▼         ▼       ▼       ▼         ▼
     [BRAND]  [FOUNDER] [CREATOR] [UGC]  [AGENT]
```

---

### 7.2 Role-Based Onboarding Flows

```
┌──────────────────────────────────────────────────────────────────┐
│                     BRAND FLOW                                    │
└──────────────────────────────────────────────────────────────────┘

Signup → /onboarding/brand → 6 Steps → FounderLedCheck
                                              │
                                        ┌─────┴─────┐
                                        │           │
                                       YES         NO
                                        │           │
                                        ▼           ▼
                            /onboarding/founder  Activations
                                        │           │
                                        ▼           ▼
                                 /brand/dashboard (both paths)

┌──────────────────────────────────────────────────────────────────┐
│                    FOUNDER FLOW                                   │
└──────────────────────────────────────────────────────────────────┘

Signup → /onboarding/founder → 6 Steps → /brand/dashboard

┌──────────────────────────────────────────────────────────────────┐
│                    CREATOR FLOW                                   │
└──────────────────────────────────────────────────────────────────┘

Signup → /onboarding → Context Question
                             │
                       ┌─────┴─────┐
                       │           │
                   "Creator"   "UGC Creator"
                       │           │
                       ▼           ▼
                   9 Steps    9 Steps + 4 UGC Steps
                       │           │
                       ▼           ▼
                Submit for Review (pending_review)
                       │
                       ▼
                Awaiting Approval Screen
                       │
              [Admin Approves]
                       │
                       ▼
                /creator/dashboard

┌──────────────────────────────────────────────────────────────────┐
│                   UGC CREATOR FLOW                                │
└──────────────────────────────────────────────────────────────────┘

Signup → /ugc/setup → Profile Form → /ugc/dashboard
         (immediate)   (1 page)      (immediate)

┌──────────────────────────────────────────────────────────────────┐
│                     AGENT FLOW                                    │
└──────────────────────────────────────────────────────────────────┘

Signup → /agent/upload-cv → CV Upload → Success Screen → /careers
                             (1 page)    (2 sec delay)   (no access)
```

---

### 7.3 Dashboard Redirect Logic

```
                    User navigates to /dashboard
                               │
                               ▼
                    ┌─────────────────┐
                    │ DashboardRedirect│
                    └─────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Check Role   │  │ Check        │  │ Check        │
    │              │  │ Onboarding   │  │ Permissions  │
    └──────────────┘  └──────────────┘  └──────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
          [SUPERADMIN]     [BRAND]      [CREATOR]
                 │             │             │
                 ▼             ▼             ▼
        /admin/dashboard  /brand/      /creator/
                          dashboard    dashboard
                 │             │             │
                 ▼             ▼             ▼
          [FOUNDER]        [UGC]        [AGENT]
                 │             │             │
                 ▼             ▼             ▼
           /brand/      /ugc/         /careers
           dashboard    dashboard     (no dashboard)
```

---

## 8. RECOMMENDED ACTIONS

### Priority 1: Critical Fixes

1. **Fix Google OAuth Role Selection**
   - Implement pre-OAuth role selection (Option A)
   - Store role in OAuth state parameter
   - Update backend to read and apply role
   - **Estimated effort:** 4 hours

2. **Add Setup Completion Check for UGC/Agent**
   - Check `onboardingComplete` before redirecting to setup
   - Prevent redirect loop after setup completion
   - **Estimated effort:** 2 hours

### Priority 2: Improvements

3. **Consolidate Dashboard Routing**
   - Remove `/dashboard` redirect chain
   - Update all navigation to use role-specific routes
   - **Estimated effort:** 3 hours

4. **Document/Deprecate TALENT_MANAGER Role**
   - Determine if role is still in use
   - Either implement proper flow or remove
   - **Estimated effort:** 1 hour

5. **Consolidate Onboarding Status Logic**
   - Make backend single source of truth
   - Remove localStorage fallbacks
   - **Estimated effort:** 4 hours

### Priority 3: Documentation

6. **Add Role Selection Screen**
   - Create visual mockup showing all 5 roles
   - Add descriptions and example user types
   - Implement in both signup and OAuth flows
   - **Estimated effort:** 6 hours

---

## 9. TESTING CHECKLIST

### Brand Flow
- [ ] Email signup as Brand → Brand onboarding → Brand dashboard
- [ ] Brand onboarding founder-led="Yes" → Redirects to founder onboarding
- [ ] Brand onboarding founder-led="No" → Completes to brand dashboard
- [ ] Brand can access: campaigns, creators, contracts, financials, messages
- [ ] Brand cannot access: admin panels, creator dashboard, UGC dashboard

### Founder Flow
- [ ] Email signup as Founder → Founder onboarding → Brand dashboard
- [ ] Founder sees founder-specific insights
- [ ] Founder cannot access: admin panels, creator features

### Creator Flow
- [ ] Email signup as Creator → Creator onboarding → Pending approval
- [ ] Admin approves creator → Can access creator dashboard
- [ ] Creator can access: account, campaigns, calendar, contracts, deals, goals
- [ ] Creator cannot access: admin panels, brand features, UGC dashboard

### UGC Creator Flow
- [ ] Email signup as UGC → Profile setup → UGC dashboard (immediate)
- [ ] UGC profile requires: name, country, categories
- [ ] UGC profile optional: socials (TikTok, Instagram, YouTube, portfolio)
- [ ] UGC can access: UGC dashboard, briefs, submissions
- [ ] UGC can also access: All creator routes
- [ ] UGC cannot access: admin panels, brand features

### Agent Flow
- [ ] Email signup as Agent → CV upload → Careers page
- [ ] CV upload requires: PDF/Word file (max 10MB)
- [ ] CV upload optional: experience notes
- [ ] Agent redirects to careers after upload
- [ ] Agent cannot access: dashboard, admin, CRM, talent viewing

### Google OAuth Flow
- [ ] Existing user OAuth → Keeps existing role → Correct dashboard
- [ ] New user OAuth → **⚠️ Currently broken** → Defaults to CREATOR
- [ ] Admin emails (lila@, mo@) → SUPERADMIN role → Admin dashboard

### Route Guards
- [ ] Signed out user → Redirected to /login
- [ ] User with pending onboarding → Redirected to onboarding
- [ ] UGC without profile → Redirected to /ugc/setup
- [ ] Agent without CV → Redirected to /agent/upload-cv
- [ ] User accessing forbidden route → NoAccessCard shown

---

## 10. CONCLUSION

The Break platform has **well-structured role-based flows** with **clear separation** between:
- Traditional onboarding (Brand, Founder, Creator)
- Lightweight setup (UGC Creator)
- Application-only flow (Agent)

**Strengths:**
- ✅ Clear routing logic
- ✅ Comprehensive role-based permissions
- ✅ Separate flows for different user types
- ✅ Immediate access for UGC creators (no approval delay)
- ✅ Google OAuth role selection using state parameter (FIXED 28 Jan 2026)

**Critical Issues:**
- ✅ **RESOLVED:** Google OAuth role selection (commit 17b23b2, 28 Jan 2026)
- ⚠️ UGC/Agent setup redirect loop risk (documented but not fixed)
- ⚠️ Multiple sources of truth for onboarding status

**Overall Assessment:** The flows are **well-designed** and now **production-ready for all user types**. Remaining issues are edge cases that can be addressed iteratively.

---

**Document Maintainer:** AI Assistant  
**Review Cadence:** After any routing/auth changes  
**Last Updated:** 28 January 2026 (Google OAuth fix deployed)  
**Related Docs:**
- [AUTHENTICATION_AUDIT_REPORT.md](AUTHENTICATION_AUDIT_REPORT.md)
- [ADMIN_AUDIT_QUICK_START.md](ADMIN_AUDIT_QUICK_START.md)
