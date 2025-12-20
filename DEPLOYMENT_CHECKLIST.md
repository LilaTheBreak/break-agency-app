# 🚀 Production Subdomain Deployment Checklist

## Current Status: Ready for DNS Configuration

### What's Already Done ✅
- [x] Code updated for subdomain support
- [x] Cookie domain set to `.tbctbctbc.online`
- [x] Frontend `.env.production` configured with `VITE_API_URL=https://api.tbctbctbc.online/api`
- [x] Changes committed to GitHub

---

## Step 1: Configure DNS (Do This First)

### In Your DNS Provider (e.g., Cloudflare):

1. **Add CNAME Record:**
   ```
   Type: CNAME
   Name: api
   Target: breakagencyapi-production.up.railway.app
   TTL: Auto (or 3600)
   Proxy status: DNS only (not proxied)
   ```

2. **Wait for DNS Propagation** (5-60 minutes)
   - Check with: `nslookup api.tbctbctbc.online`
   - Should return: `canonical name = breakagencyapi-production.up.railway.app`

---

## Step 2: Configure Railway Custom Domain

1. Go to: https://railway.app
2. Select your API project
3. Click **Settings** → **Domains**
4. Click **+ Custom Domain**
5. Enter: `api.tbctbctbc.online`
6. Railway will verify and generate SSL certificate (automatic)

⏰ **Wait for Railway to show "Active" status** (usually 5-15 minutes)

---

## Step 3: Update Railway Environment Variables

Update these variables in Railway dashboard:

```bash
COOKIE_DOMAIN=.tbctbctbc.online
GOOGLE_REDIRECT_URI=https://api.tbctbctbc.online/api/auth/google/callback
FRONTEND_ORIGIN=https://tbctbctbc.online,https://www.tbctbctbc.online,https://api.tbctbctbc.online
```

**Note:** Railway will auto-redeploy after variable changes.

---

## Step 4: Update Google OAuth Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select: "The Break Co Agency App" OAuth client
3. Update **Authorized redirect URIs:**
   - Add: `https://api.tbctbctbc.online/api/auth/google/callback`
   - Keep existing: `https://breakagencyapi-production.up.railway.app/api/auth/google/callback` (as backup)

---

## Step 5: Update Vercel Environment Variables

1. Go to: https://vercel.com/lilas-projects-27f9c819/break-agency-app
2. Settings → Environment Variables
3. Update or add:
   ```
   VITE_API_URL=https://api.tbctbctbc.online/api
   ```
4. Redeploy from Vercel dashboard or push new commit

---

## Step 6: Test the Setup

### 6.1 Verify DNS
```bash
nslookup api.tbctbctbc.online
# Should show: canonical name = breakagencyapi-production.up.railway.app
```

### 6.2 Test API Directly
```bash
curl https://api.tbctbctbc.online/api/health
# Should return: {"ok":true}
```

### 6.3 Test Authentication Flow
1. Clear browser cookies (important!)
2. Visit: https://tbctbctbc.online
3. Click "Sign In with Google"
4. Complete OAuth flow
5. You should be redirected to dashboard **and stay logged in**

### 6.4 Verify Cookie
Open browser DevTools:
- Application → Cookies → `https://tbctbctbc.online`
- Should see: `break_session` cookie with:
  - Domain: `.tbctbctbc.online`
  - Secure: ✓
  - HttpOnly: ✓
  - SameSite: None

---

## Troubleshooting

### DNS Not Resolving
- Wait longer (can take up to 1 hour)
- Check your DNS provider's propagation status
- Use: `dig api.tbctbctbc.online` for detailed info

### Railway Domain Not Active
- Verify CNAME is correctly set in DNS
- Check Railway logs for SSL certificate generation
- Try removing and re-adding the custom domain

### OAuth Redirect Error
- Verify Google OAuth console has new redirect URI
- Check Railway env var `GOOGLE_REDIRECT_URI` is correct
- Clear browser cache and cookies

### Cookies Still Not Working
- Open Network tab in DevTools
- Look for `Set-Cookie` header in `/api/auth/google/callback` response
- Verify cookie domain is `.tbctbctbc.online`
- Check browser console for cookie warnings

---

## Rollback Plan

If something goes wrong:

1. **In Railway:** Remove custom domain
2. **In Vercel:** Change `VITE_API_URL` back to `https://breakagencyapi-production.up.railway.app/api`
3. **In Railway env vars:** Set `COOKIE_DOMAIN=.up.railway.app`
4. Redeploy both services

---

## Success Criteria ✅

- [ ] DNS resolves `api.tbctbctbc.online` to Railway
- [ ] Railway shows custom domain as "Active"
- [ ] API responds at `https://api.tbctbctbc.online/api/health`
- [ ] Google OAuth redirects to new subdomain
- [ ] User can log in and session persists across page refreshes
- [ ] Cookie visible in DevTools with correct domain
- [ ] No CORS errors in browser console
- [ ] Dashboard loads with user data (no 403 errors)

---

## Need Help?

Check Railway deployment logs:
```bash
# In Railway dashboard:
1. Select your API service
2. Click "Deployments"
3. View latest deployment logs
```

Check browser console for detailed errors.
