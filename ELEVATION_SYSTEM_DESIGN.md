# 🎨 Elevation System & Visual Hierarchy Design Guide

> **Premium, restrained visual depth system for the Break Agency admin platform**

## Overview

This document defines the global elevation and shadow system that brings subtle depth, clarity, and premium aesthetics to the entire admin interface. The system is based on layering and diffused shadows, not bright colors or heavy Material Design patterns.

---

## 🏗️ Core Principles

### 1. **Soft, Diffused Shadows Only**
- No harsh, dark shadows
- No coloured shadows
- Neutral grayscale with ultra-low opacity
- Maximum `rgba(0,0,0,0.10)` for strongest shadows

### 2. **Elevation ≠ Colour**
- Never rely on colour alone for visual hierarchy
- Depth + soft shadows + contrast create focus
- Accessibility-first: multiple visual cues

### 3. **Premium, Editorial Aesthetic**
- Inspired by luxury product interfaces
- Restrained, minimal, intentional
- "Control centre" feeling, not SaaS generic
- Every shadow serves a purpose

### 4. **Consistent System Across App**
- Single source of truth via CSS variables
- No per-page custom shadows
- Predictable, scalable patterns

---

## 📐 Elevation Scale (CSS Variables)

```css
:root {
  /* Elevation 0: Flat (no shadow) */
  --elevation-0: none;
  
  /* Elevation 1: Subtle (default for cards, panels) */
  --elevation-1: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02);
  
  /* Elevation 2: Soft (hover state for interactive elements) */
  --elevation-2: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
  
  /* Elevation 3: Medium (active state, emphasis, modals) */
  --elevation-3: 0 10px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  
  /* Elevation 4: Strong (priority areas, command centre elements) */
  --elevation-4: 0 16px 32px rgba(0, 0, 0, 0.10), 0 6px 12px rgba(0, 0, 0, 0.06);
  
  /* Focus Ring (accessible focus state) */
  --elevation-focus: 0 0 0 3px rgba(167, 15, 12, 0.12);
  
  /* Focus Ring Strong (high emphasis focus) */
  --elevation-focus-strong: 0 0 0 4px rgba(167, 15, 12, 0.16);
}
```

### Shadow Logic
- **Double layer approach**: A soft diffuse layer + a slightly sharper layer beneath
- **Increasing intensity**: As elevation goes up, opacity increases slightly
- **Blur radius pattern**: 3px → 6px → 8px → 12px for increasingly soft transitions

---

## 🃏 Component Elevation Patterns

### Cards (Primary Content Areas)

```jsx
// Default state
<div className="card">Content</div>

// Applies:
// - background: white
// - border-radius: 12px
// - box-shadow: elevation-1
// - Smooth transitions on hover/active
```

**Elevation Progression:**
| State | Shadow | Purpose |
|-------|--------|---------|
| Default | `--elevation-1` | Subtle presence, minimal intrusion |
| Hover | `--elevation-2` | Light lift, invites interaction |
| Active/Selected | `--elevation-3` | Clear selection, focus |
| Focus (a11y) | `--elevation-3` + `--elevation-focus` | Accessible focus ring |

**Example Usage:**
```jsx
<div className="card transition-elevation hover:elevation-2">
  <p>Click me for interaction</p>
</div>
```

### Priority Cards (Control Room Emphasis)

```jsx
<div className="card-priority">
  {/* Highest elevation + warning accent */}
</div>
```

**Applied To:**
- Tasks Due
- Critical Approvals
- Payouts & Budget Alerts
- System Alerts
- High-priority dashboard sections

**Features:**
- `--elevation-3` shadow by default
- Warm background: `#fffdfb` (ivory with slight warmth)
- Optional top border accent: `3px solid var(--brand-red)`
- Hover lifts to `--elevation-4`

---

## 🗂️ Section Hierarchy (Layout System)

Create clear visual hierarchy across the page by using layered backgrounds:

