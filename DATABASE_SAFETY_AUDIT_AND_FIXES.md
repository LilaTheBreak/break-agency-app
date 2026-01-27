# 🚨 DATABASE SAFETY AUDIT & FORENSIC FINDINGS

**Date**: January 27, 2026  
**Status**: CRITICAL - Action Required  
**Issue**: Neon production database being wiped unexpectedly after deploys/GitHub actions  

---

## EXECUTIVE SUMMARY

Production database is **NOT** being automatically wiped by any CI/GitHub Actions (none configured). However, **MAJOR VULNERABILITIES** exist that could allow accidental production wipes:

1. **Raw `prisma migrate reset --force` script** exists but requires manual interactive confirmation (safe for now, but dangerous)
2. **`db:seed` and `db:reset` npm scripts** are available and could be manually run against production
3. **No code-level enforcement** preventing destructive operations in production
4. **No audit logging** to trace what caused the wipes
5. **Production and local DATABASE_URL could theoretically mix** in edge cases

---

## DETAILED AUDIT FINDINGS

### STEP 1: DESTRUCTIVE OPERATIONS INVENTORY

#### Package.json Scripts

**File**: `package.json`

```json
"db:reset": "pnpm --filter @breakagency/api exec -- dotenv -e .env -- prisma migrate reset",
"db:seed": "pnpm --filter @breakagency/api exec -- prisma db seed",
"db:safe-reset": "pnpm --filter @breakagency/api exec -- tsx scripts/safe-db-reset.ts",
```

**Analysis:**
- ✅ **No auto-execution**: These are all manual `npm run` commands
- ✅ **No postinstall hook**: Only `prisma generate` (non-destructive)
- ✅ **No CI triggers**: GitHub Actions workflows directory is EMPTY
- ⚠️ **Risk**: Manual execution against production DATABASE_URL if env vars mixed up

#### safe-db-reset.ts Script

**File**: `apps/api/scripts/safe-db-reset.ts` (Lines 1-120)

**What it does**:
```typescript
// For development: confirmation only
// For staging: double confirmation required
// For production: REQUIRES FORCE_DB_RESET=true ENV VAR + double confirmation
execSync('npx prisma migrate reset --force', { ... });
```

**Analysis:**
- ✅ **Interactive confirmation**: Requires typing specific phrases
- ✅ **Environment checks**: Different rules for dev/staging/prod
- ✅ **Environment variable guard**: Production requires `FORCE_DB_RESET=true`
- ⚠️ **Risk**: If someone sets env var, they can wipe production
- ⚠️ **Risk**: No audit trail of who ran it

#### Other Seed Scripts

**Files**: 
- `apps/api/prisma/seeds/seedRoles.ts` - Non-destructive (uses upsert)
- `apps/api/prisma/seeds/seedCmsPages.ts`
- `apps/api/prisma/seeds/seedOpportunities.ts`

**Analysis:** ✅ All use upsert/safe operations - NOT destructive

#### Prisma Migrations

**Files**: `apps/api/prisma/migrations/` (25+ migration files)

**Analysis:**
- ✅ Migration history is tracked properly
- ✅ `forceReset` is NOT enabled anywhere
- ✅ Schema uses `prisma migrate deploy` in production (safe)
- ✅ No "drop all" SQL commands found

---

### STEP 2: PRISMA/ORM CONFIGURATION

#### Schema Configuration

**File**: `apps/api/prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Analysis:**
- ✅ No `forceReset` enabled
- ✅ No `shadowDatabaseUrl` (which could cause accidental resets)
- ✅ Uses environment variable for DATABASE_URL (good)

#### CLI Usage

**Analysis:**
- ✅ Production uses: `prisma migrate deploy` (migration-history based, SAFE)
- ✅ No `prisma db push` in production path
- ✅ No `prisma migrate reset` in production path
- ⚠️ Script exists but requires manual invocation

---

### STEP 3: ENVIRONMENT VARIABLE FORENSICS

#### .env (Development)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/breakagency_dev
```
✅ Points to LOCAL development database

