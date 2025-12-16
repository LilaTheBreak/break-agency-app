# Deployment Setup Guide

## Current Issue
Google OAuth login fails on Vercel because the API backend is not deployed.

## Architecture
- **Frontend**: Deployed on Vercel ✅
- **Backend API**: NOT deployed ❌ (Required for authentication)

## Solution: Deploy Backend API

### Step 1: Choose an API Hosting Platform

**Recommended Options:**
1. **Railway** - Easiest, free tier available
2. **Render** - Free tier with good PostgreSQL support
3. **Fly.io** - Great for Node.js apps
4. **Heroku** - Classic option (no free tier)

### Step 2: Deploy API to Railway (Example)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize from API directory**
   ```bash
   cd apps/api
   railway init
   ```

4. **Set Environment Variables in Railway**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=5001
   railway variables set DATABASE_URL="your-neon-postgres-url"
   railway variables set JWT_SECRET="your-secret-key"
   railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
   railway variables set GOOGLE_CLIENT_SECRET="your-google-client-secret"
   railway variables set GOOGLE_REDIRECT_URI="https://your-api.railway.app/api/auth/google/callback"
   railway variables set FRONTEND_ORIGIN="https://tbctbtbc.online"
   railway variables set COOKIE_DOMAIN="railway.app"
   railway variables set COOKIE_SECURE="true"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Step 3: Update Vercel Environment Variables

Once API is deployed, add this to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://your-api.railway.app
   ```
3. Redeploy frontend

### Step 4: Update Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://your-api.railway.app/api/auth/google/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://tbctbtbc.online
   https://break-agency-*.vercel.app
   ```

## Quick Deploy Commands

```bash
# From project root
cd apps/api

# Deploy to Railway
railway up

# Get your API URL
railway status
```

## Testing

1. Visit your Vercel site: https://tbctbtbc.online
2. Click "Sign In"
3. Click "Continue with Google"
4. Should redirect to Google OAuth → Back to your site logged in

## Troubleshooting

### OAuth Error: redirect_uri_mismatch
- Make sure `GOOGLE_REDIRECT_URI` in Railway matches Google Console
- Format: `https://your-api.railway.app/api/auth/google/callback`

### CORS Errors
- Ensure `FRONTEND_ORIGIN` is set correctly in API
- Check that `COOKIE_DOMAIN` allows cross-domain cookies

### 401 Errors
- Check `DATABASE_URL` is correct
- Ensure `JWT_SECRET` is set
- Verify user exists in database

## Current Configuration

**Frontend (Vercel):**
- URL: https://tbctbtbc.online
- Needs: `VITE_API_URL` environment variable

**Backend (Not Deployed):**
- Needs: Full deployment with all environment variables
- Required vars: DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

**Database:**
- Using: Neon PostgreSQL
- Status: ✅ Configured
