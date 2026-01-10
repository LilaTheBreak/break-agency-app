# Talent Profile Image Auto-Sync - Quick Start Deployment

**Last Updated:** January 10, 2026  
**Status:** ✅ Production Ready  
**Build Status:** ✅ All checks passing (3220 modules, 0 errors)

---

## 📋 Pre-Deployment Checklist

- [x] Code implemented: TalentProfileImageService
- [x] API endpoints added: /profile-image/sync and /profile-image
- [x] Frontend updated: Refresh button + image display
- [x] Database migration created
- [x] Cron job registered
- [x] Build passing (zero errors)
- [x] Tests passing (manual verification complete)

---

## 🚀 Deployment Steps (5 minutes)

### Step 1: Review Changes (1 min)
```bash
git log --oneline -5
# Should see:
# aed45c3 Add comprehensive Talent Profile Image implementation guide
# cfba68f Talent Profile Image Auto-Sync Feature
```

### Step 2: Verify Build (1 min)
```bash
npm run build
# Should output:
# ✓ 3220 modules transformed
# ✓ built in ~20s
# apps/api build: Done
# No errors
```

### Step 3: Push to GitHub (1 min)
```bash
git push origin main
```

### Step 4: Verify Auto-Deploy (2 min)
**Vercel:**
- Go to: https://vercel.com/LilaTheBreak/break-agency-app/deployments
- Look for latest commit (cfba68f or later)
- Wait for "Ready" status (green checkmark)

**Railway:**
- Go to: https://railway.app (your project)
- Check "Latest Deployment" shows "Success"

### Step 5: Test in Production (Parallel)
1. Navigate to: https://app.thebreakco.com/admin/talent/[any-id]
2. Scroll to "Social Profiles" section
3. Add an Instagram handle (if not already connected)
4. Verify profile image appears in header avatar within 2-3 seconds
5. Click "..." (actions menu) in profile header
6. Click "Refresh Photo" button
7. Verify toast notification appears: "Profile photo updated from instagram"
8. Verify avatar updates to show new image

---

## 🔧 What Gets Deployed

### Database
- New migration: `20260110_add_talent_profile_image`
- Adds 3 columns to Talent table
- Adds 2 indexes
- ✅ **Backward compatible** (no data loss)

### Backend
- New service: `TalentProfileImageService.ts`
- New API endpoints: `/profile-image/*`
- Auto-sync on social account connect/disconnect
- Daily cron job at 2am

### Frontend
- Updated: `TalentCommandHeader.jsx`
- Added: Refresh Photo button
- Priority: Social image > User avatar > Initials
- Loading & error states

---

## 📊 What to Expect

### Immediate (Within 1 hour)
- ✅ Deployment completes on Vercel/Railway
- ✅ New avatars appear for talents with social profiles
- ✅ Refresh button works in actions menu
- ✅ No layout shifts or visual issues

### Daily (At 2:00 AM UTC)
- ✅ Cron job syncs up to 200 talents
- ✅ Profile images refreshed for those with 24hr+ since last sync
- ✅ Logs show: `[CRON] Daily talent profile image sync completed`

### Monitoring
- ✅ Check server logs for `[TALENT_IMAGE]` entries
- ✅ Monitor API endpoints: `/profile-image/sync` and `/profile-image`
- ✅ Watch for errors (invalid credentials, network issues)

---

## ✅ Verification Checklist (Post-Deployment)

After deployment, verify these work:

### Admin Dashboard
- [ ] Login as admin
- [ ] Go to /admin/talent/[any-id]
- [ ] Profile header shows social image (if connected)
- [ ] Image is circular, no distortion
- [ ] Size is consistent with other avatars

### Manual Refresh
- [ ] Click "..." dropdown in profile header
- [ ] Click "Refresh Photo"
- [ ] Loading spinner shows (briefly)
- [ ] Success toast: "Profile photo updated from instagram"
- [ ] Avatar updates (may cache, hard-refresh if needed)

### Talent Lists
- [ ] Go to /admin/talent (list view)
- [ ] Verify avatars show social images
- [ ] Fallback to initials for those without social profiles
- [ ] No broken images or 404s in console

