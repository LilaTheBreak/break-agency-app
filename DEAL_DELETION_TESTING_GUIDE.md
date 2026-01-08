# Deal Deletion - Post-Deployment Testing Guide

**Feature:** Deal deletion with SUPERADMIN authorization  
**Deployment Commit:** 5fb6740  
**Status:** Deployed to Railway & Vercel (auto-deploys active)

---

## Pre-Flight Checks (5 minutes)

### 1. Verify Deployment Status

**Check Vercel Frontend:**
```bash
# Should return 200 OK
curl -I https://yourdomain.com

# Should show "main" branch with latest commit
```

**Check Railway Backend:**
```bash
# Should return 200 OK
curl -I https://api.yourdomain.com

# Verify DELETE endpoint exists (should error but endpoint responds)
curl -X DELETE https://api.yourdomain.com/api/admin/deals/test
```

### 2. Verify Logs Show No Errors

**Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select "break-agency-app" project
3. Go to "Deployments" tab
4. Find latest deployment (should be ~5 mins ago)
5. Click to see logs
6. Look for: "✅ Built successfully"
7. **Red flag:** Any build errors

**Railway Dashboard:**
1. Go to https://railway.app/dashboard
2. Select "break-agency-app" project
3. Go to "Deployments" tab
4. Find latest deployment
5. Click to expand logs
6. Look for: Build and deployment succeeds
7. **Red flag:** "error TS" or "compilation failed"

---

## Smoke Test (10 minutes)

### Test 1: Delete Button Visibility (SUPERADMIN)

**Setup:**
- Log in as a SUPERADMIN account
- Navigate to any talent detail page
- Find the "Deal Tracker" tab or section

**Test Steps:**
1. Look for deals in the table
2. Check for "Actions" column (rightmost)
3. Look for delete icon (trash bin)

**Expected Result:**
- ✅ Delete button visible (trash icon)
- ✅ Button is in the Actions column
- ✅ Button is RED or highlighted

**If Failed:**
- Check browser console (F12) for JavaScript errors
- Check user role: `/api/me` should show `role: "SUPERADMIN"`
- Check page has fresh Deal Tracker data

---

### Test 2: Delete Button Hidden (Non-SUPERADMIN)

**Setup:**
- Log in as a regular user (NOT SUPERADMIN)
- Navigate to same talent detail page
- Find the Deal Tracker section

**Test Steps:**
1. Look for the Actions column
2. Verify delete button is NOT visible

**Expected Result:**
- ✅ No delete button visible
- ✅ Actions column is empty or shows other icons only

**If Failed:**
- Clear browser cache: Ctrl+Shift+Delete
- Re-login to refresh user session
- Check user role in browser console: `await apiFetch('/api/me')`

---

### Test 3: Delete Button Confirmation Modal

**Setup:**
- Log in as SUPERADMIN
- Navigate to talent detail page
- Find a deal in the Deal Tracker table

**Test Steps:**
1. Click the delete button (trash icon)
2. Modal should appear
3. Verify modal shows:
   - Deal name/brand
   - Deal stage
   - Deal value
   - Confirmation message
   - Cancel button
   - Delete button

**Expected Result:**
- ✅ Modal pops up instantly
- ✅ Modal shows deal details
- ✅ Buttons are clearly labeled

**If Failed:**
- Check browser console (F12) for errors
- Verify modal CSS is loading: `dist/assets/index-*.css`
- Check if modal markup is in DOM (F12 → Elements tab)

---

## Integration Test (15 minutes)

### Test 4: Successful Deletion

**Setup:**
- Log in as SUPERADMIN
- Navigate to talent with deals (e.g., Patricia Bright)
- Count deals before deletion

**Test Steps:**
1. Click delete button on a deal
2. Modal opens with deal details
3. Click "Delete" button in modal
4. Watch for loading spinner

**Expected During Deletion:**
- ✅ Spinner visible
- ✅ Modal stays open
- ✅ Can see loading state

**Expected After Deletion:**
- ✅ Spinner disappears
- ✅ Success toast appears: "Deal deleted successfully"
- ✅ Modal closes automatically
- ✅ Deal removed from table
- ✅ Deal count decreased by 1

**If Failed:**
- Check browser console for errors
- Check network tab (F12 → Network):
  - DELETE request should show 200 OK
  - Response should be: `{ success: true, dealId: "..." }`
- If 403 error: User might not be SUPERADMIN
- If 404 error: Deal might have already been deleted

---

### Test 5: Unauthorized Deletion (Non-SUPERADMIN)

