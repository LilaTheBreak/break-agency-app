# Patricia Bright Deal Data - Quick Reference

## 📋 Example Data Structure

Use this template to prepare your deal data from the tracker spreadsheet:

```typescript
const PATRICIA_DEALS: DealInput[] = [
  // =========================================================================
  // TEMPLATE: Copy and modify for each of Patricia's deals
  // =========================================================================
  {
    // Brand name (from tracker)
    brandName: "Nike",
    
    // Campaign/collaboration name
    campaignName: "Q2 2024 Summer Campaign",
    
    // Type of deal: "Paid Partnership" | "Ambassador" | "Gifting" | "Affiliate" | "Content License"
    dealType: "Paid Partnership",
    
    // Platforms involved (array)
    platform: ["Instagram", "TikTok"],
    
    // What she's creating/delivering (array)
    deliverables: ["3 Reels", "1 Post", "Stories", "Usage Rights"],
    
    // Deal value in GBP (whole number)
    dealValue: 15000,  // = £150.00
    
    // Status: "Draft" | "Active" | "Completed" | "Cancelled"
    status: "Completed",
    
    // When the deal started (YYYY-MM-DD)
    startDate: "2024-04-01",
    
    // When it ends (YYYY-MM-DD, null if ongoing)
    endDate: "2024-06-30",
    
    // Payment status: "Not Invoiced" | "Invoiced" | "Paid"
    invoiceStatus: "Paid",
    
    // Any notes (optional)
    notes: "Strong engagement metrics, exceeded KPIs"
  },
  
  // =========================================================================
  // ADD YOUR DEALS BELOW (Copy template above and fill in actual data)
  // =========================================================================
];
```

---

## 💡 Tips for Data Entry

### Brand Names
- Use exact spelling from tracker
- Capitalize properly (e.g., "Nike", not "NIKE" or "nike")
- If brand is missing, use a placeholder like "Unnamed Brand"

### Campaign Names
- Use the actual campaign name from tracker
- If missing, auto-generate: `{BrandName} Campaign {Year}`
- Examples: "Summer Collection", "Q1 Influencer Series", "Holiday Push"

### Deal Types
Choose ONE from:
- `"Paid Partnership"` - Fee-based collaboration
- `"Ambassador"` - Long-term ambassador deal
- `"Gifting"` - Free products
- `"Affiliate"` - Commission-based
- `"Content License"` - Buying existing content

### Platforms
Use EXACT platform names (case-sensitive in some places):
```typescript
platform: [
  "Instagram",        // Posts, Reels, Stories
  "TikTok",          // Short-form video
  "YouTube",         // Long-form video
  "LinkedIn",        // Professional content
  "Twitter/X",       // Tweets
  "Multi-platform"   // If multiple, list all or use "Multi-platform"
]
```

### Deliverables
List specific content being created:
```typescript
deliverables: [
  "3 Reels",           // TikTok/Instagram reels
  "1 Post",            // Static Instagram post
  "2 Stories",         // Instagram stories
  "1 Live",            // Live video session
  "Usage Rights",      // Brand can reuse content
  "Product Seeding",   // Just gifting product
  "Brand Mention",     // Mention in content
]
```

### Deal Values (Important!)
- Store as **whole number** (GBP in pence)
- Examples:
  - £1,500 → `150000`
  - £5,000 → `500000`
  - £10,500 → `1050000`
- Always use GBP currency
- Never use decimals in the code

### Statuses
Map your tracker statuses:
```
Tracker Status  →  Our Status  →  DB Stage
─────────────────────────────────────────
"Pre-agreement" →  "Draft"      → NEW_LEAD
"Live/Active"   →  "Active"     → DELIVERABLES_IN_PROGRESS
"Finished"      →  "Completed"  → COMPLETED
"Cancelled"     →  "Cancelled"  → LOST
"On Hold"       →  "Draft"      → NEW_LEAD
```

### Dates
- Format: `"YYYY-MM-DD"`
- Examples:
  - January 15, 2024 → `"2024-01-15"`
  - June 30, 2024 → `"2024-06-30"`
- For ongoing deals: set `endDate: null`

### Invoice Status
```
"Not Invoiced"  // Haven't sent invoice yet
"Invoiced"      // Invoice sent, awaiting payment
"Paid"          // Payment received
```

---

## 📊 Real-World Example

Here's a complete example with Patricia's hypothetical deals:

