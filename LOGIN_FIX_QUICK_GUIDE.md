# Login Fix - Quick Reference

## 🔴 Problem
"Failed to fetch" when logging in at `tbctbctbc.online`

## 🎯 Root Cause
Frontend is trying to call `localhost:5001` instead of your production API

## ✅ Solution (3 Steps)

### Step 1: Set Vercel Environment Variable
```
Dashboard → Settings → Environment Variables → Add

Name:  VITE_API_URL
Value: https://api.tbctbctbc.online/api
Scope: Production
```

### Step 2: Set Backend Environment Variables
Add these to Railway/Render/your backend host:

```env
NODE_ENV=production
FRONTEND_ORIGIN=https://tbctbctbc.online
COOKIE_DOMAIN=.tbctbctbc.online
USE_HTTPS=true
```

### Step 3: Redeploy Both
```bash
# Push to trigger Vercel redeploy
git add .
git commit -m "fix: production environment"
git push

# Restart backend service in Railway/Render dashboard
```

## 🧪 Test
1. Clear browser cookies
2. Go to https://tbctbctbc.online
3. Open DevTools → Network tab
4. Click login
5. Verify API calls go to `api.tbctbctbc.online` (not localhost)

## 📞 Still Not Working?

Run this in browser console at `https://tbctbctbc.online`:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL)
```

Should show: `https://api.tbctbctbc.online/api`

If it shows `http://localhost:5001/api`, then Vercel env var didn't apply. Redeploy or set it in Vercel UI.

## 🔍 Backend Check

Visit: `https://api.tbctbctbc.online/health`

Should return: `{"status":"ok","message":"Break Agency API is running"}`

If you get an error, your backend isn't accessible or isn't deployed.
