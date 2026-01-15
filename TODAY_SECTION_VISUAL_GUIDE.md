# "Today for [Talent]" Section — Visual Guide

## 🎯 What Changed

### BEFORE: Messy Red Grid
```
┌────────────────────────────────────────────────────┐
│ 📌 Today for Patricia  ← Large red header         │
│ ────────────────────────────────────────────────── │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 🔔       │  │ ⚠️       │  │ 📝       │        │
│  │ Closing  │  │ Needs    │  │ Overdue  │        │
│  │ Soon     │  │ Action   │  │ Tasks    │        │
│  │ Untitled │  │ Untitled │  │ Untitled │        │
│  │ 1/20/26  │  │          │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│  [Large red background, 4-column grid, lots of    │
│   wasted space, nested cards, placeholder text]   │
└────────────────────────────────────────────────── ─┘
```

### AFTER: Clean White Card
```
┌──────────────────────────────────────────┐
│ ACTIONS FOR PATRICIA                     │  ← Clean title
├──────────────────────────────────────────┤
│ 💰 Deal #1234                   Jan 15   │
│ [Closing today] [+5px padding] →         │
├──────────────────────────────────────────┤
│ 💰 Deal #5678                            │
│ [Unpaid] →                               │
├──────────────────────────────────────────┤
│ 📋 Review contract                       │
│ [Overdue] Jan 14 →                       │
├──────────────────────────────────────────┤
│ 📋 Follow up email                       │
│ [Due today] →                            │
├──────────────────────────────────────────┤
│ View all actions →                       │
└──────────────────────────────────────────┘
```

---

## 📊 Color System

### Red (Blocking Issues)
```
┌─────────────────────────────┐
│ 💰 Unpaid Invoice           │  Background: brand-red/3
│ [Unpaid] (12 Jan) →         │  Border: brand-red/30
└─────────────────────────────┘  Text: brand-red
```
**Use for:**
- Overdue tasks
- Unpaid deals
- Deals closing today
- Payment blocks

### Amber (Attention Needed)
```
┌─────────────────────────────┐
│ 📋 Call Patricia            │  Background: amber-100/5
│ [Due today] →               │  Border: amber-300/30
└─────────────────────────────┘  Text: amber-900
```
**Use for:**
- Tasks due today (not overdue)
- Deals stuck in early stages

### Grey (Informational)
```
┌─────────────────────────────┐
│ 📋 Schedule follow-up       │  Background: brand-white
│ [Pending] →                 │  Border: brand-black/10
└─────────────────────────────┘  Text: brand-black/50
```
**Use for:**
- Future scheduled items
- Low-priority updates

---

## ✨ Item Structure

### Task Item
```
┌─────────────────────────────────────────┐
│ 📋 Update contract                      │  ← Icon + Title
│ [Overdue] Jan 13                    →   │  ← Reason + Date + Arrow
└─────────────────────────────────────────┘
```

### Deal Item
```
┌─────────────────────────────────────────┐
│ 💰 Build-A-Bear Campaign                │  ← Icon + Title
│ [Closing today]                     →   │  ← Reason + Arrow
└─────────────────────────────────────────┘
```

---

## 🎯 States

### With Actions (Most Common)
```
Title
─────────────────
[Item 1]
[Item 2]
[Item 3]
─────────────────
View all actions →
```

### No Actions (Empty State)
```
All clear today for Patricia 🎉
No overdue tasks or urgent deals
```

### When Section Scrolls Off
```
Still visible in sidebar or floating action bar
(Future enhancement)
```

---

## 🖱️ Interactions

### Hover State
```
Before:  ┌──────────────┐
         │ 💰 Deal      │
         └──────────────┘

After:   ┌──────────────┐
         │ 💰 Deal      │ ← Subtle background change
         └──────────────┘    (hover:bg-red-red/5, etc.)
```

### Click Action
```
Click any item → Navigate to correct tab (Tasks/Deals)
                 Item becomes active/highlighted
                 User sees details in main content area
```

---

## 📏 Spacing & Typography

### Typography
```
Header:  "ACTIONS FOR [NAME]"
         Font: semibold, uppercase, tracking-[0.2em]
         Size: text-xs

Item Title: "💰 Deal Title"
            Font: semibold
            Size: text-sm

Reason: "[Closing today]"
        Font: semibold, uppercase
        Size: text-[0.65rem]

Date: "Jan 15"
      Font: regular
      Size: text-[0.65rem]
```

### Spacing
```
Container padding:     p-5 (20px)
Item list spacing:     space-y-2 (8px between items)
Item internal padding: p-3 (12px)
Border radius:         rounded-xl
```

---

## 🔄 Data Flow

```
1. User opens Talent Detail Page
   ↓
2. getAttentionRequiredItems(talent) called
   ├─ Filter tasks (overdue/due today)
   ├─ Filter deals (closing/unpaid/stuck)
   └─ Sort by severity + date
   ↓
3. Return array of max 5 items
   ↓
4. Render section
   ├─ If items.length === 0: Show empty state
   └─ If items.length > 0: Show item list
   ↓
5. User clicks item
   ├─ Item validates (no nulls/undefined)
   ├─ Navigate to correct tab
   └─ Highlight/scroll to item
```

---

## ✅ Quality Checklist

✓ No placeholder text ("Untitled") ever visible  
✓ Every item has valid ID, title, and link target  
✓ Color coding is meaningful (not just red alarm)  
✓ Layout is compact (max 5 items, max 1 line per item)  
✓ Empty state is positive (celebration emoji)  
✓ Section is above tabs but after identity info  
✓ All actions clickable and functional  
✓ No nested cards or visual clutter  
✓ Responsive on all screen sizes (full width on mobile)  

---

## 🚀 Ready for Production

This section is clean, focused, and genuinely useful. It tells managers at a glance: "What needs my attention right now for this talent?"
