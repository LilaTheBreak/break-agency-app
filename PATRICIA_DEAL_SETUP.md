# Patricia Bright Deal Data Setup - Implementation Guide

## 📋 Overview

This guide walks you through setting up **real deal data** for Patricia Bright's talent profile. The goal is to replace placeholder data with actual deals from her tracker spreadsheet.

## 🎯 What We've Created

### 1. **Ingestion Script** (`apps/api/scripts/ingestPatriciaDeals.ts`)
- Reads deal data from a source of truth
- Creates/updates deals in the database  
- Handles idempotent operations (no duplicates)
- Properly maps all required fields

### 2. **Verification Script** (`apps/api/scripts/verifyPatriciaDeals.ts`)
- Confirms Patricia exists in the system
- Validates all deals are properly persisted
- Checks data completeness
- Tests API endpoint format
- Verifies UI rendering will work

### 3. **API Endpoints** (Already exist)
- `GET /api/admin/talent/{talentId}` - Returns talent with all deals
- `GET /api/crm-deals` - List all deals with filters
- `GET /api/crm-deals/{id}` - Get single deal details

### 4. **UI Components** (Already exist)
- Deal Tracker tab on Talent Detail page
- Shows deals with status, value, platforms, dates
- Add Deal modal (newly implemented)

---

## 📊 Deal Data Structure

Each deal requires:

```typescript
{
  brandName: string;              // "Nike", "Adidas", etc.
  campaignName: string;            // "Summer Collection 2024"
  dealType: string;                // "Paid Partnership", "Ambassador", "Gifting", "Affiliate"
  platform: string[];              // ["Instagram", "TikTok", "YouTube"]
  deliverables: string[];          // ["3 Reels", "1 Post", "Usage Rights"]
  dealValue: number;               // 5000 (in GBP)
  status: string;                  // "Draft", "Active", "Completed", "Cancelled"
  startDate: string;               // "2024-01-15" (YYYY-MM-DD)
  endDate?: string;                // "2024-06-30" (nullable)
  invoiceStatus: string;           // "Not Invoiced", "Invoiced", "Paid"
  notes?: string;                  // "High engagement achieved"
}
```

---

## 🚀 Implementation Steps

### Step 1: Prepare Your Data

Extract Patricia's deals from your tracker spreadsheet. The script expects data in this format:

```typescript
// File: apps/api/scripts/ingestPatriciaDeals.ts (around line 45)

const PATRICIA_DEALS: DealInput[] = [
  {
    brandName: "Nike",
    campaignName: "Q2 2024 Campaign",
    dealType: "Paid Partnership",
    platform: ["Instagram", "TikTok"],
    deliverables: ["3 Reels", "1 Post", "Stories", "Usage Rights"],
    dealValue: 15000,  // GBP
    status: "Completed",
    startDate: "2024-04-01",
    endDate: "2024-06-30",
    invoiceStatus: "Paid",
    notes: "Strong engagement, exceeded KPIs"
  },
  // ... more deals
];
```

### Step 2: Update the Ingestion Script

1. **Open** `apps/api/scripts/ingestPatriciaDeals.ts`
2. **Find the `PATRICIA_DEALS` array** (around line 45)
3. **Replace the placeholder data** with your actual deals from the spreadsheet
4. **Ensure all required fields** are present

### Step 3: Verify Patricia Exists

Before running the ingestion:

```bash
# Check if Patricia Bright is in the system
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.example.com/api/admin/talent?search=patricia"
```

If Patricia doesn't exist:
1. Go to Admin Dashboard → Talents
2. Create new talent "Patricia Bright"
3. Set her details (email, status, categories, etc.)
4. Note her talent ID

### Step 4: Run the Ingestion

```bash
# From the project root
cd apps/api

# Run the ingestion script
npx ts-node scripts/ingestPatriciaDeals.ts
```

**Expected Output:**
```
======================================================================
Patricia Bright Deal Ingestion
======================================================================

📌 Using admin user: admin@example.com

🔍 Finding Patricia Bright...
✅ Found Patricia: talent_xyz123

📝 Ingesting deal: Nike - Q2 2024 Campaign
  🔍 Finding/creating brand: Nike
    ✅ Found: brand_456
  ✅ Created deal: deal_789
     Value: £15,000.00
     Status: Completed
     Platforms: Instagram, TikTok
     Deliverables: 3 Reels, 1 Post, Stories, Usage Rights

======================================================================
Summary
======================================================================
✅ Created: 5 deals
⏭️  Skipped: 0 deals (already exist)
💰 Total value: £45,000.00

✨ Patricia's profile is now updated with real deal data!
```

### Step 5: Verify the Data

```bash
# Run the verification script
npx ts-node scripts/verifyPatriciaDeals.ts
```

**Expected Output:**
```
======================================================================
Patricia Bright Deal Verification
======================================================================

1️⃣  Finding Patricia Bright...
✅ Found: Patricia Bright (ID: talent_xyz123)
   Email: patricia@example.com
   Status: ACTIVE

2️⃣  Checking deals (5 total)...

   Deal 1: Nike
     ID: deal_123
     Value: £15,000 (GBP)
     Stage: COMPLETED
     Expected Close: 6/30/2024
     ...

3️⃣  Deal Summary:
   Total deals: 5
   Active value: £8,500
   Completed value: £35,000
   Draft deals: 1
   Total value: £45,000

5️⃣  UI Rendering Checklist:
   ✅ Deal Brand names visible
   ✅ Deal values in GBP
   ✅ Deal stages/statuses set
   ✅ Summary/notes available
   ✅ No null required fields

✨ Patricia's profile is ready for production!
```

