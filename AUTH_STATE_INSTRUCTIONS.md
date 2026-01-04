# AUTH STATE GENERATION INSTRUCTIONS

**Status:** ⏸️ **PAUSED FOR HUMAN ACTION**

---

## 🎯 OBJECTIVE

Generate Playwright authentication state so tests can verify production truth against the live domain.

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### Step 1: Generate Auth State

Run this command in your terminal:

```bash
npx playwright codegen https://www.tbctbctbc.online
```

This will:
- Open a browser window
- Open Playwright Inspector
- Allow you to interact with the live site

---

### Step 2: Log In as SUPERADMIN

1. **In the browser window that opened:**
   - Navigate to the login page (if not already there)
   - Log in as a **SUPERADMIN** user
   - Ensure login is successful

---

### Step 3: Navigate to Talent Page

1. **In the browser window:**
   - Navigate to: `https://www.tbctbctbc.online/admin/talent`
   - **VERIFY:**
     - ✅ "Add New Talent" button is **VISIBLE**
     - ✅ Page loads **FULLY** (no loading spinners)
     - ✅ No error messages
     - ✅ You can see the talent management interface

---

### Step 4: Save Storage State

1. **In Playwright Inspector:**
   - Look for the "Save storage state" button or option
   - Click it
   - **OR** use the command:
     ```bash
     # In the Playwright Inspector, use the save command
     # Or manually copy the storage state from the inspector
     ```

2. **Save to file:**
   - File path: `playwright/.auth/admin.json`
   - Ensure the file is created in the correct location

---

### Step 5: Verify Auth State File

Run this command to verify:

```bash
ls -la playwright/.auth/admin.json
```

**Expected output:**
- File exists
- File is readable
- File contains JSON data

---

### Step 6: Resume Truth Verification

Once the auth state file exists, the system will automatically:

1. ✅ Load auth state in Playwright config
2. ✅ Re-run talent tests
3. ✅ Verify POST → GET → Render flow
4. ✅ Fix any backend query issues
5. ✅ Continue with deal → invoice tests

---

## ⚠️ IMPORTANT NOTES

### DO NOT:
- ❌ Commit `playwright/.auth/admin.json` to git (already in .gitignore)
- ❌ Share auth state files
- ❌ Use expired or invalid auth state
- ❌ Skip verification steps

### DO:
- ✅ Use SUPERADMIN account (required for `/admin/talent` access)
- ✅ Verify button visibility before saving
- ✅ Test that auth state works by running a test manually
- ✅ Regenerate if auth expires

---

## 🧪 TEST AUTH STATE (OPTIONAL)

After generating auth state, test it manually:

```bash
npx playwright test playwright/tests/talent-truth-test.spec.js --project=chromium
```

**Expected:** Test should find the "Add New Talent" button and proceed.

---

## 📊 VERIFICATION CHECKLIST

Before proceeding, verify:

- [ ] Auth state file exists: `playwright/.auth/admin.json`
- [ ] File contains valid JSON
- [ ] Logged in as SUPERADMIN
- [ ] `/admin/talent` page loads fully
- [ ] "Add New Talent" button is visible
- [ ] No console errors on page
- [ ] Auth state file is in `.gitignore`

---

## 🚀 NEXT STEPS

Once auth state is generated:

1. The system will automatically detect the file
2. Playwright will use it for all tests
3. Talent tests will run and verify truth
4. Any backend issues will be identified and fixed
5. Deal → invoice tests will proceed

---

**Status:** ⏸️ **WAITING FOR AUTH STATE GENERATION**

Generate the auth state file, then the system will automatically resume verification.

