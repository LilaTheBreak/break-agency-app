# Opportunities Page Redesign - Visual Guide

## Key Changes at a Glance

### Layout & Structure
```
BEFORE:
┌─ Basic heading + blue button ─────────────────┐
│  Opportunities Management    [Add New]         │
├────────────────────────────────────────────────┤
│  ┌─ Inline Form (if open) ──────────────────┐  │
│  │ [Brand] [Type]                           │  │
│  │ [Location] [Deadline]                    │  │
│  │ [Title] [Submit/Cancel buttons]          │  │
│  └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│  Item 1: Plain card layout with image         │
│  Item 2: Basic action buttons                 │
│  Item 3: Green/red status colors              │
└────────────────────────────────────────────────┘

AFTER:
┌─ CRM Header with red subtitle ────────────────┐
│ OPPORTUNITIES (red label)                      │
│ Manage opportunities         [Add opportunity] │
│ Create and manage all brand opportunities    │
├────────────────────────────────────────────────┤
│ [Search...] [All] [Active] [Inactive]        │
├────────────────────────────────────────────────┤
│ ┌─ Brand Name ───────────────────── Active ──┐ │
│ │ Opportunity Title                           │ │
│ │ 💼 Type  📍 Location  💰 Payment  📅 Deadline│ │
│ │                              [Edit] [Delete] │ │
│ └──────────────────────────────────────────────┘ │
│ ┌─ Brand Name 2 ──────────────── Inactive ──┐ │
│ │ Another Opportunity                        │ │
│ │ 💼 Type  📍 Location  💰 Payment  📅 Deadline│ │
│ │                              [Edit] [Delete] │ │
│ └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘

         [Form opens in right drawer]
```

## Typography

### Before
```
Simple heading + generic buttons
No clear hierarchy
Mixed font sizes
```

### After
```
OPPORTUNITIES                   ← font-subtitle (red, uppercase, tracking)
Manage opportunities            ← font-display (large, uppercase)
Create and manage brand...      ← Regular body text (calm, secondary)
Brand Name                      ← font-semibold (list items)
Type, Location, Payment...      ← text-xs (metadata)
```

## Colors

### Before
```
Blue buttons (#1e40af, #3b82f6)
Green status (#059669)
Red status (#dc2626)
Generic grays
```

### After
```
brand-red for CTAs and accents
brand-black for text and borders
brand-linen for backgrounds
brand-black/60 for secondary text
brand-black/10 for subtle borders
```

## Spacing & Sizing

### Before
```
Inconsistent padding
No clear spacing pattern
No hover states
```

### After
```
p-6 on main containers
gap-4 between major sections
gap-3 between list items
gap-2 for tight groupings
mt-2/mb-6 for directional spacing
Proper hover states with color change
```

## Card Design

### Before
```
rounded-lg border border-slate-200 bg-white p-4
Plain white background
No visual depth
```

### After
```
Main container:
  rounded-3xl border-brand-black/10 bg-brand-white p-6

List items:
  rounded-2xl border-brand-black/10 bg-brand-linen/30 
  → hover: bg-brand-linen/50

Form fields:
  rounded-2xl border-brand-black/10 bg-brand-linen/40
```

## Buttons

### Before
```
Blue: bg-blue-600 px-4 py-2 text-white hover:bg-blue-700
Green: bg-green-600 px-4 py-2 text-white hover:bg-green-700
Red: Simple red text
```

### After
```
Primary CTA:
  rounded-full bg-brand-red px-4 py-2 text-xs font-semibold 
  uppercase tracking-[0.3em] text-white hover:bg-brand-red/90

Secondary:
  rounded-full border border-brand-black/20 px-4 py-2 text-xs 
  uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5

Icon buttons (on hover):
  rounded-full p-2 hover:bg-brand-black/10
```

## Search & Filters

### Before
```
No search functionality
No filtering options
All items shown in one list
```

