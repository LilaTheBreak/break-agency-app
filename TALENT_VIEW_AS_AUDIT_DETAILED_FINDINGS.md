# TALENT VIEW AS AUDIT - DETAILED FINDINGS CHECKLIST

**Audit Date:** January 9, 2026  
**Audit Type:** Complete Security & Implementation Review  
**Verdict:** 🔴 **CRITICAL ISSUES - DO NOT DEPLOY**

---

## 1️⃣ UI & UX AUDIT

### ✅ Is there a "View as Talent" button on talent profile pages?

**Status:** ⚠️ **PARTIALLY** (Component exists but disabled by broken dependencies)

**Findings:**
- ✅ Component exists: `apps/web/src/components/ViewAsTalentButton.jsx`
- ✅ Imported in: `apps/web/src/pages/AdminTalentDetailPage.jsx` (line 1139)
- ✅ Renders: `<ViewAsTalentButton talentId={talent.id} talentName={...} />`
- ⚠️ BUT: Will crash on render because `ImpersonationProvider` missing
- ⚠️ BUT: useImpersonation() hook will throw "must be used within ImpersonationProvider"

**Code:**
```jsx
export function ViewAsTalentButton({ talentId, talentName }) {
  const { startImpersonation, isLoading } = useImpersonation();  // ← Will crash
  // ...
  return <button>View as Talent</button>
}
```

---

### ✅ Is the button visible ONLY to SUPERADMIN?

**Status:** ✅ **YES - CORRECT**

**Findings:**
```javascript
const isSuperAdmin = user?.role === "SUPERADMIN";
if (!isSuperAdmin) {
  return null;  // ✅ Returns null, not hidden with CSS
}
```

✅ **Correct:** Returns `null` (truly removed, not just hidden)  
✅ **Secure:** Uses `===` exact match  
✅ **Safe:** No way for CSS to unhide it  

**File:** `apps/web/src/components/ViewAsTalentButton.jsx` (lines 19-22)

---

### ⚠️ When clicked, does UI clearly switch to talent-only view?

**Status:** 🔴 **NO** - Actually makes admin view, not talent view

**Findings:**
1. On click:
```javascript
const handleViewAsTalent = async () => {
  try {
    setError(null);
    await startImpersonation(talentId);  // Calls API
    navigate("/dashboard", { replace: true });  // Goes to ADMIN dashboard!
  }
};
```

❌ **Problem:** Redirects to `/dashboard` which is the ADMIN dashboard, not talent dashboard
- Should redirect to `/creator/dashboard` or similar (talent view)
- Currently just goes to regular admin dashboard
- Unclear if actually impersonating

2. No visual indicators:
- ❌ No "Currently viewing as: Jane Doe" label visible on page
- ❌ No color change, warning bar, or indicator
- ⚠️ Only the banner (which has issues - see below)

---

### ⚠️ Is there a persistent banner/header showing impersonation status?

**Status:** ⚠️ **PARTIALLY** (Component exists, styling issues, not shown on all pages)

**Findings:**

1. **Component exists:** ✅ `apps/web/src/components/ImpersonationBanner.jsx`
2. **Is integrated:** ✅ Added to `apps/web/src/App.jsx` (line 378)
3. **Shows talent name:** ✅ Displays `"You are viewing as [talentName]"`
4. **Shows email:** ✅ Displays `talentEmail`

**But:**

```jsx
<div className="fixed top-0 left-0 right-0 z-40 bg-brand-red text-white">
  {/* z-40 might be hidden by modals/drawers */}
  {/* bg-brand-red might not be distinctive enough */}
```

⚠️ **Issues:**
- `z-40` might be hidden by other UI elements (drawers, modals often use z-50+)
- `bg-brand-red` might not be as visible as documented "yellow/amber"
- Not guaranteed to appear on ALL pages (depends on route structure)
- Could be missed if admin doesn't scroll to top

---

### ✅ Is there a visible "Exit View As" control?

**Status:** ✅ **YES - CORRECT**

**Code:**
```jsx
<button
  onClick={handleExit}
  className="..."
>
  {isLoading ? "Exiting..." : "Exit View As"}
</button>
```

✅ **Good:** Button is visible  
✅ **Good:** Shows loading state  
✅ **Good:** Appears in banner (fixed position)

**But:**
- If banner is z-40 and hidden behind other elements, button is inaccessible
- Only available on pages that render the banner

---

### ❌ Does exit control appear on all pages?

**Status:** ❌ **ONLY ON PAGES THAT RENDER App.jsx**

**Investigation:**

