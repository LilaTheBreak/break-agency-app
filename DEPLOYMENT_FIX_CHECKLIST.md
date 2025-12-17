# Deployment Checklist - tbctbctbc.online

## ❌ Current Issue
When accessing `tbctbctbc.online`, login fails with "Failed to fetch" because:
1. Frontend is trying to call `http://localhost:5001/api` instead of production API
2. Backend CORS is blocking requests from `tbctbctbc.online`
3. Cookie domain not configured for production

## ✅ Fix Steps

### 1. Configure Vercel (Frontend) Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add this variable:
```
Name: VITE_API_URL
Value: https://api.tbctbctbc.online/api
Environment: Production
```

**OR** if your backend is on the same domain with a proxy:
```
Name: VITE_API_URL
Value: https://tbctbctbc.online/api
Environment: Production
```

### 2. Configure Backend Environment Variables

In your backend hosting platform (Railway, Render, etc.), set these:

**Critical for login to work:**
```bash
NODE_ENV=production
FRONTEND_ORIGIN=https://tbctbctbc.online
WEB_APP_URL=https://tbctbctbc.online
COOKIE_DOMAIN=.tbctbctbc.online
USE_HTTPS=true
```

**Already configured (keep these):**
```bash
DATABASE_URL=<your_neon_url>
JWT_SECRET=<your_secret>
RESEND_API_KEY=<your_key>
GOOGLE_CLIENT_ID=<your_client_id>
GOOGLE_CLIENT_SECRET=<your_secret>
GOOGLE_REDIRECT_URI=https://api.tbctbctbc.online/api/auth/google/callback
```

### 3. Redeploy Both Services

**Frontend (Vercel):**
```bash
# Push changes to GitHub
git add .
git commit -m "fix: configure production environment"
git push

# Vercel will auto-deploy
# Or manually trigger in Vercel dashboard
```

**Backend:**
- If using Railway: Push to trigger rebuild
- If using Render: It will auto-redeploy on env change
- Or manually restart the service

### 4. Test After Deployment

1. Clear browser cookies and cache
2. Go to `https://tbctbctbc.online`
3. Open DevTools → Network tab
4. Try to log in
5. Check that API calls go to `https://api.tbctbctbc.online` (not localhost)
6. Verify no CORS errors in console

## 🔍 Debugging

### Check if API is accessible
```bash
curl https://api.tbctbctbc.online/health
```

Should return: `{"status":"ok"}`

### Check CORS headers
```bash
curl -I -X OPTIONS https://api.tbctbctbc.online/api/auth/me \
  -H "Origin: https://tbctbctbc.online" \
  -H "Access-Control-Request-Method: GET"
```

Should include:
```
Access-Control-Allow-Origin: https://tbctbctbc.online
Access-Control-Allow-Credentials: true
```

### Check environment in frontend
Open browser console on `https://tbctbctbc.online`:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

Should show: `https://api.tbctbctbc.online/api` (not localhost)

## 📝 Architecture

```
┌─────────────────────────┐
│   tbctbctbc.online      │ ← Frontend (Vercel)
│   (React/Vite)          │
└────────┬────────────────┘
         │
         │ API calls with credentials: include
         │
         ▼
┌─────────────────────────┐
│ api.tbctbctbc.online    │ ← Backend (Railway/etc)
│ (Express/Node.js)       │
│                         │
│ CORS allows:            │
│ - Origin: tbctbctbc.online
│ - Credentials: true     │
│                         │
│ Cookies set with:       │
│ - Domain: .tbctbctbc.online
│ - Secure: true          │
│ - SameSite: none        │
└─────────────────────────┘
```

## 🚨 Common Issues

### "Failed to fetch"
- API URL still pointing to localhost
- Backend not accessible from internet
- Firewall blocking requests

### CORS errors
- `FRONTEND_ORIGIN` not set correctly
- Doesn't match exact domain (http vs https)
- Missing trailing slash mismatch

### Cookies not working
- `COOKIE_DOMAIN` not set to `.tbctbctbc.online`
- `USE_HTTPS=true` not set
- `NODE_ENV=production` not set
- Browser blocking third-party cookies (shouldn't happen with proper domain)

### 401 Unauthorized on all requests
- Cookies not being sent
- Cookie domain mismatch
- Session expired - clear cookies and retry

## ✅ Verification Checklist

- [ ] `VITE_API_URL` set in Vercel
- [ ] `FRONTEND_ORIGIN` set in backend
- [ ] `COOKIE_DOMAIN` set to `.tbctbctbc.online`
- [ ] `NODE_ENV=production` in backend
- [ ] `USE_HTTPS=true` in backend
- [ ] Both services redeployed
- [ ] Health check responds
- [ ] CORS headers correct
- [ ] Login successful
- [ ] Cookies persisting across pages
- [ ] Protected routes working

## 📞 Next Steps

After completing the checklist:
1. Try logging in at `https://tbctbctbc.online`
2. If still failing, check browser DevTools → Console for errors
3. Check browser DevTools → Network tab → failed request details
4. Verify environment variables are actually loaded (backend logs on startup)
