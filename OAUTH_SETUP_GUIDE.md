# OAuth Setup Guide - Complete Configuration

## Step 1: Add Environment Variables to Railway (5 minutes)

1. Go to: https://railway.app/dashboard
2. Click on your project: **The Break Agency APP**
3. Click on the **@breakagency/api** service
4. Click on **Variables** tab
5. Click **+ New Variable** and add each of these:

```
GOOGLE_CLIENT_ID
583250868510-r3e37u1i3udor8ctdo8p5s5o87qg3rol.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET
<paste your secret from Google Console - see Step 2>

GOOGLE_REDIRECT_URI
https://breakagencyapi-production.up.railway.app/api/auth/google/callback

JWT_SECRET
/oWt4APN/V7qDOy4zOKrx1TJGAM46IhdjsJMeMqN9g0=

FRONTEND_ORIGIN
https://tbctbctbc.online

WEB_APP_URL
https://tbctbctbc.online

NODE_ENV
production

COOKIE_DOMAIN
.up.railway.app

USE_HTTPS
true

COOKIE_SECURE
true
```

**Note:** You already have these (keep them):
- ✅ DATABASE_URL
- ✅ OPENAI_API_KEY
- ✅ PORT

---

## Step 2: Get Google Client Secret (2 minutes)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `583250868510-r3e37u1i3udor8ctdo8p5s5o87qg3rol.apps.googleusercontent.com`
3. Click on it to open details
4. Copy the **Client Secret** value
5. Go back to Railway and paste it into the `GOOGLE_CLIENT_SECRET` variable

---

## Step 3: Update Google OAuth Authorized URLs (3 minutes)

While you're in Google Cloud Console (same page from Step 2):

### Add Authorized Redirect URIs:
Click **"+ ADD URI"** and add these **3 URLs**:

```
https://breakagencyapi-production.up.railway.app/api/auth/google/callback
https://tbctbctbc.online/api/auth/google/callback
http://localhost:5001/api/auth/google/callback
```

### Add Authorized JavaScript Origins:
Scroll down and click **"+ ADD URI"** under "Authorized JavaScript origins" and add these **3 URLs**:

```
https://breakagencyapi-production.up.railway.app
https://tbctbctbc.online
http://localhost:5173
```

Click **SAVE** at the bottom.

---

## Step 4: Wait for Railway to Redeploy (2 minutes)

After adding the environment variables, Railway will automatically redeploy your API.

Check the deployment:
1. Go to: https://railway.app/dashboard
2. Click on your project
3. Click on **Deployments** tab
4. Wait for the green "Success" status (takes ~2-3 minutes)

---

## Step 5: Test Your API is Running (30 seconds)

Open this URL in your browser:
```
https://breakagencyapi-production.up.railway.app/health
```

You should see something like:
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T..."
}
```

If you get an error, check the Railway logs.

---

## Step 6: Verify Vercel Deployment (1 minute)

1. Go to: https://vercel.com/dashboard
2. Check that your latest deployment succeeded
3. It should have the environment variable: `VITE_API_URL=https://breakagencyapi-production.up.railway.app/api`

---

## Step 7: Test the Complete OAuth Flow (5 minutes)

1. **Open your frontend:** https://tbctbctbc.online
2. **Click "Sign In with Google"**
3. **You should:**
   - Be redirected to Google's login page
   - Choose your Google account
   - Be redirected back to your dashboard
   - See your user info in the dashboard

### If it doesn't work:

**Check Railway Logs:**
```bash
cd /Users/admin/Desktop/break-agency-app/apps/api
railway logs
```

Look for errors like:
- "GOOGLE_CLIENT_SECRET is undefined"
- "Invalid redirect_uri"
- "Cookie not set"

**Check Browser Console:**
- Right-click → Inspect → Console tab
- Look for CORS errors or 401/403 errors

**Check Network Tab:**
- Right-click → Inspect → Network tab
- Click "Sign In"
- Look at the `/api/auth/google/url` request
- Look at the `/api/auth/google/callback` request
- Check if cookies are being set

---

## Troubleshooting

### "redirect_uri_mismatch" error:
- Double-check that you added the exact redirect URI to Google Console
- Make sure you clicked SAVE in Google Console
- Wait 5 minutes for Google's cache to update

### "Access Blocked: This app's request is invalid"
- Your Google Client ID or Secret is wrong
- Check Railway variables are correct
- Restart Railway deployment

### OAuth succeeds but I'm not logged in:
- Check Railway logs for cookie errors
- Verify `COOKIE_DOMAIN=.up.railway.app` is set
- Verify `USE_HTTPS=true` and `COOKIE_SECURE=true` are set

### CORS errors in browser:
- Verify `FRONTEND_ORIGIN=https://tbctbctbc.online` in Railway
- Check that Vercel deployment has `VITE_API_URL` pointing to Railway

---

## Success Checklist

- [ ] All Railway environment variables added (11 variables)
- [ ] Google Client Secret retrieved and added to Railway
- [ ] Google OAuth redirect URIs updated (3 URIs)
- [ ] Google OAuth JavaScript origins updated (3 origins)
- [ ] Railway redeployed successfully
- [ ] API health check returns 200 OK
- [ ] Vercel deployment succeeded
- [ ] Can click "Sign In with Google"
- [ ] Redirected to Google login
- [ ] Redirected back to dashboard
- [ ] Logged in and can see user info

---

## Quick Reference

**Railway API URL:** https://breakagencyapi-production.up.railway.app
**Frontend URL:** https://tbctbctbc.online
**Google Console:** https://console.cloud.google.com/apis/credentials
**Railway Dashboard:** https://railway.app/dashboard
**Vercel Dashboard:** https://vercel.com/dashboard

**OAuth Callback:** https://breakagencyapi-production.up.railway.app/api/auth/google/callback
**Health Check:** https://breakagencyapi-production.up.railway.app/health

---

**Estimated Total Time:** 15-20 minutes
