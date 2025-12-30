# Menu Alphabetization Audit Report
**Date:** 2025-01-02  
**Status:** Complete Audit - Ready for Implementation

## Executive Summary

This audit identifies all menus in the codebase and classifies which should be alphabetized while preserving role logic, grouping, and destructive action placement.

---

## Phase 1: Menu Inventory

### ✅ Navigation Menus (Alphabetizable)

#### 1. Admin Navigation Links
**File:** `apps/web/src/pages/adminNavLinks.js`  
**Type:** Sidebar navigation  
**Role:** Admin  
**Current Order:**
1. Overview
2. Activity
3. Tasks
4. Calendar
5. Queues
6. Approvals
7. Documents / Contracts
8. Users
9. Brands
10. Outreach
11. Campaigns
12. Events
13. Deals
14. Messaging
15. Finance
16. Settings

**Classification:** ✅ **ALPHABETIZABLE** - Pure navigation, no destructive actions

**Alphabetized Order:**
1. Activity
2. Approvals
3. Brands
4. Calendar
5. Campaigns
6. Deals
7. Documents / Contracts
8. Events
9. Finance
10. Messaging
11. Outreach
12. Overview (keep first - primary entry point)
13. Queues
14. Settings (keep last - standard placement)
15. Tasks
16. Users

**Note:** "Overview" should stay first, "Settings" should stay last (UX best practice)

---

#### 2. Brand Navigation Links
**File:** `apps/web/src/pages/BrandDashboard.jsx` (line 26)  
**Type:** Sidebar navigation  
**Role:** Brand  
**Current Order:**
1. Overview
2. My Profile
3. Socials
4. Campaigns
5. Opportunities
6. Contracts
7. Financials
8. Messages
9. Email Opportunities
10. Settings

**Classification:** ✅ **ALPHABETIZABLE** - Pure navigation

**Alphabetized Order:**
1. Overview (keep first)
2. Campaigns
3. Contracts
4. Email Opportunities
5. Financials
6. Messages
7. My Profile
8. Opportunities
9. Settings (keep last)
10. Socials

---

#### 3. Admin Dropdown Menu (App.jsx)
**File:** `apps/web/src/App.jsx` (line 1101)  
**Type:** Dropdown menu  
**Role:** Admin  
**Current Order:** Same as ADMIN_NAV_LINKS

**Classification:** ✅ **ALPHABETIZABLE** - Should match ADMIN_NAV_LINKS

---

#### 4. Control Room Presets - Admin QuickLinks
**File:** `apps/web/src/pages/controlRoomPresets.js` (line 11)  
**Type:** Quick links  
**Role:** Admin  
**Current Order:** Same as ADMIN_NAV_LINKS

**Classification:** ✅ **ALPHABETIZABLE** - Should match ADMIN_NAV_LINKS

---

### ✅ Tab Menus (Conditionally Alphabetizable)

#### 5. Exclusive Talent Tabs
**File:** `apps/web/src/pages/controlRoomPresets.js` (line 83)  
**Type:** Tabs  
**Role:** Exclusive Talent  
**Current Order:**
1. Overview (default)
2. My Profile
3. Socials
4. Campaigns
5. Opportunities
6. Financials
7. Messages
8. Contracts
9. Settings

**Classification:** ⚠️ **CONDITIONALLY ALPHABETIZABLE** - "Overview" should stay first (default), "Settings" should stay last

**Alphabetized Order:**
1. Overview (keep first - default)
2. Campaigns
3. Contracts
4. Financials
5. Messages
6. My Profile
7. Opportunities
8. Settings (keep last)
9. Socials

---

#### 6. Talent Tabs
**File:** `apps/web/src/pages/controlRoomPresets.js` (line 120)  
**Type:** Tabs  
**Role:** Talent/Creator  
**Current Order:**
1. Overview (default)
2. Campaigns
3. Opportunities
4. Agent
5. Messages
6. Contracts
7. Account

**Classification:** ⚠️ **CONDITIONALLY ALPHABETIZABLE** - "Overview" should stay first

**Alphabetized Order:**
1. Overview (keep first - default)
2. Account
3. Agent
4. Campaigns
5. Contracts
6. Messages
7. Opportunities

---

#### 7. UGC Talent Tabs
**File:** `apps/web/src/pages/controlRoomPresets.js` (line 155)  
**Type:** Tabs  
**Role:** UGC  
**Current Order:**
1. Overview
2. Briefs
3. Tools
4. Finance
5. Education
6. Messages

**Classification:** ⚠️ **CONDITIONALLY ALPHABETIZABLE** - "Overview" should stay first

**Alphabetized Order:**
1. Overview (keep first)
2. Briefs
3. Education
4. Finance
5. Messages
6. Tools

---

#### 8. Founder Tabs
**File:** `apps/web/src/pages/controlRoomPresets.js` (line 253)  
**Type:** Tabs  
**Role:** Founder  
**Current Order:**
1. Overview (default)
2. Strategy
3. Offers & Revenue
4. Content & Distribution
5. Projects
6. Sessions & Support
7. Resources
8. Account

**Classification:** ⚠️ **CONDITIONALLY ALPHABETIZABLE** - "Overview" should stay first, "Account" should stay last

**Alphabetized Order:**
1. Overview (keep first - default)
2. Account (keep last - standard placement)
3. Content & Distribution
4. Offers & Revenue
5. Projects
6. Resources
7. Sessions & Support
8. Strategy

---

#### 9. Brand Tabs
**File:** `apps/web/src/pages/controlRoomPresets.js` (line 393)  
**Type:** Tabs  
**Role:** Brand  
**Current Order:**
1. Overview (default)
2. Campaigns
3. Creators
4. Reports
5. Messages
6. Account

