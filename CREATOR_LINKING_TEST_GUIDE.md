# Creator Auto-Linking - Testing Guide

## Quick Start Test Cases

### Prerequisites
1. Start the dev server: `npm run dev:local`
2. Have admin access to create test talents
3. Browser dev tools open (F12) to see console logs

---

## Test Case 1: Existing Talent + Matching Email → Auto-Linked ✅

### Setup
1. As Admin, go to Admin → Talents
2. Create new talent with:
   - Name: "Patricia Test"
   - Primary Email: `patricia.test+auto@example.com`
   - Leave unlinked (no user assigned)
3. Save and note the talent ID

### Execute
1. Signup as creator with email: `patricia.test+auto@example.com`
2. Complete onboarding form (all required fields)
3. Click "Complete Onboarding" button
4. Observe console (F12 → Console tab)

### Verify
```
✓ Console shows: "Creator talent linked/created: {action: 'LINKED', talentId: '...'}"
✓ Dashboard loads without 404
✓ Creator dashboard displays (no error state)
✓ Admin can navigate to Talents and see talentId now has linked user
```

**Console Log Pattern**:
```
[CREATOR_ONBOARDING] Completing onboarding for user: user_xxx, patricia.test+auto@example.com
[CREATOR_ONBOARDING] Found unlinked talent by email, linking: talent_yyy
[CREATOR_ONBOARDING] Talent linked successfully: talent_yyy
[CREATOR_ONBOARDING] User onboarding status updated
[CREATOR_ONBOARDING] Returning success response - action: LINKED, talentId: talent_yyy
Creator talent linked/created: { action: 'LINKED', talentId: 'talent_yyy', ... }
```

---

## Test Case 2: No Talent Record → Create + Link ✅

### Setup
1. Choose a unique email: `newcreator.test+date@example.com` (include timestamp)
2. Verify talent does NOT exist in admin panel
3. Note: You'll create one during signup

### Execute
1. Signup as creator with email: `newcreator.test+date@example.com`
2. Fill onboarding form:
   - Display Name: "New Creator Test"
   - Categories: Select 2-3 (e.g., "Tech", "Entertainment")
   - Representation: "NON_EXCLUSIVE"
3. Complete all required steps
4. Click "Complete Onboarding"
5. Observe console

### Verify
```
✓ Console shows: "Creator talent linked/created: {action: 'CREATED', talentId: '...'}"
✓ Dashboard loads
✓ Admin can navigate to Talents and see newly created talent
✓ Talent's primaryEmail matches signup email
✓ Talent has linked userId
```

**Console Log Pattern**:
```
[CREATOR_ONBOARDING] Completing onboarding for user: user_xxx, newcreator.test+date@example.com
[CREATOR_ONBOARDING] Creating new talent for user: user_xxx
[CREATOR_ONBOARDING] Talent created successfully: talent_zzz
[CREATOR_ONBOARDING] User onboarding status updated
[CREATOR_ONBOARDING] Returning success response - action: CREATED, talentId: talent_zzz
Creator talent linked/created: { action: 'CREATED', talentId: 'talent_zzz', ... }
```

---

## Test Case 3: Creator Logs In → Dashboard Loads ✅

### Prerequisites
- Complete Test Case 1 or 2 (have a linked talent)

### Execute
1. Logout (if still logged in)
2. Login with the creator email from Test Case 1 or 2
3. Navigate to creator dashboard: `/exclusive/overview`

### Verify
```
✓ No 404 errors in console
✓ Dashboard renders successfully
✓ Page title shows "Dashboard" or similar
✓ Navigation shows creator role
✓ No error banners or fallback UI
```

---

## Test Case 4: Deals/Tasks Visible to Creator ✅

### Prerequisites
- Creator account from Test Case 1 or 2 (linked talent)
- Admin: Go to Talents → Find the linked talent → Add sample deals/tasks

### Setup (Admin)
1. Go to Admin → Talents
2. Find the linked talent from Test Case 1/2
3. Click to view talent detail
4. Add a sample deal or task (if UI available) OR
5. Use Admin Tasks/Deals to create one linked to this talent

### Execute (Creator)
1. Login as creator
2. Go to Dashboard / Tasks / Deals sections
3. Verify items display

### Verify
```
✓ Tasks section shows newly created task
✓ Deals section shows newly created deal
✓ Can click to view details
✓ Can update status (if permissions allow)
✓ No errors when interacting with items
```

