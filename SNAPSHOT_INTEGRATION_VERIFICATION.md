# Snapshot Integration - Runtime Verification Checklist

## Pre-Runtime Setup
- [ ] Ensure API server is running with snapshot endpoints
- [ ] Ensure database has revenue data populated
- [ ] Clear browser cache/hard refresh to load new components

## Visual Verification

### Revenue Cards Rendering
- [ ] Deal revenue card displays with "£" formatting
- [ ] Commerce revenue card displays with "£" formatting  
- [ ] Total revenue card displays with "£" formatting
- [ ] Revenue goal progress card displays as percentage with progress bar

### Formatting Tests
- [ ] Small values: £0, £100, £999 display correctly
- [ ] Medium values: £1,234 → "£1k" format
- [ ] Large values: £1,234,567 → "£1.2M" format
- [ ] Percentages: 0%, 50%, 100% display with "%"
- [ ] Progress bar fills to match percentage

### Commerce Revenue Specific
- [ ] When commerce revenue = 0: "Connect a store" CTA appears
- [ ] CTA button is clickable and navigates to /exclusive/commerce
- [ ] When commerce revenue > 0: CTA disappears, value shows instead

### Revenue Goal Specific
- [ ] Goal card shows percentage
- [ ] Progress bar fills to percentage level
- [ ] Shows "X% of goal" text below progress bar
- [ ] Works when goal = 0 (shows 0%)
- [ ] Works when goal > 100% (progress bar still visible)

### Loading & Error States
- [ ] Section shows loading skeleton while fetching snapshots
- [ ] If API fails: shows error message
- [ ] If no snapshots: shows empty state
- [ ] Other sections (events, tasks) load regardless of snapshot errors

## Functional Tests

### API Integration
- [ ] Network tab shows GET /api/dashboard/snapshots request
- [ ] Request includes dashboardType=EXCLUSIVE_TALENT_OVERVIEW
- [ ] Request includes talentId parameter when present
- [ ] Response is array of snapshot objects
- [ ] Response includes all 4 revenue snapshots

### Admin Context
- [ ] Admin views talent A: sees talent A's snapshots
- [ ] Admin views talent B: sees talent B's snapshots  
- [ ] Admin views own profile: sees own snapshots
- [ ] Talent views own profile: sees own snapshots

### Navigation
- [ ] Clicking "Add Store" navigates to /exclusive/commerce
- [ ] Back navigation returns to overview
- [ ] Other section links (events, tasks) still work

## Browser Console
- [ ] No TypeScript errors related to useSnapshots
- [ ] No import errors for SnapshotCard
- [ ] No "undefined property" warnings
- [ ] No network errors fetching /api/dashboard/snapshots

## Performance
- [ ] Page loads in < 2 seconds
- [ ] No layout shifts after snapshots load
- [ ] Scrolling is smooth
- [ ] No memory leaks (check DevTools memory tab)

## Edge Cases
- [ ] When revenue = 0: displays "£0.00" not blank
- [ ] When goal not set: displays 0% not error
- [ ] When commerce = 0: shows CTA not blank
- [ ] When one snapshot fails: others still render
- [ ] When user has no snapshots: shows empty state

## Backwards Compatibility
- [ ] RevenueCard component still exists (if needed elsewhere)
- [ ] No old revenue endpoints still being called
- [ ] useExclusiveTalentData still loads other data correctly
- [ ] All other overview sections (events, tasks, calendar) work

## Code Quality
- [ ] No console.log() statements remain
- [ ] No commented-out code remains  
- [ ] No TODO comments unrelated to work
- [ ] Indentation and formatting consistent

## Final Verification
- [ ] Web app builds cleanly: `npm run build`
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] All 4 snapshots render correctly
- [ ] Ready for production deployment

---

## Test Data Scenarios

### Scenario 1: New Creator (No Revenue)
- Total Revenue: £0.00
- Deal Revenue: £0.00
- Commerce Revenue: £0.00 (shows "Connect a store" CTA)
- Revenue Goal Progress: 0% (no goal set)

### Scenario 2: Active Creator (With Deals)
- Total Revenue: £25,000
- Deal Revenue: £25,000
- Commerce Revenue: £0.00 (shows "Connect a store" CTA)
- Revenue Goal Progress: 50% (goal = £50,000)

### Scenario 3: Ecommerce Creator
- Total Revenue: £45,200
- Deal Revenue: £10,000
- Commerce Revenue: £35,200 (no CTA)
- Revenue Goal Progress: 75% (goal = £60,000)

### Scenario 4: Exceeded Goal
- Total Revenue: £75,000
- Deal Revenue: £30,000
- Commerce Revenue: £45,000 (no CTA)
- Revenue Goal Progress: 150% (goal = £50,000, progress bar full)

---

## Known Limitations (Expected)

1. API errors from snapshotResolver (pre-existing TypeScript issues)
   - Frontend integration is clean
   - Backend may need type fixes
   - Doesn't block frontend testing

2. API endpoint must be running
   - Can't test without backend
   - Requires database with data

3. Cache invalidation
   - Snapshots may take time to update after revenue changes
   - Depends on backend caching strategy

---

## Support

If issues occur:
1. Check browser console for errors
2. Check Network tab for API requests/responses
3. Verify API endpoint is accessible: `/api/dashboard/snapshots`
4. Verify database has RevenueSource, RevenueEvent, RevenueGoal tables
5. Verify Prisma schema is up to date: `npx prisma generate`

