# 🔐 GitHub Actions Playwright CI/CD Setup

## ✅ What's Configured

### Workflow: `.github/workflows/playwright.yml`

The workflow automatically runs on:
- ✅ Every pull request (Phase 1 + Phase 2)
- ✅ Every push to `main` branch
- ✅ Every push to `develop` branch

**What it does:**
1. Checks out code
2. Installs Node.js 20
3. Installs dependencies
4. Installs Playwright browsers
5. Runs Phase 1 tests (20 tests, happy path)
6. Runs Phase 2 tests (10 tests, invariants)
7. Uploads HTML report to artifacts
8. Comments on PR with test summary
9. Enforces test status check

---

## 🔧 GitHub Settings Required

### Step 1: Enable Branch Protection (IMPORTANT)

1. Go to: **Settings → Branches**
2. Add rule for `main` branch
3. Check: **Require status checks to pass before merging**
4. Select check: `Test Status Check`
5. Check: **Require branches to be up to date**
6. Check: **Dismiss stale review approvals**
7. Click **Create**

```
Branch: main
  ✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Dismiss stale review approvals when new commits are pushed
  ✅ Require code reviews before merging (optional, recommended)
```

### Step 2: Create Environments (Optional)

**Settings → Environments → Production**

```
Name: production
Deployment branches: main
  ✅ Protected branches
```

---

## 🚀 How It Works

### On Pull Request:
```
1. User opens PR
   ↓
2. GitHub Actions triggers
   ↓
3. Runs Phase 1 tests (20 tests)
   ↓
4. Runs Phase 2 tests (10 tests)
   ↓
5. Comments on PR with results
   ↓
6. Status check appears: "Test Status Check"
   ├─ ✅ PASS → Merge button enabled
   └─ ❌ FAIL → Merge button disabled
```

### On Push to Main:
```
1. Push code to main
   ↓
2. GitHub Actions triggers
   ↓
3. Runs Phase 1 tests (20 tests)
   ↓
4. Runs Phase 2 tests (10 tests)
   ↓
5. Report uploaded to artifacts
   ├─ ✅ PASS → Deploy (if configured)
   └─ ❌ FAIL → Alert team
```

---

## 📊 Test Coverage

| Phase | Tests | What's Tested | Impact |
|-------|-------|---------------|--------|
| Phase 1 | 20 | Happy path, CRUD, errors | Core functionality |
| Phase 2 | 10 | Invariants, regression guards | Data integrity |

**Total:** 30 tests guarding production stability

---

## 📈 What Gets Checked

### Infrastructure
- ✅ API calls go to production (Railway)
- ✅ No localhost calls
- ✅ HTTPS only

### Authentication
- ✅ Protected routes require login
- ✅ Auth cookies work
- ✅ Non-admin users blocked

### CRUD Operations
- ✅ Create talent works
- ✅ Read (fetch) works
- ✅ Delete works & is idempotent
- ✅ List and detail views agree

### Data Safety
- ✅ No cascade deletes
- ✅ No data leaks between records
- ✅ Errors don't mutate data
- ✅ No ghost records
- ✅ No stale cache
- ✅ All required fields present

### Error Handling
- ✅ Errors are readable
- ✅ No 500 on missing resources
- ✅ Status codes correct (204, 404, etc)
- ✅ No "[object Object]" in errors

### Regression Guards
- ✅ Hard 500 error check
- ✅ Concurrent operations safe
- ✅ Idempotent retries work
- ✅ No race conditions

---

## ✨ Features

### 1. **HTML Report**
```
Artifacts stored for 30 days
Download: playwright-report.zip
View: Test results with screenshots
```

### 2. **PR Comments**
```
✅ Comment automatically added to each PR
📊 Shows test summary
🔗 Links to full report
```

### 3. **Status Check**
```
Required for merge
Name: Test Status Check
Blocks merge if tests fail
Cannot be overridden by admins
```

### 4. **Artifacts**
```
Saved for 30 days
Includes HTML report
Screenshots on failure
Video recordings on failure
```

---

## 🐛 Debugging Failed Tests

### View Test Results:
1. Go to PR or branch
2. Click **Details** next to "Test Status Check"
3. Or click **Artifacts** in Actions run
4. Download `playwright-report.zip`
5. Extract and open `index.html`

### Common Failures:

**Test: "Admin endpoints never return 500"**
- Check: Backend is running
- Check: No unhandled exceptions
- Solution: Fix backend error handling

**Test: "List and detail views agree"**
- Check: Both endpoints return same data
- Check: No response shape mismatch
- Solution: Normalize API responses

**Test: "Delete doesn't have side effects"**
- Check: No cascade deletes
- Check: Related records survive
- Solution: Fix delete logic

---

## 📋 Checklist

- [ ] Workflow file created (`.github/workflows/playwright.yml`)
- [ ] Committed to repository
- [ ] Pushed to GitHub
- [ ] Branch protection enabled for `main`
- [ ] Status check required: `Test Status Check`
- [ ] Tests run on PR creation (verify in Actions tab)
- [ ] Tests run on push to main (verify in Actions tab)
- [ ] PR comments appear (check a test PR)
- [ ] Merge blocked if tests fail (create failing test PR)

---

## 🚀 First Run

1. **Commit the workflow:**
   ```bash
   git add .github/workflows/playwright.yml
   git commit -m "ci: Add Playwright audit CI/CD workflow"
   git push origin main
   ```

2. **Enable branch protection:**
   - Go to Settings → Branches
   - Add rule for `main`
   - Require `Test Status Check` status check
   - Save

3. **Test it:**
   - Create a test PR
   - Verify tests run in Actions tab
   - Verify comment appears on PR
   - Verify merge is blocked if tests fail

---

## 📊 Sample PR Comment

When tests run, you'll see:
```
✅ Playwright Audit Complete

📊 Full system audit (Phase 1 & Phase 2) has been run.

🔍 What was tested:
- Infrastructure (real backend, no localhost)
- Authentication & permissions
- Talent CRUD operations (create, read, delete)
- Delete idempotency & safety
- Error handling & readable messages
- HTTP status codes (204, 404, 500)
- Data consistency & integrity
- Regression guards (no 500 errors)
- Concurrent operations
- Permission boundaries

📈 View detailed results:
[See test artifacts](...)

🚀 Merge safety: All tests must pass before merge is allowed.
```

---

## 🔒 Protection Rules

Once configured, the merge button will:

✅ **Allow merge if:**
- All tests pass (Phase 1 & Phase 2)
- Branch is up to date with main
- Code review approved (optional)

❌ **Block merge if:**
- Any test fails
- Status check fails
- Branch is out of date
- Required reviews not met

---

## 📈 Monitoring

### Check Test Results:
1. **Repository → Actions tab**
2. **Click latest run**
3. **View test output**
4. **Download artifacts** (if needed)

### Set Up Slack Notifications:
Add to workflow for real-time alerts:
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    slack-message-1-in-channel: true
    slack-webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🎯 Next Steps

1. ✅ Workflow file committed
2. ✅ Tests ready to run
3. 📝 Enable branch protection
4. 🧪 Test with a sample PR
5. 🚀 All merges now protected

---

**Status:** ✅ Ready to deploy  
**Impact:** Prevents regressions on every merge  
**Automation:** 100% (no manual intervention needed)  
**Cost:** Free (GitHub Actions included)

---

**Created:** 2026-01-05  
**Version:** 1.0  
**Quality:** Production-Ready
