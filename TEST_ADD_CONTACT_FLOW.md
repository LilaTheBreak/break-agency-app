# Add Contact Feature - End-to-End Testing Guide

## Test Execution Plan

### 1. UI/UX VERIFICATION
Test in browser at `http://localhost:5173/admin/contacts`

#### Modal Appearance
- [ ] Click "Add Contact" button
- [ ] Modal appears **centered** on screen
- [ ] Background is **darkened/blurred** (semi-transparent overlay)
- [ ] Modal has **clear visible header** "Add Contact"
- [ ] Modal has **proper width** (not full screen, not too narrow)
- [ ] Modal has **scrollable content** for long forms
- [ ] Close button (✕) is **visible and clickable**
- [ ] Cancel and Save buttons are **always visible** at bottom

#### Form Layout
- [ ] Form is **logically grouped** into sections:
  - Core Details
  - Contact Information
  - Settings
- [ ] Section headers are **clearly visible**
- [ ] Labels are **separated from inputs** (not stacked)
- [ ] Required fields are **clearly marked** with asterisk (*)
- [ ] No text **overlaps** with inputs
- [ ] No **background content bleeds through** modal
- [ ] Form is **readable on smaller screens**

#### Form Validation (Frontend)
- [ ] Try to save with **empty First Name** → Error toast: "First name is required"
- [ ] Try to save with **empty Last Name** → Error toast: "Last name is required"
- [ ] Try to save with **no Brand selected** → Error toast: "Brand is required"
- [ ] Fill all required fields → **Save button becomes enabled**

---

### 2. FUNCTIONAL AUDIT - CREATE CONTACT

#### Form State Management
- [ ] **Fill form:**
  - Brand: (select any brand)
  - First Name: "John"
  - Last Name: "Doe"
  - Role: "Manager"
  - Email: "john.doe@example.com"
  - Phone: "+1-555-0123"
  - Relationship Status: "New"
- [ ] **Save contact**
- [ ] Modal **closes automatically**
- [ ] **Success toast appears:** "Contact 'John Doe' added successfully"

#### Backend Verification (Database)
```bash
# Check if contact was created
curl -X GET http://localhost:3001/api/crm-contacts \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] New contact appears in list
- [ ] Contact has correct **first name, last name, email, phone**
- [ ] Contact is linked to **correct Brand** (crmBrandId)
- [ ] Contact has **correct relationship status**

#### UI List Update
- [ ] Return to Contacts page
- [ ] **New contact appears immediately** in list
- [ ] Contact shows **correct Brand name**
- [ ] Contact shows **email address**
- [ ] Contact shows **phone number**
- [ ] No need to **refresh page** to see new contact

---

### 3. BRAND RELATIONSHIP VERIFICATION

#### Create Multiple Contacts
- [ ] Create Contact 1 for "Brand A"
- [ ] Create Contact 2 for "Brand A"
- [ ] Create Contact 3 for "Brand B"

#### Verify Grouping
- [ ] Contacts page shows contacts **grouped by Brand**
- [ ] Brand A section shows **both contacts**
- [ ] Brand B section shows **only one contact**
- [ ] Contact count is **accurate**

---

### 4. PRIMARY CONTACT LOGIC

#### Test Primary Flag
- [ ] Create Contact A for Brand X (unchecked primary)
- [ ] Create Contact B for Brand X (check primary = true)
- [ ] Verify Contact B is shown as **"Primary"** in list (or marked somehow)
- [ ] Edit Contact A, check primary = true
- [ ] Verify Contact A is now primary
- [ ] Verify Contact B's primary status is **automatically unchecked**

---

### 5. EDIT CONTACT FUNCTIONALITY

#### Modify Existing Contact
- [ ] Click "Edit" on any contact
- [ ] Modal opens with **all fields pre-filled**
- [ ] Change Phone number
- [ ] Change Relationship Status
- [ ] Click Save
- [ ] Success toast: "Contact 'John Doe' updated successfully"
- [ ] List updates with **new phone number**
- [ ] No page refresh needed

---

### 6. ERROR HANDLING

#### Invalid Email (if validation exists)
- [ ] Try entering invalid email: "notanemail"
- [ ] Verify validation catches it (if implemented)

#### Network Failure Simulation
```bash
# Stop API server, then try to create contact
```
- [ ] Toast error appears: "Failed to save contact: [error details]"
- [ ] Modal stays **open** (doesn't close on error)
- [ ] Can **retry** after fixing issue

---

### 7. DELETE CONTACT

#### Delete Flow
- [ ] Click "Delete" on any contact
- [ ] Confirmation modal appears
- [ ] Modal shows contact name to be deleted
- [ ] Click "Delete" in confirmation
- [ ] Success toast: "Contact deleted successfully"
- [ ] Contact **disappears** from list
- [ ] List count **updates**

#### Verify Deletion in Database
```bash
curl -X GET http://localhost:3001/api/crm-contacts \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Deleted contact **no longer appears** in API response