1. Banner is in `App.jsx`:
```jsx
<OnboardingReminderBanner />
<ImpersonationBanner />  // ← Here
<AppRoutes />
```

2. So banner appears on any route inside `<App />`
3. **But:** If admin navigates away from app (external link), banner is gone
4. **But:** If component crashes, banner might not render

**Risk:** Admin might think they're no longer impersonating if banner disappears

---

## 2️⃣ AUTH / SESSION BEHAVIOUR AUDIT

### ❌ Does impersonation use session/JWT context?

**Status:** 🔴 **NO - UNSAFE PATTERN FOUND**

**Current Implementation (WRONG):**
```javascript
// Frontend stores impersonation in sessionStorage
sessionStorage.setItem("impersonationContext", JSON.stringify({
  actingAsUserId: talentUserId,
  originalAdminId: adminUserId,
  talentName: talentUser.name,
  startedAt: new Date().toISOString(),
}));
```

**Problems:**
1. **Client-side only:** Backend doesn't know about impersonation
2. **Can be forged:** Admin can manually edit sessionStorage:
   ```javascript
   sessionStorage.setItem("impersonationContext", {
     actingAsUserId: "someone-else",
     originalAdminId: "spoofed"
   });
   ```
3. **Not sent in API requests:** Impersonation context doesn't go to backend
4. **No server validation:** Backend can't verify admin is really impersonating

**File:** `apps/web/src/context/ImpersonationContext.jsx` (lines 26-48)

---

### ❌ Is the original admin identity preserved?

**Status:** ⚠️ **PARTIALLY PRESERVED, BUT NOT VALIDATED**

**What happens:**
1. Admin clicks button
2. Frontend stores `originalAdminId` in sessionStorage
3. Admin's actual JWT token is not changed
4. When exiting, frontend sends `originalAdminId` back to API

**Problems:**
- `originalAdminId` comes from frontend, not verified by server
- Admin's JWT token isn't modified (good), but impersonation state is client-side (bad)
- API has no way to know which JWT represents the original admin

**File:** `apps/api/src/routes/impersonate.ts` (line 120)

---

### ❌ Is the admin NOT logged out during impersonation?

**Status:** ✅ **CORRECT** - Admin session is preserved

**Good:**
- JWT token in httpOnly cookie is unchanged
- Admin's actual user ID and role are preserved
- logout() function not called

---

### 🔴 Permission checks - do they resolve impersonated user first?

**Status:** 🔴 **NO - PERMISSION CHECKS COMPLETELY IGNORE IMPERSONATION**

**How it currently works:**

1. Admin makes API call: `GET /api/talent-contracts`
2. Backend checks:
```typescript
router.get("/api/talent-contracts", requireAuth, (req, res) => {
  const userId = req.user.id;  // Still admin's ID!
  // NOT: const userId = req.impersonatedUserId || req.user.id;
  
  // Returns admin's data, not talent's data
});
```

3. **Result:** Admin can access ALL data, not just impersonated talent

**Example attack:**
```
1. Admin impersonates Talent A in UI
2. But manually calls API: GET /api/talent-contracts?userId=TALENT_B
3. Returns Talent B's contracts (not Talent A!)
```

---

### 🔴 Are admin-only routes blocked while impersonating?

**Status:** 🔴 **NO - ADMIN ROUTES NOT BLOCKED**

**Example:**
```
1. Admin impersonates Talent A
2. Admin is viewing as Talent A
3. Admin can still call: POST /api/admin/users/create
4. Creates new user from Talent view (should not be possible!)
```

**Root cause:** No middleware checks if impersonating. Routes just check `isAdmin(req.user)` which is true (admin is still admin).

---

## 3️⃣ BACKEND / API AUDIT

### ❌ Do the required endpoints exist?

**Status:** ⚠️ **PARTIALLY**

**Endpoints that should exist:**
- ✅ `POST /api/admin/impersonate/start` - EXISTS
- ✅ `POST /api/admin/impersonate/stop` - EXISTS
- ⚠️ `GET /api/admin/impersonate/status` - EXISTS but BROKEN (see issue below)

**File:** `apps/api/src/routes/impersonate.ts`

---

### 🔴 Are they properly registered?

**Status:** ⚠️ **REGISTERED BUT BROKEN AT RUNTIME**

**Registration in server.ts (line 705):**
```typescript
app.use("/api/admin/impersonate", impersonateRouter);
```

✅ **Good:** Routes are registered

**But routes will crash because:**