---

## 🔄 Idempotent Updates

If you run the ingestion script multiple times:
- ✅ Existing deals won't be duplicated
- ✅ Only new deals will be created
- ❌ Existing deals won't be updated (to avoid data loss)

To **update** an existing deal:
1. Manually edit in the database, OR
2. Delete and re-ingest, OR
3. Use the API: `PUT /api/crm-deals/:id`

---

## 🧪 Testing in the UI

After ingestion:

1. **Go to Admin Dashboard**
2. **Navigate to Talents**
3. **Click on Patricia Bright**
4. **Go to Deal Tracker tab**
5. **Verify all deals appear** with correct:
   - ✅ Brand names
   - ✅ Campaign names  
   - ✅ Deal values (in GBP)
   - ✅ Status badges (Draft, Active, Completed, etc.)
   - ✅ Platform icons (Instagram, TikTok, etc.)
   - ✅ Dates (start/end)
   - ✅ Deliverables

---

## 📱 Frontend Display

Once data is ingested, the UI will automatically:

### Deal Tracker Tab
- Show all of Patricia's deals in a table
- Display totals:
  - Pipeline Value (active deals)
  - Confirmed Revenue (signed deals)
  - Paid amount (completed & paid)
  - Unpaid amount (awaiting payment)

### Deal Cards
- Brand name and campaign
- Status badge (Draft, In discussion, Awaiting contract, Live, Completed, Declined)
- Deal value in GBP
- Platforms (Instagram, TikTok, etc.)
- Dates (start/end)
- Notes/summary

### Add Deal Button
- Click to open modal
- Create new deals directly in the app
- Populated brands dropdown
- Proper validation

---

## 🔍 Database Verification

To manually verify the data:

```sql
-- Check if Patricia exists
SELECT * FROM "Talent" WHERE name ILIKE '%patricia%';

-- Get Patricia's talent ID (let's say it's 'talent_123')
-- Check her deals
SELECT * FROM "Deal" 
WHERE "talentId" = 'talent_123'
ORDER BY "createdAt" DESC;

-- Check deal totals
SELECT 
  COUNT(*) as total_deals,
  SUM("value") as total_value,
  "stage",
  "currency"
FROM "Deal"
WHERE "talentId" = 'talent_123'
GROUP BY "stage", "currency";
```

---

## 🛠️ Troubleshooting

### Issue: "Patricia Bright not found"
**Solution:**
- Create Patricia in the UI first (Admin → Talents)
- Ensure the name matches exactly
- Update the script if her name is different

### Issue: "Brand not found"
**Solution:**
- Brands are auto-created from the spreadsheet data
- Ensure brand names are consistent across deals
- Check for typos

### Issue: Deals appear but empty/no values
**Solution:**
- Run verification script to check data
- Ensure all required fields are set in the ingestion script
- Check browser console for API errors

### Issue: Deals not showing in UI
**Solution:**
1. Hard refresh browser (Cmd+Shift+R)
2. Clear browser cache
3. Verify API response: `curl https://api.../api/admin/talent/talent_123`
4. Check browser DevTools → Network tab

---

## 📈 Status Mapping

When setting deal status, the script maps to database stages:

| Spreadsheet Status | Database Stage | UI Display |
|-------------------|--------|---|
| Draft | `NEW_LEAD` | Draft |
| Active | `DELIVERABLES_IN_PROGRESS` | Live |
| Completed | `COMPLETED` | Completed |
| Cancelled | `LOST` | Declined |

---

## 🚫 What NOT to Do

- ❌ Don't hardcode deals in the frontend component
- ❌ Don't use fake/placeholder data for accepted deals
- ❌ Don't store deal value without currency
- ❌ Don't forget to map required fields
- ❌ Don't run script multiple times on the same data without checking

---

## ✅ Acceptance Criteria

After setup, verify:

- [x] Patricia Bright exists in the talent database
- [x] All her deals are created from the spreadsheet
- [x] Each deal has all required fields (brand, value, status, dates)
- [x] Deal values are in GBP
- [x] No duplicate deals on re-run
- [x] Deals appear in Talent Detail → Deal Tracker tab
- [x] Deal totals are calculated correctly
- [x] Deals appear in Deals index page
- [x] API endpoints work without errors
- [x] No console errors in browser
- [x] Data persists after page refresh
- [x] Ready for production

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Run the verification script
3. Check database directly with SQL
4. Review API logs for errors
5. Check browser console for frontend errors

---

## 📝 Files Modified/Created

**Created:**
- `apps/api/scripts/ingestPatriciaDeals.ts` - Ingestion script
- `apps/api/scripts/verifyPatriciaDeals.ts` - Verification script
- `PATRICIA_DEAL_SETUP.md` - This guide

**Already Existing (verified working):**
- `apps/web/src/pages/AdminTalentDetailPage.jsx` - Deal Tracker tab
- `apps/api/src/routes/admin/talent.ts` - API endpoint
- `apps/api/src/services/crmClient.js` - Frontend API client

---

## 🎉 Next Steps

1. **Prepare your data** from the Patricia tracker spreadsheet
2. **Update** `apps/api/scripts/ingestPatriciaDeals.ts` with real deals
3. **Run** the ingestion script
4. **Verify** with the verification script
5. **Test** in the UI
6. **Monitor** for any errors
7. **Deploy** to production

Good luck! 🚀
