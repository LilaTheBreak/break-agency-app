# 🔐 AUTH SESSION PERSISTENCE FIX

## Problem Summary

**Symptom:** Google OAuth redirects successfully, but `/api/auth/me` returns 401

**Root Cause:** Cookie domain mismatch in cross-domain OAuth flow
- OAuth callback sets cookie from: `breakagencyapi-production.up.railway.app`
- Redirects to: `www.tbctbctbc.online`
- Cookie domain set to: `.tbctbctbc.online`
- Browser correctly rejects cookie (different domain!)
- Frontend fallback with Bearer token should work but may have issues

---

## ✅ Solution: Configure Railway Environment Variables

### Required Changes in Railway Dashboard

Remove or clear `COOKIE_DOMAIN` environment variable:

**Path:** Railway Dashboard → Project → Service → Variables

| Variable | Current | New | Reason |
|----------|---------|-----|--------|
| `COOKIE_DOMAIN` | `.tbctbctbc.online` | `` (empty/delete) | Avoid cross-domain rejection |
| `USE_HTTPS` | `true` | `true` | Keep this ✅ |
| `NODE_ENV` | `production` | `production` | Keep this ✅ |

### Why This Works

1. **Remove domain restriction** → Cookie won't apply cross-domain anyway
2. **Rely on Bearer token** → Frontend extracts token from OAuth redirect URL
3. **Backend auth middleware** → Accepts either cookie OR Bearer token
4. **Secure fallback** → Bearer token stored in localStorage, sent in Authorization header

### Auth Flow After Fix

```
1. User: Google login on www.tbctbctbc.online
2. Frontend → GET /api/auth/google/url
3. Backend → Returns Google OAuth URL
4. User: Authorizes on Google
5. Google → POST to breakagencyapi-production.up.railway.app/api/auth/google/callback
6. Backend: 
   ✅ Creates user
   ✅ Creates JWT token
   ✅ Sets cookie (without domain restriction)
   ✅ Redirects to: www.tbctbctbc.online/?token=JWT
7. Frontend: 
   ✅ Extracts token from URL
   ✅ Stores in localStorage
   ✅ Cleans URL via replaceState
   ✅ Calls /api/auth/me with: Authorization: Bearer JWT
8. Backend:
   ✅ Checks cookies (none)
   ✅ Checks Authorization header (found!)
   ✅ Verifies JWT
   ✅ Returns 200 with user data
9. User: Logged in ✅
```

---

## 🔧 Implementation

### Step 1: Update Railway Environment

1. Go to: https://railway.app/dashboard
2. Select Project: **The Break Agency APP**
3. Select Service: **@breakagency/api**
4. Go to: **Variables** tab
5. Find `COOKIE_DOMAIN`
6. **Delete it** (or set to empty string)
7. Click **Save/Deploy**

### Step 2: Verify Backend Code (Already Correct)

The backend code in `apps/api/src/lib/jwt.ts` already handles empty COOKIE_DOMAIN:

```typescript
// From jwt.ts line 66-67
const domain = process.env.COOKIE_DOMAIN || undefined;

return {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: COOKIE_MAX_AGE,
  path: "/",
  domain  // Will be undefined if COOKIE_DOMAIN not set
};
```

When `domain` is `undefined`, Express doesn't restrict cookie by domain ✅

### Step 3: Verify Frontend Code (Already Correct)

The frontend in `apps/web/src/context/AuthContext.jsx` already extracts token:

```javascript
// Lines 75-85
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    localStorage.setItem('auth_token', tokenFromUrl);
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, newUrl);
  }
  
  refreshUser();
}, [refreshUser]);
```

And `apiFetch` sends it:

```javascript
// Lines 55-65
const token = localStorage.getItem('auth_token');
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

Both already correct ✅

### Step 4: Redeploy

Railway will automatically redeploy when env var changes save.
Build should take ~2-3 minutes.

---

## 🧪 Verification Checklist

After deployment, test the complete flow:

### Test 1: OAuth Login
```
1. Navigate to: https://www.tbctbctbc.online
2. Click "Sign In with Google"
3. Authorize with Google account
4. Should redirect to dashboard
```

### Test 2: Browser DevTools - Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Login with Google
4. Look for request to: /api/auth/me
5. Check Headers → Authorization
6. Should see: Authorization: Bearer <JWT token>
7. Response should be: 200 with user data
```

