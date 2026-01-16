# Health Cards Navigation - Testing & Visual Guide

## 🎯 What Changed

The 4 dashboard metric cards are now **fully interactive**. Click any card to navigate to its section and take action.

## 📊 Card Mapping

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TALENT PROFILE - HEALTH SNAPSHOT                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐│
│  │ 📈 ACTIVE    │   │ 💰 TOTAL     │   │ ✓ PENDING    │   │ 📊 HEALTH││
│  │  PIPELINE    │   │  EARNINGS    │   │  TASKS       │   │  SCORE   ││
│  │              │   │              │   │              │   │          ││
│  │    0         │   │    £0        │   │    0         │   │   30%    ││
│  │ No active    │   │ No earnings  │   │ All caught   │   │ Profile &││
│  │ deals        │   │ yet          │   │ up!          │   │ perf.    ││
│  │              │   │              │   │              │   │          ││
│  │ View deals → │   │ View rev. →  │   │ Refresh →    │   │ View pr →││
│  │              │   │              │   │              │   │          ││
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────┘│
│                                                                           │
│  🖱️ CLICK ANY CARD TO NAVIGATE                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔍 Interactive Features

### Active Pipeline Card
```
┌─────────────────────┐
│ 📈 ACTIVE PIPELINE  │◀─ Icon scales on hover
│                     │
│         0           │◀─ Main value
│                     │
│ No active deals     │◀─ Context subtext
│                     │
│ View deals →        │◀─ Action prompt (changes color on hover)
│                     │
└─────────────────────┘◀─ Card scales up on hover
```

**Click behavior:**
- Navigates to `/admin/talent/{talentId}`
- Sets state: `{ tab: "deals" }`
- Shows all active deals for this talent

### Total Earnings Card
```
┌─────────────────────┐
│ 💰 TOTAL EARNINGS   │
│                     │
│        £0           │
│                     │
│ No earnings yet     │
│                     │
│ View revenue →      │
│                     │
└─────────────────────┘
```

**Click behavior:**
- Navigates to `/admin/talent/{talentId}`
- Sets state: `{ tab: "revenue" }`
- Shows revenue breakdown and history

### Pending Tasks Card
```
┌─────────────────────┐
│ ✓ PENDING TASKS     │
│                     │
│         0           │
│                     │
│ All caught up!      │◀─ Green text when zero
│                     │
│ Refresh →           │◀─ Different action text
│                     │
└─────────────────────┘
```

**Click behavior:**
- Navigates to `/admin/talent/{talentId}`
- Sets state: `{ tab: "tasks" }`
- Shows pending action items

### Health Score Card
```
┌─────────────────────┐
│ 📊 HEALTH SCORE     │
│                     │
│        30%          │
│                     │
│ Profile & perf      │
│                     │
│ View profile →      │
│                     │
└─────────────────────┘◀─ Background color changes with score
   (red bg at 30%)        (green at 80+, yellow at 60-79)
```

**Click behavior:**
- Navigates to `/admin/talent/{talentId}`
- Sets state: `{ tab: "profile" }`
- Shows profile completion and health factors

## 🎨 Visual States

### Default State
- Rounded corners (border-radius: 1rem)
- Light tan background (bg-brand-linen/50)
- Black border at 10% opacity
- Padding: 1rem
- Smooth animations on load (fadeInUp)

### Hover State
- **Scale:** Card grows to 1.05x
- **Shadow:** Subtle box shadow appears
- **Border:** Increases from 10% to 20% opacity
- **Icon:** Scales to 1.1x
- **Text:** Action text color transitions

### Health Score Card Special
- **Low score (< 60%):** Red background (bg-red-100)
- **Medium score (60-79%):** Yellow background (bg-yellow-100)
- **High score (80%+):** Green background (bg-green-100)

## 📱 Responsive Layout

```
Mobile (< 640px):
┌───────────────────────┐
│   ACTIVE PIPELINE     │
├───────────────────────┤
│   TOTAL EARNINGS      │
├───────────────────────┤
│   PENDING TASKS       │
├───────────────────────┤
│   HEALTH SCORE        │
└───────────────────────┘
(1 column layout)

Tablet (640px - 1024px):
┌──────────────────┐ ┌──────────────────┐
│ ACTIVE PIPELINE  │ │ TOTAL EARNINGS   │
├──────────────────┤ ├──────────────────┤
│ PENDING TASKS    │ │ HEALTH SCORE     │
└──────────────────┘ └──────────────────┘
(2 column layout)

Desktop (> 1024px):
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Pipeline│ │Earnings│ │ Tasks  │ │ Health │
└────────┘ └────────┘ └────────┘ └────────┘
(4 column layout)
```

## 🧪 Testing Checklist

### Visual Testing
- [ ] Cards appear in correct grid layout
- [ ] Animations fade in on load (staggered 50ms)
- [ ] Hover effects work smoothly
- [ ] Icons scale correctly on hover
- [ ] Action text is visible and readable
- [ ] Health score background color matches score
- [ ] Responsive layout works on mobile/tablet/desktop

