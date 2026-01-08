# Handoff Checklist - Railway Deployment Fix

## For Next Team Member

This checklist guides you through the handoff and execution of the Railway deployment fix.

### Pre-Work (5 minutes)

- [ ] Read `WORK_SESSION_SUMMARY.md` for context
- [ ] Read `QUICK_START_NEXT_STEPS.md` for action steps
- [ ] Understand: **Fast Path** vs **Complete Path** trade-off
- [ ] Confirm: Do you have 1-2 hours (Fast) or 6-8 hours (Complete)?

### Decision Point

**Choose one:**

- [ ] **Fast Path** (1-2 hours) → Go to "Execute Fast Path" section
- [ ] **Complete Path** (6-8 hours) → Go to "Execute Complete Path" section

---

## Fast Path Execution (1-2 hours)

If choosing Fast Path, follow these steps:

### Step 1: Disable High-Error Features (20 min)

```bash
cd /Users/admin/Desktop/break-agency-app-1

# Open these files and COMMENT OUT the problematic imports

# File 1: apps/api/src/routes/admin/talent.ts
# Find line with: import * as suitabilityService
# Change to: // import * as suitabilityService from "..."
# Find line with: import * as strategy
# Change to: // import * as strategy from "..."

# File 2: apps/api/src/routes/admin/finance.ts
# Find line with: import * as commission
# Change to: // import * as commission from "..."

# File 3: Any route using undefined Prisma models
# grep -r "creatorBrandFit\|opportunityCluster\|brandSignal\|systemEvent" src/
# Comment out those imports
```

- [ ] Commented out `suitabilityService` import
- [ ] Commented out `strategy` imports
- [ ] Commented out `commission` service if causing issues
- [ ] Searched for undefined model references

### Step 2: Build and Verify (10 min)

```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/api
npm run build 2>&1 | tail -20
```

- [ ] Error count dropped to ~100-150 (was 722)
- [ ] Remaining errors are fixable
- [ ] No "Cannot find module" errors for core files

### Step 3: Quick Type Fixes (20 min)

Fix the easiest remaining errors:

```bash
# Fix Zod error handling
cd /Users/admin/Desktop/break-agency-app-1/apps/api

# Search for error patterns
grep -r "parsed.error\|result.error" src/ | head -5

# Fix pattern: Change
# if (parsed.error) res.json(parsed.error)
# To:
# if (!parsed.success) return res.status(400).json(parsed.error.flatten())
```

- [ ] Fixed Zod error handling patterns
- [ ] Fixed void return types
- [ ] Ran build again - errors stable or decreasing

### Step 4: Test Health Endpoint (10 min)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test health endpoint
curl http://localhost:3001/health

# Should return:
# {"status":"ok","db":"connected","gmail":"configured|missing","stripe":"enabled|disabled","timestamp":"...","uptime":0.xxx}
```

- [ ] Server starts without crashing
- [ ] `/health` endpoint returns 200
- [ ] Response JSON looks correct
- [ ] No errors in server logs

### Step 5: Commit and Deploy (5 min)

```bash
git add -A
git commit -m "fix: Disable broken features for Railway deploy - Fast Path

Disabled:
- suitabilityService (schema drift)
- strategy services (missing models)
- negotiation features (incomplete)

Result: Build passes, healthcheck 200, core features available.
Phase 2: Re-enable features with schema fixes."