### Test 3: Browser DevTools - Storage
```
1. Open DevTools
2. Go to Application → Local Storage
3. Find: auth_token
4. Should contain a valid JWT (3 parts with dots)
5. Should NOT be empty
```

### Test 4: Asset Loading
```
1. Check that logos/images load
2. Right-click image → Inspect
3. Check Network tab for 200 responses
4. Images should serve from: https://www.tbctbctbc.online/logo.svg
```

### Test 5: Session Persistence
```
1. Login with Google (complete Test 1)
2. Refresh page
3. Should stay logged in
4. User info should display in dashboard
5. No redirect to login page
```

---

## 📊 Expected Results

| Component | Before Fix | After Fix |
|-----------|-----------|-----------|
| Google OAuth | ✓ Redirects work | ✓ Still works |
| Cookie set | ✓ Sets (but rejected) | ✓ Sets and accepted |
| Bearer token in URL | ✓ Included | ✓ Still included |
| Token in localStorage | ✗ Maybe not used | ✓ Actively used |
| /api/auth/me | ✗ 401 | ✅ 200 |
| Session persistence | ✗ Broken | ✅ Works |
| Images load | ✗ Fail | ✅ Load |
| Frontend hydration | ✗ Stuck | ✅ Complete |

---

## 🔐 Security Notes

### Is this secure?

**Yes, because:**

1. **Bearer token is JWT (JSON Web Token)**
   - Signed by server with JWT_SECRET
   - Cannot be forged or modified
   - Expires after 7 days

2. **Token stored in localStorage**
   - Only accessible by JavaScript on same origin
   - Not vulnerable to XSS if proper CSP headers set
   - Auto-cleared on logout

3. **HTTPOnly flag NOT needed for Bearer tokens**
   - HTTPOnly is for cookies (browser auto-sends)
   - Bearer tokens are explicit (JS explicitly adds them)
   - Front-end control = more secure in this case

4. **HTTPS enforcement**
   - USE_HTTPS=true in production
   - All requests must be HTTPS
   - Bearer token never sent over HTTP

### What about XSS attacks?

The Bearer token approach is actually MORE secure than cookies for:
- Frontend JavaScript - Bearer tokens are in localStorage (visible to JS but not to XSS via cookies)
- Content Security Policy - Can restrict localStorage access
- Logout - Immediate (just clear localStorage)

---

## 🚨 Rollback Plan

If something breaks:

1. Re-add `COOKIE_DOMAIN=.tbctbctbc.online` in Railway
2. Redeploy
3. System falls back to cookie-based auth

But this should not be necessary.

---

## 📋 Implementation Checklist

- [ ] Navigate to Railway Dashboard
- [ ] Select "The Break Agency APP" project
- [ ] Select "@breakagency/api" service  
- [ ] Go to Variables tab
- [ ] Find `COOKIE_DOMAIN` 
- [ ] **Delete it or set to empty**
- [ ] Click Save
- [ ] Wait for redeploy (~3 minutes)
- [ ] Test Google login
- [ ] Verify /api/auth/me returns 200
- [ ] Verify session persists on refresh
- [ ] Verify images/logos load
- [ ] Test logout
- [ ] Complete all verification tests

---

## 📞 Troubleshooting

### Issue: Still getting 401 after login

**Check:**
1. Is token in localStorage? (DevTools → Application → Local Storage → auth_token)
2. Is Authorization header being sent? (DevTools → Network → /api/auth/me)
3. Did Railway redeploy complete?
4. Are you on fresh deploy or cached?

**Fix:**
1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Clear browser cache
3. Check Railway build logs for errors

### Issue: Images still not loading

**Check:**
1. Are they served from Vercel?
2. Check Network tab → Image requests
3. Should see: https://www.tbctbctbc.online/logo.svg

**This is separate from auth** - likely CDN/Vercel issue

### Issue: Logout doesn't work

**Check:**
```javascript
// In console after logout attempt
localStorage.getItem('auth_token')
// Should return null
```

**If returns token:** Frontend logout not working
**If returns null:** Logout is working ✅

---

**Status:** Ready for deployment  
**Risk Level:** Low (uses existing code, only config change)  
**Testing:** Required before going live  
**Rollback:** One config change, instant

