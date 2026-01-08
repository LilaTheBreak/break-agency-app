# PATRICIA DEAL SEEDING - COMMAND REFERENCE

**Quick copy-paste commands for deployment**

---

## Prerequisites

```bash
# Install dependencies (if needed)
cd apps/api
pnpm install

# Verify DATABASE_URL is set
echo $DATABASE_URL  # Should print your connection string
```

---

## Deployment Commands

### 1. Apply Database Migration

```bash
cd /path/to/break-agency-app-1/apps/api

# Run migration
DATABASE_URL="postgresql://user:password@host/database" pnpm migrate deploy

# Expected output:
# ✓ Running migrate `prisma migrate deploy`
# 1 migration executed
# ✓ All migrations have been successfully applied
```

### 2. Run Seeding Script

```bash
cd /path/to/break-agency-app-1/apps/api

# Run seeding
DATABASE_URL="postgresql://user:password@host/database" pnpm seed:patricia-deals

# Expected output:
# 🌱 Starting Patricia Deals Seeder...
# ✅ Loaded 16 raw deals from tracker
# ✨ Seeding successful!
```

### 3. Verify in Database

```bash
# Check Patricia has deals
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as deal_count, 
       SUM(value) as total_value
FROM "Deal" 
WHERE "talentId" = 'talent_1767737816502_d9wnw3pav';
EOF

# Expected output:
# deal_count | total_value
# -----------|------------
# 16         | 254500
```

---

## Verification Commands

### Check Migration Status

```bash
cd apps/api
npx prisma migrate status

# Should show:
# database: ... Connected
# migrations: All migrations have been applied
```

### View Patricia's Deals in Database

```bash
npx prisma db execute --stdin << 'EOF'
SELECT id, "brandName", value, stage
FROM "Deal"
WHERE "talentId" = 'talent_1767737816502_d9wnw3pav'
ORDER BY "createdAt" DESC
LIMIT 5;
EOF
```

### Test API Endpoint

```bash
# Test API returns deals
curl -X GET "https://tbtcbtbc.online/api/admin/talent/talent_1767737816502_d9wnw3pav" \
  -H "Accept: application/json"

# Check response contains deals array with 16 items
```

---

## Troubleshooting Commands

### Check if Patricia Exists

```bash
npx prisma db execute --stdin << 'EOF'
SELECT id, name FROM "Talent" 
WHERE name ILIKE '%Patricia%';
EOF
```

### Check if ADMIN User Exists

```bash
npx prisma db execute --stdin << 'EOF'
SELECT id, email, role FROM "User" 
WHERE role IN ('ADMIN', 'SYSTEM') 
LIMIT 1;
EOF
```

### List All Brands

```bash
npx prisma db execute --stdin << 'EOF'
SELECT id, name FROM "Brand" 
ORDER BY name;
EOF
```

### Check Migration History

```bash
npx prisma db execute --stdin << 'EOF'
SELECT "id", "migration_name", "finished_at" 
FROM "_prisma_migrations" 
ORDER BY "finished_at" DESC 
LIMIT 5;
EOF
```

---

## Rollback Commands

### Delete Patricia's Deals (Keep Schema)

```bash
npx prisma db execute --stdin << 'EOF'
DELETE FROM "Deal" 
WHERE "talentId" = 'talent_1767737816502_d9wnw3pav';
EOF

# Then re-seed:
DATABASE_URL="..." pnpm seed:patricia-deals
```

### Delete Specific Deal by Brand

```bash
npx prisma db execute --stdin << 'EOF'
DELETE FROM "Deal" 
WHERE "talentId" = 'talent_1767737816502_d9wnw3pav'
AND "brandName" = 'AVEENO';
EOF
```

### Rollback Schema Changes

```bash
# Removes all new columns
npx prisma migrate resolve --rolled-back 20260107200000_add_deal_tracker_fields

# View current schema
npx prisma studio
```

---

## Debugging Commands

### Enable Verbose Logging

```bash
# Set debug environment variable
export DEBUG=prisma:* NODE_ENV=development

# Run seeding with verbose output
DATABASE_URL="..." pnpm seed:patricia-deals
```

### View Database Schema

```bash
# Open Prisma Studio
npx prisma studio

# Or view schema SQL
pg_dump -s postgresql://user:pass@host:5432/db | grep -A 20 "CREATE TABLE \"Deal\""
```

### Count All Deals

```bash
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as total_deals, 
       COUNT(DISTINCT "talentId") as talents,
       SUM(value) as total_value
FROM "Deal";
EOF
```

### List Deals by Status

```bash
npx prisma db execute --stdin << 'EOF'
SELECT stage, COUNT(*) as count
FROM "Deal"
WHERE "talentId" = 'talent_1767737816502_d9wnw3pav'
GROUP BY stage
ORDER BY count DESC;
EOF
```

---

## Environment Setup

### Set DATABASE_URL (Production)

```bash
# Option 1: Inline (one-time)
DATABASE_URL="postgresql://user:password@host:5432/database" pnpm command

# Option 2: Export (persistent in shell)
export DATABASE_URL="postgresql://user:password@host:5432/database"
pnpm migrate deploy
pnpm seed:patricia-deals

# Option 3: .env file
# Create or update apps/api/.env
DATABASE_URL=postgresql://user:password@host:5432/database

# Then run normally:
pnpm migrate deploy
pnpm seed:patricia-deals
```

### Verify DATABASE_URL

```bash
# Check if set
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin << 'EOF'
SELECT version();
EOF

# Should return PostgreSQL version
```

---

## One-Command Deployment

```bash
# Entire deployment in one command:
cd /path/to/break-agency-app-1/apps/api && \
DATABASE_URL="your-database-url" pnpm migrate deploy && \
DATABASE_URL="your-database-url" pnpm seed:patricia-deals

# Then verify:
# Visit: https://tbtcbtbc.online/admin/talent/talent_1767737816502_d9wnw3pav
# Should see 16 deals with £254,500 total
```

---

## Files to Reference

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | Schema with new fields |
| `apps/api/prisma/migrations/20260107200000_*/migration.sql` | Database migration |
| `apps/api/scripts/seedPatriciaDeals.ts` | Seeding script |
| `apps/api/package.json` | npm scripts |
| `PATRICIA_DEAL_SEEDING_DEPLOYMENT.md` | Full deployment guide |
| `PATRICIA_DEAL_SEEDING_TECHNICAL.md` | Technical details |

---

## Quick Help

```bash
# Show help for migration
npx prisma migrate --help

# Show help for db execute
npx prisma db --help

# Show all Prisma commands
npx prisma --help
```

---

## Notes

- **DATABASE_URL Format**: `postgresql://user:password@host:port/database`
- **Neon (PostgreSQL SaaS)**: `postgresql://user:password@xxx.region.neon.tech/database?sslmode=require`
- **Local PostgreSQL**: `postgresql://postgres:password@localhost:5432/breakagency`
- **All commands must run from**: `apps/api` directory
- **Commands require**: DATABASE_URL environment variable set
- **Seeding is idempotent**: Safe to run multiple times

---

**Ready to deploy? Copy the deployment command and run it!**
