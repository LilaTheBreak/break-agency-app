# Outreach Module - Quick Start Guide

**Status:** Ready to test  
**Version:** 1.0.0  
**Time to First Test:** 5 minutes

---

## 🚀 5-Minute Setup

### Step 1: Verify Servers Running

```bash
cd /Users/admin/Desktop/break-agency-app-1
pnpm dev
```

Wait for both servers to start:
- Web: ✅ http://localhost:5173
- API: ✅ http://localhost:5001

### Step 2: Navigate to Outreach

1. Open http://localhost:5173
2. Login (if not already)
3. Go to **Admin → Talent**
4. Click any talent
5. Scroll to **"Outreach"** section
6. You'll see "Outreach" tab

### Step 3: Create Your First Record

1. Click **"New Outreach"** button
2. Fill in:
   - **Target:** "Acme Corp"
   - **Contact:** "Sarah Johnson"
   - **Email:** "sarah@acme.com"
   - **Source:** "LinkedIn"
3. Click **"Create"**

✅ **Done!** Record appears in the list.

---

## 📋 Test Checklist

Run through these tests to verify everything works:

### Test 1: Create Records
- [ ] Create 3 different outreach records
- [ ] Use different sources (LinkedIn, Email, Referral)
- [ ] All show in list with `not_started` stage

### Test 2: View Pipeline
- [ ] Switch to **"Pipeline"** tab
- [ ] See 6 columns (one per stage)
- [ ] All 3 records in `not_started` column
- [ ] Count badge shows "3"

### Test 3: Update Stages
- [ ] Click first record detail
- [ ] Change stage to `awaiting_reply`
- [ ] Detail updates
- [ ] Click list, pipeline updates - record moved to new column

### Test 4: Mark as Replied
- [ ] Click second record
- [ ] Click **"Mark as Replied"** button
- [ ] emailsReplies count increases
- [ ] Stage auto-updates to `replied`

### Test 5: View Metrics
- [ ] Switch to **"Metrics"** tab
- [ ] See:
  - Total: 3
  - Response Rate: 33% (1 out of 3)
  - Conversion: 0 (none converted yet)
- [ ] All numbers are real data, not placeholders

### Test 6: Schedule Follow-up
- [ ] Click third record
- [ ] (Future: "Schedule Follow-up" button)
- [ ] For now, just verify stage management works

### Test 7: Search & Filter
- [ ] In List tab, search for "Sarah"
- [ ] Should find the Sarah Johnson record
- [ ] Filter by stage `awaiting_reply`
- [ ] Shows only the first record

### Test 8: Conversion (Optional)
- [ ] Click record detail
- [ ] (Future: "Convert to Opportunity" button)
- [ ] For now, verify metrics stay accurate

### Test 9: Data Persistence
- [ ] Refresh page
- [ ] All records still there
- [ ] Stages preserved
- [ ] Metrics still match

---

## 🎯 What to Look For

### Success Indicators ✅

- Outreach records create without errors
- Stages update immediately
- Pipeline counts match list
- Metrics update in real-time
- No console errors

### Common Issues 🔴

- Records not loading → API not running
- Metrics show 0 → No records created yet
- Stages not updating → Click detail modal to refresh
- Search not working → Type slowly, wait 500ms

---

## 📊 Quick Metrics Explanation

After completing all tests:

| Metric | Value | Meaning |
|--------|-------|---------|
| Total Outreach | 3 | Created 3 records |
| by Stage | 1 awaiting, 1 replied, 1 not_started | Distributed across stages |
| Response Rate | 33% | 1 of 3 replied |
| Conversion | 0% | None converted to opportunity yet |
| Follow-ups | 0 | None scheduled (for now) |

---

## 🔧 Troubleshooting

### "404 Not Found" for /api/outreach

**Fix:**
```bash
# Kill servers
Ctrl+C

# Clean and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Restart
pnpm dev
```

### "Network error" in browser

**Check:**
1. API running: `curl http://localhost:5001/api/health`
2. Token in localStorage: Open DevTools → Application → Cookies
3. CORS enabled: Check API logs for CORS errors

### Records not persisting

**Check:**
1. Database connected: Look for "Connected to Neon" in API logs
2. Prisma migrations: `pnpm exec prisma migrate deploy`
3. Check browser network tab for 500 errors

### Metrics show all zeros

**Normal if:**
- First test - no records yet
- After first record, wait 2-3 seconds
- Refresh metrics tab

---

## 💡 Pro Tips

1. **Use different sources** - Helps test "Top Sources" metric
2. **Mark some as replied** - Immediately shows response rate
3. **Check network tab** - See actual API responses
4. **Open DevTools** - Watch console for debug logs
5. **Test on refresh** - Ensures data persists

---

## 📈 Next: Advanced Testing

After basic tests pass:

1. **Test API directly:**
   ```bash
   curl http://localhost:5001/api/outreach \
     -H "Authorization: Bearer $(grep 'token=' .env | cut -d'=' -f2)"
   ```

2. **Test metrics:**
   ```bash
   curl http://localhost:5001/api/outreach/metrics/dashboard \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Test stage update:**
   ```bash
   curl -X PATCH http://localhost:5001/api/outreach/RECORD_ID/stage \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"stage":"replied"}'
   ```

---

## ✨ You're All Set!

- ✅ Server running
- ✅ Component loaded
- ✅ API wired
- ✅ Metrics working

**Start the test checklist above and verify each item.**

When all tests pass, you have a fully functional Outreach CRM system! 🎉

---

**Estimated Time:** 5-10 minutes for all 9 tests  
**Questions?** Check the complete guide: `OUTREACH_COMPLETE_GUIDE.md`
