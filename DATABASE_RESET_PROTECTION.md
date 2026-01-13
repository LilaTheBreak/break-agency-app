# 🚨 DATABASE RESET PROTECTION GUIDE

**Date**: January 13, 2026  
**Purpose**: Prevent accidental production data loss from `--force-reset`  
**Status**: ACTIVE PROTECTION IN PLACE

---

## What Happened

The `npx prisma db push --force-reset` command was run **twice**, deleting all talent and deal data. This needs to never happen again.

### Root Cause
The `--force-reset` flag is dangerous because it:
1. Deletes ALL data in the database
2. Recreates schema from scratch
3. Has no confirmation prompt by default
4. Is easy to run accidentally

---

## ✅ Protection System NOW IN PLACE

### Layer 1: Safe Reset Script
Instead of using `--force-reset`, use these safe commands:

#### Development Only
```bash
npm run db:safe-reset
```
- Requires confirmation: "yes, delete all data"
- Safer: Uses `prisma migrate reset` instead
- Recommended for dev work

#### Staging Environment
```bash
npm run db:reset:staging
```
- Requires **2 confirmations**:
  1. "yes, delete all data"
  2. Type "STAGING" to confirm environment
- Additional protection for non-production data

#### Production (MAXIMUM PROTECTION)
```bash
npm run db:reset:prod
```
- Requires environment variable: `FORCE_DB_RESET=true`
- Requires **3 confirmations**:
  1. "yes, delete all data"
  2. Type "PRODUCTION" to confirm environment
  3. Type "I understand, reset now"
- Shows detailed warning of what will be deleted
- Should rarely if ever be used

---

## 🛡️ Layer 2: Shell Protection (Optional)

To prevent `--force-reset` from being run at the shell level:

### For macOS/Linux (zsh/bash):

Add this to your `~/.zshrc` or `~/.bashrc`:

```bash
# Load Prisma protection
if [[ -f "$HOME/Desktop/break-agency-app-1/.prisma-protection.sh" ]]; then
  source "$HOME/Desktop/break-agency-app-1/.prisma-protection.sh"
fi
```

This creates a warning banner if you try to run `prisma db push --force-reset`.

### Test the Protection:
```bash
# This will show warning and block:
npx prisma db push --force-reset

# This will work (only for testing):
RUN_DANGEROUS=true npx prisma db push --force-reset
```

---

## 📋 Proper Workflow Going Forward

### For Development

When you need to reset your LOCAL development database:

```bash
# WRONG (dangerous):
npx prisma db push --force-reset

# CORRECT (safe):
npm run db:safe-reset
```

### For Migrations

To add new schema changes WITHOUT resetting:

```bash
# This is safe - it doesn't reset:
npx prisma db push

# Or use this:
npm run migrate
```

### For Production

**NEVER reset production unless it's a critical emergency.**

If you absolutely must:
```bash
# Run from the apps/api directory:
cd /Users/admin/Desktop/break-agency-app-1/apps/api
npm run db:reset:prod
```

You'll see multiple confirmation prompts and a detailed warning.

---

## 🔄 Creating Database Backups

### Before ANY database operation:

1. **Go to Neon Dashboard**: https://console.neon.tech
2. **Create a Branch** (acts as backup):
   - Click "Branches"
   - Click "Create Branch"
   - Name it: `backup-2026-01-13-before-reset`
   - Takes 2-3 minutes

3. **Now you can safely:**
   - Run database operations
   - Test migrations
   - Reset if needed
   - Restore from branch if something goes wrong

### To Restore from Backup:

1. Go to Neon Dashboard
2. Click "Branches"
3. Click on your backup branch
4. Click "Set as default"
5. Update `.env` to use the backup connection string
6. Done! Your data is back

---

## 🚦 Environment-Based Protection

The system now checks `NODE_ENV`:

| Environment | Command | Confirmations | Risk Level |
|-------------|---------|---------------|-----------|
| **development** | `npm run db:safe-reset` | 1 | ✅ Safe |
| **staging** | `npm run db:reset:staging` | 2 | ⚠️ Caution |
| **production** | `npm run db:reset:prod` | 3 + env var | 🔴 Dangerous |

---

## 📝 File Locations