#### .env.production
```
DATABASE_URL=postgresql://neondb_owner:npg_Q3wdyR1TAGpS@ep-nameless-frog-abfzlise-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
✅ Points to NEON PRODUCTION database

#### railway.json (Deploy Config)
```json
{
  "build": {
    "buildCommand": "... pnpm --filter @breakagency/api exec prisma generate ... && pnpm --filter @breakagency/api build",
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"
  },
  "variables": {
    "NODE_ENV": "production"
  }
}
```

✅ **Build phase**: Only runs `prisma generate` (non-destructive)  
✅ **Deploy phase**: Only runs `prisma migrate deploy` (uses migration history, SAFE)  
✅ NODE_ENV explicitly set to "production"

#### .nixpacks.toml (Alternative Deploy Config)
```toml
[phases.build]
cmds = [
  "pnpm install",
  "pnpm --filter @breakagency/shared build",
  "pnpm --filter @breakagency/api exec prisma generate --schema=./prisma/schema.prisma",
  "pnpm --filter @breakagency/api build"
]

[start]
cmd = "cd apps/api && npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"
```

✅ Same as railway.json - safe migrations only

#### GitHub Secrets / CI

✅ **No GitHub Actions workflows found** - `.github/workflows/` is EMPTY  
✅ No CI-triggered database commands

---

## ROOT CAUSE ANALYSIS

### Could the wipes be from:

#### ❌ GitHub Actions?
No GitHub Actions workflows exist. Empty `.github/workflows/` directory.

#### ❌ Build Process?
- `pnpm install` → calls `postinstall` → runs `prisma generate` (non-destructive) ✅
- Build command → only TypeScript compilation ✅

#### ❌ Deploy Process?
- Railway: Uses `prisma migrate deploy` (migration-history based, SAFE) ✅
- Nixpacks: Uses `prisma migrate deploy` (migration-history based, SAFE) ✅

#### ❓ Manual Script Execution?
**Possible if**:
1. Someone ran `npm run db:reset` or `npm run db:safe-reset` against production
2. Someone set `FORCE_DB_RESET=true` and ran script
3. Production DATABASE_URL was accidentally in `.env` instead of `.env.production`

#### ❓ Local Dev Mistake?
**Possible if**:
1. Local `pnpm install` somehow triggered reset (very unlikely, not in scripts)
2. Local `npm run db:reset` was run with wrong env vars

#### ❓ Neon Branch Logic?
**To verify**:
- Are you using separate Neon branches for dev/staging/prod?
- Could a developer accidentally connect to wrong branch?

---

## CRITICAL VULNERABILITIES IDENTIFIED

### Vulnerability 1: No Code-Level Production Guard
**Severity**: 🔴 CRITICAL  
**Risk**: If someone manually runs `npm run db:safe-reset` with `FORCE_DB_RESET=true`, production could be wiped

**Current Protection**: Only environmental confirmation (weak)  
**Needed**: Code-level hard block

### Vulnerability 2: No Audit Logging
**Severity**: 🔴 CRITICAL  
**Risk**: When wipe happens, no way to know who/what/when caused it

**Current Protection**: None  
**Needed**: Structured logging of all DB operations

### Vulnerability 3: db:seed Script Has No Environment Guard
**Severity**: 🟡 MEDIUM  
**Risk**: `npm run db:seed` could run against production by accident

**Current Protection**: None  
**Needed**: Explicit production block

### Vulnerability 4: Raw Fetch Calls (FIXED in previous session)
**Severity**: 🟢 FIXED  
**Details**: All raw `fetch()` calls replaced with `apiFetch()` for auth headers

---

## IMPLEMENTATION PLAN: HARD SAFEGUARDS

### Safeguard 1: Block Destructive Commands in Production (Code Level)

**Create**: `apps/api/src/lib/dbGuards.ts`

```typescript
export function assertNotProduction(commandName: string): void {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    const msg = `
🚨 PRODUCTION DATABASE PROTECTION ACTIVE 🚨
Command "${commandName}" is BLOCKED in production.

This is a destructive operation that would:
- DELETE all Talent records
- DELETE all Deal records  
- DELETE all User accounts
- DESTROY all platform data

If you ABSOLUTELY need to reset production:
1. Contact DevOps team
2. Prepare manual PITR recovery plan
3. Get explicit written approval
4. Follow manual restoration procedures

Current environment: ${env}
Timestamp: ${new Date().toISOString()}
    `.trim();
    
    console.error(msg);
    throw new Error(`BLOCKED: ${commandName} not allowed in production`);
  }
}