**Setup:**
- Log in as regular user
- Use browser dev tools to manually call API

**Test Steps:**
1. Open browser console (F12)
2. Run:
```javascript
const response = await fetch('/api/admin/deals/deal_xxx', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' }
});
const data = await response.json();
console.log(response.status, data);
```
3. Check response status and message

**Expected Result:**
- ✅ Response status: 403
- ✅ Response message: "Forbidden" or "Only SUPERADMIN can delete deals"

**If Failed:**
- Authorization check might not be working
- Check backend code: `apps/api/src/routes/admin/deals.ts`
- Verify `isSuperAdmin()` is being called

---

### Test 6: Delete Non-Existent Deal

**Setup:**
- Use browser console to test API directly

**Test Steps:**
1. Open browser console (F12)
2. Run:
```javascript
const response = await fetch('/api/admin/deals/nonexistent123', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' }
});
const data = await response.json();
console.log(response.status, data);
```

**Expected Result:**
- ✅ Response status: 404
- ✅ Response message: "Deal not found"

**If Failed:**
- Deal lookup might be broken
- Check backend: `prisma.deal.findUnique()`

---

### Test 7: Error Handling (Non-Blocking)

**Setup:**
- Log in as SUPERADMIN
- Prepare to delete a deal
- Simulate error (disconnect internet or use dev tools)

**Test Steps:**
1. Click delete on a deal
2. Modal opens
3. Disconnect network (or use dev tools to block request)
4. Click Delete button
5. Watch for error message