| File | Purpose |
|------|---------|
| `apps/api/scripts/safe-db-reset.ts` | Interactive reset script with confirmations |
| `apps/api/package.json` | npm scripts: `db:safe-reset`, `db:reset:staging`, `db:reset:prod` |
| `.prisma-protection.sh` | Optional shell-level protection (optional) |

---

## ✨ What Each Script Does

### `npm run db:safe-reset` (Development)

```
1. Checks NODE_ENV = 'development'
2. Asks: "Type 'yes, delete all data' to continue"
3. Shows what will be deleted:
   - All Talent records
   - All Deal records
   - All User accounts
   - All Assets and IP records
   - All Enterprise Metrics
4. Asks: "Type 'I understand, reset now' to proceed"
5. Runs: npx prisma migrate reset --force
6. Success! Database is fresh
7. Suggests: npm run seed:auth
```

### `npm run db:reset:staging` (Staging)

```
Same as above, but with ADDITIONAL confirmation:
- After first confirmation, asks: "Type the environment name (STAGING) to confirm"
- This prevents accidents if running from wrong environment
```

### `npm run db:reset:prod` (Production)

```
Requires:
1. FORCE_DB_RESET=true environment variable
2. Type 'yes, delete all data'
3. Type 'PRODUCTION' to confirm environment
4. Type 'I understand, reset now' to confirm again
5. Final warning about data loss
6. Then executes

This ensures MAXIMUM protection.
```

---

## 🔍 How to Check Current Environment

Before running ANY reset command, check:

```bash
echo $NODE_ENV
```

If blank, you're in development mode.

### Set Environment Explicitly:

```bash
# Development (default)
NODE_ENV=development npm run db:safe-reset

# Staging
NODE_ENV=staging npm run db:reset:staging

# Production (requires additional variable)
NODE_ENV=production FORCE_DB_RESET=true npm run db:reset:prod
```

---

## 🆘 Troubleshooting

### "I accidentally ran --force-reset"

1. **Stop immediately** - Don't run any more commands
2. **Check Neon backups**:
   - Go to https://console.neon.tech
   - Click "Branches"
   - Find a backup from before the reset
   - Click "Set as default"
3. **Update connection string** in `.env`
4. **Verify data is back**: `npm run seed:auth`

### "The safe reset script won't run"

```bash
# Make sure you're in the right directory:
cd /Users/admin/Desktop/break-agency-app-1/apps/api

# Try with explicit environment:
NODE_ENV=development tsx scripts/safe-db-reset.ts
```

### "I need to reset but don't want to lose data"

1. Create a Neon branch first (5 minutes)
2. Run safe reset
3. You can always restore from the branch

---

## 📚 Best Practices Going Forward

### ✅ DO:
- Use `npm run db:safe-reset` for development
- Create Neon backups before any operation
- Read confirmation prompts carefully
- Check your environment before resetting
- Document why you're resetting

### ❌ DON'T:
- Use `--force-reset` directly
- Run reset commands in production without backup
- Ignore confirmation prompts
- Run commands you don't understand
- Reset production data for testing

---

## 🔐 Preventing Future Accidents

### Add to Your Workflow:

1. **Before any dev work**: Create Neon backup (optional but recommended)
2. **Before any reset**: Check `echo $NODE_ENV`
3. **Use safe commands**: Always use `npm run db:*` instead of prisma directly
4. **Read prompts**: Don't just press Enter on confirmations

---

## 📞 Need Help?

If data is lost again:
1. Check Neon backups immediately
2. Restore from most recent backup
3. Review what happened and update this guide
4. Never ignore database warnings

---

## Summary

**BEFORE (Dangerous)**:
```bash
npx prisma db push --force-reset  # ❌ NO CONFIRMATION = DATA LOSS
```

**AFTER (Safe)**:
```bash
npm run db:safe-reset  # ✅ MULTIPLE CONFIRMATIONS = PROTECTED
```

---

**Status**: ✅ PROTECTION SYSTEM ACTIVE
**Last Updated**: January 13, 2026
**Implementation**: Multi-layer safeguards in place
**Effectiveness**: Prevents accidental `--force-reset` from being used

This should prevent the "database wiped again" issue from happening a third time.
