# PROJECT STATUS REPORT

## 1. Project Summary
- **Scope**: Break Agency Console is a monorepo CRM platform that bundles the OAuth-backed API (`apps/api`), the React/Vite web dashboard (`apps/web`), and shared packages (`packages/shared`). It targets Google OAuth sign-in, JWT-backed sessions, creator/admin dashboards, Stripe, and internal automations.
- **Architecture**:
  - `apps/api`: Node/Express + TypeScript, Prisma ORM over PostgreSQL, Stripe jobs/cron, Google OAuth routes, JWT + httpOnly cookies, middleware for auditing/request context.
  - `apps/web`: React + Vite + React Router + context providers for sessions/auth, role-based dashboards for admin/brand/exclusive talent, API client with `credentials: "include"`.
  - Shared tooling: pnpm workspace, `packages/shared` utilities, centralized ESLint/tsconfig, `.env` driven configuration with `.env`, `.env.local`, `.env.production` variants.
  - **Auth flow**: Google OAuth (frontend obtains `/api/auth/google/url` → Google → API callback `/api/auth/google/callback`). API exchanges the code, signs a JWT via `signSessionToken`, and should set a `break_session` cookie (httpOnly + SameSite + Secure per env). `/api/auth/me` inspects cookies to hydrate users.

## 2. Current Functional Status
| Area | Status | Notes |
| --- | --- | --- |
| Google OAuth | **Partially Working** | OAuth URL construction/logging is correct; callback is hit, but session cookie is not sticking so auth round-trip is incomplete. |
| JWT cookie issuing & verification | **Partially Working** | Utility functions exist and are used, but cookie writers are still misconfigured (SameSite/Secure) so tokens never persist. |
| `/api/auth/me` session loading | **Blocked** | Always returning `{ user: null }` because no `break_session` cookie survives the callback. |
| Dashboard redirects & role-gated UI | **Partially Working** | Routes/components exist and depend on session context; without a user it falls back to blank/locked states. |
| Prisma database + migrations | **Working** | Prisma schema checked in, migrations apply, and app boots without schema errors after removing stale includes. |
| User + role seeding (admin accounts) | **Working** | `apps/api/prisma/seed-admins.ts` seeds `lila@` and `mo@` as admins; script wired into package.json. |
| Local environment (.env) | **Partially Working** | Client IDs unified and logged, but cookie env toggles (SameSite/Secure flags, frontend origin) still need refinement. |
| Production environment (Vercel + domain) | **Blocked** | Config placeholders exist, but OAuth redirect/origins and cookie domains for `tbctbctbc.online` have not been verified live. |
| API server functionality | **Working** | Express server runs (`pnpm --filter @breakagency/api dev`), routes mount, Stripe/webhook/test logs show normal operation. |
| Web frontend functionality | **Partially Working** | Vite dev server runs and dashboards render, yet login-dependent areas remain inaccessible due to missing session state. |

## 3. What Was Fixed Recently
- Unified Google OAuth Client IDs across API + web `.env` files; removed stray variants.
- Synced OAuth origins/redirect URIs and added logging in `server.ts`/`google` helper to debug env mismatches.
- Added admin seed script to Prisma so `lila@thebreakco.com` and `mo@thebreakco.com` have `admin` roles.
- Ensured `.env` files exist for API/web, plus console logs to validate `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` loading.
- Resolved Vite dev startup freeze by fixing module errors (e.g., calendar TS annotation) and ensuring `credentials: "include"` on fetch clients.
- Adjusted cookie config helpers (dev vs prod) so `secure`/`sameSite` can toggle, though final behavior still needs verification.

## 4. Current Blockers
1. `break_session` cookie is still not stored after Google callback; Chrome shows nothing under Application → Cookies.
2. `/api/auth/google/callback` likely finishes without calling `res.cookie(...)` successfully (or it sets `SameSite=None` + `secure=true` on localhost, causing silent drops).
3. SameSite/Secure misconfiguration for dev (should be `lax`/`false`) vs prod (`none`/`true`, domain `.tbctbctbc.online`) remains unresolved.
4. Because the cookie never persists, `/api/auth/me` keeps returning `{ user: null }`, so React context never hydrates and dashboards stay blank/loader.
5. Frontend shows a blank shell after login because ProtectedRoute thinks the user is unauthenticated.

## 5. Still To Do
- [ ] Verify cookie helper uses `secure=false`, `sameSite="lax"`, and no `domain` while running on `localhost`.
- [ ] Re-run Google OAuth flow and confirm callback exchanges tokens (inspect API logs for Google response + Prisma user creation/upsert).
- [ ] Ensure `setAuthCookie()` (or equivalent) executes and `res.cookie("break_session", ...)` is called before redirecting to the frontend.
- [ ] In Chrome DevTools → Application → Cookies, confirm `break_session` appears with the right attributes after login.
- [ ] After cookie exists, call `/api/auth/me` (e.g., `fetch(..., { credentials:"include" })`) and verify it returns `{ user: {...} }`.
- [ ] Confirm frontend context receives the user and `/dashboard` redirects to the correct role-based route (admin/exclusive/brand).
- [ ] Configure production env vars (`GOOGLE_REDIRECT_URI=https://tbctbctbc.online/api/auth/google/callback`, `FRONTEND_ORIGIN=https://tbctbctbc.online`) and test OAuth end-to-end on deployed infrastructure.
- [ ] Exercise Vercel (web) → Render/railway (api) calls to ensure CORS + cookies work cross-domain (`secure=true`, `sameSite="none"`, `domain=.tbctbctbc.online`).
- [ ] Remove/merge redundant `.env.local` / `.env.example` files to prevent drift.

## 6. Priority TODO (Next 5 Actions)
1. Update auth cookie middleware to respect `NODE_ENV` (lax/false locally, none/true + domain in prod) and redeploy API.
2. Run full Google OAuth locally, capture network requests, and verify cookie storage via DevTools.
3. Hit `/api/auth/me` post-login to confirm session hydration; fix Prisma include fields if necessary.
4. Validate React AuthContext consumes the session and dashboards redirect appropriately.
5. Replicate the same flow on the production domain (`tbctbctbc.online`) and adjust DNS/Vercel/Render config as needed.

## 7. Confidence Score
- **Confidence:** 0.73 (High-level repo inspection + recent logs point to cookie misconfiguration as the remaining blocker, but live testing still pending.)