**Classification:** ⚠️ **CONDITIONALLY ALPHABETIZABLE** - "Overview" should stay first, "Account" should stay last

**Alphabetized Order:**
1. Overview (keep first - default)
2. Account (keep last)
3. Campaigns
4. Creators
5. Messages
6. Reports

---

### ✅ Filter Menus (Alphabetizable)

#### 10. Admin Messaging Filters
**File:** `apps/web/src/pages/AdminMessagingPage.jsx` (line 9)  
**Type:** Filter buttons  
**Role:** Admin  
**Current Order:**
1. All
2. Creators
3. Brands
4. Talent Managers
5. External

**Classification:** ✅ **ALPHABETIZABLE** - "All" should stay first (standard filter pattern)

**Alphabetized Order:**
1. All (keep first - standard filter pattern)
2. Brands
3. Creators
4. External
5. Talent Managers

---

### ✅ Option Menus (Alphabetizable)

#### 11. Role Options
**File:** `apps/web/src/components/EditUserDrawer.jsx` (line 5)  
**Type:** Dropdown options  
**Role:** Admin  
**Current Order:**
1. SUPERADMIN
2. ADMIN
3. CREATOR
4. UGC
5. BRAND
6. FOUNDER
7. TALENT_MANAGER
8. EXCLUSIVE_TALENT

**Classification:** ✅ **ALPHABETIZABLE** - No destructive actions

**Alphabetized Order:**
1. ADMIN
2. BRAND
3. CREATOR
4. EXCLUSIVE_TALENT
5. FOUNDER
6. SUPERADMIN (consider keeping first - highest privilege)
7. TALENT_MANAGER
8. UGC

**Note:** Consider keeping SUPERADMIN first for hierarchy, but alphabetizing the rest

---

#### 12. Status Options
**File:** `apps/web/src/components/EditUserDrawer.jsx` (line 16)  
**Type:** Dropdown options  
**Role:** Admin  
**Current Order:**
1. Active
2. Archived
3. Suspended

**Classification:** ⚠️ **CONDITIONALLY ALPHABETIZABLE** - "Active" is positive state, should stay first

**Alphabetized Order:**
1. Active (keep first - positive state)
2. Archived
3. Suspended

---

### ❌ Do NOT Alphabetize

#### 13. Submission Tabs (Process-Driven)
**File:** `apps/web/src/pages/CreatorDashboard.jsx` (line 190)  
**Type:** Tabs  
**Current Order:**
1. Drafts
2. Revisions requested
3. Awaiting approval
4. Scheduled
5. Approved
6. Usage log

**Classification:** ❌ **DO NOT ALPHABETIZE** - Process-driven workflow (Draft → Revision → Approval → Scheduled → Approved → Usage)

**Reason:** Represents a workflow progression, not a menu

---

## Implementation Plan

### Phase 1: Navigation Menus
1. ✅ Alphabetize `ADMIN_NAV_LINKS` (keep Overview first, Settings last)
2. ✅ Alphabetize `BRAND_NAV_LINKS` (keep Overview first, Settings last)
3. ✅ Alphabetize admin dropdown in `App.jsx` (match ADMIN_NAV_LINKS)
4. ✅ Alphabetize `CONTROL_ROOM_PRESETS.admin.quickLinks` (match ADMIN_NAV_LINKS)

### Phase 2: Tab Menus
5. ✅ Alphabetize Exclusive Talent tabs (keep Overview first, Settings last)
6. ✅ Alphabetize Talent tabs (keep Overview first)
7. ✅ Alphabetize UGC tabs (keep Overview first)
8. ✅ Alphabetize Founder tabs (keep Overview first, Account last)
9. ✅ Alphabetize Brand tabs (keep Overview first, Account last)

### Phase 3: Filter & Option Menus
10. ✅ Alphabetize Admin Messaging filters (keep "All" first)
11. ✅ Alphabetize Role Options (consider keeping SUPERADMIN first)
12. ✅ Alphabetize Status Options (keep "Active" first)

### Phase 4: Verification
- ✅ Confirm all menus alphabetized correctly
- ✅ Verify Overview/Settings/Account placement preserved
- ✅ Verify no destructive actions moved
- ✅ Test role-based visibility
- ✅ Test feature flags

---

## Rules Applied

### ✅ Alphabetization Rules
1. **Navigation menus:** Alphabetize within role sections
2. **Tabs:** Alphabetize but keep "Overview" first, "Settings"/"Account" last
3. **Filters:** Alphabetize but keep "All" first
4. **Options:** Alphabetize but consider hierarchy (e.g., SUPERADMIN first)

### ❌ Exclusions
1. **Process-driven tabs:** Do not alphabetize (e.g., Submission workflow)
2. **Destructive actions:** Keep last (none found in audited menus)
3. **Primary CTAs:** Keep first (none found in audited menus)
4. **Chronological menus:** Do not alphabetize (none found)

---

## Files to Update

1. `apps/web/src/pages/adminNavLinks.js` - Admin navigation
2. `apps/web/src/pages/BrandDashboard.jsx` - Brand navigation
3. `apps/web/src/App.jsx` - Admin dropdown menu
4. `apps/web/src/pages/controlRoomPresets.js` - All tab menus and quickLinks
5. `apps/web/src/pages/AdminMessagingPage.jsx` - Filters
6. `apps/web/src/components/EditUserDrawer.jsx` - Role and Status options

---

## Success Criteria

✅ All eligible menus alphabetized
✅ Overview/Settings/Account placement preserved
✅ No destructive actions moved
✅ Role-based visibility preserved
✅ Feature flags still work
✅ No navigation broken
✅ UX feels polished and intentional

