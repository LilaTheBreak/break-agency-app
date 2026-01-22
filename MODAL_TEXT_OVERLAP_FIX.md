# Create New Deal Modal - Text Overlap Fix

## Issue
The BrandSelect dropdown in the "Create New Deal" modal was displaying overlapping text labels, making the form difficult to read. The dropdown menu was overlapping with form fields below it (Stage, Estimated Value, etc.).

### Root Cause
The BrandSelect component used `absolute` positioning (`top-full left-0 right-0`) within the scrollable modal content area. This caused:
1. The dropdown menu to be positioned relative to the input button within a scrollable container
2. The dropdown to clip or appear to overlap with fields below when scrolling
3. Text labels to visually blend with the dropdown menu

## Solution Implemented

### Technical Changes
Modified [apps/web/src/components/BrandSelect.jsx](apps/web/src/components/BrandSelect.jsx) to:

1. **Use React Portal**: Moved dropdown rendering to `document.body` using `createPortal()`
   - Breaks dropdown out of scrollable modal container
   - Prevents clipping and overflow issues

2. **Fixed Positioning**: Changed from `absolute` to `fixed` positioning
   - Calculates button's screen position using `getBoundingClientRect()`
   - Positions dropdown directly below button with proper offset
   - Stores position in state: `{ top, left, width }`

3. **Proper Z-Index**: Applied `z-index: 9999` to dropdown
   - Ensures dropdown appears above modal content
   - Maintains visibility hierarchy

4. **Click-Outside Handler**: Added event listener to close dropdown
   - Closes when clicking outside the dropdown area
   - Improves UX by allowing users to easily dismiss it

5. **Dependencies Added**:
   - `useRef` for button element reference
   - `useEffect` for position calculation and click-outside handling
   - `createPortal` from React for portal rendering

### Code Structure
```jsx
// New dependencies
import { createPortal } from "react-dom";
import { useRef, useEffect } from "react";

// New state for dropdown positioning
const buttonRef = useRef(null);
const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

// Position calculation effect
useEffect(() => {
  if (isOpen && buttonRef.current) {
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    });
  }
}, [isOpen]);

// Portal rendering
{isOpen && !disabled && createPortal(
  <div style={{ position: "fixed", top, left, width, zIndex: 9999 }}>
    {/* dropdown content */}
  </div>,
  document.body
)}
```

## Impact
- ✅ Eliminates text overlap in Create New Deal modal
- ✅ Dropdown now displays cleanly above all form fields
- ✅ Improves form readability and usability
- ✅ Works consistently across different modal scroll states
- ✅ No changes needed to parent components

## Testing
1. Open "Create New Deal" modal from AdminTalentDetailPage
2. Click on Brand dropdown
3. Verify dropdown appears below the button without overlapping text
4. Select a brand - dropdown should close properly
5. Scroll within modal - dropdown should remain accessible when open
6. Click outside dropdown - should close

## Files Modified
- [apps/web/src/components/BrandSelect.jsx](apps/web/src/components/BrandSelect.jsx) - Core component changes

## Build Status
✅ Web build succeeded (`npm run build:web` - 2,883 modules transformed, no errors)

## Commit
- **Hash**: 144fb25
- **Message**: fix: Use portal for BrandSelect dropdown to prevent text overlap in modal

## Related Issues
- Create New Deal modal text overlap (FIXED)
- Form field readability in modal (IMPROVED)