```typescript
const PATRICIA_DEALS: DealInput[] = [
  {
    brandName: "Nike",
    campaignName: "Q2 2024 Summer Campaign",
    dealType: "Paid Partnership",
    platform: ["Instagram", "TikTok"],
    deliverables: ["3 Reels", "1 Post", "Stories", "Usage Rights"],
    dealValue: 1500000,  // £15,000
    status: "Completed",
    startDate: "2024-04-01",
    endDate: "2024-06-30",
    invoiceStatus: "Paid",
    notes: "Strong engagement, 8% engagement rate"
  },
  {
    brandName: "Adidas",
    campaignName: "Creator Collab Series",
    dealType: "Ambassador",
    platform: ["Instagram", "TikTok", "YouTube"],
    deliverables: ["5 Reels", "2 Posts", "1 Long-form Video", "Usage Rights"],
    dealValue: 2500000,  // £25,000
    status: "Active",
    startDate: "2024-06-01",
    endDate: null,  // Ongoing
    invoiceStatus: "Invoiced",
    notes: "3-month renewable contract"
  },
  {
    brandName: "Glossier",
    campaignName: "Beauty Campaign 2024",
    dealType: "Gifting",
    platform: ["Instagram"],
    deliverables: ["Product Seeding", "Organic Posts"],
    dealValue: 50000,  // £500 (just product value)
    status: "Completed",
    startDate: "2024-05-15",
    endDate: "2024-05-30",
    invoiceStatus: "Paid",
    notes: "Product gifting campaign"
  },
  {
    brandName: "Amazon",
    campaignName: "Affiliate Program",
    dealType: "Affiliate",
    platform: ["TikTok", "Instagram"],
    deliverables: ["Ongoing Content", "Links in Bio"],
    dealValue: 1000000,  // £10,000 (annual estimate)
    status: "Active",
    startDate: "2024-01-01",
    endDate: null,
    invoiceStatus: "Paid",
    notes: "Recurring commission 5% of sales"
  },
  {
    brandName: "Sony Music",
    campaignName: "Artist Promotion",
    dealType: "Paid Partnership",
    platform: ["TikTok"],
    deliverables: ["2 TikToks", "1 Reel"],
    dealValue: 500000,  // £5,000
    status: "Draft",
    startDate: "2024-08-01",
    endDate: "2024-08-31",
    invoiceStatus: "Not Invoiced",
    notes: "Pending contract review"
  }
];
```

---

## 🔢 Quick Conversion Table

Copy-paste these deal values (in pence) based on GBP amounts:

| Amount | Code | Amount | Code |
|--------|------|--------|------|
| £100   | 10000 | £5,000 | 500000 |
| £250   | 25000 | £7,500 | 750000 |
| £500   | 50000 | £10,000 | 1000000 |
| £750   | 75000 | £12,500 | 1250000 |
| £1,000 | 100000 | £15,000 | 1500000 |
| £2,500 | 250000 | £20,000 | 2000000 |

---

## 📋 Checklist Before Running Script

Before running `ingestPatriciaDeals.ts`:

- [ ] All deals have `brandName` (no empty strings)
- [ ] All deals have `campaignName` (no empty strings)
- [ ] All deal values are numbers (not strings)
- [ ] All dates are in `"YYYY-MM-DD"` format
- [ ] Status is one of: Draft, Active, Completed, Cancelled
- [ ] Platform array is not empty
- [ ] Deliverables array is not empty
- [ ] No duplicate deals in the list
- [ ] All required fields are present
- [ ] Patricia Bright exists in the database
- [ ] You have admin access to run the script

---

## ⚠️ Common Mistakes

### ❌ Wrong Date Format
```typescript
// WRONG - This won't parse correctly
startDate: "01/04/2024",  // ❌ MM/DD/YYYY
startDate: "15 April 2024", // ❌ Long format
startDate: "2024-04-15 10:30", // ❌ Has time component

// RIGHT
startDate: "2024-04-15", // ✅ ISO format
```

### ❌ Wrong Value Format
```typescript
// WRONG
dealValue: "5000", // ❌ String, not number
dealValue: 50, // ❌ Pence, but too small (= 50p)
dealValue: 5000.50, // ❌ Decimal (should be whole number)

// RIGHT
dealValue: 500000, // ✅ 5000 pence = £50.00
```

### ❌ Wrong Status
```typescript
// WRONG
status: "completed", // ❌ Lowercase
status: "COMPLETED", // ❌ Uppercase
status: "Finished", // ❌ Not a valid option

// RIGHT
status: "Completed", // ✅ Title case
```

---

## 🚀 How to Use This File

1. **Copy the template** above
2. **Fill in your actual data** from Patricia's tracker
3. **Paste into** `apps/api/scripts/ingestPatriciaDeals.ts`
4. **Replace** the `PATRICIA_DEALS` array
5. **Run** the ingestion script
6. **Verify** with the verification script
7. **Test** in the UI

---

## 💬 Questions?

Refer to:
- `PATRICIA_DEAL_SETUP.md` - Full implementation guide
- Database schema in `schema.prisma` - Exact field definitions
- Existing deals in the UI for reference

Good luck! 🎉