---

## Test Case 5: Admin Talent View Shows Linked User ✅

### Prerequisites
- Creator linked from Test Case 1 or 2

### Execute (Admin)
1. Go to Admin → Talents
2. Find the talent that was linked during creator onboarding
3. Click to view talent detail page

### Verify
```
✓ Detail page loads
✓ "Linked User" or "User Account" section visible
✓ Shows creator's email
✓ Shows creator's user ID
✓ Status shows "approved" or "pending" (appropriate)
✓ Can see user link/unlink option (if admin can modify)
```

---

## Edge Cases & Additional Tests

### Edge Case 1: Email Conflict
1. Create talent A with email: `conflict@example.com` linked to user 1
2. Try to signup with same email as different user
3. During onboarding completion, endpoint should return 409
4. **Expected**: Error logged, but creator still goes to dashboard (non-blocking)

### Edge Case 2: Already Linked User
1. Creator completes onboarding successfully (talent linked)
2. Somehow trigger endpoint again (e.g., re-submit form or via API call)
3. Endpoint should detect already linked and return action='ALREADY_LINKED'
4. **Expected**: Same response, no duplicate creation

### Edge Case 3: Case-Insensitive Email Match
1. Create talent with email: `TeSt@ExAmPlE.com`
2. Signup creator with email: `test@example.com` (all lowercase)
3. Should still match and link due to case-insensitive search
4. **Expected**: action='LINKED' because email matches case-insensitively

### Edge Case 4: Email with Whitespace
1. Create talent with email: `  test@example.com  ` (extra spaces)
2. Signup creator with email: `test@example.com`
3. Both normalize and should match
4. **Expected**: action='LINKED'

---

## Console Logs to Monitor

### Success Flows
```
[CREATOR_ONBOARDING] Completing onboarding for user: USER_ID, EMAIL
[CREATOR_ONBOARDING] Found unlinked talent by email, linking: TALENT_ID
[CREATOR_ONBOARDING] Talent linked successfully: TALENT_ID
// OR
[CREATOR_ONBOARDING] Creating new talent for user: USER_ID
[CREATOR_ONBOARDING] Talent created successfully: TALENT_ID
[CREATOR_ONBOARDING] Returning success response - action: LINKED|CREATED, talentId: TALENT_ID
```

### Error Flows
```
[CREATOR_ONBOARDING] No authenticated user  // 401 error
[CREATOR_ONBOARDING] Talent email exists but linked to different user  // 409 conflict
[CREATOR_ONBOARDING] Error: ...  // 500 server error
```

### Front-end Logs
```
Creator talent linked/created: { action: 'LINKED'|'CREATED'|'ALREADY_LINKED', ... }
Failed to link creator talent: { error: ... }  // If endpoint returns error
Error linking creator talent: ...  // If network error
```

---

## Debugging Checklist

If tests fail, check:

1. **Backend endpoint exists?**
   - File: `apps/api/src/routes/creator.ts`
   - Search: "complete-onboarding"
   - Should find POST endpoint around line 326

2. **Frontend integration exists?**
   - File: `apps/web/src/pages/OnboardingPage.jsx`
   - Search: "complete-onboarding" in finishOnboarding()
   - Should see fetch call

3. **Auth context working?**
   - Console should show user logged in
   - Check Network tab → API calls include auth header

4. **Email normalization working?**
   - Backend log should show normalized email (lowercase)
   - Try different email cases to verify

5. **Database connection?**
   - Check if Prisma connection works
   - Verify schema includes Talent.userId unique FK

6. **API endpoint accessible?**
   - Try manual API call: `curl -X POST http://localhost:3000/api/creator/complete-onboarding`
   - Should return 401 (no auth) not 404 (endpoint exists)

---

## Performance Notes

- **Endpoint latency**: Should be < 500ms (one DB query + update)
- **Non-blocking**: Frontend doesn't wait for response, continues to dashboard
- **Concurrent**: Multiple creators can onboard simultaneously

---

## Success Criteria

✅ All 5 test cases pass
✅ No 404 errors on creator dashboard
✅ Talents linked correctly in admin view
✅ Email case-insensitivity works
✅ Conflicts handled gracefully (409)
✅ Console logs show proper flow
✅ Non-blocking behavior works (errors don't prevent nav)

**Status**: Ready to test in local environment
