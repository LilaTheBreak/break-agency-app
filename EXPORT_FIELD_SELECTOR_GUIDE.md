# Export Field Selector - Frontend Implementation Guide

## Overview
The export field selection UI is **fully functional** with all state management in place. The component uses a simple checkbox grid approach that's already integrated.

## Current State

### ✅ Completed Components

1. **Export Buttons** (Lines 2238-2254)
   - CSV button: Downloads CSV with selected fields
   - PDF button: Downloads PDF with selected fields  
   - XLSX button: Downloads Excel with selected fields
   - Loading/disabled states while exporting

2. **Field Selector Toggle** (Lines 2255-2259)
   - "⚙️ Show Fields" / "⚙️ Hide Fields" button
   - Toggles `showExportOptions` state
   - Styled consistently with other buttons

3. **Field Selection UI** (Lines 2261-2288)
   - Checkbox grid for 8 exportable fields
   - Each field: Brand, Campaign, Status, Value, Currency, Payment Status, Closed Date, Notes
   - "Select All" quick action button
   - Individual field toggle handlers
   - Conditional rendering: Only shows when `showExportOptions === true`

4. **Export Handler** (Lines 1780-1837)
   - Collects selected fields from state
   - Sends selectedFields array to backend
   - Properly filters to only include checked fields
   - Handles errors with user-friendly messages

### ✅ Backend Integration

The export endpoint **already accepts and uses selectedFields**:
- POST /api/admin/deals/closed/export
- Request body includes: `selectedFields: ["brand", "campaign", "status", ...]`
- All three export functions (CSV, XLSX, PDF) filter by selectedFields
- Backend properly maps fields to display labels

---

## Usage Example

### User Flow:
1. Navigate to Closed Deals tab on Admin Talent page
2. Click "⚙️ Show Fields" button
3. Select desired fields from checkbox grid
4. Click "Select All" to quickly enable all fields
5. Choose export format: CSV, PDF, or XLSX
6. File downloads with only selected fields

### Example Payload Sent to Backend:
```json
{
  "talentId": "talent_123",
  "format": "xlsx",
  "selectedFields": ["brand", "campaign", "status", "value", "currency", "closedDate"]
}
```

### Example Backend Response:
```json
{
  "success": true,
  "message": "Export generated successfully",
  "filename": "closed-deals-talent_123-2024-01-10.xlsx",
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
```

---

## Field Mapping Reference

### Available Fields (8 total):

| Field ID | Display Label | Data Source | Type |
|----------|--------------|-------------|------|
| `brand` | Brand | Deal.brandName | string |
| `campaign` | Campaign | Deal.campaignName | string |
| `status` | Status | Deal.stage (COMPLETED/LOST) | string |
| `value` | Value | Deal.value | number |
| `currency` | Currency | Deal.currency | string (GBP/USD/EUR/etc) |
| `paymentStatus` | Payment | Deal.paymentStatus | string |
| `closedDate` | Closed Date | Deal.closedAt | date |
| `notes` | Notes | Deal.notes | string |

### Default Selection:
```javascript
{
  brand: true,
  campaign: true,
  status: true,
  value: true,
  currency: true,
  paymentStatus: true,
  closedDate: true,
  notes: false  // Disabled by default
}
```

---

## Code Location Reference

### Frontend Files:

**File**: `apps/web/src/pages/AdminTalentDetailPage.jsx`

**State Initialization** (Lines ~1485-1520):
```javascript
const [selectedExportFields, setSelectedExportFields] = useState({
  brand: true,
  campaign: true,
  status: true,
  value: true,
  currency: true,
  paymentStatus: true,
  closedDate: true,
  notes: false,
});

const [showExportOptions, setShowExportOptions] = useState(false);
const [exportLoading, setExportLoading] = useState(false);
const [exportError, setExportError] = useState("");
```

**Export Handler** (Lines ~1780-1837):
```javascript
const handleExportClosedDeals = async (format) => {
  setExportError("");
  setExportLoading(true);
  
  try {
    const selectedFields = Object.keys(selectedExportFields)
      .filter((k) => selectedExportFields[k]);
    
    const response = await fetch("/api/admin/deals/closed/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        talentId: talent.id,
        format: format,
        selectedFields: selectedFields.length > 0 ? selectedFields : undefined,
      }),
    });
    // ... rest of handler
  } catch (err) {
    // ... error handling
  } finally {
    setExportLoading(false);
  }
};
```

**UI Components** (Lines ~2238-2288):
- Export buttons section
- Field selector toggle
- Field selection grid with checkboxes

### Backend Files:

**File**: `apps/api/src/routes/admin/deals.ts`

**Export Endpoint** (Lines 152-347):
- Accepts `selectedFields` parameter
- Validates format (csv|pdf|xlsx)
- Routes to appropriate generator function

