# Deployment Checklist - All Changes

## ✅ Changes Ready for Deployment

All changes have been committed and pushed to GitHub:

1. **Menu Alphabetization** (870c7ce)
   - All eligible menus alphabetized
   - Preserved Overview/Settings placement
   - No breaking changes

2. **Console Error Fixes** (792ece8)
   - Fixed Gmail suggested tasks error
   - Fixed MEETING_SUMMARIES ReferenceError
   - Added Talent menu to admin navigation

3. **OAuth Redirect Fix** (0a753e5) ⚠️ **REQUIRES ENV VAR**
   - Enforces production domain for OAuth redirects
   - Prevents redirects to Vercel preview URLs

## 🚀 Deployment Status

### Frontend (Vercel)
- ✅ **Auto-deploy enabled** - Pushes to `main` trigger automatic deployment
- ✅ **Status**: Should be deploying now
- 🔗 **Check**: https://vercel.com/dashboard

### Backend (Railway)
- ✅ **Auto-deploy enabled** - Pushes to `main` trigger automatic deployment
- ✅ **Status**: Should be deploying now
- ⚠️ **ACTION REQUIRED**: Set environment variable
- 🔗 **Check**: https://railway.app/dashboard

## ⚠️ Critical: Environment Variable Required

**Railway Environment Variable** (REQUIRED for OAuth fix):

```
FRONTEND_URL=https://www.tbctbctbc.online
```

### How to Set:
1. Go to Railway dashboard
2. Select your API service
3. Go to Variables tab
4. Add: `FRONTEND_URL` = `https://www.tbctbctbc.online`
5. Save (will trigger redeploy)

### Why This Matters:
- Without this, OAuth redirects may still use wrong domain
- The system will fallback to production domain, but explicit is better
- Ensures consistent behavior across all environments

## 📋 Post-Deployment Verification

### 1. Frontend (Vercel)
- [ ] Check Vercel deployment logs
- [ ] Verify build completes successfully
- [ ] Test production site loads correctly
- [ ] Verify menu alphabetization visible

### 2. Backend (Railway)
- [ ] Check Railway deployment logs
- [ ] Verify build completes successfully
- [ ] Verify `FRONTEND_URL` env var is set
- [ ] Check API health endpoint responds

### 3. OAuth Redirects (Critical)
- [ ] Test Gmail OAuth connection
- [ ] Verify redirect goes to `www.tbctbctbc.online`
- [ ] Verify NO redirects to `*.vercel.app`
- [ ] Test Google Calendar OAuth (if applicable)
- [ ] Verify sessions persist after redirect

### 4. Console Errors
- [ ] Check browser console for errors
- [ ] Verify no MEETING_SUMMARIES errors
- [ ] Verify no Gmail suggested tasks errors
- [ ] Verify Talent menu appears for admins

## 🔍 Monitoring

### Check Deployment Status:

**Vercel:**
```bash
# Check via Vercel CLI (if installed)
vercel ls
```

**Railway:**
```bash
# Check via Railway CLI (if installed)
railway status
```

### Check Logs:

**Vercel:**
- Dashboard → Project → Deployments → View logs

**Railway:**
- Dashboard → Service → Deployments → View logs

## 🐛 Troubleshooting

### If OAuth redirects still wrong:
1. Verify `FRONTEND_URL` is set in Railway
2. Check Railway logs for frontend URL warnings
3. Verify production domain is correct
4. Clear browser cache and cookies

### If build fails:
1. Check build logs for errors
2. Verify all dependencies installed
3. Check for TypeScript errors
4. Verify environment variables are set

### If menu not alphabetized:
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache
3. Verify deployment completed successfully

## 📝 Notes

- All changes are backward compatible
- No database migrations required
- No breaking API changes
- Environment variable is optional but recommended

## ✅ Success Criteria

- [x] All code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Railway deployment successful
- [ ] `FRONTEND_URL` env var set in Railway
- [ ] OAuth redirects go to production domain
- [ ] No console errors
- [ ] Menus alphabetized correctly
- [ ] Talent menu visible for admins
