# CMS Edit Page Button - Testing Guide

## Quick Test (5 minutes)

### Test 1: Open Editor from Hardcoded Content
```
1. Navigate to: http://localhost:3000/careers
2. You should see hardcoded "Join The Break" content
3. Click the red "Edit Page" button (bottom right)
4. ✅ EXPECT: Editor header appears at top with "Edit Mode" badge
5. ✅ EXPECT: Empty state shows with "No content yet" message
6. ✅ EXPECT: "Create First Block" button is visible
```

**Console Logs to See**:
```javascript
[CMS] Edit mode enabled for /careers
[CMS Edit] Loading draft content for slug: careers
[CMS Edit] Successfully loaded 0 blocks for slug: careers
[CMS] Edit Page clicked - entering edit mode
```

### Test 2: Exit Edit Mode
```
1. From Test 1 state (editor open, empty state)
2. Click the "Exit" button (top right)
3. ✅ EXPECT: Editor header disappears
4. ✅ EXPECT: Back to hardcoded content view
5. ✅ EXPECT: "Edit Page" button visible again
```

### Test 3: Create First Block
```
1. From Test 1 state (editor open, empty state)
2. Click "Create First Block" button
3. ✅ EXPECT: Block creation form opens
4. ✅ EXPECT: Can select block type (HERO, TEXT, etc.)
5. ✅ EXPECT: Can add content
```

### Test 4: Check Loading State
```
1. From Test 1, click "Exit" to close editor
2. Immediately click "Edit Page" again
3. BRIEFLY see: Loading spinner with "Loading editor content..."
4. ✅ EXPECT: Spinner disappears after ~1 second
5. ✅ EXPECT: Editor UI appears
```

### Test 5: Error Handling (Optional - requires API error)
```
1. Open DevTools Network tab
2. Block the request to /api/content/pages/careers
3. Click "Edit Page"
4. ✅ EXPECT: Error toast appears (bottom right)
5. ✅ EXPECT: Console shows [CMS Edit] error
6. ✅ EXPECT: Editor gracefully handles error
```

---

## Extended Test (15 minutes)

### Test 6: Create and Save Block
```
1. Enter edit mode (Test 1)
2. Click "Create First Block"
3. Select "TEXT" block type
4. Fill in: Headline, Body, Link
5. Click "Save"
6. ✅ EXPECT: Block appears in editor
7. ✅ EXPECT: "Save Draft" button becomes enabled
8. Click "Save Draft"
9. ✅ EXPECT: "Draft saved" toast appears
10. Refresh page - ✅ EXPECT: Block still there
```

### Test 7: Create Multiple Blocks
```
1. From Test 6 state (have 1 block)
2. Click "+ Add Block" button
3. Create another block (different type)
4. ✅ EXPECT: Blocks are in editor
5. Drag to reorder blocks
6. ✅ EXPECT: Order changes
7. Save Draft
8. ✅ EXPECT: Order persists after refresh
```

### Test 8: Publish Changes
```
1. From Test 6 state (unsaved draft)
2. Click "Publish" button
3. Confirm in dialog "Publish changes?"
4. ✅ EXPECT: Publish button becomes disabled briefly
5. ✅ EXPECT: "Page published successfully" toast
6. Go to /careers (without ?edit=true)
7. ✅ EXPECT: See published block content (not hardcoded)
```

### Test 9: Edit Existing Block
```
1. From Test 8 state (published page)
2. Click "Edit Page" to enter edit mode
3. Click on a block to edit it
4. Change content
5. ✅ EXPECT: "Save Draft" button becomes enabled
6. Save and publish
7. ✅ EXPECT: Changes appear on public page
```

### Test 10: Delete Block
```
1. In edit mode
2. Hover over a block
3. Click trash icon or "Delete"
4. Confirm delete dialog
5. ✅ EXPECT: Block removed from editor
6. ✅ EXPECT: "Save Draft" button enabled
7. Save Draft
8. ✅ EXPECT: Block deleted after refresh
```

---

## Test Other Pages (to ensure no regression)

Test that other CMS pages still work:

- [ ] `/` (Welcome/Landing) - Edit Page button works
- [ ] `/press` - Edit Page button works
- [ ] `/help` - Edit Page button works
- [ ] `/contact` - Edit Page button works

For each page:
1. Navigate to page
2. Click "Edit Page"
3. ✅ EXPECT: Editor opens
4. Edit and save content
5. ✅ EXPECT: Changes appear on public page

---

## Browser Console Debugging

### All Expected Logs

When working correctly, you should see these logs in sequence:

```javascript
// User clicks Edit Page button
[CMS] Edit Page clicked - entering edit mode

// Component syncs URL
[CMS] Edit mode enabled for /careers

// Hook fetches content
[CMS Edit] Loading draft content for slug: careers

// Success or failure
[CMS Edit] Successfully loaded 0 blocks for slug: careers
// OR
[CMS Edit] Failed to load page 'careers': 404 (Page not found or not editable)
```

### Common Log Patterns

**Page has no blocks yet**:
```javascript
[CMS Edit] Successfully loaded 0 blocks for slug: careers
```

**Page has blocks**:
```javascript
[CMS Edit] Successfully loaded 3 blocks for slug: careers
```

**Page not in registry**:
```javascript
[CMS Edit] Failed to load page 'unknown-slug': 404
```

**API error**:
```javascript
[CMS Edit] Failed to load page 'careers': Failed to fetch page: 500 Internal Server Error
```

---

## Network Tab Debugging

### Requests to Expect

When entering edit mode for `/careers`:

1. **POST** to `/api/content/pages` (if fetching list)
   - Response: `{pages: [{slug: "careers", title: "Careers", ...}]}`

2. **GET** to `/api/content/pages/careers?preview=true`
   - Response: `{blocks: [...]}`
   - If no blocks: `{blocks: []}`

### Check for Errors

Look for red 404 or 500 responses:
- 404: Page not in registry
- 403: Permission denied (requires superadmin)
- 500: Server error

If you see errors, check the browser console for matching error toast.

---

## Rollback Instructions

If anything breaks during testing:

1. Revert the CareersPage.jsx changes:
```bash
git checkout apps/web/src/pages/CareersPage.jsx
```

2. Revert the useCmsEditMode.js changes:
```bash
git checkout apps/web/src/hooks/useCmsEditMode.js
```

3. Rebuild:
```bash
cd apps/web && npm run build
```

---

## Success Criteria

After all tests pass, you can be confident:

- ✅ Edit mode opens reliably for empty pages
- ✅ Edit mode opens reliably for pages with blocks
- ✅ Loading states are visible and clear
- ✅ Errors are shown to users
- ✅ Empty state guides users to create first block
- ✅ Save/Publish/Edit flows work end-to-end
- ✅ No silent failures
- ✅ Console logs help with debugging
- ✅ No regression on other pages
