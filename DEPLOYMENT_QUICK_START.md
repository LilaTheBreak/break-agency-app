# DEPLOYMENT QUICK REFERENCE

**Date:** January 10, 2026  
**Status:** Ready for Production  

---

## PHASE 6: TALENT PROFILE REDESIGN ✅ READY

### What Changed
- 5 new card components for tabs (Opportunities, Contracts, Payments, Deliverables)
- Integrated into AdminTalentDetailPage.jsx
- Responsive grid layout (1 col mobile, 2 col desktop)
- Smooth animations inherited from Phase 5

### Build Status
```
✅ 3220 modules
✅ 0 errors
✅ Production ready
```

### Deployment Command
```bash
# Build is already done, just copy dist/
cp -r dist/* /production/dist/
```

### Verification (2 minutes)
```
✅ /admin/talent/{id} loads
✅ All 6 tabs render (Overview, Deals, Opportunities, Contracts, Payments, Deliverables)
✅ Cards display correctly
✅ Responsive on mobile/tablet/desktop
✅ Animations smooth on hover
```

### Commit
```
3f4fa8d - Phase 6: Tab Enhancement & Unification
```

---

## GMAIL OAUTH SETUP ⚠️ CREDENTIALS NEEDED

### What You Need
1. Google Cloud Project created
2. Gmail API enabled
3. OAuth 2.0 Client ID generated
4. GOOGLE_CLIENT_ID value
5. GOOGLE_CLIENT_SECRET value

### Setup Steps (60 minutes)
```
1. Create Google Cloud Project
2. Enable Gmail API + Google+ API
3. Create OAuth 2.0 Client ID
4. Save GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
5. Update .env.production with credentials
6. Restart API server
7. Test OAuth flow in browser
8. Verify emails appear in inbox
```

### Environment Variables to Update
```bash
# In .env.production:
GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>
GOOGLE_REDIRECT_URI=https://api.thebreakco.com/api/gmail/auth/callback
```

### Verification (5 minutes)
```
✅ Server logs show credentials loaded
✅ OAuth URL generates successfully
✅ Google login flow works
✅ GmailToken record created
✅ Emails appear in /admin/inbox
```

---

## COMBINED DEPLOYMENT SUMMARY

| Component | Status | Action | Time |
|-----------|--------|--------|------|
| **Phase 6 UI** | ✅ Built | Deploy dist/ | 5 min |
| **Gmail Setup** | ⚠️ Ready | Get credentials, update env | 60 min |
| **Testing** | ⚠️ Manual | Test both features | 15 min |
| **Total** | - | - | 80 min |

---

## QUICK DEPLOY CHECKLIST

### Pre-Deploy (10 min)
- [ ] Review DEPLOYMENT_PRODUCTION_GUIDE.md
- [ ] Backup current /production/dist
- [ ] Have Google Client ID & Secret ready

### Deploy Phase 6 (5 min)
```bash
cd /Users/admin/Desktop/break-agency-app-1
npm run build
cp -r dist/* /production/dist/
```

### Deploy Gmail (10 min)
```bash
# Update .env.production
nano .env.production
# Edit lines 36-52

# Restart server
pm2 restart api

# Verify logs
pm2 logs api | grep GMAIL
```

### Test Phase 6 (5 min)
- [ ] Navigate to /admin/talent/{id}
- [ ] Check all 6 tabs load
- [ ] Verify responsive design
- [ ] Test animations

### Test Gmail (5 min)
- [ ] Go to /admin/inbox
- [ ] Click "Connect Gmail"
- [ ] Complete Google login
- [ ] See emails appear

### Verify (5 min)
- [ ] Check server logs: no errors
- [ ] Check database: GmailToken created
- [ ] Check database: InboundEmail populated
- [ ] Wait for cron: should see sync logs

---

## ROLLBACK (If Needed)

### Phase 6 Issues
```bash
rm -rf /production/dist
cp -r /production/dist.backup.latest/* /production/dist/
```

### Gmail Issues
```bash
# Revert credentials
nano .env.production
# Set to placeholder values
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

pm2 restart api
```

---

## KEY FILES

### Phase 6
- New: [TabContentWrapper.jsx](apps/web/src/components/AdminTalent/TabContentWrapper.jsx)
- New: [OpportunitiesCard.jsx](apps/web/src/components/AdminTalent/OpportunitiesCard.jsx)
- New: [ContractsCard.jsx](apps/web/src/components/AdminTalent/ContractsCard.jsx)
- New: [PaymentsCard.jsx](apps/web/src/components/AdminTalent/PaymentsCard.jsx)
- New: [DeliverablesCard.jsx](apps/web/src/components/AdminTalent/DeliverablesCard.jsx)
- Modified: [AdminTalentDetailPage.jsx](apps/web/src/pages/AdminTalentDetailPage.jsx)

### Gmail
- Config: [.env.production](.env.production) (lines 36-52)
- Routes: [gmailAuth.ts](apps/api/src/routes/gmailAuth.ts)
- Services: [syncInbox.ts](apps/api/src/services/gmail/syncInbox.ts)
- Frontend: [InboxPage.jsx](apps/web/src/pages/InboxPage.jsx)

---

## MONITORING

### Watch These Logs
```bash
pm2 logs api | grep -E "(GMAIL|CRON|error)"
```

### Check These Tables
```sql
-- New emails synced
SELECT COUNT(*) FROM "InboundEmail";

-- Gmail connections
SELECT "userId", "lastSyncedAt" FROM "GmailToken";

-- AI analysis
SELECT COUNT(*) FROM "InboundEmail" WHERE "aiSummary" IS NOT NULL;
```

### Performance Metrics
- Page load: target <500ms
- Sync time: target <5 seconds
- Cron frequency: every 15 minutes
- Module count: 3220 (stable)

---

## SUPPORT CONTACTS

For issues, refer to:
- Phase 6 details: See git commit 3f4fa8d
- Gmail architecture: GMAIL_SYNC_AUDIT_COMPLETE.md
- Gmail setup: GMAIL_OAUTH_IMPLEMENTATION_STEPS.md
- Full deployment guide: DEPLOYMENT_PRODUCTION_GUIDE.md

---

**Status:** ✅ Ready to deploy  
**Risk Level:** 🟢 Low (no database migrations, feature-gated)  
**Downtime:** 0 minutes  
**Rollback Time:** <5 minutes  

**Questions?** Check the detailed guides linked above.
