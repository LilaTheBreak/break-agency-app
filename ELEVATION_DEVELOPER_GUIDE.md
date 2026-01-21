# 🎨 Elevation System - Developer Implementation Guide

## Quick Start

The elevation system is now live. Here's how to use it in your components:

---

## Basic Patterns

### 1. Card Component (Most Common)

```jsx
// ✅ DO THIS - Simple, built-in elevation
<div className="card">
  <h3>My Card Title</h3>
  <p>Content goes here</p>
</div>

// Features:
// - elevation-1 by default
// - elevation-2 on hover
// - elevation-3 when active
// - Smooth transitions
// - Proper border radius (12px)
```

### 2. Section with Cards Inside

```jsx
// Section wrapper + card hierarchy
<section className="section-wrapper elevation-1 p-6">
  <h2>Dashboard Section</h2>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
    {items.map(item => (
      <div key={item.id} className="card">
        {/* Card content automatically elevated */}
      </div>
    ))}
  </div>
</section>

// Gives clear visual hierarchy:
// Page bg (flat) → Section (elevation-1) → Cards inside (elevation-2 on hover)
```

### 3. Priority Card (High Emphasis)

```jsx
// For tasks, alerts, critical items
<div className="card-priority">
  <h3>🔴 Critical Action Needed</h3>
  <p>This gets elevation-3 by default + warm background</p>
</div>

// Automatically gets:
// - elevation-3 shadow
// - #fffdfb warm background
// - 3px red top border
// - elevation-4 on hover
```

### 4. Navigation Active State

```jsx
<ul className="space-y-2">
  {tabs.map(tab => (
    <li
      key={tab.id}
      className={`nav-item p-3 cursor-pointer rounded-lg ${
        activeTab === tab.id ? 'active' : ''
      }`}
      onClick={() => setActiveTab(tab.id)}
    >
      {tab.label}
    </li>
  ))}
</ul>

// .nav-item.active automatically shows:
// - elevation-2 shadow
// - Red left border
// - White background
```

### 5. Panel with Section

```jsx
// For grouped content with separation
<div className="panel p-6">
  <div className="section-header mb-4">
    <h3>Panel Title</h3>
  </div>
  
  <div className="space-y-3">
    {/* Content items */}
  </div>
</div>
```

---

## Elevation Classes Reference

### Direct Shadow Application

```jsx
// Apply elevation directly
<div className="elevation-1">Basic shadow</div>
<div className="elevation-2">Slightly more elevated</div>
<div className="elevation-3">Medium emphasis</div>
<div className="elevation-4">Highest elevation</div>

// With transitions
<div className="elevation-2 transition-elevation hover:elevation-3">
  Smoothly transitions on hover
</div>
```

### Component Classes

```jsx
{/* Card System */}
<div className="card">Standard card</div>
<div className="card card-focus">Focused/selected card</div>
<div className="card-priority">Priority/alert card</div>

{/* Panel System */}
<div className="panel">Standard panel</div>
<div className="panel panel-elevated">Elevated panel</div>
<div className="panel panel-prominent">Prominent (priority) panel</div>

{/* Navigation */}
<div className="nav-item active">Active nav item</div>
<div className="nav-item">Inactive nav item</div>

{/* Layer System */}
<div className="layer-base">Page background</div>
<div className="layer-primary">Standard section</div>
<div className="layer-secondary">Emphasized section</div>
<div className="layer-focused">Focused/active section</div>

{/* Containers */}
<div className="section-wrapper">Section container</div>
<div className="section-header">Section header with border</div>
```

---

## Accessibility & Focus

### Keyboard Focus (Automatic)

```jsx
// All interactive elements automatically support focus:
<button className="...">Click me</button>
<input type="text" />
<a href="#/">Link</a>

// On keyboard focus, shows soft red focus ring
// CSS: box-shadow: var(--elevation-focus)
```

### Manual Focus Styling

```jsx
<div 
  className="card focus:elevation-focus-strong"
  tabIndex={0}
>
  Custom focusable element
</div>

// Or within a focused card:
<div 
  className="card focus-within:elevation-3"
>
  <input type="text" placeholder="Focus me" />
</div>
```

---

## Common Patterns

### Admin Dashboard Layout

```jsx
export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header Section - Subtle elevation */}
      <section className="section-wrapper elevation-1 p-6">
        <h1>Admin Dashboard</h1>
      </section>

      {/* Priority Area - Highest elevation */}
      <div className="card-priority p-6">
        <h2>Approvals Required</h2>
        <p>3 pending approvals</p>
      </div>

      {/* Regular Cards Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4">
            <h3>Card {i}</h3>
          </div>
        ))}
      </div>

      {/* Detailed List */}
      <section className="section-wrapper elevation-1">
        <div className="section-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="space-y-2 p-4">
          {/* List items */}
        </div>
      </section>
    </div>
  );
}
```

### Tab Navigation

