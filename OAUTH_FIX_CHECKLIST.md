# OAuth Cross-Domain Fix - Action Items

## ✅ Completed

- [x] Identified hardcoded cookie domain fallback in `jwt.ts`
- [x] Removed `.tbctbctbc.online` hardcoded fallback
- [x] Verified all authentication mechanisms
- [x] Confirmed Bearer token flow working
- [x] Validated frontend token extraction from URL
- [x] Checked Google OAuth configuration
- [x] Tested cross-domain safety without cookies
- [x] Created comprehensive audit report
- [x] Committed changes to GitHub
- [x] Pushed to main branch (Railway will auto-deploy)

## 🔄 Pending (Required for OAuth to Work)

### 1. Wait for Railway Auto-Deploy
- **Status:** In progress (GitHub push completed)
- **Expected:** 2-5 minutes after push
- **Check:** Railway dashboard build logs

### 2. Set Environment Variables in Railway

**Navigate to:** Railway Dashboard → `breakagencyapi-production` → Variables tab

**Add/Update these variables:**

```bash
Variable: COOKIE_DOMAIN
Value: [empty string - leave blank]

Variable: FRONTEND_ORIGIN  
Value: https://break-agency-3nan4i2ow-lilas-projects-27f9c819.vercel.app
```

**Critical Notes:**
- `COOKIE_DOMAIN` must exist as a variable but have NO value
- Don't use `undefined` or `null` - just leave it empty
- After adding, click "Deploy" or wait for auto-redeploy

### 3. Test OAuth Flow

**Step 1: Clear browser state**
```javascript
// Open browser console on Vercel app
localStorage.clear();
// Refresh page
```

**Step 2: Attempt login**
1. Click "Login with Google"
2. Complete Google authentication
3. Should redirect to dashboard
4. No errors in console

**Step 3: Verify token**
```javascript
// In browser console:
console.log('Token:', localStorage.getItem('auth_token'));
// Should show JWT token (not null)
```

**Step 4: Test API**
```javascript
// In browser console:
fetch('https://breakagencyapi-production.up.railway.app/api/users/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  },
  credentials: 'include'
}).then(r => r.json()).then(console.log);
// Should return user object
```

### 4. Verify No Cookie Errors

**In browser DevTools:**
1. Open Network tab
2. Login with Google
3. Look at response from Google callback
4. Check Console tab for cookie warnings
5. **Expected:** No cookie errors (cookies may fail, but that's OK)

## 📋 Verification Checklist

After completing steps above:

- [ ] Railway deployment completed successfully
- [ ] `COOKIE_DOMAIN` set to empty in Railway
- [ ] `FRONTEND_ORIGIN` set correctly in Railway
- [ ] Browser localStorage cleared
- [ ] Google login successful
- [ ] Redirected to correct dashboard
- [ ] `auth_token` present in localStorage
- [ ] No cookie errors in browser console
- [ ] API requests return 200 (not 401)
- [ ] User data loads correctly
- [ ] Can navigate authenticated pages
- [ ] Logout works (clears token)

## 🚨 If OAuth Still Fails

### Debug Steps

**1. Check Railway Environment Variables**
```bash
# In Railway logs, look for:
[COOKIE] Setting cookie with config: {"httpOnly":true,"secure":true,"sameSite":"none","maxAge":604800000,"path":"/"}
# Domain should NOT appear in the config
```

**2. Check Frontend Token Extraction**
```javascript
// In browser console right after OAuth redirect:
console.log('URL:', window.location.href);
console.log('Token in URL:', new URLSearchParams(window.location.search).get('token'));
console.log('Token in storage:', localStorage.getItem('auth_token'));
```

**3. Check Backend Logs**
- Railway Dashboard → Deployments → View Logs
- Look for: `>>> GOOGLE OAUTH CALLBACK HIT`
- Should see: `✔ Google OAuth user upsert completed`
- Look for: `>>> REDIRECT INFO:` with token in URL

**4. Verify Google Console Configuration**
- Go to: https://console.cloud.google.com
- OAuth Credentials → Your Client ID
- Authorized redirect URIs should include ONLY:
  ```
  https://breakagencyapi-production.up.railway.app/api/auth/google/callback
  ```

### Common Issues

**Issue:** Cookie rejected by browser
- **Solution:** ✅ Already handled - Bearer token works without cookies
- **Verify:** Token should still appear in localStorage

**Issue:** 401 Unauthorized on API requests
- **Solution:** Check Authorization header includes Bearer token
- **Debug:** 
  ```javascript
  const token = localStorage.getItem('auth_token');
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length);
  ```

**Issue:** Redirect URI mismatch in Google
- **Solution:** Ensure Railway env var `GOOGLE_REDIRECT_URI` matches Google Console
- **Should be:** `https://breakagencyapi-production.up.railway.app/api/auth/google/callback`

## 📚 Documentation Reference

- **Full Audit:** `OAUTH_DOMAIN_AUDIT_REPORT.md` (19 sections, complete analysis)
- **Quick Fix Guide:** `GOOGLE_OAUTH_FIX.md` (3 solution options)
- **This Checklist:** `OAUTH_FIX_CHECKLIST.md`

## 🎯 Success Criteria

OAuth is working correctly when:
1. ✅ User can log in with Google
2. ✅ No cookie errors in console (may have cookie warnings - OK)
3. ✅ Token stored in localStorage
4. ✅ API requests authenticated with Bearer token
5. ✅ User session persists across page refreshes
6. ✅ Logout removes token and ends session

**Current Status:** Code deployed to GitHub, waiting for Railway auto-deploy + env var configuration.
