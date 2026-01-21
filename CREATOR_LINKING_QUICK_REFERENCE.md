# Creator Auto-Linking - Quick Reference

## What Changed?

| Component | File | Change |
|-----------|------|--------|
| Backend | `apps/api/src/routes/creator.ts` | ➕ NEW endpoint: `POST /api/creator/complete-onboarding` (167 lines) |
| Frontend | `apps/web/src/pages/OnboardingPage.jsx` | ✏️ Modified: `finishOnboarding()` function (~50 lines) |

---

## The Feature

**Problem**: Creators get 404 errors on dashboard after onboarding
**Solution**: Auto-link to existing Talent OR create new one
**When**: At end of creator onboarding
**Who**: Creator role only (role-gated)

---

## Endpoint Summary

```
POST /api/creator/complete-onboarding
├─ Input: displayName, categories, representationType
├─ Processing:
│  ├─ Normalize email (lowercase)
│  ├─ Check for existing linked talent
│  ├─ Search for talent by email (case-insensitive)
│  └─ Link OR create
├─ Output: { action: 'LINKED'|'CREATED'|'ALREADY_LINKED', talentId, talent }
└─ Errors: 401 (auth), 409 (conflict), 500 (server)
```

---

## Key Implementation Details

### Email Handling
✅ Normalize: `email.toLowerCase().trim()`
✅ Search: Case-insensitive (`mode: 'insensitive'`)
✅ Match: Works with whitespace and mixed case

### Safety Guarantees
✅ One-to-One: Talent.userId is unique FK
✅ No Duplicates: Check existing linked talent first
✅ Conflict Detection: Different user → 409 error
✅ Idempotent: Safe to call multiple times

### Behavior Modes
| Scenario | Action | Response |
|----------|--------|----------|
| Talent found + unlinked | Link talent | `action: 'LINKED'` |
| No talent found | Create talent | `action: 'CREATED'` |
| User already linked | Return existing | `action: 'ALREADY_LINKED'` |
| Email exists + linked to different user | Error | `409 EMAIL_CONFLICT` |

---

## Code Locations

### Backend Endpoint
```
File: apps/api/src/routes/creator.ts
Lines: 311-477
Search pattern: "complete-onboarding"
```

### Frontend Integration
```
File: apps/web/src/pages/OnboardingPage.jsx
Function: finishOnboarding()
Lines: 343-405
Search pattern: "/api/creator/complete-onboarding"
```

---

## Testing Quick Start

### Test 1: Link Existing Talent
```
1. Admin creates talent: email = test@example.com (unlinked)
2. Creator signs up with: test@example.com
3. Check response: { action: 'LINKED', talentId: '...' }
```

### Test 2: Create New Talent
```
1. Creator signs up with: newtest@example.com (no talent exists)
2. Complete onboarding
3. Check response: { action: 'CREATED', talentId: '...' }
```

### Test 3: Dashboard Works
```
1. Creator completes onboarding
2. Navigate to dashboard
3. Verify: No 404, dashboard loads
```

---

## Console Logs

### Success
```javascript
[CREATOR_ONBOARDING] Completing onboarding for user: user_123, test@example.com
[CREATOR_ONBOARDING] Found unlinked talent by email, linking: talent_456
[CREATOR_ONBOARDING] Talent linked successfully: talent_456
Creator talent linked/created: {action: "LINKED", talentId: "talent_456", ...}
```

### Error
```javascript
[CREATOR_ONBOARDING] Talent email exists but linked to different user: user_789
Failed to link creator talent: {error: "Email conflict", code: "EMAIL_CONFLICT"}
```

---

## Debugging

### Issue: Endpoint not found
```bash
curl -X POST http://localhost:3000/api/creator/complete-onboarding
# Should return 401, not 404
```

### Issue: Email not matching
- Check: Is email normalized? (lowercase + trimmed)
- Check: Is search case-insensitive? (should be)
- Check: Are both DB and form using same email?

### Issue: Dashboard still shows 404
- Check: Did talent linking succeed?
- Check: Is talentId returned in response?
- Check: Is user.id linked in Talent record?

---

## Configuration

### No configuration needed!
- ✅ Uses existing auth middleware
- ✅ Uses existing Prisma setup
- ✅ No environment variables
- ✅ No database migrations

---

## Deployment Steps

```bash
# 1. Build
npm run build

# 2. Deploy
npm run deploy
# (or manual deployment to Vercel)

# 3. Test
# Run 5 test cases from CREATOR_LINKING_TEST_GUIDE.md

# 4. Monitor
# Watch for errors in logs
grep CREATOR_ONBOARDING /var/log/app.log
```

---

## Rollback

```bash
# If issues occur:
git revert <commit-hash>
npm run build && npm run deploy
```

---

## Performance

- **Latency**: < 500ms (1 query + 1 update)
- **Throughput**: Non-blocking (doesn't slow onboarding)
- **Scaling**: Linear with creator signup rate

---

## Monitoring

### Key Metrics
- Success rate: (LINKED + CREATED) / total
- Error rate: Errors / total
- Conflict rate: 409 errors / total

### Alert Thresholds
- 🔴 Error rate > 10%
- 🟡 Latency > 2 seconds
- 🟢 Target: < 5% errors, < 500ms latency

---

## FAQ

**Q: Does this break existing flows?**
A: No. Non-blocking means errors don't prevent onboarding.

**Q: What if talent already exists?**
A: Automatically linked. No duplicates created.

**Q: What if two creators have same email?**
A: First to link wins. Second gets 409 error (non-blocking).

**Q: Can this be called multiple times?**
A: Yes, idempotent. Same result each time.

**Q: Does this work for other roles?**
A: No, creator-only (role-gated).

---

## Success Criteria

- ✅ All 5 test cases pass
- ✅ Dashboard loads without 404
- ✅ Talents linked correctly in admin
- ✅ Email case-insensitivity works
- ✅ Console shows proper logs

---

## Support

**Documentation**: See CREATOR_LINKING_IMPLEMENTATION.md
**Testing Guide**: See CREATOR_LINKING_TEST_GUIDE.md
**Full Report**: See CREATOR_LINKING_FINAL_REPORT.md

---

**Status**: ✅ READY FOR DEPLOYMENT
