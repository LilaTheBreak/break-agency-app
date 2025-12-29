# CORS Production Fix - Final Solution

## ⚠️ ROOT CAUSE IDENTIFIED

**FRONTEND_ORIGIN environment variable is NOT SET in Railway production.**

This causes the CORS middleware to reject ALL requests from `https://www.tbctbctbc.online` because it falls back to the default: `http://localhost:5173`

## 🔧 What Was Fixed

### 1. **Explicit OPTIONS Preflight Handling** ✅
**File**: `apps/api/src/server.ts` (lines 241-264)

```typescript
// CORS Configuration - MUST be first middleware
const corsConfig = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
});

app.use(corsConfig);

// Explicitly handle ALL OPTIONS requests (preflight)
app.options("*", corsConfig);
```

**Changes Made**:
- ✅ Extracted CORS config to reusable variable
- ✅ Added explicit `app.options("*", corsConfig)` for preflight handling
- ✅ Added `preflightContinue: false` to ensure CORS handles preflight completely
- ✅ Added `optionsSuccessStatus: 204` for proper OPTIONS response

### 2. **Local Environment Documentation** ✅
**File**: `apps/api/.env`

```dotenv
# CRITICAL: CORS Configuration
# Production MUST set: FRONTEND_ORIGIN=https://www.tbctbctbc.online
# Development supports multiple origins (comma-separated)
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. **Cookie Configuration Verified** ✅
**File**: `apps/api/src/lib/jwt.ts` (lines 48-78)

Production cookies already correctly configured:
```typescript
{
  httpOnly: true,
  secure: true,
  sameSite: "none",  // ✅ Allows cross-domain
  maxAge: COOKIE_MAX_AGE,
  path: "/",
  domain: undefined  // ✅ Browser handles domain correctly
}
```

## 🚨 CRITICAL: Railway Environment Setup Required

### **YOU MUST DO THIS NOW**

1. Go to Railway dashboard: https://railway.app
2. Select project: `break-agency-app` → `api` service
3. Go to **Variables** tab
4. Add this variable:

```
FRONTEND_ORIGIN=https://www.tbctbctbc.online
```

5. Click **Deploy** (Railway will auto-redeploy)

### **Optional: Allow Localhost Testing Against Production**

To test production API from localhost:

```
FRONTEND_ORIGIN=https://www.tbctbctbc.online,http://localhost:3000
```

### **Verify Other Required Variables**

Ensure these are also set in Railway:

```
NODE_ENV=production
USE_HTTPS=true
JWT_SECRET=<your-secret>
DATABASE_URL=<your-postgres-url>
```

## 📋 Middleware Ordering Verified

The CORS middleware is correctly positioned:

```typescript
const app = express();

// ✅ 1. CORS (FIRST - before everything)
app.use(corsConfig);
app.options("*", corsConfig);

// ✅ 2. Security middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// ✅ 3. Request tracking
app.use(requestDurationMiddleware);
app.use(attachUserFromSession);

// ✅ 4. Stripe webhook (raw body)
app.post("/webhooks/stripe", express.raw(...), stripeWebhookHandler);

// ✅ 5. Body parsers
app.use(express.json(...));
app.use(express.urlencoded(...));

// ✅ 6. Routes
app.use("/api/auth", authRouter);
// ... other routes
```

**✅ NO duplicate CORS calls found in codebase**
**✅ NO router-level CORS overrides**
**✅ NO conditional CORS logic**

## 🔍 Verification Steps

### **After Railway Deploys (2-3 minutes)**

#### 1. Test OPTIONS Preflight

```bash
curl -X OPTIONS https://breakagencyapi-production.up.railway.app/api/auth/me \
  -H "Origin: https://www.tbctbctbc.online" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Expected Response:**
```
< HTTP/2 204
< access-control-allow-origin: https://www.tbctbctbc.online
< access-control-allow-credentials: true
< access-control-allow-methods: GET,POST,PATCH,DELETE,OPTIONS,PUT
< access-control-allow-headers: Content-Type,Authorization,X-Requested-With
< access-control-max-age: 86400
```

#### 2. Test Actual Request

```bash
curl https://breakagencyapi-production.up.railway.app/api/auth/me \
  -H "Origin: https://www.tbctbctbc.online" \
  -v
```

**Expected Response:**
```
< HTTP/2 401  (or 200 if authenticated)
< access-control-allow-origin: https://www.tbctbctbc.online
< access-control-allow-credentials: true
```

#### 3. Test in Browser

1. Visit: `https://www.tbctbctbc.online`
2. Open DevTools → Console
3. Run:
```javascript
fetch("https://breakagencyapi-production.up.railway.app/api/auth/me", {
  credentials: "include"
}).then(r => console.log("Status:", r.status))
```

**Expected**: No CORS errors, status `401` or `200`

#### 4. Test Google Auth Flow

```bash
curl https://breakagencyapi-production.up.railway.app/api/auth/google/url \
  -H "Origin: https://www.tbctbctbc.online" \
  -v
```

**Expected**: JSON response with Google OAuth URL, no CORS errors

