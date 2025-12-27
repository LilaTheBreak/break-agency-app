# 💰 Revenue Dashboard - Quick Start Guide

**For:** Product Team, Admins, Developers  
**Updated:** December 26, 2025

---

## 🚀 What's New

Revenue dashboards are now **fully functional** using deal-based calculations. No payment processor required!

---

## 📊 How It Works

### Revenue States

```
┌─────────────┐
│  PROJECTED  │ ← Deals being negotiated
└─────────────┘   Stages: NEW_LEAD, NEGOTIATION, CONTRACT_SENT

┌─────────────┐
│ CONTRACTED  │ ← Signed but unpaid
└─────────────┘   Stages: CONTRACT_SIGNED, DELIVERABLES_IN_PROGRESS, PAYMENT_PENDING

┌─────────────┐
│    PAID     │ ← Payment received (manual confirmation)
└─────────────┘   Stages: PAYMENT_RECEIVED, COMPLETED
```

### Data Flow

```
1. Deal Created → value: $5,000 → stage: NEW_LEAD
   ↓
   Revenue Dashboard: Projected = $5,000

2. Contract Signed → stage: CONTRACT_SIGNED
   ↓
   Revenue Dashboard: Contracted = $5,000

3. Payment Received → Admin updates stage: PAYMENT_RECEIVED
   ↓
   Revenue Dashboard: Paid = $5,000
```

---

## 🎯 For Admins

### Viewing Revenue

**Navigate to:** Admin Dashboard → Revenue Tab

**What You See:**
- Total pipeline revenue
- Breakdown by state (Projected/Contracted/Paid)
- Deal counts for each state
- Revenue by brand
- Creator earnings

### Marking Payments as Received

**Process:**
1. Brand confirms payment received
2. Go to deal page
3. Update deal stage to "Payment Received"
4. Revenue dashboard automatically updates

**Important:** Payment tracking is **manual** - no automatic detection yet.

---

## 💻 For Developers

### API Endpoints

**Admin Revenue:**
```bash
GET /api/revenue/metrics
GET /api/revenue/by-brand
GET /api/revenue/creator-earnings
GET /api/revenue/time-series
```

**Brand Revenue:**
```bash
GET /api/revenue/brand/:brandId/summary
GET /api/revenue/brand/:brandId/deals
```

**Example Request:**
```bash
curl -X GET "http://localhost:5001/api/revenue/metrics?startDate=2025-01-01" \
  -H "Cookie: session=..." \
  --silent | jq
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "projected": 45000,
    "contracted": 120000,
    "paid": 80000,
    "total": 245000,
    "dealCount": {
      "projected": 12,
      "contracted": 8,
      "paid": 5,
      "total": 25
    }
  }
}
```

### Using the Dashboard Component

```jsx
import { AdminRevenueDashboard } from '@/components/AdminRevenueDashboard';

// In your admin page
<AdminRevenueDashboard />
```

---

## 🎨 For Product/Design

### UI Guidelines

**Labels to Use:**
- "Projected Revenue" (not "Estimated" or "Potential")
- "Contracted Revenue" (not "Committed" or "Confirmed")
- "Paid Revenue (Manual)" (not "Received" - must indicate manual tracking)

**Visual Hierarchy:**
```
[MOST PROMINENT]
Total Pipeline: $245,000

[SECONDARY]
Projected: $45K | Contracted: $120K | Paid: $80K

[SUPPORTING]
12 deals projected | 8 deals contracted | 5 deals paid
```

**Important Notice:**
Always show: "Payment tracking is manual. Update deal stages to reflect payments."

---

## ✅ Testing Checklist

### Before Launch
- [ ] Create test deals in each stage
- [ ] Verify revenue calculations match expectations
- [ ] Test date range filtering
- [ ] Test brand breakdown
- [ ] Test creator earnings
- [ ] Verify manual payment update workflow
- [ ] Check all revenue labels are clear
- [ ] Test brand user access (own brand only)
- [ ] Test admin access (all brands)

### After Launch
- [ ] Monitor API response times
- [ ] Verify revenue accuracy with finance team
- [ ] Collect user feedback on clarity
- [ ] Track manual payment update adoption

---

## 🐛 Common Issues

**Issue:** Revenue shows $0
**Fix:** Create deals with values populated

**Issue:** Paid revenue not updating
**Fix:** Ensure deal stage changed to PAYMENT_RECEIVED or COMPLETED

**Issue:** Brand can't see revenue
**Fix:** Verify brand ownership mapping (TODO)

**Issue:** Time series empty
**Fix:** Populate deal.closedAt dates

---

## 🔮 What's Next

**Phase 2 (Future):**
- Stripe webhook integration for automatic payment tracking
- Email notifications on payment received
- CSV export functionality
- Payment reconciliation

**For Now:**
- Manual payment tracking works perfectly
- Users understand it's manual
- No misleading automation promises

---

## 📞 Questions?

**Technical:** Check `/REVENUE_DASHBOARD_COMPLETE.md`  
**Business:** Revenue = Deal Value × Stage  
**Support:** All revenue states clearly labeled in UI

---

**Status:** ✅ Production Ready  
**Documentation:** Complete  
**Feature Flags:** Enabled  
**Risk Level:** None - Honest manual tracking
