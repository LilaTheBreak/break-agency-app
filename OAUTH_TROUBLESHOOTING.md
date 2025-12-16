# Google OAuth Login Troubleshooting

## Check These Items:

### 1. Google Cloud Console Configuration
Go to: https://console.cloud.google.com/apis/credentials

Find your OAuth 2.0 Client ID: `583250868510-2l8so00gv97bedejv9hq5d73nins36ag.apps.googleusercontent.com`

**Authorized JavaScript origins must include:**
- `http://localhost:5173`
- `http://localhost:5001`

**Authorized redirect URIs must include:**
- `http://localhost:5001/api/auth/google/callback`

### 2. Browser Console Errors
When you click "Continue with Google":

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Click "Continue with Google"
4. Look for errors or logs

Expected console output:
```
Starting Google login...
Fetching Google OAuth URL...
Response status: 200
Payload: { url: "https://accounts.google.com/..." }
Redirecting to: https://accounts.google.com/...
```

### 3. Common Issues:

**Issue: Popup Blocked**
- Solution: Check if browser is blocking popups
- The redirect should happen in the same window (not a popup)

**Issue: CORS Error**
- Symptom: Console shows "CORS policy" error
- Solution: API is already configured with correct CORS headers

**Issue: redirect_uri_mismatch**
- Symptom: Google shows error page
- Solution: Add `http://localhost:5001/api/auth/google/callback` to Google Console

**Issue: Nothing happens when clicking button**
- Check: Is JavaScript console showing errors?
- Check: Is API server running? (`lsof -ti :5001`)

### 4. Test Manually

**Step 1: Get OAuth URL**
```bash
curl http://localhost:5001/api/auth/google/url
```

Should return:
```json
{"url":"https://accounts.google.com/o/oauth2/v2/auth?client_id=..."}
```

**Step 2: Visit URL in Browser**
Copy the URL from above response and paste into browser address bar.
You should be redirected to Google login.

**Step 3: After Google Login**
Google will redirect back to:
```
http://localhost:5001/api/auth/google/callback?code=...
```

Then the API will redirect you back to:
```
http://localhost:5173
```

### 5. Quick Fix Commands

**Restart API server:**
```bash
cd /Users/admin/Desktop/break-agency-app
lsof -ti :5001 | xargs kill -9
pnpm --filter @breakagency/api dev
```

**Restart frontend:**
```bash
lsof -ti :5173 | xargs kill -9
pnpm --filter @breakagency/web dev
```

### 6. Environment Variables Check

**API (.env in apps/api):**
```bash
cd /Users/admin/Desktop/break-agency-app/apps/api
grep GOOGLE .env
```

Should show:
```
GOOGLE_CLIENT_ID=583250868510-2l8so00gv97bedejv9hq5d73nins36ag.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback
```

**Frontend (.env.local in apps/web):**
```bash
cd /Users/admin/Desktop/break-agency-app/apps/web
grep VITE .env.local
```

Should show:
```
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=583250868510-2l8so00gv97bedejv9hq5d73nins36ag.apps.googleusercontent.com
```

### 7. Next Steps

Try these in order:

1. **Open browser console** (F12) and click login button
2. **Check console logs** - look for the debug messages we just added
3. **Try the manual test** (curl command above)
4. **Verify Google Cloud Console** settings
5. **Report back** what error you see in the console