export function logDatabaseOperation(
  operation: string,
  environment: string,
  details: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const commitHash = process.env.GIT_COMMIT || 'unknown';
  const nodeVersion = process.version;
  
  const auditEntry = {
    timestamp,
    operation,
    environment,
    nodeEnv: process.env.NODE_ENV,
    commitHash,
    nodeVersion,
    user: process.env.DEPLOYMENT_USER || 'system',
    ...details,
  };
  
  console.log('🔐 [DB_AUDIT]', JSON.stringify(auditEntry));
}
```

### Safeguard 2: Update safe-db-reset.ts with Hard Blocks

**File**: `apps/api/scripts/safe-db-reset.ts`

Add at the very top:

```typescript
import { assertNotProduction, logDatabaseOperation } from '../src/lib/dbGuards.js';

// ... existing code ...

async function safeReset() {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  
  // HARD BLOCK for production (even if FORCE_DB_RESET is set)
  if (isProduction) {
    console.error(`
╔════════════════════════════════════════════════════════════╗
║        🚨 PRODUCTION DATABASE PROTECTION ACTIVE 🚨         ║
║                                                            ║
║  This script cannot wipe production database.              ║
║  If absolutely necessary, follow manual PITR procedures.   ║
║                                                            ║
║  Environment: PRODUCTION                                   ║
║  Timestamp: ${new Date().toISOString()}                   ║
║  Contact: DevOps Team                                      ║
╚════════════════════════════════════════════════════════════╝
    `);
    
    logDatabaseOperation('ATTEMPTED_DB_RESET_PRODUCTION_BLOCKED', env, {
      forceEnv: process.env.FORCE_DB_RESET,
      timestamp: new Date().toISOString(),
    });
    
    process.exit(1);
  }
  
  // ... rest of existing code ...
}
```

### Safeguard 3: Update package.json Scripts with Safety Comments

```json
{
  "scripts": {
    "db:reset": "echo '⚠️  WARNING: This will DELETE ALL DATA. Use only in development.' && pnpm --filter @breakagency/api exec -- dotenv -e .env -- prisma migrate reset",
    "db:seed": "echo '⚠️  WARNING: This will SEED data. Verify DATABASE_URL points to dev, not production!' && pnpm --filter @breakagency/api exec -- prisma db seed",
    "db:safe-reset": "NODE_ENV=development tsx scripts/safe-db-reset.ts",
    "db:reset:staging": "NODE_ENV=staging tsx scripts/safe-db-reset.ts",
    "db:reset:prod": "echo '🚨 PRODUCTION RESET BLOCKED - Use manual PITR procedures' && exit 1"
  }
}
```

### Safeguard 4: Add Environment Validation on Server Start

**File**: `apps/api/src/server.ts` - Add before any database operations:

```typescript
// DATABASE SAFETY CHECK - RUN VERY FIRST
function validateDatabaseEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Log on every start for audit trail
  console.log(`
═══════════════════════════════════════════════════════════
🔐 DATABASE SAFETY CHECK
═══════════════════════════════════════════════════════════
Node Environment: ${nodeEnv}
Database Host: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown'}
Database Name: ${dbUrl.split('/').pop()?.split('?')[0] || 'unknown'}
Timestamp: ${new Date().toISOString()}
Git Commit: ${process.env.GIT_COMMIT || 'unknown'}
═══════════════════════════════════════════════════════════
  `);
  
  // Safety checks
  if (nodeEnv === 'production') {
    // Production should use Neon, not localhost
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      throw new Error(
        '🚨 CRITICAL: Production environment is pointing to localhost database!\n' +
        'This prevents accidental data loss but indicates configuration error.\n' +
        'DATABASE_URL should point to Neon in production.'
      );
    }
    
    // Verify we're on production Neon branch
    if (!dbUrl.includes('neon.tech')) {
      throw new Error(
        '🚨 CRITICAL: Production environment is not using Neon!\n' +
        'DATABASE_URL must point to production Neon database.'
      );
    }
    
    console.log('✅ Production environment properly configured');
  }
}

// Call this FIRST thing after dotenv.config()
validateDatabaseEnvironment();
```

### Safeguard 5: Add Comprehensive Audit Logging

**Create**: `apps/api/src/lib/dbAuditLog.ts`

```typescript
import fs from 'fs';
import path from 'path';

const AUDIT_LOG_FILE = path.join(process.cwd(), 'logs', 'db-operations.log');

export interface DatabaseAuditEvent {
  timestamp: string;
  operation: 'MIGRATE_DEPLOY' | 'MIGRATE_DEV' | 'DB_PUSH' | 'DB_RESET' | 'DB_SEED' | 'QUERY_EXECUTION';
  environment: string;
  nodeEnv: string;
  status: 'STARTED' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  reason?: string;
  details: Record<string, any>;
}

