# Deal Tracker Upgrade - Quick Start Guide

**For Patricia Bright's Talent Profile** | **January 7, 2026**

---

## 🎯 What Changed?

The Deal Tracker is no longer read-only. Talent managers can now manage deals completely from the UI.

---

## 👥 For Talent Managers

### How to Use the New Deal Tracker

**View Your Deals:**
1. Go to Admin → Talents → Patricia Bright
2. Click the **Deal Tracker** tab
3. Toggle between:
   - **Opportunities** = deals without a stage (early discussions)
   - **Deals** = deals with a stage (active pipeline)

**Edit Any Field:**
1. Click on a cell (Scope, Fee, Currency, Stage, Date, Notes)
2. Cell turns red and becomes editable
3. Type new value or select from dropdown
4. Press Enter or click outside to save
5. Success notification appears

**Change Deal Stage (Moves between tabs):**
1. Click the Stage cell
2. Select from: In discussion, Negotiation, Contract Sent, Contract Signed, Live, Completed, Declined
3. Or select "Clear Stage (Opportunity)" to move back to Opportunities
4. Deal automatically moves to correct tab

**Manage Currency:**
1. Click Currency cell (GBP, USD, EUR, AUD, CAD)
2. Select new currency
3. Displays in Fee amount (e.g., "£5000" or "$5000")

**Track Payments:**
1. Payment Status automatically updates based on Stage
2. Paid = stage is Payment Received or Completed
3. Unpaid = stage is Payment Pending
4. Awaiting = stage is Contract Signed or Deliverables

**Filter & Sort:**
- **Stage Filter:** Show only specific deal stages
- **Payment Filter:** Show only Paid/Unpaid/Awaiting/Pending
- **Currency Filter:** Show only deals in GBP, USD, etc.
- **Sort Options:** By Date, Brand, Stage, or Value

**View Financial Summary:**
- **Total Pipeline:** All non-declined deals
- **Pending Deals:** Early stage (In discussion, Negotiation, Contract Sent)
- **Confirmed Revenue:** Signed and active deals
- **Paid vs Unpaid:** Breakdown of payment status
- **Avg Deal Value:** Pipeline ÷ deal count
- **Largest Deal:** Biggest single deal
- **Closing This Month:** Deals due this month
- **Total Deals:** Count of all deals

---

## 💻 For Developers

### API Changes

**Updated PATCH Endpoint:** `/api/crm-deals/:id`

New fields supported:
```json
{
  "currency": "GBP",              // ISO code: GBP, USD, EUR, AUD, CAD
  "stage": "CONTRACT_SIGNED",     // DealStage enum value
  "value": 5000,                  // Numeric fee
  "expectedClose": "2026-02-15",  // ISO date string
  "notes": "Updated notes here"   // Text field
}
```

Backward compatible with old names:
- `status` → maps to `stage`
- `estimatedValue` → maps to `value`
- `expectedCloseDate` → maps to `expectedClose`

**Audit Logging:**
All changes logged to audit trail with field names and timestamp.

### Frontend Changes

**File:** `apps/web/src/pages/AdminTalentDetailPage.jsx`

New in DealsTab:
- State: `dealView`, `editingDealId`, `editingField`, `editValue`
- Function: `handleEditField(dealId, field, value)` - saves to DB
- Function: `getPaymentStatus(stage)` - computes status from stage
- Filters: `stageFilter`, `paymentFilter`, `currencyFilter`
- Sorting: Added `stage` and `value` options

Removed:
- Nothing - only additions

### Testing

1. **Create deal with GBP:** Should default to GBP currency
2. **Edit currency:** Should persist and display in fee
3. **Change stage:** Should move between Opportunities/Deals tabs
4. **Filter by currency:** Should filter results correctly
5. **Check metrics:** Should show correct GBP calculations
6. **Edit and refresh:** Changes should persist after page reload

---

## 📊 Data Model Reference

### Deal Model Fields (Relevant)

| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| `id` | UUID | ❌ | Auto-generated |
| `brandName` | String | ✅ (scope) | Stored as notes |
| `value` | Number | ✅ | Deal fee amount |
| `currency` | String | ✅ | ISO code: GBP, USD, etc. |
| `stage` | Enum | ✅ | DealStage: NEW_LEAD, etc. |
| `expectedClose` | Date | ✅ | Due date |
| `notes` | Text | ✅ | Scope + notes combined |
| `paymentStatus` | - | ❌ | Computed from stage |

### Deal Stages

```
NEW_LEAD          → "In discussion"
NEGOTIATION       → "In discussion" (same display)
CONTRACT_SENT     → "Awaiting contract"
CONTRACT_SIGNED   → "Contract signed"
DELIVERABLES_IN_PROGRESS → "Live"
PAYMENT_PENDING   → "Live" (same display)
PAYMENT_RECEIVED  → "Completed"
COMPLETED        → "Completed" (same display)
LOST             → "Declined"
(empty/null)     → "Opportunity"
```

---

## 🔧 Deployment Steps

```bash
# 1. Backend
cd apps/api
npm run build

# 2. Frontend
cd apps/web
npm run build

# 3. Deploy both builds to production

# 4. Verify:
# - Visit Patricia Bright's page
# - Check Deal Tracker tab loads
# - Try editing a field
# - Verify currency dropdown shows GBP default
# - Check metrics calculate
```

---

## ⚠️ Known Limitations

- Currency conversion not automated (stored values only)
- Cannot bulk edit multiple deals
- Cannot duplicate deals from template
- Payment Status is computed (cannot override manually)
- Brand name locked after deal creation

These can be added in future iterations.

---

## 📞 Support & Questions

See [DEAL_TRACKER_UPGRADE_COMPLETE.md](DEAL_TRACKER_UPGRADE_COMPLETE.md) for:
- Complete implementation details
- Architecture decisions
- All code changes with line numbers
- Full testing checklist

---

**Status:** ✅ **Live and ready to use**

Start managing Patricia Bright's deals from the Talent page!
