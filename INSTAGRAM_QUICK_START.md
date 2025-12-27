# 🚀 Instagram Integration - Quick Start Guide

**Ready to test Instagram OAuth in 5 minutes!**

---

## Step 1: Run Database Migration (2 minutes)

```bash
cd apps/api
npx prisma migrate dev --name add_social_analytics_models
npx prisma generate
```

**Expected output:**
```
✔ Generated Prisma Client
✔ The migration has been created successfully.
```

---

## Step 2: Register Instagram App (3 minutes)

### Option A: For Testing (Quickest)
Use **Instagram Basic Display API** - no app review needed for testing with your own account.

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"** → Choose **"Consumer"**
3. Add **"Instagram Basic Display"** product
4. Click **"Basic Display"** in left menu
5. Under "Instagram App ID" section:
   - Copy your **Instagram App ID** (this is your CLIENT_ID)
   - Copy your **Instagram App Secret** (this is your CLIENT_SECRET)
6. Click **"Add or Remove Instagram Testers"** → Add your Instagram account
7. Go to your Instagram app on phone → **Settings** → **Apps and Websites** → **Tester Invites** → Accept invite
8. Back in Meta dashboard, under **"User Token Generator"**, add redirect URI:
   - `http://localhost:5001/api/auth/instagram/callback`

### Option B: For Production
Use **Instagram Graph API** - requires Business/Creator account and app review.

---

## Step 3: Add Environment Variables (30 seconds)

Edit `/apps/api/.env`:

```bash
# Instagram OAuth
INSTAGRAM_CLIENT_ID=your_instagram_app_id_here
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:5001/api/auth/instagram/callback
```

---

## Step 4: Restart API (30 seconds)

```bash
cd apps/api
npm run dev
```

Wait for: `Server running on port 5001`

---

## Step 5: Test OAuth Flow (1 minute)

### Option A: Browser Test
1. Navigate to `http://localhost:3000/dashboard`
2. Look for social connections section
3. Click **"Connect Instagram"** button
4. OAuth popup opens → Login to Instagram → Authorize
5. Popup closes → See success toast
6. Profile data should appear

### Option B: API Test (curl)
```bash
# Get OAuth URL
curl -X GET http://localhost:5001/api/auth/instagram/connect \
  -H "Cookie: your-session-cookie" \
  | jq .

# Expected response:
{
  "success": true,
  "url": "https://api.instagram.com/oauth/authorize?client_id=..."
}

# Open the URL in browser, complete OAuth, then check connections:
curl -X GET http://localhost:5001/api/analytics/socials/connections \
  -H "Cookie: your-session-cookie" \
  | jq .
```

---

## ✅ Success Indicators

**You're good when you see:**

1. **Database Migration:** 4 new tables created
   - `SocialProfile`
   - `SocialPost`
   - `SocialMetric`
   - `SocialSyncLog`

2. **OAuth Flow:** Popup opens and closes automatically

3. **Data Sync:** Console logs show:
   ```
   [CRON] ✓ Synced profile for @your_handle
   [CRON] ✓ Synced 10/10 posts for @your_handle
   ```

4. **API Response:**
   ```json
   {
     "success": true,
     "data": {
       "connections": [{
         "platform": "instagram",
         "handle": "your_handle",
         "connected": true,
         "followerCount": 1234
       }]
     }
   }
   ```

---

## 🚨 Troubleshooting

### "Instagram OAuth not configured"
- Check `.env` file has INSTAGRAM_CLIENT_ID
- Restart API server after adding env vars

### "Redirect URI mismatch"
- Meta dashboard redirect URI must exactly match .env
- Check for http vs https
- Check port number (5001)

### "User not authorized as a tester"
- Add yourself as tester in Meta dashboard
- Accept tester invite in Instagram app
- Wait 5 minutes and try again

### "Failed to fetch Instagram profile"
- Token may be invalid/expired
- Try disconnecting and reconnecting
- Check Meta dashboard app status

### "No social accounts found"
- OAuth callback may have failed
- Check API logs for errors
- Try clearing cookies and reconnecting

---

## 🧪 Manual Sync Test

Trigger a manual sync:

```bash
# From browser (after connecting)
fetch('/api/auth/instagram/sync', {
  method: 'POST',
  credentials: 'include'
})

# Or from terminal
curl -X POST http://localhost:5001/api/auth/instagram/sync \
  -H "Cookie: your-session-cookie"
```

---

## 📊 Check Database

```sql
-- See connected accounts
SELECT * FROM "SocialAccountConnection" WHERE connected = true;

-- See profiles
SELECT * FROM "SocialProfile";

-- See recent posts
SELECT * FROM "SocialPost" ORDER BY "postedAt" DESC LIMIT 10;

-- See sync logs
SELECT * FROM "SocialSyncLog" ORDER BY "createdAt" DESC LIMIT 10;
```

---

## 🔄 Next Steps After Testing

Once Instagram works:

1. **Add to Dashboard UI**
   - Update `ExclusiveTalentDashboard.jsx`
   - Show profile stats (followers, posts)
   - Display recent posts
   - Show last sync time

2. **Set up Cron Job**
   - Add to your cron scheduler
   - Run daily at 3 AM
   - Syncs all connected accounts automatically

3. **Production Deployment**
   - Update redirect URI to production domain
   - Set production env vars
   - Test token refresh logic

4. **Phase 2: TikTok**
   - Similar implementation
   - Different OAuth provider
   - Different API endpoints

---

## 🎉 You're Done!

Instagram integration is working when:
- ✅ OAuth popup opens and closes
- ✅ Success toast appears
- ✅ Profile data displays
- ✅ Posts sync automatically
- ✅ Database has records

**Total time: ~5 minutes**

Ready to move to Phase 2 (TikTok)? The foundation is now built, and the next platforms will be faster to implement using the same patterns.
