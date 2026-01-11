# Database Migration Setup Guide

This document provides step-by-step instructions for running the Prisma migrations to create the Contact Information & Personal Details tables.

## 📋 Prerequisites

- Node.js 22.21.1+ installed
- npm or yarn package manager
- Prisma CLI installed (`npm install -g prisma` or use `npx prisma`)
- Database credentials configured in `.env`
- All code deployed to production

## 🔧 Environment Setup

### 1. Verify Database Connection

Before running migrations, ensure your database connection is working:

```bash
# From the apps/api directory
cd /Users/admin/Desktop/break-agency-app-1/apps/api

# Test database connection
npx prisma db execute --stdin < /dev/null
```

You should see no errors. If you get a connection error, verify:
- `.env` has correct `DATABASE_URL`
- Database server is running
- Network connectivity to database

### 2. Backup Database (PRODUCTION ONLY!)

**Critical**: Always backup before running migrations in production!

```bash
# PostgreSQL backup (if using Neon)
pg_dump $(echo $DATABASE_URL | sed 's|postgresql://||') > talent_backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Neon dashboard: https://console.neon.tech/
# Settings → Backups → Create backup
```

## ✨ Running Migrations

### Option 1: Create and Run Migration (Recommended)

This creates a migration file in version control:

```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/api

# Create migration
npx prisma migrate dev --name "add-contact-information-models"

# Follow prompts:
# 1. Enter migration name (already provided)
# 2. Review SQL changes
# 3. Confirm to create migration

# This will:
# ✓ Create migration file in prisma/migrations/
# ✓ Apply changes to development database
# ✓ Regenerate Prisma client
```

### Option 2: Apply to Existing Database

If migration file already exists:

```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/api

# Deploy existing migrations
npx prisma migrate deploy

# Or reset and reapply (development only!)
npx prisma migrate reset
```

### Option 3: Push Without Migration Files

For rapid development (not recommended for production):

```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/api

npx prisma db push
```

⚠️ **Warning**: This doesn't create migration files. Use only for local development!

## 🔍 Verifying Migration Success

### 1. Check Prisma Schema

```bash
npx prisma introspect

# Should show all new models:
# - TalentPersonalDetails
# - TalentAddress
# - TalentBankingDetails
# - TalentTaxCompliance
# - TalentRepresentation
# - TalentMeasurements
# - TalentTravelInfo
# - TalentBrandPreferences
# - TalentInternalNotes
# - TalentConsent
```

### 2. Check Database Tables

```bash
# Connect to database and verify tables exist
psql -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"

# Look for:
# - talent_personal_details
# - talent_address
# - talent_banking_details
# - talent_tax_compliance
# - talent_representation
# - talent_measurements
# - talent_travel_info
# - talent_brand_preferences
# - talent_internal_notes
# - talent_consent
```

### 3. Verify Relationships

```bash
# Check foreign keys are created correctly
psql -c "\dt talent_*"
psql -c "\d talent_personal_details"
```

### 4. Test API Endpoints

```bash
# Start API server
cd /Users/admin/Desktop/break-agency-app-1
npm run dev

# In another terminal, test endpoint
curl -X GET http://localhost:3001/api/admin/talent/test-id/personal-details \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return 200 with talent object or empty fields
```

## 📊 Post-Migration Tasks

### 1. Update API Environment

Ensure `.env` includes:

```env
# Database
DATABASE_URL=postgresql://...

# Contact Information
CONTACT_INFO_PASSWORD=123456

# S3 (optional, for Phase 3)
S3_BUCKET_NAME=talent-documents
S3_REGION=eu-west-2
AWS_ACCESS_KEY_ID=optional
AWS_SECRET_ACCESS_KEY=optional
```

### 2. Restart Services

```bash
# Kill running Node processes
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Restart API
cd /Users/admin/Desktop/break-agency-app-1
npm run dev
```

### 3. Regenerate Prisma Client

```bash
npx prisma generate
```

### 4. Check Admin Activity Logging

Verify logs are created when accessing endpoints:

```bash
# Check log files (path depends on your setup)
tail -f logs/admin-activity.log

# Or check database
psql -c "SELECT * FROM admin_activity ORDER BY created_at DESC LIMIT 5;"
```