### Interaction Testing
- [ ] Active Pipeline card is clickable
  - [ ] Cursor changes to pointer
  - [ ] Navigates to deals tab
  - [ ] Shows all active deals
  
- [ ] Total Earnings card is clickable
  - [ ] Cursor changes to pointer
  - [ ] Navigates to revenue tab
  - [ ] Shows earnings breakdown
  
- [ ] Pending Tasks card is clickable
  - [ ] Cursor changes to pointer
  - [ ] Navigates to tasks tab
  - [ ] Shows pending tasks
  
- [ ] Health Score card is clickable
  - [ ] Cursor changes to pointer
  - [ ] Navigates to profile tab
  - [ ] Shows profile completion

### Data Testing
- [ ] Pipeline value updates correctly
- [ ] Earnings calculation is accurate
- [ ] Task count is current
- [ ] Health score reflects actual metrics

### Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Accessibility Testing
- [ ] Cards are focusable (Tab key)
- [ ] Can press Enter to activate
- [ ] Keyboard navigation works
- [ ] Screen readers announce card content

## 🔧 Technical Details

### Component Props
```javascript
<HealthSnapshotCards 
  talent={talentObject}      // Required: talent data
  stats={{}}                 // Optional: additional stats
  talentId={talentId}        // NEW: enables navigation
/>
```

### Navigation Implementation
```javascript
// Active Pipeline
navigate(`/admin/talent/${talentId}`, { state: { tab: "deals" } })

// Total Earnings
navigate(`/admin/talent/${talentId}`, { state: { tab: "revenue" } })

// Pending Tasks
navigate(`/admin/talent/${talentId}`, { state: { tab: "tasks" } })

// Health Score
navigate(`/admin/talent/${talentId}`, { state: { tab: "profile" } })
```

### Styling Classes Used
- `rounded-2xl` - Card border radius
- `border border-brand-black/10` - Card border
- `bg-brand-linen/50` - Default background
- `p-4` - Padding
- `transition-all duration-300` - Smooth transitions
- `hover:shadow-md` - Hover shadow
- `hover:border-brand-black/20` - Border on hover
- `hover:scale-105` - Scale on hover
- `cursor-pointer` - Pointer cursor
- `text-left` - Text alignment
- `h-4 w-4` - Icon size
- `transition-transform duration-300` - Icon animation
- `hover:scale-110` - Icon scale on hover

## 🎬 Animation Details

### Load Animation
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Applied with staggered delay */
animation: 'fadeInUp 0.6s ease-out forwards';
animationDelay: `${idx * 50}ms`; /* Stagger: 0ms, 50ms, 100ms, 150ms */
```

### Hover Transitions
- **Card scale:** 300ms ease-out
- **Border color:** 300ms ease-out
- **Icon scale:** 300ms ease-out
- **Text color:** Implicit transition

## 🚀 Performance Considerations

- **No additional API calls:** Uses existing data
- **Lightweight:** ~5KB component
- **Animations:** GPU-accelerated (transform, opacity)
- **Navigation:** React Router hash-based (no page reload)
- **Memory:** No memory leaks (proper cleanup)

## 🐛 Troubleshooting

### Cards not clickable
- Ensure `talentId` is being passed to component
- Check browser console for React errors
- Verify React Router is properly configured

### Navigation not working
- Check React Router setup
- Verify route `/admin/talent/:id` exists
- Check browser network tab for 404s

### Styles not applying
- Clear browser cache
- Verify Tailwind CSS is configured
- Check for CSS conflicts

### Animations not smooth
- Check browser performance
- Reduce animation complexity if needed
- Verify GPU acceleration is enabled

## 📚 Related Files

- Component: `apps/web/src/components/AdminTalent/HealthSnapshotCards.jsx`
- Page: `apps/web/src/pages/AdminTalentDetailPage.jsx`
- Implementation: `HEALTH_CARDS_NAVIGATION_UPDATE.md`

## 🎓 Using the Feature

### For End Users
1. Navigate to Talent Profile page
2. Scroll to "Health Snapshot" section
3. Click any card to see more details and take action
4. Use back button to return to profile

### For Developers
1. Pass `talentId` prop to component
2. Cards handle navigation automatically
3. Tabs must exist at destination (handled by AdminTalentDetailPage)
4. No additional configuration needed

## 💡 Future Enhancements

1. **Secondary Actions:** Add buttons for quick actions (e.g., "New Deal" from pipeline)
2. **Analytics:** Track click patterns to understand user behavior
3. **Shortcuts:** Add keyboard shortcuts (e.g., Alt+P for pipeline)
4. **Tooltips:** Add helpful tooltips on hover
5. **Progress Indicators:** Show progress bars for metrics (e.g., health score)