---

### 8. FORM RESPONSIVENESS

#### Desktop (1920x1080)
- [ ] All fields visible
- [ ] Modal well-centered
- [ ] Buttons accessible

#### Tablet (768x1024)
- [ ] Modal width **adjusts appropriately**
- [ ] Form **still scrollable** if needed
- [ ] Buttons at bottom **still accessible**

#### Mobile (375x667)
- [ ] Modal **doesn't exceed screen width**
- [ ] Content is **scrollable** vertically
- [ ] Buttons are **tappable** (not too small)
- [ ] Close button is **accessible**

---

### 9. DATA PERSISTENCE

#### Create & Verify Persistence
- [ ] Create contact "Jane Smith"
- [ ] **Refresh page** (Ctrl+R or Cmd+R)
- [ ] Contact **still appears** in list
- [ ] All data **intact** (name, email, phone, brand)

#### Check After Logout/Login
- [ ] Create contact "Bob Johnson"
- [ ] **Logout** of admin account
- [ ] **Login** again
- [ ] Navigate to Contacts
- [ ] Contact "Bob Johnson" **still exists**

---

### 10. CONCURRENT OPERATIONS

#### Multiple Adds
- [ ] Open Add Contact modal
- [ ] Fill form for Contact A
- [ ] **Don't submit yet**
- [ ] Open another browser tab
- [ ] Create Contact B (different brand)
- [ ] Return to first tab
- [ ] Submit Contact A
- [ ] Verify both contacts exist in list
- [ ] No **conflicts or overwrites**

---

### 11. OPTIONAL FIELD HANDLING

#### Create with Minimal Data
- [ ] First Name: "Alex"
- [ ] Last Name: "Turner"
- [ ] Brand: (select)
- [ ] Leave all optional fields **blank**
- [ ] Save
- [ ] Contact appears in list
- [ ] Optional fields show as **empty/not set**

#### Edit and Add Optional Data
- [ ] Edit Contact (Alex Turner)
- [ ] Add Email: "alex@example.com"
- [ ] Add Phone: "+44-7700-900000"
- [ ] Save
- [ ] Verify fields **now populated** in list

---

## Expected Test Results

### ✅ All Passing
- [ ] Modal is centered and fully visible
- [ ] All form validations work
- [ ] Contacts save correctly to database
- [ ] Contacts appear immediately in list (no refresh needed)
- [ ] Brand relationships persist
- [ ] Toast notifications appear for success/error
- [ ] Edit and delete operations work
- [ ] Data persists after page refresh
- [ ] Responsive on all screen sizes

### ⚠️ Issues Found
If any tests fail, document:
1. **Test Name**
2. **Steps to Reproduce**
3. **Expected vs Actual Result**
4. **Error Messages** (from console or toast)

---

## Quick Debug Commands

### Check Contacts in Database
```bash
curl -X GET http://localhost:3001/api/crm-contacts \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Check API Response
Open browser DevTools → Network tab:
1. Filter for `/crm-contacts`
2. Click "Add Contact" and submit
3. Inspect POST request
4. Verify response has `{ contact: {...} }` format

### Check Browser Console
Open DevTools → Console:
1. Look for any JavaScript errors (red)
2. Look for any 404/500 errors (network tab)
3. Verify toast notifications appear

---

## Sign-off

- [ ] All critical tests passing
- [ ] No console errors
- [ ] No network errors
- [ ] Ready for production