### Network
- [ ] Open DevTools → Network tab
- [ ] Refresh talent profile page
- [ ] Verify GET /api/admin/talent/[id] returns profileImageUrl
- [ ] Verify GET /api/admin/talent/[id]/profile-image works
- [ ] No 404s or 500s

### Console
- [ ] Open DevTools → Console tab
- [ ] No TypeScript errors
- [ ] No "undefined is not a function" errors
- [ ] Look for `[TALENT_IMAGE]` logs (optional, debug logs)

---

## 🚨 If Something Goes Wrong

### Issue: Profile images not appearing

**Quick Fix:**
1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Try manual sync: Click "Refresh Photo" button
3. Check browser console for errors

**Root Cause Check:**
1. SSH into server, check logs: `tail -f logs/error.log`
2. Look for `[TALENT_IMAGE]` entries
3. Check if social accounts are marked `connected: true`
4. Verify API tokens for Instagram/TikTok/YouTube

### Issue: Refresh button shows error

**Quick Fix:**
1. Retry in a few minutes
2. Ensure social account is still connected
3. Check if social platform is having issues

**Debug:**
1. POST to `/api/admin/talent/[id]/profile-image/sync` manually
2. Check response for specific error message
3. Review server logs for details

### Issue: Cron job not running

**Quick Fix:**
1. Restart server to re-register cron jobs
2. Check server timezone: `date` or env var `TIMEZONE`
3. Verify `/api/admin/talent/[id]/profile-image` endpoint works (tests API connectivity)

**Monitor:**
1. Check server logs at 2:00 AM UTC daily
2. Look for: `[CRON] Starting daily talent profile image sync...`
3. Should see: `[CRON] Daily talent profile image sync completed`

---

## 📈 Performance Expectations

- **Manual refresh:** < 1 second (with network latency)
- **Avatar load:** Browser cached (1-2ms after first load)
- **API response:** < 100ms (local database)
- **Daily cron:** 200 talents × ~200ms = ~40 seconds total

---

## 🔄 Rollback Plan (If Needed)

If issues occur, rollback is straightforward:

```bash
# 1. Revert commits
git revert cfba68f aed45c3

# 2. Rebuild
npm run build

# 3. Redeploy
git push origin main
```

**Impact:**
- Profile images revert to initials
- API endpoints removed (no client errors, just won't call them)
- No data loss (migration is backward compatible)
- Service restored within 5 minutes

---

## 📚 Documentation Links

- **Full Implementation Guide:** [TALENT_PROFILE_IMAGE_IMPLEMENTATION.md](./TALENT_PROFILE_IMAGE_IMPLEMENTATION.md)
- **Service Code:** `apps/api/src/services/talent/TalentProfileImageService.ts`
- **API Routes:** `apps/api/src/routes/admin/talent.ts` (search for `/profile-image`)
- **Frontend Component:** `apps/web/src/components/AdminTalent/TalentCommandHeader.jsx`
- **Cron Job:** `apps/api/src/cron/index.ts` (search for `daily talent profile image sync`)

---

## 🎯 Success Criteria

Deployment is successful when:

1. ✅ Build passes on Vercel/Railway
2. ✅ No console errors in browser
3. ✅ Social profile images appear in admin talent profile headers
4. ✅ Refresh Photo button works (shows toast on success)
5. ✅ Avatars update when social account is added
6. ✅ Avatars revert to initials when social accounts removed
7. ✅ Daily cron job runs at 2am (check logs)
8. ✅ No API errors in server logs

---

## 📞 Troubleshooting Command Reference

```bash
# Check build
npm run build

# View git log
git log --oneline -5

# Check migrations pending
npx prisma migrate status

# View server logs (if SSH access)
tail -f logs/error.log | grep TALENT_IMAGE

# Test API endpoint (replace TALENT_ID)
curl https://api.thebreakco.com/api/admin/talent/TALENT_ID/profile-image \
  -H "Authorization: Bearer YOUR_TOKEN"

# Manually trigger sync (replace TALENT_ID)
curl -X POST https://api.thebreakco.com/api/admin/talent/TALENT_ID/profile-image/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## ✨ Done!

You're all set. The talent profile image auto-sync feature is now live!

**Key Takeaway:** This feature automatically fetches and displays social media profile images for talents, creating a more professional, premium experience. No additional configuration needed—it just works.

Enjoy! 🎉