**Expected Behavior:**
- ✅ Error message appears in red box in modal
- ✅ Modal stays open (doesn't close on error)
- ✅ Can see retry/cancel options
- ✅ Spinner stops

**After Error:**
1. Reconnect network
2. Click Delete button again
3. Deletion should work

**Expected Result:**
- ✅ Can retry successfully
- ✅ Deal deleted on second attempt

**If Failed:**
- Error handling might be broken
- Check browser console for JavaScript errors
- Verify error state management in React component

---

## Audit & Logging Test (10 minutes)

### Test 8: Audit Log Recording

**Setup:**
- Have admin access to Neon database
- Have a deal ready to delete

**Test Steps:**
1. Get deal ID from table
2. Delete the deal via UI
3. Wait 5 seconds
4. Check audit logs in database:

```sql
-- Check destructive action logs
SELECT * FROM "DestructiveActionLog" 
WHERE "dealId" = 'deal_xxx'
ORDER BY "timestamp" DESC LIMIT 1;

-- Check admin activity logs
SELECT * FROM "AdminActivityLog"
WHERE action = 'ADMIN_DEAL_DELETED'
ORDER BY "timestamp" DESC LIMIT 1;
```

**Expected Result in destructive_action_log:**
- ✅ dealId matches
- ✅ action = 'DEAL_DELETED'
- ✅ entityType = 'Deal'
- ✅ timestamp is recent
- ✅ userId is your SUPERADMIN ID

**Expected Result in admin_activity_log:**
- ✅ event = 'ADMIN_DEAL_DELETED'
- ✅ metadata contains dealId
- ✅ timestamp matches

**If Failed:**
- Logging might not be initialized
- Check database connection in backend
- Check logs in Railway dashboard for errors

---

## Performance Test (5 minutes)

### Test 9: Response Time

**Setup:**
- Log in as SUPERADMIN
- Have multiple deals ready

**Test Steps:**
1. Delete 3 deals one after another
2. Measure time from click to modal appearance
3. Measure time from Delete button to modal close

**Expected Performance:**
- ✅ Modal appears: <500ms
- ✅ Deletion completes: <2 seconds
- ✅ Deal removal from table: instant

**Measure with Dev Tools:**
1. Open F12 → Network tab
2. Click delete
3. Watch DELETE request
4. Response time should show in Network tab

**Expected Timing:**
- ✅ DELETE request: <100ms
- ✅ Total round-trip: <500ms

**If Failed:**
- Network might be slow
- Database query might be inefficient
- Check Railway logs for slow queries

---

## Edge Cases (10 minutes)

### Test 10: Rapid Clicks (Double-Click Prevention)

**Setup:**
- Log in as SUPERADMIN
- Have a deal ready

**Test Steps:**
1. Click delete button twice rapidly
2. Watch spinner behavior

**Expected Result:**
- ✅ Only one deletion occurs
- ✅ Second click doesn't trigger another delete
- ✅ No duplicate deletions in audit log

**If Failed:**
- Double-click prevention might not be working
- Check loading state management

---

### Test 11: Modal Persistence After Error

**Setup:**
- Set up to trigger an error (see Test 7)

**Test Steps:**
1. Delete a deal with network disconnected
2. Error message appears
3. Reconnect network
4. Modal should still be visible
5. Click Delete again

**Expected Result:**
- ✅ Modal doesn't close on error
- ✅ Can retry without reopening modal
- ✅ Successful deletion on retry

---

### Test 12: Concurrent Deletions (Different Deals)

**Setup:**
- Open 2 browser tabs with same user
- Both logged in as SUPERADMIN

**Test Steps:**
1. In Tab 1: Click delete on Deal A
2. In Tab 2: Click delete on Deal B
3. Both modals should open
4. Delete both concurrently

**Expected Result:**
- ✅ Both deals deleted successfully
- ✅ No conflicts or errors
- ✅ Both shown in audit logs

---

## Rollback Procedure (If Issues)

### Option 1: Disable via Frontend (Fastest)

1. In [AdminTalentDetailPage.jsx](apps/web/src/pages/AdminTalentDetailPage.jsx):
   - Comment out lines 2051-2065 (delete button JSX)
2. Commit and push to `main`
3. Vercel auto-deploys
4. Delete button disappears in ~2 minutes

### Option 2: Disable via Backend

1. In [server.ts](apps/api/src/server.ts):
   - Comment out line ~550: `app.use("/api/admin/deals", adminDealsRouter)`
2. Commit and push to `main`
3. Railway auto-deploys
4. API endpoint becomes 404 in ~2 minutes

### Option 3: Emergency Revert

```bash
# If something is critically broken:
git revert 5fb6740
git push origin main

# Both platforms will re-deploy old code
```

---

## Test Report Template

After running all tests, fill out:

```markdown
## Test Results - Deal Deletion Feature

**Date:** [Today's date]
**Tested By:** [Your name]
**Environment:** Production

### Smoke Tests
- [ ] Deployment status: ✅ OK / ❌ Failed
- [ ] Frontend loads: ✅ OK / ❌ Failed
- [ ] Backend responds: ✅ OK / ❌ Failed

### Integration Tests
- [ ] SUPERADMIN sees delete button: ✅ OK / ❌ Failed
- [ ] Non-SUPERADMIN doesn't see button: ✅ OK / ❌ Failed
- [ ] Modal opens correctly: ✅ OK / ❌ Failed
- [ ] Deletion succeeds: ✅ OK / ❌ Failed
- [ ] Deal removed from table: ✅ OK / ❌ Failed
- [ ] Audit log recorded: ✅ OK / ❌ Failed

### Error Handling
- [ ] Unauthorized (403) handled correctly: ✅ OK / ❌ Failed
- [ ] Not found (404) handled correctly: ✅ OK / ❌ Failed
- [ ] Network error displayed non-blocking: ✅ OK / ❌ Failed

### Performance
- [ ] Modal appears in <500ms: ✅ OK / ❌ Failed
- [ ] Deletion completes in <2s: ✅ OK / ❌ Failed
- [ ] Double-click prevented: ✅ OK / ❌ Failed

### Overall Status
- [ ] ✅ ALL TESTS PASSED - Ready for production
- [ ] ❌ ISSUES FOUND - See details below

### Issues (if any)
[Describe any failures here]

### Notes
[Any additional observations]
```

---

## Support

### Common Issues & Fixes

**Issue:** Delete button not visible
- **Fix:** Check user is SUPERADMIN. Clear browser cache. Refresh page.

**Issue:** Delete fails with 403
- **Fix:** User is not SUPERADMIN. Use different account or contact admin.

**Issue:** Delete fails with 404
- **Fix:** Deal might have already been deleted. Refresh table to verify.

**Issue:** API not responding
- **Fix:** Check Railway deployment status. Wait 2 minutes for deploy to complete.

**Issue:** Frontend not updated
- **Fix:** Check Vercel deployment status. Clear browser cache. Hard refresh (Ctrl+Shift+R).

### Get Help

1. Check [DEAL_DELETION_DEPLOYMENT_COMPLETE.md](DEAL_DELETION_DEPLOYMENT_COMPLETE.md)
2. Check browser console (F12) for errors
3. Check deployment logs:
   - Vercel: https://vercel.com/dashboard
   - Railway: https://railway.app/dashboard
4. Ask for support with screenshot and error message

---

**Testing Guide Status:** ✅ COMPLETE  
**Deployment:** ✅ LIVE  
**Next Step:** Run smoke tests and report results
