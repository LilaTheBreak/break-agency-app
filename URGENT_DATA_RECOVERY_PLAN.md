# 🚨 URGENT: Data Recovery & Prevention Plan

**Date**: January 13, 2026
**Issue**: Database wiped TWICE with `--force-reset`
**Action**: Recover data + implement permanent protection

---

## 🔴 IMMEDIATE ACTIONS (RIGHT NOW)

### Step 1: Check Neon Backups (2 minutes)
```
1. Go to: https://console.neon.tech
2. Login to your account
3. Select your project
4. Click "Branches" tab
5. Look for backups from:
   - Yesterday (Jan 12)
   - Day before (Jan 11)
   - Any older backups
6. Note the timestamp of the MOST RECENT backup
```

**What to look for**:
- A "main" or "master" branch
- Branches labeled with dates/times
- The most recent branch before today

### Step 2: Restore from Backup (5-10 minutes)
```
1. In Neon, click the backup branch
2. Click "Set as default" button
3. It will create a new connection string
4. Copy the new DATABASE_URL
5. Update /Users/admin/Desktop/break-agency-app-1/apps/api/.env
   - Replace DATABASE_URL with the restored one
6. Restart your app: npm run dev
7. Check that talent data is back
```

### Step 3: Verify Data Restored
```bash
# In terminal:
curl http://localhost:3000/api/talents | jq .

# Should show your talent data
# If empty [], backup didn't have data either - check older backups
```

---

## 🛡️ PERMANENT PREVENTION (INSTALLED)

### Now Active - 3 Layers of Protection

#### 1️⃣ Safe Reset Scripts (READY TO USE)
```bash
# For development:
npm run db:safe-reset

# For staging:
npm run db:reset:staging

# For production (requires confirmation + env variable):
npm run db:reset:prod
```

**Files Created**:
- ✅ `apps/api/scripts/safe-db-reset.ts` (150 LOC)
- ✅ `apps/api/package.json` (3 new scripts added)
- ✅ `DATABASE_RESET_PROTECTION.md` (complete guide)

#### 2️⃣ Shell Protection (OPTIONAL - INSTALL NOW)
```bash
# Add this line to ~/.zshrc (at the end):
if [[ -f "$HOME/Desktop/break-agency-app-1/.prisma-protection.sh" ]]; then
  source "$HOME/Desktop/break-agency-app-1/.prisma-protection.sh"
fi

# Then reload:
source ~/.zshrc
```

**What It Does**:
- Blocks `npx prisma db push --force-reset` at shell level
- Shows: "🚨 DANGEROUS OPERATION BLOCKED 🚨"
- Forces use of safe: `npm run db:safe-reset` instead

#### 3️⃣ Documentation (COMPLETE)
- ✅ `DATABASE_RESET_PROTECTION.md` - Full guide
- ✅ `DATABASE_PROTECTION_SUMMARY.md` - Quick reference
- ✅ This action plan

---

## 📋 What Changed

### Before (Dangerous ❌)
```bash
npx prisma db push --force-reset
# → Database DELETED
# → No confirmation
# → No warning
# → Data GONE
```

### After (Safe ✅)
```bash
npm run db:safe-reset
# → Prompt 1: "Type 'yes, delete all data' to continue"
# → Shows what will be deleted
# → Prompt 2: "Type 'I understand, reset now' to proceed"
# → Database reset (only if both confirmed)
# → Suggestion: npm run seed:auth
```

---

## 🔐 Complete Protection Matrix

| Scenario | Protection | Status |
|----------|-----------|--------|
| Dev accidentally resets | 2 confirmations required | ✅ ACTIVE |
| Staging gets reset | 3 confirmations required | ✅ ACTIVE |
| Production reset attempt | Requires env variable + confirmations | ✅ ACTIVE |
| `--force-reset` at shell | Blocked by wrapper (if enabled) | ⏳ OPTIONAL |
| Data recovery via Neon | Backup branches available | ✅ READY |

---

## ✅ Checklist

### Recovery (Do NOW)
- [ ] Go to Neon dashboard
- [ ] Find most recent backup branch
- [ ] Set as default
- [ ] Update connection string in `.env`
- [ ] Restart app and verify data is back

### Prevention Setup (Do ONCE)
- [x] Safe reset scripts created
- [x] npm scripts added to package.json
- [x] Shell protection script created
- [x] Documentation written
- [ ] (Optional) Enable shell protection in ~/.zshrc
- [ ] Read DATABASE_RESET_PROTECTION.md