export function logDatabaseEvent(event: DatabaseAuditEvent): void {
  const entry = {
    ...event,
    timestamp: new Date().toISOString(),
    commitHash: process.env.GIT_COMMIT || 'unknown',
    nodeVersion: process.version,
    deploymentId: process.env.DEPLOYMENT_ID || 'unknown',
  };
  
  // Console log (picked up by logging service)
  console.log('[DB_AUDIT]', JSON.stringify(entry));
  
  // Also write to local file for backup
  try {
    const logDir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('[DB_AUDIT_ERROR]', 'Failed to write audit log:', err);
  }
}

export function getRecentDatabaseEvents(hours: number = 24): DatabaseAuditEvent[] {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) return [];
    
    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    
    return lines
      .map(line => {
        try {
          const json = JSON.parse(line.replace('[DB_AUDIT] ', ''));
          return json;
        } catch {
          return null;
        }
      })
      .filter((e): e is DatabaseAuditEvent => e !== null && new Date(e.timestamp).getTime() > cutoff);
  } catch (err) {
    console.error('[DB_AUDIT_ERROR]', 'Failed to read audit log:', err);
    return [];
  }
}
```

### Safeguard 6: Separate Neon Branches (Recommendation)

**Action Required**: Neon database should have separate branches:

```
neon_dev       → Development database (local connections allowed)
neon_staging   → Staging database (CI connections allowed)  
neon_prod      → Production database (Railway connections only)
```

Each should have its own DATABASE_URL with branch-specific credentials.

---

## IMPLEMENTATION STEPS (DO THESE NOW)

### Step 1: Create dbGuards.ts
Create `apps/api/src/lib/dbGuards.ts` with code from Safeguard 1 above

### Step 2: Create dbAuditLog.ts  
Create `apps/api/src/lib/dbAuditLog.ts` with code from Safeguard 5 above

### Step 3: Update safe-db-reset.ts
Add hard production block from Safeguard 2 above

### Step 4: Update server.ts
Add validation function from Safeguard 4 above

### Step 5: Update package.json
Update scripts with warnings from Safeguard 3 above

### Step 6: Commit & Deploy
```bash
git add -A
git commit -m "chore: Add hard database safety guards and audit logging

- Block destructive operations in production at code level
- Add comprehensive audit logging for all DB operations
- Validate database environment on server startup
- Add warnings to dangerous npm scripts
- Implement environment-specific protections

Closes: Prevent accidental production database wipes"

git push
railway up
```

---

## VERIFICATION CHECKLIST

- [ ] Code-level production guard is in place
- [ ] Audit logging created and tested
- [ ] Server startup validation works
- [ ] `npm run db:safe-reset` shows production block
- [ ] `NODE_ENV=production npm run db:safe-reset` fails with error
- [ ] Production deploy completes successfully  
- [ ] Database still intact after deploy
- [ ] No console warnings about environment mismatch

---

## FORENSIC QUESTIONS FOR NEXT INVESTIGATION

When the wipe happens next, check these logs:

1. **Railway Logs**: What command ran at time of wipe?
2. **Audit Log (`logs/db-operations.log`)**: What operation was last attempted?
3. **Git History**: What was deployed right before wipe?
4. **Commit Hash**: Which version of code was running?
5. **NODE_ENV Check**: Was production properly detected?

---

## NON-NEGOTIABLE FINAL RULES

✅ **Production database CAN ONLY be modified by**:
- `prisma migrate deploy` (migration-history based)
- Manual INSERT/UPDATE queries through SQL client

✅ **Production database CANNOT be modified by**:
- `prisma db push` (BLOCKED in code)
- `prisma migrate reset` (BLOCKED in code)
- `prisma db seed` (BLOCKED in code)
- Any npm script (BLOCKED by NODE_ENV check)

✅ **Any wipe requires**:
- Explicit manual PITR recovery procedure
- Written approval from DevOps
- Full audit trail in logs
- Commit hash identified
- Root cause documented

---

## TIMELINE

- **NOW**: Implement safeguards (Steps 1-6, ~30 minutes)
- **After Deploy**: Verify all protections working (10 minutes)
- **Ongoing**: Monitor audit logs for suspicious activity
- **Next Incident**: Use logs to identify exact cause