```jsx
<div className="flex gap-2 bg-brand-linen p-2 rounded-lg">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActive(tab.id)}
      className={`nav-item px-4 py-2 rounded ${
        active === tab.id ? 'active' : ''
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>

// Active button shows:
// - elevation-2 shadow
// - Red left border
// - White background
```

### Modal/Overlay Pattern

```jsx
<div className="fixed inset-0 modal-overlay z-50">
  <div className="modal-content p-6 m-auto max-w-2xl">
    <h2>Modal Title</h2>
    <p>Content</p>
  </div>
</div>

// Automatically gets:
// - Blurred overlay background
// - elevation-4 shadow on modal
// - High z-index
```

### Form Group with Elevation

```jsx
<div className="card p-6 space-y-4">
  <div>
    <label className="block text-sm mb-2">Full Name</label>
    <input 
      type="text" 
      className="w-full border rounded p-2 focus:elevation-focus"
    />
  </div>
  
  <div>
    <label className="block text-sm mb-2">Email</label>
    <input 
      type="email" 
      className="w-full border rounded p-2 focus:elevation-focus"
    />
  </div>
  
  <button className="w-full bg-brand-red text-white py-2 rounded">
    Submit
  </button>
</div>

// Card provides elevation-1
// Inputs get elevation-focus on focus
// Button inherits card context
```

---

## Tailwind Integration Examples

### Hover Elevation Changes

```jsx
<div className="
  elevation-1
  hover:elevation-2
  transition-elevation
  cursor-pointer
">
  Hover me for elevation change
</div>
```

### Responsive Elevation

```jsx
<div className="
  elevation-1
  md:elevation-2
  lg:elevation-3
">
  More elevation on larger screens
</div>
```

### Combined with Other Utilities

```jsx
<div className="
  card
  p-6
  space-y-4
  hover:elevation-2
  focus-within:elevation-3
  transition-elevation
">
  Advanced card
</div>
```

---

## Testing Your Implementation

### Visual Checklist

- [ ] Card has subtle shadow by default
- [ ] Hovering card lifts slightly
- [ ] Active/selected state is obvious
- [ ] No harsh or hard-edged shadows
- [ ] Transitions feel smooth (not jumpy)
- [ ] Focus ring visible with Tab key
- [ ] Priority items "pop" above normal content
- [ ] Page feels layered, not flat

### Browser DevTools

```css
/* Inspect to see the elevation variables */
/* In DevTools, hover over element with shadow */
/* Should show something like: */
/* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02) */
```

### Accessibility Testing

1. **Keyboard Navigation**
   - Tab through page
   - Focus ring should be visible on all interactive elements
   - Ring should be soft red, not jarring

2. **Screen Reader**
   - Content should be semantic
   - Focus rings shouldn't interfere with reading

3. **High Contrast Mode**
   - Shadows should still show hierarchy
   - Test with Windows High Contrast

---

## Migration Path for Existing Components

### Before (Old Pattern)

```jsx
<div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
  Card content
</div>
```

### After (Using Elevation System)

```jsx
<div className="card p-6">
  Card content
</div>
```

### Benefits

- 60% less CSS to write
- Automatic hover states
- Consistent shadows across app
- Focus accessibility built-in
- Easier to maintain

---

## CSS Variables Available

```css
/* In :root */
--elevation-0: none;
--elevation-1: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02);
--elevation-2: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
--elevation-3: 0 10px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
--elevation-4: 0 16px 32px rgba(0, 0, 0, 0.10), 0 6px 12px rgba(0, 0, 0, 0.06);
--elevation-focus: 0 0 0 3px rgba(167, 15, 12, 0.12);
--elevation-focus-strong: 0 0 0 4px rgba(167, 15, 12, 0.16);

/* Use in custom CSS if needed */
box-shadow: var(--elevation-2);
```

---

## Performance Notes

- All shadows use GPU-accelerated `box-shadow` property
- Transitions use `0.2s ease` for smooth 60fps animation
- No heavy blur effects (blur is set inline in shadows, not separate filter)
- CSS variables update instantly, no JavaScript overhead

---

## Troubleshooting

### "Shadow looks too subtle"
- That's intentional! Premium design uses restraint.
- On hover, it'll be more apparent.
- For emphasis, use `.card-priority` instead.

### "Focus ring not showing"
- Make sure element is focusable (button, input, link, or `tabIndex={0}`)
- Check z-index isn't interfering
- Try with `:focus-visible` selector in DevTools

### "Transition feels jerky"
- Make sure you're using `.transition-elevation` class
- Check for conflicting `transition` classes
- Test in latest browsers (not legacy)

### "I want stronger shadows"
- Use `.card-priority` for highest elevation
- Or apply `.elevation-4` directly
- Avoid custom shadows—use the system

---

## Next Steps

1. **Update existing cards** to use `.card` class
2. **Convert sections** to `.section-wrapper`
3. **Update navigation** to use `.nav-item.active`
4. **Test keyboard navigation** with Tab key
5. **Check focus rings** on all interactive elements

---

## Resources

- **Design Guide**: See `ELEVATION_SYSTEM_DESIGN.md`
- **CSS Source**: `src/index.css` (`:root` + `@layer utilities`)
- **Tailwind Config**: `tailwind.config.js` (`boxShadow` extend)

---

**Last Updated:** January 21, 2026
**Version:** 1.0 - Developer Edition
