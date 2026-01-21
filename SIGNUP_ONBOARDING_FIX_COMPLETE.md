# Signup → Onboarding Routing Fix - COMPLETE ✅

## Problem
When users signed up as BRAND or AGENT role, they were redirected to `/admin/dashboard` instead of going through the onboarding flow.

## Root Cause
The `ONBOARDING_ROLES` set in `apps/web/src/lib/onboardingState.js` only included:
- `CREATOR`
- `FOUNDER`
- `UGC`

But users could sign up as:
- `BRAND` ❌ Not in ONBOARDING_ROLES
- `FOUNDER` ✅
- `CREATOR` ✅
- `UGC` ✅
- `AGENT` ❌ Not in ONBOARDING_ROLES

This caused `shouldRouteToOnboarding(user)` to return `false` for BRAND and AGENT users, allowing the DashboardRedirect component to route them directly to their role-based dashboard instead of onboarding.

## Solution
Updated `ONBOARDING_ROLES` to include all signup roles:

```javascript
// Before
const ONBOARDING_ROLES = new Set([Roles.CREATOR, Roles.FOUNDER, Roles.UGC]);

// After
const ONBOARDING_ROLES = new Set([Roles.BRAND, Roles.CREATOR, Roles.FOUNDER, Roles.UGC, Roles.AGENT]);
```

**Commit**: `3630f14` - "Fix: Add BRAND and AGENT to onboarding roles"

## How the Flow Now Works

1. **User Signs Up as BRAND**
   - Form submits: `email`, `password`, `role: "BRAND"`
   - Backend creates user with:
     - `role: "BRAND"`
     - `onboarding_status: "in_progress"`
   - Frontend stores token and calls `refreshUser()`
   - Frontend navigates to `/onboarding?role=BRAND`

2. **App Routes Through ProtectedRoute**
   - `shouldRouteToOnboarding(user)` checks:
     - Is role in ONBOARDING_ROLES? ✅ YES (BRAND now included)
     - Is status "not_started" or "in_progress"? ✅ YES
     - Returns `true`
   - User is routed to onboarding page

3. **DashboardRedirect Component**
   - First check: `if (shouldRouteToOnboarding(session))` → redirect to `/onboarding` ✅
   - Never reaches the role-based dashboard redirect

## Files Changed
- `apps/web/src/lib/onboardingState.js`: Updated ONBOARDING_ROLES set

## Deployment Status
- ✅ Committed to `main` branch
- ✅ Pushed to origin
- ✅ Vercel auto-deployment triggered for frontend

## Testing Checklist
- [ ] Sign up as BRAND user → Should go to onboarding, NOT admin dashboard
- [ ] Sign up as AGENT user → Should go to onboarding, NOT admin dashboard
- [ ] Sign up as CREATOR user → Should go to onboarding (already working)
- [ ] Sign up as FOUNDER user → Should go to onboarding (already working)
- [ ] Sign up as UGC user → Should go to onboarding (already working)

## Related Fixes (Previously Completed)
1. **Brand Fetching** - Fixed `/api/crm-brands` → `/api/brands` with auth headers
2. **Permission Errors** - Suppressed analytics endpoint 403 errors
3. **Onboarding Status** - Set new signups to `onboarding_status: "in_progress"` instead of "pending_review"

---

**Status**: READY FOR TESTING ✅
