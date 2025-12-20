# API Subdomain Setup for Production

## What We're Doing
Setting up `api.tbctbctbc.online` to point to Railway so cookies work properly between frontend and API.

## DNS Configuration Steps

### In Your DNS Provider (Cloudflare/GoDaddy/etc):

1. **Add CNAME Record:**
   - **Type:** CNAME
   - **Name:** `api` (or `api.tbctbctbc.online` depending on your provider)
   - **Value:** `breakagencyapi-production.up.railway.app`
   - **TTL:** Auto or 3600

2. **Verify DNS propagation** (takes 5-60 minutes):
   ```bash
   nslookup api.tbctbctbc.online
   # Should show: api.tbctbctbc.online canonical name = breakagencyapi-production.up.railway.app
   ```

## Railway Configuration

### Add Custom Domain:
1. Go to Railway project: https://railway.app/project/break-agency-api
2. Click on your service
3. Go to **Settings** → **Domains**
4. Click **+ Custom Domain**
5. Enter: `api.tbctbctbc.online`
6. Railway will provide verification instructions (usually automatic if CNAME is set)

## Environment Variable Updates

Once DNS is configured, update Railway variables:

```bash
# Current (will update these):
COOKIE_DOMAIN=.tbctbctbc.online  # ← Update to shared domain
GOOGLE_REDIRECT_URI=https://api.tbctbctbc.online/api/auth/google/callback  # ← Update
```

## Frontend Configuration

Update API base URL in frontend to use subdomain:

**File:** `apps/web/src/lib/api-client.js`
```javascript
const API_BASE_URL = import.meta.env.PROD 
  ? "https://api.tbctbctbc.online"  // ← New subdomain
  : "http://localhost:3001";
```

## Why This Works

✅ Both on same root domain (`tbctbctbc.online`)
✅ Cookies with `domain=.tbctbctbc.online` work across subdomains
✅ No CORS cookie restrictions
✅ Professional setup
✅ Easy to manage SSL (Railway handles it)

## Testing After Setup

1. Clear browser cookies
2. Visit https://tbctbctbc.online
3. Click "Sign In with Google"
4. Should redirect to `api.tbctbctbc.online/api/auth/google/callback`
5. Cookie should persist and you stay logged in

## Current Status
- [ ] DNS CNAME record added
- [ ] Railway custom domain configured
- [ ] Environment variables updated
- [ ] Frontend API URL updated
- [ ] Tested login flow
