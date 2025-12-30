# Railway Deployment Guide
**Date:** 2025-01-02  
**Issue:** Railway auto-deploy not triggering

## Quick Fix: Manual Deployment

### Option 1: Railway Dashboard (Recommended)
1. Go to https://railway.app/dashboard
2. Select your API service
3. Click **"Deploy"** or **"Redeploy"** button
4. Monitor deployment logs

### Option 2: Railway CLI
```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project (if not already linked)
railway link

# Deploy
railway up
```

## Troubleshooting Auto-Deploy

### Check 1: GitHub Webhook Configuration
1. Go to Railway dashboard → Your Service → Settings
2. Check **"GitHub"** section
3. Verify:
   - ✅ Repository is connected
   - ✅ Webhook is active
   - ✅ Correct branch selected (should be `main`)

### Check 2: Auto-Deploy Settings
1. Go to Railway dashboard → Your Service → Settings
2. Check **"Deploy"** section
3. Verify:
   - ✅ **"Auto Deploy"** is enabled
   - ✅ Branch is set to `main`
   - ✅ Root directory is correct (if monorepo)

### Check 3: Service Configuration
For monorepo setup, verify:
- **Root Directory:** Should be `apps/api` (or leave blank if Railway detects it)
- **Build Command:** Should be `pnpm --filter @breakagency/api build`
- **Start Command:** Should be `cd apps/api && npx prisma migrate deploy && node dist/server.js`

### Check 4: Recent Deployments
1. Go to Railway dashboard → Your Service → Deployments
2. Check latest deployment:
   - If it shows "Failed" → Check logs for errors
   - If it shows "Success" but old → Auto-deploy may be disabled
   - If no deployments → Service may not be linked to GitHub

### Check 5: Build Configuration
Verify `.nixpacks.toml` exists and is correct:
```toml
[phases.setup]
nixPkgs = ["nodejs_22"]

[phases.install]
cmds = [
  "npm install -g pnpm@8.15.8",
  "pnpm install --frozen-lockfile"
]

[phases.build]
cmds = [
  "pnpm --filter @breakagency/shared build",
  "pnpm --filter @breakagency/api exec prisma generate --schema=./prisma/schema.prisma",
  "pnpm --filter @breakagency/api build || echo 'Build completed with warnings'"
]

[start]
cmd = "cd apps/api && npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"
```

## Manual Deployment Steps

### Via Railway Dashboard
1. Navigate to https://railway.app/dashboard
2. Select your API service
3. Click **"Deploy"** tab
4. Click **"Redeploy"** or **"Deploy Latest"**
5. Monitor the deployment logs

### Via Railway CLI
```bash
# Ensure you're in the project root
cd /Users/admin/Desktop/break-agency-app-1

# Login (if needed)
railway login

# Link to project (if needed)
railway link

# Deploy
railway up --service "@breakagency/api"
```

## Verification

After deployment, verify:
1. ✅ Service shows "Active" status
2. ✅ Latest deployment shows "Success"
3. ✅ API responds at Railway URL
4. ✅ Health check endpoint works
5. ✅ No errors in deployment logs

## Common Issues

### Issue: "No deployments found"
**Solution:** Service may not be linked to GitHub. Link it in Railway dashboard → Settings → GitHub

### Issue: "Build failed"
**Solution:** Check build logs for errors. Common issues:
- Missing environment variables
- TypeScript errors (check for non-blocking worker code errors)
- Prisma schema issues

### Issue: "Deployment succeeded but service not running"
**Solution:** Check start command and environment variables

## Next Steps

1. **Immediate:** Trigger manual deployment via Railway dashboard
2. **Short-term:** Fix auto-deploy configuration (webhook/settings)
3. **Long-term:** Set up deployment notifications/monitoring

## Support

If issues persist:
1. Check Railway status: https://status.railway.app
2. Review Railway docs: https://docs.railway.app
3. Check Railway community: https://discord.gg/railway