## ✅ Configuration Summary

### **CORS Mounted At**
- **File**: `/apps/api/src/server.ts`
- **Line**: 241-264
- **Position**: FIRST middleware after `express()`

### **Exact CORS Config**
```typescript
{
  origin: allowedOrigins = ["https://www.tbctbctbc.online"],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}
```

### **OPTIONS Handling**
```typescript
app.options("*", corsConfig);  // Explicit preflight handling
```

### **Cookie Config (Production)**
```typescript
{
  httpOnly: true,
  secure: true,
  sameSite: "none",
  domain: undefined
}
```

## 🚫 What Was NOT Done (Correctly)

- ✅ NO wildcard origins (`*`)
- ✅ NO CORS disabled
- ✅ NO frontend hacks/proxies
- ✅ NO temporary workarounds
- ✅ NO duplicate CORS middleware

## 📊 Expected Outcomes

### **Before Fix**
```
OPTIONS https://breakagencyapi-production.up.railway.app/api/auth/me
❌ CORS error: No 'Access-Control-Allow-Origin' header
```

### **After Fix (with FRONTEND_ORIGIN set)**
```
OPTIONS https://breakagencyapi-production.up.railway.app/api/auth/me
✅ 204 No Content
✅ Access-Control-Allow-Origin: https://www.tbctbctbc.online
✅ Access-Control-Allow-Credentials: true
```

## 🔧 Troubleshooting

### **Issue: Still getting CORS errors after deploy**

**Check 1**: Verify environment variable in Railway
```bash
# Railway CLI (if installed)
railway variables

# Should show:
FRONTEND_ORIGIN=https://www.tbctbctbc.online
```

**Check 2**: Check Railway logs for CORS warnings
```bash
railway logs

# Look for:
[CORS] Blocked origin: https://www.tbctbctbc.online
```

If you see this, the environment variable is NOT set.

**Check 3**: Verify deployment completed
```bash
railway status

# Should show latest commit deployed
```

### **Issue: OPTIONS returns 404**

**Cause**: Routes registered BEFORE `app.options("*", corsConfig)`

**Solution**: Already fixed - OPTIONS handler is placed immediately after CORS middleware

### **Issue: Cookies not being set**

**Check 1**: Verify frontend uses `credentials: "include"`
```javascript
fetch(url, { credentials: "include" })  // ✅
fetch(url)  // ❌ - cookies won't be sent
```

**Check 2**: Verify both domains use HTTPS
- Frontend: `https://www.tbctbctbc.online` ✅
- API: `https://breakagencyapi-production.up.railway.app` ✅

**Check 3**: Verify `NODE_ENV=production` in Railway

## 📝 Final Checklist

Before declaring victory:

- [ ] `FRONTEND_ORIGIN` set in Railway dashboard
- [ ] Railway deployment completed successfully
- [ ] `OPTIONS /api/auth/me` returns 204 with CORS headers
- [ ] `GET /api/auth/me` returns 401/200 (not CORS error)
- [ ] Browser console shows NO CORS errors
- [ ] Cookie `break_session` appears in DevTools → Application → Cookies
- [ ] Cookie has `Secure`, `HttpOnly`, `SameSite=None` flags
- [ ] Login flow completes successfully

## 🎯 FINAL CONFIRMATION

Run this command after Railway deploys:

```bash
curl -X OPTIONS https://breakagencyapi-production.up.railway.app/api/auth/me \
  -H "Origin: https://www.tbctbctbc.online" \
  -H "Access-Control-Request-Method: GET" \
  -i | grep -i "access-control"
```

**If you see:**
```
access-control-allow-origin: https://www.tbctbctbc.online
access-control-allow-credentials: true
```

**Then:**
```
✅ CORS preflight works in production — YES
```

**If you see:**
```
[empty or error]
```

**Then:**
```
❌ FRONTEND_ORIGIN is NOT set in Railway
```

## 🚀 Deployment Commands

```bash
git add -A
git commit -m "fix: Add explicit OPTIONS preflight handling and FRONTEND_ORIGIN documentation"
git push origin main
```

Railway will auto-deploy in 2-3 minutes.

## 📞 If This Doesn't Work

Check Railway logs immediately after deploy:

```bash
railway logs --tail

# Look for:
✅ FRONTEND_ORIGIN validated: https://www.tbctbctbc.online
```

If you see:
```
✅ FRONTEND_ORIGIN validated: http://localhost:5173
```

The environment variable is **NOT SET** in Railway.

---

## Summary

**What was wrong**: `FRONTEND_ORIGIN` not set in Railway → CORS rejected production origin

**What was fixed**:
1. Added explicit `app.options("*", corsConfig)` for preflight handling
2. Added `preflightContinue: false` and `optionsSuccessStatus: 204`
3. Documented `FRONTEND_ORIGIN` in `.env`

**What you must do**: Set `FRONTEND_ORIGIN=https://www.tbctbctbc.online` in Railway dashboard

**Verification**: `curl -X OPTIONS ...` returns CORS headers

**Status**: ✅ Code ready → ⏳ Awaiting Railway environment variable