```typescript
// Line 3 of impersonate.ts
import { isSuperAdmin, isAdminOrSuperAdmin } from "../middleware/auth.js";
// ❌ These functions don't exist in auth.js
```

Result when API starts:
```
Error: Cannot find exported member 'isSuperAdmin' from '../middleware/auth.js'
```

---

### 🔴 Do they restrict access to SUPERADMIN only?

**Status:** 🔴 **BROKEN** - Auth checks don't work

**Current code (line 8-9):**
```typescript
router.use(isAdminOrSuperAdmin);  // ❌ Function doesn't exist
```

**What should be:**
```typescript
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { isSuperAdmin } from "../lib/roleHelpers.js";

router.use(requireAuth);  // First: require login
router.use(requireAdmin); // Second: require admin role
router.post("/start", (req, res, next) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: "SUPERADMIN only" });
  }
  next();
}, handler);
```

---

### ✅ Do they validate target user is TALENT?

**Status:** ✅ **YES**

**Code (lines 49-56):**
```typescript
if (
  talentUser.role === "ADMIN" ||
  talentUser.role === "SUPERADMIN" ||
  talentUser.role === "FOUNDER"
) {
  return res.status(403).json({
    error: "Cannot impersonate admin, superadmin, or founder users",
  });
}
```

✅ **Correct:** Blocks privilege escalation

---

### ❌ Is impersonation state cleared reliably on exit?

**Status:** ⚠️ **PARTIALLY**

**Frontend clears correctly:**
```javascript
sessionStorage.removeItem("impersonationContext");
setImpersonationContext(null);
setImpersonating(false);
```

**But:**
- Only clears in sessionStorage (client-side)
- Backend has NO server-side state to clear
- If client crashes, state persists until timeout

---

### ❌ Does request context expose original admin vs impersonated?

**Status:** 🔴 **NO - REQUEST CONTEXT DOESN'T HANDLE IMPERSONATION**

**Check requestContext middleware:**
```typescript
// apps/api/src/middleware/requestContext.ts
// No mention of impersonation context
// req.user = authenticated user (admin)
// req.impersonatedUserId = undefined (not set)
```

**What's missing:**
```typescript
// Should have:
req.impersonatedUserId = req.sessionStorage?.impersonationContext?.actingAsUserId;
req.originalAdminId = req.user.id;
// But sessionStorage isn't available on server!
```

---

## 4️⃣ DATA ACCESS & PERMISSIONS AUDIT

### ❌ Are admin-only features hidden while impersonating?

**Status:** 🔴 **NO - ADMIN FEATURES NOT HIDDEN**

**Example:**
- Admin impersonates Talent A
- Admin's sidebar still shows "Admin Dashboard", "Users", "Finance", etc.
- Admin can click these and access admin features
- UI doesn't change to "talent-only view"

**Missing:** Conditional rendering based on `impersonating` flag

```jsx
// Should have something like:
if (impersonating) {
  // Show talent-only UI
} else {
  // Show admin UI
}
```

---

### ❌ Does impersonated view match talent's exact view?

**Status:** 🔴 **NO - JUST PRETEND VIEW, NOT ACTUAL TALENT VIEW**

**Problem:**
- Admin can call endpoints as themselves (admin)
- Just UI pretends to be talent view
- Admin gets admin data, not talent data

**Example:**
```
Admin impersonates Talent A

UI shows: "Viewing as Talent A"
But internally:
  GET /api/contracts (called as ADMIN)
  → Returns ADMIN's contracts, not Talent A's
```

---

### ❌ Is other talent data NOT visible?

**Status:** 🔴 **NO - ALL TALENT DATA IS VISIBLE**

**How to exploit:**
```javascript
// While impersonating Talent A, admin can:
fetch("/api/talent-contracts?userId=TALENT_B")  // Gets Talent B's data
fetch("/api/brand-messages/BRAND_X")             // Gets any brand's messages
fetch("/api/payments/TALENT_C")                  // Gets Talent C's payments
```

**Root cause:** No per-request validation that URLs match impersonated user

---

### 🔴 Are admin shortcuts still accessible?

**Status:** 🔴 **YES - ADMIN CAN USE SHORTCUTS**

**Example exploits while impersonating:**
```
1. POST /api/admin/users/create (create new user)
2. POST /api/admin/contracts/force-sign (modify contracts)
3. GET /api/admin/finance/all-payments (view all payments)
4. DELETE /api/users/{id} (delete anyone)
```

**Why:** Backend doesn't check "are you impersonating" on admin routes

---

## 5️⃣ AUDIT LOGGING (CRITICAL)