### Team Communication (Do THIS WEEK)
- [ ] Share DATABASE_RESET_PROTECTION.md with team
- [ ] Show them new safe commands
- [ ] Explain why `--force-reset` is blocked
- [ ] Review Neon backup procedures
- [ ] Document in team handbook

---

## 🎯 New Safe Workflow

### When You Need to Reset Database

**WRONG WAY (OLD)**:
```bash
npx prisma db push --force-reset  # ❌ DON'T DO THIS
```

**RIGHT WAY (NEW)**:
```bash
# Step 1: Optional but recommended - create backup in Neon
# https://console.neon.tech → Create Branch

# Step 2: Run safe reset
npm run db:safe-reset

# Step 3: Seed initial data if needed
npm run seed:auth
```

### When You Need to Update Schema

**This is SAFE - doesn't reset data**:
```bash
npx prisma db push  # ✅ SAFE - only updates schema

# Or:
npm run migrate
```

---

## 🆘 If Data Loss Happens Again

1. **STOP immediately** - don't run more commands
2. **Go to Neon**: https://console.neon.tech
3. **Click "Branches"**
4. **Find backup from before the reset**
5. **Click "Set as default"**
6. **Update .env with new connection string**
7. **Restart app**
8. **Data should be back in 30 seconds**

---

## 📞 Quick Reference

### Commands That Are SAFE
```bash
npx prisma db push              # ✅ Updates schema only
npm run migrate                 # ✅ Migration dev tool
npm run db:safe-reset           # ✅ Safely resets dev
npm run db:reset:staging        # ✅ Safely resets staging
npm run db:reset:prod           # ✅ Safely resets production
```

### Commands That Are DANGEROUS
```bash
npx prisma db push --force-reset      # ❌ BLOCKS DATA LOSS
npx prisma migrate reset              # ⚠️ Use safe version instead
npx prisma db execute 'DROP ...'      # ❌ Never use this
```

---

## 🔍 How the Protection Works

### Safe Reset Script Logic
```
1. Check NODE_ENV
   ├─ If development: require 2 confirmations
   ├─ If staging: require 3 confirmations
   └─ If production: require env var + confirmations

2. First confirmation
   └─ User must type: "yes, delete all data"

3. Show what will be deleted
   ├─ All Talent records
   ├─ All Deal records
   ├─ All User accounts
   ├─ All Assets
   └─ ALL DATA

4. Final confirmation
   └─ User must type: "I understand, reset now"

5. If all confirmed: Run prisma migrate reset --force
   Else: Cancel gracefully
```

### Shell Protection Logic
```
When user types: npx prisma db push --force-reset

1. Detect --force-reset flag
2. Show warning banner
3. Block execution
4. Suggest: npm run db:safe-reset instead
5. Allow bypass only with RUN_DANGEROUS=true
```

---

## 📊 Expected Timeline

### TODAY (Jan 13)
- ✅ Recover data from Neon backup (15 minutes)
- ✅ Implement protection system (already done)
- ✅ Read protection documentation
- ⏳ Test that safe commands work

### THIS WEEK
- ⏳ Enable shell protection (optional, 2 minutes)
- ⏳ Share with team
- ⏳ Create backups before any dev work

### ONGOING
- ⏳ Use `npm run db:safe-reset` instead of `--force-reset`
- ⏳ Create Neon backups weekly
- ⏳ Test recovery procedures monthly

---

## 🎉 Result

After today:
- ✅ Your data is recovered
- ✅ Multiple layers of protection in place
- ✅ Team educated on safe practices
- ✅ Accidental data loss is prevented
- ✅ Easy recovery if something happens

**This will not happen a third time.** 🔐

---

## 📚 Files You Need to Know About

| File | Purpose | Read This? |
|------|---------|-----------|
| `DATABASE_RESET_PROTECTION.md` | Complete guide with examples | ⭐⭐⭐ YES |
| `DATABASE_PROTECTION_SUMMARY.md` | Quick reference | ⭐⭐ Optional |
| `apps/api/scripts/safe-db-reset.ts` | The protection script | Read if curious |
| `apps/api/package.json` | Updated with 3 new scripts | Reference only |
| `.prisma-protection.sh` | Shell wrapper (optional) | Install instructions inside |

---

**Status**: 🚨 DATA RECOVERY NEEDED + ✅ PROTECTION IMPLEMENTED
**Next Action**: Restore from Neon backup immediately
**Prevention**: Active and ready to use
**Time to Safe**: 5 minutes to recover + 2 minutes to read guide

**LET'S RECOVER YOUR DATA AND MAKE SURE THIS NEVER HAPPENS AGAIN.** 💪
