# Google OAuth Cookie Fix

## Problem Identified

Google OAuth login is failing due to **cookie domain mismatch**:

- **Backend (Railway)**: Sets cookies for `.tbctbctbc.online`
- **Frontend (Vercel)**: Running on `break-agency-3nan4i2ow-lilas-projects-27f9c819.vercel.app`
- **Result**: Browser rejects cookies because domains don't match

## How OAuth Currently Works

1. User clicks "Login with Google"
2. Frontend fetches OAuth URL from `/api/auth/google/url`
3. User redirects to Google for authentication
4. Google redirects to backend `/api/auth/google/callback`
5. Backend:
   - Creates JWT token
   - Sets cookie (FAILS due to domain mismatch)
   - Redirects to frontend with token in URL: `?token=xxxxx`
6. Frontend (AuthContext.jsx lines 56-69):
   - Extracts token from URL
   - Stores in localStorage
   - Cleans up URL

## Solution Options

### Option 1: Quick Fix - Empty Cookie Domain (RECOMMENDED)

**In Railway Dashboard:**

1. Go to your `breakagencyapi-production` project
2. Click on **Variables** tab
3. Set/update these variables:

```bash
COOKIE_DOMAIN=
FRONTEND_ORIGIN=https://break-agency-3nan4i2ow-lilas-projects-27f9c819.vercel.app
```

4. Click **Deploy** to restart with new variables

**Why this works:**
- Empty `COOKIE_DOMAIN` allows cookies on any domain
- Token is still passed via URL as backup
- localStorage handles persistence

### Option 2: Use Custom Domain (PROPER SOLUTION)

**Step 1: Configure Custom Domain on Vercel**

1. Go to Vercel project settings
2. Add domain: `tbctbctbc.online`
3. Update DNS records as instructed by Vercel

**Step 2: Update Railway Variables**

```bash
COOKIE_DOMAIN=.tbctbctbc.online
FRONTEND_ORIGIN=https://tbctbctbc.online
```

**Step 3: Update Google OAuth Console**

1. Go to https://console.cloud.google.com
2. Find your OAuth client ID: `583250868510-2l8so00gv97bedejv9hq5d73nins36ag`
3. Update Authorized redirect URIs to include:
   ```
   https://breakagencyapi-production.up.railway.app/api/auth/google/callback
   ```

### Option 3: Remove Domain Restriction in Code

**Edit `apps/api/src/lib/jwt.ts`:**

```typescript
function buildCookieConfig() {
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    return {
      httpOnly: true,
      secure: false,
      sameSite: "lax" as const,
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      domain: undefined
    };
  }
  
  // Production - allow empty domain for cross-domain compatibility
  const domain = process.env.COOKIE_DOMAIN || undefined; // Changed from ".tbctbctbc.online"
  
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    domain // Will be undefined if COOKIE_DOMAIN not set
  };
}
```

Then commit and push to trigger Railway redeploy.

## Current Environment State

**Backend (Railway):**
- URL: `https://breakagencyapi-production.up.railway.app`
- Status: ✅ Healthy (all APIs working)
- OAuth Callback: `https://breakagencyapi-production.up.railway.app/api/auth/google/callback`

**Frontend (Vercel):**
- Current URL: `https://break-agency-3nan4i2ow-lilas-projects-27f9c819.vercel.app`
- Custom Domain: `tbctbctbc.online` (may not be configured)
- VITE_API_URL: `https://breakagencyapi-production.up.railway.app` ✅

**Google OAuth Client:**
- Client ID: `583250868510-2l8so00gv97bedejv9hq5d73nins36ag.apps.googleusercontent.com`
- Redirect URI: `https://breakagencyapi-production.up.railway.app/api/auth/google/callback`
- Scopes: openid, email, profile, calendar.readonly, calendar.events

## Testing After Fix

1. **Clear browser cookies and localStorage**
   ```javascript
   // In browser console:
   localStorage.clear();
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

2. **Test Google login flow:**
   - Click "Login with Google"
   - Complete Google authentication
   - Should redirect back to dashboard
   - Check localStorage has `auth_token`

3. **Verify API requests work:**
   ```javascript
   // In browser console after login:
   fetch('https://breakagencyapi-production.up.railway.app/api/users/me', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
     },
     credentials: 'include'
   }).then(r => r.json()).then(console.log);
   ```

## Why Token-in-URL Works Even Without Cookies

The code in `AuthContext.jsx` already handles this:

```javascript
// Lines 56-69
useEffect(() => {
  // Check for token in URL (from OAuth redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    // Store token in localStorage for cross-domain auth
    localStorage.setItem('auth_token', tokenFromUrl);
    
    // Clean up URL
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, newUrl);
  }
  
  refreshUser();
}, [refreshUser]);
```

This means OAuth **should** work even with cookie issues, as long as:
1. Backend redirects with `?token=xxxxx` in URL ✅
2. Frontend extracts and stores token ✅
3. API requests include token in Authorization header ✅

## Recommended Action

**Go with Option 1** - Set `COOKIE_DOMAIN=` (empty) on Railway.

This is the quickest fix and should make OAuth work immediately. The token-in-URL mechanism is already implemented and working.

If you want the proper solution later, configure the custom domain (Option 2).