### ✅ Are impersonation events logged?

**Status:** ⚠️ **PARTIALLY**

**What's logged:**
- ✅ IMPERSONATION_STARTED event
- ✅ IMPERSONATION_ENDED event

**What's NOT logged:**
- ❌ What admin ACCESSED while impersonating
- ❌ What admin MODIFIED while impersonating
- ❌ Which routes were called

**File:** `apps/api/src/routes/impersonate.ts` (lines 70-79, 138-147)

---

### ⚠️ Does log store required info?

**Status:** ⚠️ **PARTIALLY - Some info is spoofable**

**Correctly captured:**
- ✅ Admin ID (from `req.user.id`)
- ✅ IP address (from headers)
- ✅ Timestamp (from `new Date()`)

**Problems:**
- ⚠️ Talent ID comes from frontend (can be spoofed)
- ⚠️ Duration comes from frontend (can be fake)
- ⚠️ Impersonated talent name/email comes from DB (good)

**Spoofing example:**
```javascript
// Frontend sends fake info:
POST /admin/impersonate/stop {
  "originalAdminId": "hacker-123",
  "actingAsUserId": "victim-talent-456",
  "durationSeconds": 999999
}

// Backend logs it as real because it trusts req.body
```

---

### 🔴 Can audit logs be trusted?

**Status:** 🔴 **NO - LOGS ARE SPOOFABLE**

**See Issue #4 in Security Audit file for details**

---

## 6️⃣ EXIT & RECOVERY FLOW AUDIT

### ✅ Does exit restore admin access?

**Status:** ✅ **PARTIALLY CORRECT**

**What works:**
```javascript
sessionStorage.removeItem("impersonationContext");
setImpersonationContext(null);
setImpersonating(false);
```

✅ Frontend state is cleared  
✅ Admin's JWT is unchanged  
✅ Admin can use app again

**But:**
- ⚠️ Backend never knew about impersonation anyway
- ⚠️ No server-side state to restore

---

### ✅ Does exit clear impersonation state?

**Status:** ✅ **FRONTEND STATE IS CLEARED**

But backend has nothing to clear.

---

### ⚠️ Does refresh break the state?

**Status:** ⚠️ **COULD BE PROBLEMATIC**

**What happens on refresh:**
1. Frontend reloads
2. `ImpersonationContext` initializes with `null`
3. Look for impersonation in sessionStorage:
```javascript
const stored = sessionStorage.getItem("impersonationContext");
if (stored) {
  const context = JSON.parse(stored);
  setImpersonationContext(context);
  setImpersonating(true);
}
```

✅ **Good:** State persists across refresh  
⚠️ **Problem:** If impersonation state is corrupted, hard to recover

---

### ⚠️ Does back button cause auth issues?

**Status:** ⚠️ **PROBABLY OK BUT UNTESTED**

Browser back button should:
1. Navigate to previous URL
2. Re-render component with restored state
3. sessionStorage still has impersonation context

**Risk:** If sessionStorage is cleared or corrupted, admin might be stuck

---

## 7️⃣ FINAL VERDICT

### ✅ Fully Implemented
- [ ] Button visibility control (SUPERADMIN only)
- [ ] Cannot impersonate privileged roles
- [ ] IP tracking in logs
- [ ] Exit button appears in banner

### ⚠️ Partially Implemented
- [ ] Banner displays impersonation status
- [ ] Impersonation state preserved across refresh
- [ ] Audit logging exists
- [ ] Routes are registered

### ❌ Not Implemented / Broken
- [ ] Backend auth checks (broken imports)
- [ ] Auth middleware (missing)
- [ ] Frontend provider wrapper (missing)
- [ ] Server-side session (doesn't exist)
- [ ] Data access scoping (completely missing)
- [ ] Admin feature hiding (completely missing)
- [ ] Permission enforcement (non-existent)
- [ ] Reliable audit trail (spoofable)

---

## FINAL ASSESSMENT

| Dimension | Score | Status |
|-----------|-------|--------|
| **UI Component** | 6/10 | ⚠️ Works but has gaps |
| **Auth/Session** | 2/10 | 🔴 Fundamentally broken |
| **Backend API** | 1/10 | 🔴 Won't even compile |
| **Data Security** | 0/10 | 🔴 Completely unprotected |
| **Audit Trail** | 4/10 | ⚠️ Exists but spoofable |
| **Exit/Recovery** | 5/10 | ⚠️ Works but risky |
| **Overall** | 3/10 | 🔴 **DO NOT DEPLOY** |

---

**Audit Complete:** January 9, 2026
