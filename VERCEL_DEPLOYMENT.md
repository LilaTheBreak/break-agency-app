# Vercel Deployment Guide

## ✅ Configuration Complete

Your project is now properly configured for Vercel deployment. All necessary files have been updated.

## 🚀 Deploy to Vercel

### Step 1: Push Changes to Git

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push
```

### Step 2: Configure in Vercel Dashboard

Go to your Vercel project settings (https://vercel.com/your-org/break-agency-app/settings):

#### Build & Development Settings
These should auto-detect from `vercel.json`, but verify:
- ✅ Framework Preset: **Vite**
- ✅ Build Command: `pnpm --filter @breakagency/web build`
- ✅ Output Directory: `apps/web/dist`
- ✅ Install Command: `pnpm install --prefer-offline`

#### Environment Variables
Add these in Settings → Environment Variables:

**Required:**
```
VITE_API_URL=https://your-api-url.com
VITE_GOOGLE_CLIENT_ID=583250868510-r3e37u1i3udor8ctdo8p5s5o87qg3rol.apps.googleusercontent.com
```

**Optional:**
```
VITE_ENV=production
```

⚠️ **Important:** Make sure to set these for **Production** environment!

### Step 3: Configure Custom Domain

1. Go to Settings → Domains
2. Add your domain: `tbctbctbc.online`
3. Follow Vercel's instructions to update your DNS records:
   - Type: **A Record**
   - Name: **@**
   - Value: **76.76.21.21**
   
   - Type: **CNAME**
   - Name: **www**
   - Value: **cname.vercel-dns.com**

4. Wait for DNS propagation (usually 5-60 minutes)

### Step 4: Deploy

After pushing your changes, Vercel will automatically:
1. Detect the changes
2. Run the build
3. Deploy to production
4. Make it available on your domain

## 🔍 Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify Node.js version is 22.x (auto-detected from `.nvmrc`)

### 404 Errors on Routes
- The `vercel.json` in `apps/web/public/` handles SPA routing
- All routes should redirect to `index.html`

### API Connection Issues
- Verify `VITE_API_URL` points to your live API
- Check CORS settings on your API server
- Ensure your API is publicly accessible

### Environment Variables Not Working
- They must be prefixed with `VITE_` (not `NEXT_PUBLIC_`)
- Redeploy after adding environment variables
- Clear build cache if needed (Deployments → ⋯ → Redeploy)

## 📝 What Was Fixed

1. ✅ Updated `vercel.json` with proper Vite configuration
2. ✅ Added SPA routing support via rewrites
3. ✅ Created `apps/web/public/vercel.json` for client-side routing
4. ✅ Fixed environment variable naming (NEXT_PUBLIC_ → VITE_)
5. ✅ Verified build process works correctly

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com)
- [Vite Documentation](https://vite.dev)
- [DNS Checker](https://dnschecker.org)