## 🧪 Testing After Migration

### Frontend Testing

1. Open admin panel
2. Go to talent detail page
3. Click "Contact Information" tab
4. Verify tab loads without errors
5. Try entering password (123456)
6. Add/edit address
7. Check console for no errors

### API Testing

```bash
# Create or update personal details
curl -X PUT http://localhost:3001/api/admin/talent/hzjgtd1yhmltkxf6aprwtb1o/personal-details \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "legalFirstName": "Patricia",
    "legalLastName": "Bright",
    "preferredName": "Patricia",
    "dateOfBirth": "1995-05-15",
    "nationality": "GB",
    "countryOfResidence": "GB"
  }'

# Get address list
curl -X GET http://localhost:3001/api/admin/talent/hzjgtd1yhmltkxf6aprwtb1o/addresses \
  -H "Authorization: Bearer TOKEN"

# Add address
curl -X POST http://localhost:3001/api/admin/talent/hzjgtd1yhmltkxf6aprwtb1o/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "label": "Home",
    "addressLine1": "123 Main Street",
    "city": "London",
    "country": "GB",
    "isPrimary": true
  }'
```

## ⚠️ Rollback Procedure

If something goes wrong:

### Option 1: Rollback Last Migration

```bash
cd /Users/admin/Desktop/break-agency-app-1/apps/api

# List migrations
npx prisma migrate status

# Rollback (not available in Neon - would need backup restore)
# Instead, manually drop tables if needed

npx prisma db execute --stdin << 'SQL'
DROP TABLE IF EXISTS talent_consent CASCADE;
DROP TABLE IF EXISTS talent_internal_notes CASCADE;
DROP TABLE IF EXISTS talent_brand_preferences CASCADE;
DROP TABLE IF EXISTS talent_travel_info CASCADE;
DROP TABLE IF EXISTS talent_measurements CASCADE;
DROP TABLE IF EXISTS talent_representation CASCADE;
DROP TABLE IF EXISTS talent_tax_compliance CASCADE;
DROP TABLE IF EXISTS talent_banking_details CASCADE;
DROP TABLE IF EXISTS talent_address CASCADE;
DROP TABLE IF EXISTS talent_personal_details CASCADE;
SQL
```

### Option 2: Restore from Backup

```bash
# If using Neon, use dashboard to restore backup
# Otherwise, restore from SQL dump:
psql < talent_backup_20260111_120000.sql
```

## 🚀 Production Deployment Checklist

- [ ] Database backed up
- [ ] Migration file reviewed and committed
- [ ] All tests passing locally
- [ ] Code deployed to main branch
- [ ] Database migrations applied
- [ ] API restarted
- [ ] Frontend tested in production
- [ ] Admin activity logging verified
- [ ] Team notified of changes

## 📝 Migration File Location

After running migration, new files created at:

```
apps/api/prisma/migrations/
├── migration_lock.toml
└── [timestamp]_add_contact_information_models/
    ├── migration.sql
    └── snapshot.json
```

These should be committed to git for version control.

## 🔍 Troubleshooting

### Migration Timeout

```bash
# Increase timeout (use environment variable)
DATABASE_CONNECTION_TIMEOUT=30000 npx prisma migrate dev

# Or edit prisma schema
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
#   shadowDatabaseUrl = env("SHADOW_DATABASE_URL")  // For Neon
# }
```

### Permission Denied Error

```bash
# Verify user has permission to create tables
# Connect as admin/superuser:
psql -U postgres -h your-host -d talent_db
```

### Foreign Key Constraint Error

```bash
# Check that talent table exists and is compatible
npx prisma introspect

# If issues, may need to recreate relations
# Or check database for corrupt references
```

### Prisma Client Not Found

```bash
# Regenerate Prisma client
npx prisma generate

# Or reinstall
rm -rf node_modules/.prisma
npx prisma generate
```

## 📞 Support

For migration issues:
1. Check error message in console
2. Verify database connection
3. Check `npx prisma migrate status`
4. Review migration file SQL
5. Consider database restore if critical issue

---

**Created**: January 2026  
**Version**: 1.0  
**Status**: Ready to Run
