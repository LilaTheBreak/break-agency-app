# Modal & Brand Dropdown Implementation Guide

## 🎯 Quick Start for Developers

### Using Modals in Your Components

#### Option 1: Reusable ModalWrapper (RECOMMENDED)
```jsx
import ModalWrapper from '../components/ModalWrapper.jsx';
import { useState } from 'react';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <ModalWrapper
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Modal Title"
        size="medium"  // small | medium | large | full
      >
        <div className="modal-body">
          <p>Modal content here</p>
          <input type="text" placeholder="Your form..." />
        </div>
        
        <div className="modal-footer">
          <button onClick={() => setIsOpen(false)}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </ModalWrapper>
    </>
  );
}
```

#### Option 2: Existing Drawer Component (Used in Brands Page)
```jsx
import { Drawer } from './Drawer';  // Or use local Drawer component

<Drawer
  open={isOpen}
  title="Edit Contact"
  onClose={() => setIsOpen(false)}
  actions={<PrimaryButton onClick={save}>Save</PrimaryButton>}
>
  {/* Content with modal-body/modal-footer classes */}
</Drawer>
```

---

### Using Brand Dropdown in Modals

#### Step 1: Import the hook and component
```jsx
import { useBrands } from '../hooks/useBrands.js';
import { BrandSelect } from '../components/BrandSelect.jsx';
```

#### Step 2: Fetch brands
```jsx
const { brands, isLoading, error, createBrand, refresh } = useBrands();
const [selectedBrandId, setSelectedBrandId] = useState('');
```

#### Step 3: Render the dropdown
```jsx
<div className="modal-body">
  <BrandSelect
    brands={brands}
    value={selectedBrandId}
    onChange={setSelectedBrandId}
    isLoading={isLoading}
    onCreateBrand={createBrand}
    error={error}
  />
</div>
```

#### Step 4: Refresh brands when modal opens (optional)
```jsx
useEffect(() => {
  if (isOpen) {
    refresh();  // Force refresh brand list
  }
}, [isOpen, refresh]);
```

---

## ✅ CSS Classes for Modals

### Applied Automatically
When using `ModalWrapper` component, these classes are applied automatically.

### For Custom Modals
If creating a custom modal, apply these classes:

```jsx
<div className="modal">
  {/* Sticky header stays at top */}
  <div className="modal-header">
    <h2>Title</h2>
  </div>

  {/* Scrollable content area */}
  <div className="modal-body">
    {/* Content scrolls here */}
  </div>

  {/* Sticky footer stays at bottom */}
  <div className="modal-footer">
    <button>Action</button>
  </div>
</div>
```

### Form Fields in Modals
```jsx
<div className="form-field">
  <label>Your Field</label>
  <input type="text" />
</div>
```

When dropdown opens, the field automatically gets higher z-index.

---

## 🔧 Backend: Brand Endpoint

### GET /api/brands
**Returns**: All brands from database

```javascript
// Request
GET /api/brands
Authorization: Bearer {token}

// Response
{
  "brands": [
    {
      "id": "abc123",
      "name": "Nike",
      "websiteUrl": "https://nike.com",
      "industry": "Fashion",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    // ... more brands
  ],
  "total": 42
}
```

**Guarantees**:
- ✅ Returns ALL brands (no filtering)
- ✅ Sorted alphabetically by name
- ✅ No permission restrictions
- ✅ No soft-delete filtering
- ✅ Consistent response format

---

## 🎨 Z-Index Stack

Modal z-index management (from bottom to top):

```
z-50     = Modal/Drawer backdrop + container
z-100    = Dropdown inside modal (BrandSelect)
z-9999   = Dropdown menu (portal-rendered, above everything)
```

**Key Point**: Dropdowns use `z-[100]` or `z-9999` to escape modal clipping.

---

## 🐛 Troubleshooting

### Problem: Dropdown appears behind modal
**Cause**: Dropdown not rendered with high z-index  
**Solution**: BrandSelect already handles this. If custom dropdown, add `z-[9999]`

### Problem: Modal content is clipped
**Cause**: Missing `modal-body` class or wrong parent overflow  
**Solution**: Use `modal-body` class on scrollable container

### Problem: Save button is hidden after scrolling
**Cause**: Footer not using `modal-footer` class  
**Solution**: Wrap buttons in `<div className="modal-footer">`

### Problem: Brand list doesn't show newly created brand
**Cause**: Cache not cleared after brand creation  
**Solution**: `clearBrandsCache()` is called after creation, but you can also manually call `refresh()`

### Problem: Dropdown opens but stays behind modal
**Cause**: Dropdown portal not properly configured  
**Solution**: BrandSelect uses fixed positioning for menu. Verify z-index in browser dev tools.

---

## 📋 QA Checklist for New Modals

- [ ] Modal is readable on mobile (375px viewport)
- [ ] Modal is readable on desktop (1920px viewport)
- [ ] Content scrolls when exceeding 90vh height
- [ ] Save/Cancel buttons stay visible after scroll
- [ ] All form fields are accessible (no overflow)
- [ ] Dropdown (if any) opens above modal content
- [ ] Dropdown is not clipped by modal boundaries
- [ ] Escape key closes modal
- [ ] Tab key traps focus inside modal
- [ ] Brand dropdown shows all brands (if applicable)
- [ ] Newly created items appear in dropdowns immediately
- [ ] No console errors or warnings

---

## 📚 Related Files

**Components**:
- `apps/web/src/components/ModalWrapper.jsx` - Main modal wrapper
- `apps/web/src/components/BrandSelect.jsx` - Brand dropdown component
- `apps/web/src/components/Modal.jsx` - Older modal component (consider using ModalWrapper instead)

**Hooks**:
- `apps/web/src/hooks/useBrands.js` - Brand data management

**Styles**:
- `apps/web/src/index.css` - Modal CSS utilities (lines 305-420)

**Backend**:
- `apps/api/src/controllers/brandController.ts` - `/api/brands` endpoint
- `apps/api/src/routes/brands.ts` - Brand routes

---

## 🚀 Best Practices

1. **Always use ModalWrapper for consistency**
   - Don't create custom modal JSX
   - ModalWrapper handles all accessibility concerns

2. **Always use useBrands hook for brand data**
   - Don't make direct API calls
   - Hook manages caching and deduplication

3. **Always apply modal-* CSS classes**
   - `modal-body` for scrollable content
   - `modal-footer` for sticky buttons
   - Ensures consistent behavior

4. **Test across viewports**
   - Mobile: 375px, 425px
   - Tablet: 768px, 1024px
   - Desktop: 1920px

5. **Use dropdowns outside modals when possible**
   - If dropdown must be in modal, BrandSelect already handles it
   - For custom dropdowns, apply portal + z-index

---

## 🔗 Links

- [Full Implementation Report](./MODAL_BRAND_DROPDOWN_FIXES_COMPLETE.md)
- [Commit](https://github.com/your-org/repo/commit/598a62c)
- [Deployment](https://break-agency-3ooesl05z-lilas-projects-27f9c819.vercel.app)