git push origin main
```

- [ ] Committed with descriptive message
- [ ] Pushed to main branch
- [ ] Ready to merge (if using PR)

### Step 6: Monitor Railway Deployment (5 min)

```bash
# In Railway dashboard:
# 1. Trigger redeploy
# 2. Watch logs for errors
# 3. Check /health endpoint
# 4. Verify responds with 200
```

- [ ] Railway deployment triggered
- [ ] Build completes successfully
- [ ] `/health` returns 200
- [ ] No unhandled errors in logs

---

## Complete Path Execution (6-8 hours)

If choosing Complete Path, see: `RAILWAY_FIX_STATUS_REPORT.md` Section "Complete Path Options"

This requires:
1. Systematic schema audit (2-3 hours)
2. Schema fixes (2-3 hours)
3. Type fixes (1-2 hours)
4. Testing (1 hour)

- [ ] Time blocked: 6-8 hours uninterrupted
- [ ] Have `RAILWAY_FIX_STATUS_REPORT.md` open
- [ ] Follow Complete Path section step-by-step
- [ ] Build verification after each phase

---

## Success Criteria

**Fast Path Success:**
- [ ] Build completes: `npm run build` shows "✔️ Built successfully"
- [ ] Healthcheck works: `curl /health` returns 200
- [ ] Server starts: `npm run dev` starts without crashes
- [ ] Core features available: Can access main routes
- [ ] No critical errors: Logs show no unhandled exceptions

**Complete Path Success:**
- [ ] All Fast Path criteria met
- [ ] TypeScript errors: 0 (was 722)
- [ ] All features working: Test key modules
- [ ] Production ready: Full test pass

---

## Troubleshooting

### Build Still Has Errors

**Problem**: `npm run build` still shows many errors
**Solution**: 
- Check which files are causing errors
- Disable that feature/service
- Try: `grep "error TS" build.log | head -10`
- Comment out problematic imports
- Rebuild

### Healthcheck Returns 503

**Problem**: `/health` returns 503 instead of 200
**Solution**:
- Check logs: `npm run dev` should show error
- Look for: "Health check database error"
- Verify: DATABASE_URL is set in .env
- Try: Direct database connection test
- Check: Prisma client initialization

### Still Can't Deploy

**Problem**: Build passes locally but Railway deploy fails
**Solution**:
- Check: Railway build logs (similar to local build)
- Verify: Environment variables match (DATABASE_URL, API keys)
- Check: Node version compatibility
- Try: Force rebuild in Railway dashboard

---

## Documentation Reference

| Document | Purpose | Read Time |
|----------|---------|-----------|
| WORK_SESSION_SUMMARY.md | Session overview | 5 min |
| QUICK_START_NEXT_STEPS.md | Action steps | 5 min |
| RAILWAY_FIX_STRATEGY.md | Strategic options | 10 min |
| RAILWAY_FIX_STATUS_REPORT.md | Detailed analysis | 15 min |

---

## Quick Reference

**Commands you'll use:**
```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/api
npm run build          # Check if build passes
npm run dev            # Run dev server
curl http://localhost:3001/health  # Test healthcheck
git status             # Check what changed
git add -A && git commit -m "..."  # Commit changes
```

**Key files:**
- Build script: `package.json` (already fixed ✅)
- Schema: `prisma/schema.prisma` (add missing fields here)
- Healthcheck: `src/routes/health.ts` (must return 200)
- Entry point: `src/server.ts` (startup logic)

---

## Success Metrics

### After Fast Path (Expected)
- ✅ Build passes or near-passes
- ✅ /health returns 200
- ✅ Server stable
- ✅ Core functionality available

### After Complete Path (Expected)
- ✅ Build passes with 0 errors
- ✅ All features available
- ✅ Full test coverage
- ✅ Production ready

---

## Post-Deployment

### Fast Path Follow-Up
After successful Fast Path deploy:

1. **Document disabled features** (what's not available)
2. **Create issue**: "Phase 2: Re-enable features with schema fixes"
3. **Plan timeline**: When to re-enable each feature
4. **Notify users**: What features are temporarily unavailable

### Complete Path Follow-Up
After successful Complete Path deploy:

1. **Verify in production** (test each feature)
2. **Monitor logs** (watch for errors 24 hours)
3. **Update documentation** (schema changes)
4. **Plan next features** (safer now with clean schema)

---

## Questions?

If you get stuck:

1. **Check logs**: `npm run dev` output shows most issues
2. **Check docs**: All scenarios documented above
3. **Git history**: See what changed: `git log --oneline -10`
4. **Build errors**: `npm run build 2>&1 | grep error | head -20`

---

## Final Checklist

Before marking complete:

- [ ] Read all relevant docs (5-10 min)
- [ ] Chose Fast or Complete path
- [ ] Executed chosen path (1-8 hours)
- [ ] Verified success criteria
- [ ] Deployed to Railway
- [ ] Confirmed /health = 200
- [ ] Created follow-up issues if needed
- [ ] Documented what was done

---

**Status**: Ready for execution
**Difficulty**: Medium (mostly following guides)
**Risk**: Low (changes are localized)
**Support**: All decisions documented above

Good luck! 🚀
