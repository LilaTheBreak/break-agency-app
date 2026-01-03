# STEP 0: Baseline Sanity Check Report

**Date:** January 2, 2026  
**Purpose:** Verify app boots cleanly before fixing features

---

## 1. BACKEND BOOT CHECK

### ✅ Server Configuration
- **Port:** `process.env.PORT || 5001` (defaults to 5001)
- **Health Endpoint:** `/api/health` exists
- **Startup:** Server listens on configured port

### ⚠️ Environment Variable Validation

**Required for Boot:**
- ✅ `DATABASE_URL` — Required (Prisma connection)
- ✅ `SESSION_SECRET` — Required (JWT signing)
- ✅ `JWT_SECRET` — Required (JWT signing)

**Optional (Warnings Only):**
- ⚠️ `GOOGLE_CLIENT_ID` — Warns if missing (Gmail features won't work)
- ⚠️ `GOOGLE_CLIENT_SECRET` — Warns if missing (Gmail features won't work)
- ⚠️ `GOOGLE_REDIRECT_URI` — Warns if missing
- ⚠️ `WEBHOOK_VERIFY_TOKEN` — Warns if missing (Meta webhook won't work)
- ⚠️ `GCS_PROJECT_ID` — Warns if missing (file uploads won't work)
- ⚠️ `GCS_BUCKET_NAME` — Warns if missing (file uploads won't work)
- ⚠️ `GOOGLE_APPLICATION_CREDENTIALS_JSON` — Warns if missing (file uploads won't work)

### ✅ Production Credential Validation
- **Location:** `apps/api/src/lib/env.ts` → `validateProductionCredentials()`
- **Behavior:** 
  - Development: Warns only
  - Production: **Exits with code 1** if invalid
- **Status:** ✅ Non-blocking in dev, blocking in prod (correct)

### ✅ GCS Configuration Validation
- **Location:** `apps/api/src/services/storage/googleCloudStorage.ts` → `validateGCSConfig()`
- **Behavior:** Warns only, server continues (file operations will error)
- **Status:** ✅ Non-blocking (correct)

### 🔴 Potential Boot Blockers

1. **Production Google OAuth Credentials**
   - **Issue:** Server exits if `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `GOOGLE_REDIRECT_URI` are invalid in production
   - **Impact:** Server won't start in production if credentials are "test" or missing
   - **Status:** ✅ Intentional (prevents broken production)

2. **Database Connection**
   - **Issue:** Prisma client initializes on import, but connection is lazy
   - **Impact:** Server boots even if DB is down (connection fails on first query)
   - **Status:** ⚠️ Acceptable (health check will catch it)

---

## 2. FRONTEND BUILD CHECK

### ✅ Vite Configuration
- **Config:** `apps/web/vite.config.js`
- **Proxy:** `/api` → `http://localhost:5001` (dev only)
- **Build:** Standard Vite + React setup

### ✅ API Base URL Configuration
- **Location:** `apps/web/src/services/apiClient.js`
- **Logic:**
  1. Reads `import.meta.env.VITE_API_URL`
  2. Falls back to `/api` (relative, uses proxy in dev)
  3. Normalizes trailing slashes and `/api` prefix
- **Production:** Uses `VITE_API_URL` env var (must be set in Vercel)
- **Status:** ✅ Handles both dev and production correctly

### ⚠️ Potential Runtime Issues

1. **Missing `VITE_API_URL` in Production**
   - **Issue:** Frontend falls back to `/api` (relative URL)
   - **Impact:** API calls will fail if frontend and backend are on different domains
   - **Fix Required:** Set `VITE_API_URL` in Vercel environment variables

2. **CORS Configuration**
   - **Backend:** Allows origins from `FRONTEND_ORIGIN` and `WEB_APP_URL` env vars
   - **Status:** ✅ Configured correctly

---

## 3. AUTHENTICATION CHECK

### ✅ Auth Flow
- **Backend:** `apps/api/src/routes/auth.ts`
- **Frontend:** `apps/web/src/services/authClient.js`
- **Session:** JWT tokens in cookies + Bearer tokens
- **Middleware:** `requireAuth` checks for `req.user.id`

### ✅ Protected Routes
- **Middleware:** `requireAuth` returns 401 if no user
- **Status:** ✅ Enforced on all CRM routes

### ⚠️ Role Enforcement
- **Issue:** CRM routes use `requireAuth` only, not role checks
- **Impact:** Any authenticated user can access CRM
- **Status:** ⚠️ May be intentional (multi-role CRM) or security gap

---

## 4. DATABASE CONNECTION CHECK

### ✅ Prisma Configuration
- **Location:** `apps/api/src/lib/prisma.ts`
- **Client:** Standard PrismaClient initialization
- **Connection:** Lazy (connects on first query)

### ✅ Health Check
- **Endpoint:** `GET /api/health`
- **Database Test:** `await prisma.$queryRaw\`SELECT 1\``
- **Response:** `{ status: "ok", db: "connected" | "error" }`
- **Status:** ✅ Health check will catch DB issues

### ⚠️ Potential Issues
1. **No Connection Pooling Validation**
   - **Issue:** Health check doesn't verify pool health
   - **Impact:** Connection pool exhaustion may not be detected
   - **Status:** ⚠️ Acceptable for MVP

---

## 5. API BASE URL CHECK

### ✅ Development
- **Frontend:** `http://localhost:5173` (Vite default)
- **Backend:** `http://localhost:5001` (default)
- **Proxy:** Vite proxies `/api` → `http://localhost:5001`
- **Status:** ✅ Works correctly

### ⚠️ Production
- **Frontend:** `https://www.tbctbctbc.online` (from audit)
- **Backend:** `https://breakagencyapi-production.up.railway.app`
- **Required:** `VITE_API_URL=https://breakagencyapi-production.up.railway.app/api`
- **Status:** ⚠️ Must be set in Vercel environment variables

---

## SUMMARY: BLOCKERS & WARNINGS

### 🔴 BLOCKERS (Must Fix)

**None** — Server boots successfully with required env vars.

### ⚠️ WARNINGS (Should Fix)

1. **Production API URL**
   - **Issue:** `VITE_API_URL` must be set in Vercel
   - **Impact:** Frontend API calls will fail if not set
   - **Action:** Verify `VITE_API_URL` is set in Vercel dashboard

2. **Role Enforcement on CRM Routes**
   - **Issue:** CRM routes accessible to any authenticated user
   - **Impact:** Security gap if CRM should be admin-only
   - **Action:** Decide policy (admin-only or multi-role), then enforce

3. **Database Connection Validation**
   - **Issue:** Server boots even if DB is down
   - **Impact:** First API call will fail, not startup
   - **Action:** Acceptable for MVP (health check catches it)

### ✅ WORKING CORRECTLY

1. ✅ Backend boots without errors (with required env vars)
2. ✅ Frontend builds without runtime errors
3. ✅ Auth middleware enforces authentication
4. ✅ Health check validates database connection
5. ✅ Environment variable validation warns appropriately
6. ✅ Production credential validation prevents broken deploys

---

## RECOMMENDATION

**✅ PROCEED TO STEP 1**

The baseline is clean. No blockers prevent moving forward with feature fixes.

**Before proceeding, verify:**
1. `VITE_API_URL` is set in Vercel production environment
2. Database is accessible (check `/api/health` endpoint)
3. Google OAuth credentials are valid in production

---

## NEXT STEP

Proceed to **STEP 1: Brands CRM** audit and fix.