```
┌─────────────────────────────────────┐
│  Page Background (Layer 0)          │  var(--brand-ivory) - Flat
│  ┌─────────────────────────────────┐│
│  │ Section Wrapper (Layer 1)        ││  elevation-1
│  │  ┌──────┐  ┌──────┐  ┌──────┐   ││
│  │  │ Card │  │ Card │  │ Card │   ││  elevation-2 (hover)
│  │  └──────┘  └──────┘  └──────┘   ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Layer System:**

| Layer | CSS Class | Box Shadow | Background | Usage |
|-------|-----------|------------|-----------|-------|
| Base | `.layer-base` | none | `var(--brand-ivory)` | Page background |
| Primary | `.layer-primary` | `--elevation-1` | white | Standard sections |
| Secondary | `.layer-secondary` | `--elevation-2` | white | Emphasized sections |
| Focused | `.layer-focused` | `--elevation-3` | white | Active/selected sections |

**Scanability Benefit:** Eyes naturally move from flat background → subtle shadows → lifted cards. Creates depth perception.

---

## 🧭 Navigation & Active States

### Sidebar/Navigation Items

```css
.nav-item {
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.nav-item:hover {
  box-shadow: var(--elevation-1);  /* Subtle lift */
}

.nav-item.active {
  background: var(--brand-white);
  box-shadow: var(--elevation-2);   /* Clear active state */
  border-left: 3px solid var(--brand-red);  /* Color + depth */
}
```

**What This Achieves:**
- Hover: Subtle feedback without overwhelming
- Active: Clear visual distinction (depth + accent)
- Never relies on colour alone
- Predictable, consistent interaction pattern

---

## 🎯 Focus & Interactive States (Accessibility)

### Keyboard Focus Ring

```css
button:focus-visible,
.card:focus-visible,
input:focus-visible {
  outline: none;
  box-shadow: var(--elevation-focus);
  /* Soft red outline: rgba(167, 15, 12, 0.12) */
}
```

**Why This Works:**
- 3px buffer allows native focus ring to show cleanly
- Soft red (brand colour) at low opacity
- Visible from distance, doesn't overwhelm
- Accessible for keyboard navigation

### Card Focus State

When a card contains focused input:
```css
.card:focus-within {
  box-shadow: var(--elevation-3), var(--elevation-focus);
}
```

---

## 📋 Modals & Overlays

### Modal Overlay
```jsx
<div className="modal-overlay">
  <div className="modal-content">
    {/* Content */}
  </div>
</div>
```

**Styling:**
- Overlay: Semi-transparent blur backdrop
- Content: `--elevation-4` (highest elevation)
- Ensures modal "floats" above everything
- Clear visual separation

---

## 🚀 Implementation Guide

### Using the System

#### 1. **For Standard Containers**
```jsx
<div className="card">
  {/* Automatically gets elevation-1, hover effects */}
</div>
```

#### 2. **For Section Wrappers**
```jsx
<section className="section-wrapper elevation-1 transition-elevation hover:elevation-2">
  {/* Container with proper spacing */}
</section>
```

#### 3. **For Panels/Groups**
```jsx
<div className="panel panel-prominent">
  {/* Uses elevation-3 + priority background */}
</div>
```

#### 4. **For Priority Areas**
```jsx
<div className="card-priority">
  {/* Highest elevation, warm background, top accent */}
</div>
```

#### 5. **Direct Elevation Classes** (When you need custom)
```jsx
<div className="elevation-3 transition-elevation">
  {/* Direct elevation control */}
</div>
```

---

## 🎨 Tailwind Integration

### Available Utilities

#### Elevation Box Shadows
```
shadow-elevation-0   // none
shadow-elevation-1   // subtle
shadow-elevation-2   // soft
shadow-elevation-3   // medium
shadow-elevation-4   // strong
shadow-elevation-focus     // focus ring
shadow-elevation-focus-strong  // strong focus
```

#### Component Classes
```
.card              // Card component with elevation-1
.card:hover        // Elevation-2 on hover
.card.active       // Elevation-3 when active
.card-priority     // Priority card styling
.panel             // Panel with elevation-1
.panel-elevated    // Panel with elevation-2
.nav-item          // Navigation item with hover/active states
```

---

## 🔄 Smooth Transitions

All elevation changes should be smooth and performant:

```css
.transition-elevation {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.transition-elevation-lg {
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
```

**Optional lift on hover:**
```jsx
<div className="card hover:scale-y-[1.01]">
  {/* Subtle Y-axis scale lifts card */}
</div>
```

---

## ❌ DO NOT

🚫 **No random shadows** - use only the elevation variables
🚫 **No coloured shadows** - greyscale only
🚫 **No heavy drop shadows** - max `rgba(0,0,0,0.10)`
🚫 **No neumorphism** - inset shadows rarely used
🚫 **No per-page custom styles** - always use system
🚫 **No colour-only focus indicators** - always combine with depth
🚫 **No visual noise** - every shadow should serve a purpose

---

## ✅ DO

✅ **Use CSS variables** - consistency guaranteed
✅ **Layer section backgrounds** - clear hierarchy
✅ **Combine depth + contrast** - readable at all sizes
✅ **Add smooth transitions** - professional feel
✅ **Test with keyboard navigation** - accessibility first
✅ **Use focus rings on interactive elements** - WCAG compliant
✅ **Scale up for priority items** - control room emphasis

---

## 🎯 Testing Checklist

- [ ] All cards have subtle shadows by default
- [ ] Hover states provide clear feedback
- [ ] Active/selected states are unmistakable
- [ ] Focus rings visible with keyboard navigation
- [ ] No harsh, hard-edged shadows
- [ ] Transitions are smooth and responsive
- [ ] Priority areas "float" above normal content
- [ ] Navigation active states include multiple cues
- [ ] Modals properly overlay the page
- [ ] All shadows use CSS variables (no hardcoded values)

---

## 📚 Reference Files

- **CSS Variables**: `src/index.css` (`:root` block)
- **Elevation Utilities**: `src/index.css` (`@layer utilities`)
- **Tailwind Config**: `tailwind.config.js` (`boxShadow` extend)
- **Design System**: This file

---

## 🔗 Global CSS Variables Map

```css
/* In src/index.css */
:root {
  --elevation-0: none;
  --elevation-1: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02);
  --elevation-2: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
  --elevation-3: 0 10px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  --elevation-4: 0 16px 32px rgba(0, 0, 0, 0.10), 0 6px 12px rgba(0, 0, 0, 0.06);
  --elevation-focus: 0 0 0 3px rgba(167, 15, 12, 0.12);
  --elevation-focus-strong: 0 0 0 4px rgba(167, 15, 12, 0.16);
}
```

---

## 🚀 Roll-out Plan

### Phase 1: Foundation ✅
- [x] Define elevation variables
- [x] Create utility classes
- [x] Update tailwind config
- [x] Document system

### Phase 2: Dashboard Components (In Progress)
- [ ] Cards & panels
- [ ] Navigation active states
- [ ] Section hierarchy
- [ ] Priority areas

### Phase 3: Detailed Pages
- [ ] Talent detail pages
- [ ] Admin dashboards
- [ ] Modals & overlays
- [ ] Form components

### Phase 4: Polish
- [ ] Keyboard navigation testing
- [ ] Accessibility audit
- [ ] Performance review
- [ ] Brand alignment check

---

## 💡 Design Philosophy

> "Depth without distraction. Hierarchy without noise."

The elevation system is invisible when working correctly. Users should feel the structure without consciously noticing the shadows. It should feel like a premium product—clear, sophisticated, intentional.

Think of it like editorial design: headlines have weight, body text is light, margins create breathing room. Same principle here, but for interactive interfaces.

---

**Last Updated:** January 21, 2026
**Version:** 1.0 - Foundation Release
**Status:** Live & Evolving