**Export Generators** (Lines 349-560):
- `generateCSV(deals, fieldsToExport)` - Uses fieldMap to filter
- `generateXLSX(deals, fieldsToExport, talentId)` - Creates 2-sheet workbook
- `generateAdvancedPDF(deals, fieldsToExport, talentId)` - Professional PDF

---

## Optional Enhancements

### 1. Field Preferences Persistence
Save selected fields to localStorage:
```javascript
// On mount
useEffect(() => {
  const saved = localStorage.getItem(`export_fields_${talent?.id}`);
  if (saved) {
    setSelectedExportFields(JSON.parse(saved));
  }
}, [talent?.id]);

// On change
const handleFieldToggle = (field) => {
  setSelectedExportFields(prev => {
    const updated = { ...prev, [field]: !prev[field] };
    localStorage.setItem(`export_fields_${talent?.id}`, JSON.stringify(updated));
    return updated;
  });
};
```

### 2. Clear Selection Button
```javascript
<button
  onClick={() => setSelectedExportFields({
    brand: false, campaign: false, status: false, value: false,
    currency: false, paymentStatus: false, closedDate: false, notes: false,
  })}
  className="text-xs font-semibold text-red-600 hover:text-red-700"
>
  Clear All
</button>
```

### 3. Field Count Badge
```javascript
const selectedCount = Object.values(selectedExportFields).filter(v => v).length;
<span className="ml-2 text-xs bg-brand-black text-white px-2 py-1 rounded">
  {selectedCount} / 8
</span>
```

### 4. Save Field Preset
```javascript
const [fieldPresets, setFieldPresets] = useState({
  default: { /* all true */ },
  minimal: { brand: true, status: true, value: true, currency: true, /* ... */ },
  financial: { value: true, currency: true, paymentStatus: true, /* ... */ },
});
```

---

## Testing Scenarios

### Test 1: Field Selection Persistence
1. Select only Brand, Status, Value
2. Click export (any format)
3. Verify exported file contains ONLY those 3 fields
4. Verify field selection persists (UI still shows same 3 checked)

### Test 2: Select All / Clear All
1. Click "Select All"
2. Verify all 8 checkboxes become checked
3. Click any checkbox to deselect
4. Click "Select All" again
5. Verify all 8 are checked again

### Test 3: Export with Different Field Sets
1. Test CSV with 3 fields
2. Test PDF with 6 fields
3. Test XLSX with all 8 fields
4. Verify each export contains only selected fields

### Test 4: Error Handling
1. Deselect all fields
2. Try to export
3. Should either:
   - Export empty file (no fields), or
   - Show error "Please select at least one field"
4. Verify error message displayed

### Test 5: Performance
1. Open field selector
2. Rapidly toggle fields on/off
3. Verify no lag or performance issues
4. Verify state stays consistent

---

## Troubleshooting

### Issue: Field selector doesn't appear
- Check: Is `showExportOptions` state rendering in JSX?
- Check: Is the conditional `{showExportOptions && (` present?
- Check: Does toggle button update state correctly?

### Issue: Export missing selected fields
- Check: Is `handleExportClosedDeals` collecting selectedFields?
- Check: Is selectedFields array being sent in request body?
- Check: Does backend verify and use selectedFields parameter?

### Issue: All fields always export
- Check: Is selectedFields being filtered (`.filter(k => selectedExportFields[k])`)? 
- Check: Is endpoint receiving selectedFields in request body?
- Check: Are generator functions using fieldsToExport parameter?

---

## API Contract

### Request Format:
```json
POST /api/admin/deals/closed/export
{
  "talentId": "string",
  "format": "csv|pdf|xlsx",
  "selectedFields": ["brand", "campaign", "status", "value", "currency", "paymentStatus", "closedDate", "notes"],
  "fromDate": "2024-01-01T00:00:00Z",  // Optional date filter
  "toDate": "2024-01-31T23:59:59Z"     // Optional date filter
}
```

### Response Format:
```
HTTP/1.1 200 OK
Content-Type: application/octet-stream | text/csv | application/pdf
Content-Disposition: attachment; filename="closed-deals-...[format]"

[Binary file content]
```

---

## Summary

The export field selection feature is **fully implemented and ready to use**. The UI provides an intuitive checkbox interface with:

✅ 8 exportable fields
✅ Individual field toggles  
✅ "Select All" quick action
✅ State management with React hooks
✅ Backend integration with all 3 export formats
✅ Error handling and loading states
✅ Professional UX with consistent styling

No additional implementation is needed - the feature works end-to-end!

### To Use:
1. Go to Closed Deals tab
2. Click "⚙️ Show Fields"
3. Select desired fields
4. Click export button (CSV/PDF/XLSX)
5. File downloads with selected fields only