### After
```
Search:
  [🔍 Search by brand, title, or type...] (full width)

Filters:
  [All] [Active] [Inactive]
  
  Active filter highlighted with:
    border-brand-red bg-brand-red/10 text-brand-red
```

## Opportunity Items

### Before
```
┌─ [Image] ───────────┐
│  Brand Name         │
│  Title              │
│  [Active/Inactive]  │
│  📍 📍 💰 📅         │
│  [Edit] [Delete]    │
└─────────────────────┘
```

### After
```
┌─ Brand Name ──────────────────────────── [Status Pill] ──┐
│ Title                                                      │
│ 💼 Type  📍 Location  💰 Payment  📅 Deadline           │
│                                     [Edit] [Delete] (hover)│
└────────────────────────────────────────────────────────────┘
```

## Status Pills

### Before
```
Active:   bg-green-100 text-green-700
Inactive: bg-slate-100 text-slate-600
```

### After
```
Active:   border-brand-black/20 bg-brand-linen/50 text-brand-black
Inactive: border-brand-black/10 bg-brand-black/5 text-brand-black/60
```

## Form Modal

### Before
```
Inline form in main content area
Takes up significant vertical space
Green/blue buttons for submit
```

### After
```
Right-side drawer (matching Deals, Contacts pages)
Smooth backdrop blur
Form fields with proper labels:
  label {
    font-subtitle (xs, uppercase, tracking)
    input with rounded-2xl, border-brand-black/10
  }
  
Primary action:
  rounded-full bg-brand-red px-4 py-2 (top right)
  
Close button:
  rounded-full border border-brand-black/20 (top right)
```

## Empty State

### Before
```
Plain centered text:
"No opportunities yet. Create your first one!"
```

### After
```
Inside main card container:
┌────────────────────────────────────┐
│ ∅ No opportunities yet             │
│ Create your first opportunity...   │
│ [Add first opportunity] (CTA)      │
└────────────────────────────────────┘
```

## Hover States

### Before
```
Simple button hover color changes
```

### After
```
Opportunity rows:
  bg-brand-linen/30 → hover: bg-brand-linen/50
  Action icons hidden → visible on hover
  Icons: Edit2, Trash2 from lucide-react
  
Buttons:
  All buttons have proper hover states
  Smooth transitions with 'transition-colors'
```

## Integration with CRM

### Talent Page ✓
- Same header style with red subtitle
- Same CTA button colors and styling
- Same card borders and spacing
- Same form field styling
- Same modal/drawer patterns

### Deals Page ✓
- Same DashboardShell integration
- Same typography hierarchy
- Same color system
- Same filter pill styles
- Same hover interactions

### Contacts Page ✓
- Same drawer form pattern
- Same search and filter layout
- Same typography
- Same spacing and alignment
- Same button styling

## Responsive Design

### Before
```
Single column on mobile
Form takes up entire width
Images unclear on small screens
```

### After
```
Mobile (< 640px):
  - Header stacks vertically
  - CTA button full width
  - Search full width
  - Filter pills wrap
  - List items adapt

Tablet/Desktop:
  - Proper spacing and alignment
  - Efficient use of horizontal space
  - Multi-line layouts work well
```

---

## Component Breakdown

| Component | Before | After |
|-----------|--------|-------|
| Container | rounded-lg | rounded-3xl |
| Border color | slate-200 | brand-black/10 |
| Background | white | brand-white (p-6) |
| Button (Primary) | blue-600 | brand-red |
| Button (Secondary) | slate-300 border | brand-black/20 border |
| Status (Active) | green-100 | brand-linen/50 border |
| Status (Inactive) | slate-100 | brand-black/5 border |
| Form field | slate border | brand-black/10 border, brand-linen/40 bg |
| List item | no hover | bg-brand-linen/50 on hover |

---

**Result**: A cohesive, modern CRM interface that feels like one unified product.
