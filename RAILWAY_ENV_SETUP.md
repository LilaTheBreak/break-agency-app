# Railway Environment Configuration Guide

## ⚠️ CRITICAL: Required Environment Variables

These environment variables **MUST** be set in Railway for production to work correctly.

### Authentication & CORS

```bash
# CRITICAL: Must be empty string (not unset, not a value)
COOKIE_DOMAIN=

# CRITICAL: Must match your Vercel deployment URL
FRONTEND_ORIGIN=https://break-agency-3nan4i2ow-lilas-projects-27f9c819.vercel.app

# Required for JWT signing
JWT_SECRET=<your-secure-random-string>

# Production mode
NODE_ENV=production
```

### Google OAuth

```bash
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=583250868510-2l8so00gv97bedejv9hq5d73nins36ag.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-secret-from-google-console>

# Must match Railway backend URL
GOOGLE_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/auth/google/callback
```

### Database

```bash
# Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## How to Set Environment Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to: https://railway.app/project/your-project-id
2. Click on your service (e.g., "api")
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   - **Key:** Variable name (e.g., `COOKIE_DOMAIN`)
   - **Value:** Variable value (e.g., empty string for `COOKIE_DOMAIN`)
6. Click **Save**

### Method 2: Railway CLI

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Set variables
railway variables set COOKIE_DOMAIN=""
railway variables set FRONTEND_ORIGIN="https://your-vercel-url.vercel.app"
railway variables set JWT_SECRET="your-jwt-secret"
```

## Verification Steps

### 1. Check Variables Are Set

In Railway Dashboard → Variables, verify all critical variables appear.

**IMPORTANT:** For `COOKIE_DOMAIN`, verify it shows as an empty value (not missing).

### 2. Trigger Redeploy

After setting variables:
1. Railway Dashboard → Deployments
2. Click **Deploy** (or wait for auto-deploy from GitHub)
3. Check deployment logs for errors

### 3. Test OAuth Flow

1. Navigate to your Vercel URL
2. Click "Login with Google"
3. Complete OAuth flow
4. Verify you're logged in
5. Check browser console for errors

### 4. Check Railway Logs

```bash
# In Railway Dashboard → Logs, look for:
✅ "[INFO] OAuth redirect completed"
✅ "[INFO] Auth cookie set"
❌ Avoid: Errors about domain mismatch or CORS
```

## Common Issues

### Issue: "Origin not allowed by CORS"

**Cause:** `FRONTEND_ORIGIN` doesn't match your Vercel URL

**Fix:**
```bash
# Get your exact Vercel URL
FRONTEND_ORIGIN=https://break-agency-3nan4i2ow-lilas-projects-27f9c819.vercel.app

# Update in Railway
railway variables set FRONTEND_ORIGIN="$FRONTEND_ORIGIN"
```

### Issue: Cookies not working

**Cause:** `COOKIE_DOMAIN` not set to empty string

**Fix:**
```bash
# In Railway Dashboard → Variables
COOKIE_DOMAIN=  # Empty string, not unset
```

**Why:** Bearer token auth works without cookies, but `COOKIE_DOMAIN` must be explicitly empty to prevent hardcoded fallbacks.

### Issue: Google OAuth fails

**Cause:** `GOOGLE_REDIRECT_URI` mismatch

**Fix:**
1. Check Google Cloud Console → Credentials → OAuth 2.0 Client IDs
2. Verify redirect URI matches:
   ```
   https://breakagencyapi-production.up.railway.app/api/auth/google/callback
   ```
3. Ensure Railway `GOOGLE_REDIRECT_URI` variable matches exactly

### Issue: JWT token errors

**Cause:** `JWT_SECRET` not set or changed

**Fix:**
```bash
# Generate a secure secret (do this once)
openssl rand -base64 32

# Set in Railway
railway variables set JWT_SECRET="<generated-secret>"
```

**WARNING:** Changing `JWT_SECRET` will invalidate all existing user sessions.

## Security Checklist

- [ ] `JWT_SECRET` is a strong random string (at least 32 characters)
- [ ] `GOOGLE_CLIENT_SECRET` is not exposed in logs or frontend
- [ ] `DATABASE_URL` uses SSL mode (`?sslmode=require`)
- [ ] `COOKIE_DOMAIN` is set to empty string (enables cross-domain auth)
- [ ] `FRONTEND_ORIGIN` matches your production Vercel URL
- [ ] `NODE_ENV` is set to `production`

## Updating After Vercel Domain Changes

If you configure a custom domain or get a new Vercel URL:

```bash
# 1. Update Railway
railway variables set FRONTEND_ORIGIN="https://new-domain.com"

# 2. Update Vercel build command (in vercel.json)
# Change VITE_API_URL if Railway URL changes

# 3. Redeploy both services
railway up        # Railway
vercel --prod     # Vercel
```

## Environment Variable Template

Copy this template to set all variables at once:

```bash
# === CRITICAL ===
COOKIE_DOMAIN=
FRONTEND_ORIGIN=https://break-agency-3nan4i2ow-lilas-projects-27f9c819.vercel.app
JWT_SECRET=<generate-with-openssl-rand-base64-32>
NODE_ENV=production

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=583250868510-2l8so00gv97bedejv9hq5d73nins36ag.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<get-from-google-cloud-console>
GOOGLE_REDIRECT_URI=https://breakagencyapi-production.up.railway.app/api/auth/google/callback

# === DATABASE ===
DATABASE_URL=<neon-postgres-connection-string>

# === OPTIONAL ===
# SENTRY_DSN=<for-backend-error-monitoring>
```

## Quick Start Checklist

1. [ ] Copy template above
2. [ ] Replace `<placeholders>` with actual values
3. [ ] Set variables in Railway Dashboard
4. [ ] Trigger redeploy
5. [ ] Test OAuth flow
6. [ ] Monitor logs for errors

---

**Last Updated:** December 23, 2025  
**Next Review:** After production launch + 1 week
