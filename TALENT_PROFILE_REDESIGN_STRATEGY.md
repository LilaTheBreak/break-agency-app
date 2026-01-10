# Admin Talent Profile — UX/UI Redesign Strategy

**Objective:** Transform the Admin Talent Detail Page from a form-heavy panel into a professional control centre for managing talent's entire business.

**Current State:** Functional but feels like data entry rather than decision-making.

**Target State:** Stripe Dashboard / Linear / Notion-level professionalism — calm, deliberate, intelligent, expensive.

---

## 📐 INFORMATION ARCHITECTURE OVERHAUL

### Current Problems
- All sections feel equally important (no hierarchy)
- Form inputs dominate the visual space
- Agent must scroll to see key metrics
- Social profiles feel like admin inputs, not business signals
- Tasks buried in "Overview" tab feel scattered
- No clear "what matters now?" focal point

### New Architecture — 3 Tiers

```
┌─────────────────────────────────────────────────┐
│ TIER 1: COMMAND HEADER                          │
│ ─────────────────────────────────────────────── │
│ [Avatar] Name | Type Badge | Status             │
│ "Exclusive | Finance & Lifestyle | UK"          │
│ [View As] [Edit] [Quick Actions ▼]              │
└─────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────┐
│ TIER 2: BUSINESS HEALTH SNAPSHOT                │
│ ─────────────────────────────────────────────── │
│ [Open Opps] [Active Deals] [Campaigns] [Revenue]│
│ Scannable, read in 2 seconds                     │
└─────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────┐
│ TIER 3: FUNCTIONAL WORKSPACES (Tab Redesign)    │
│ ─────────────────────────────────────────────── │
│ Purpose-driven views: Overview, Deals, Tasks... │
│ Read-only by default, inline edits for power    │
└─────────────────────────────────────────────────┘
```

---

## 🎯 TIER 1: TALENT COMMAND HEADER

**Goal:** Establish talent identity in 2 seconds. Should feel like a CEO profile card, not a form header.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [Avatar/Initial]  Name (Display)                       │
│  24px height       24px, Uppercase, Black               │
│                    ↓                                    │
│  photo or          "Exclusive | Finance & Lifestyle"   │
│  initials badge    12px, Tracking 0.35em, Red          │
│                    ↓                                    │
│  [Back]  [View As] [Edit] [⋯ Actions]                 │
│  Link    Button    Button  Dropdown                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components

**Avatar Container**
- 64px × 64px (larger than current, signals importance)
- Show image if linked user has avatarUrl
- Fallback: Initials badge with brand-red background
- Border: 2px brand-black/10
- No shadow — fits restraint luxury

**Name & Representation**
- **Name:** font-display (existing), text-3xl, uppercase
- **One-liner:** `"{Type} | {Markets} | {Regions}"`
  - Example: "Exclusive | Finance & Lifestyle | UK / Global"
  - 12px, tracking 0.35em, red
  - Derived from representationType + fields (new optional fields to add)

**Action Buttons (Horizontal)**
1. **Back** — Simple link button (arrows)
2. **View As** — Existing component, no change
3. **Edit** — Opens EditTalentModal (existing, no change)
4. **Quick Actions ▼** — New dropdown menu:
   - Add Deal
   - Add Task
   - Add Note
   - Link/Unlink User
   - (Future: Send Email, Schedule Call, etc.)

### Code Changes Required
- Component: Move current "header section" into standalone Header component
- Add optional fields to Talent model: `markets` (array), `regions` (array)
- New QuickActionsDropdown component with above actions
- Move back button + action buttons here (currently scattered)

---

## 💼 TIER 2: BUSINESS HEALTH SNAPSHOT

**Goal:** Executive-level insight. Agent opens page and immediately sees:
- "Is this talent healthy?"
- "What needs attention?"
- "What are the numbers?"

### Card Structure

Each card follows this pattern:
```
┌──────────────────────────┐
│ Label       [Icon]       │
│ 12px, Red, Tracking      │
│ ─────────────────────────│
│ VALUE                    │
│ 24px, Bold, Black        │
│ ─────────────────────────│
│ Micro-label (optional)   │
│ 11px, Black/50           │
└──────────────────────────┘
```

### Four Core Cards (Grid Layout)

**1. Open Opportunities**
- Value: Count of opportunities (from Opportunity table)
- Micro: "awaiting decision"
- Icon: TrendingUp (existing)
- If 0: Subtle, not alarming

**2. Active Deals**
- Value: Count of deals with stage != "CLOSED"
- Micro: "£X.Xk total value" (or "—" if not exclusive)
- Icon: Briefcase
- Shows pipeline health at a glance

**3. Live Campaigns**
- Value: Count of campaigns in progress
- Micro: "X deliverables pending"
- Icon: FileText
- Shows execution load

**4. Revenue (Exclusive Only)**
- Value: "£X.Xk" (gross total)
- Micro: "£X.Xk paid | £X.Xk outstanding"
- Icon: DollarSign
- Shows financial health for exclusive talent

### Visual Rules
- 4-column grid on desktop, 2-column on tablet, 1-column on mobile
- All cards same height
- Padding: 16px
- Border: 1px brand-black/10
- Background: brand-white (no color, max clarity)
- No shadow, no gradient
- Value color: brand-black
- Label color: brand-black/60

### Code Changes Required
- Replace existing SnapshotCard component with new refined version
- Add logic to fetch opportunity count (requires endpoint)
- Modify revenue card to show breakdown (paid vs outstanding)
- Card width auto-scales, no hard spacing

---

## 🗂️ TIER 3: FUNCTIONAL WORKSPACES (Tab Redesign)

### Problem with Current Tabs
- Too many tabs (10) feels overwhelming
- Tabs don't feel purpose-driven
- Overview tab is still form-heavy with inputs
- No clear sequencing of what to use when

### Redesigned Tabs (Reorganized)

| Tab | Purpose | Key UX | 
|-----|---------|--------|
| **Overview** | High-level summary | Read-only, snapshot of representation details |
| **Deals & Pipeline** | Deal tracker, closed-loop sales | Stage-based grouping, inline edits, deal creation |
| **Opportunities** | Inbound intelligence | Filter, search, conversion tracking |
| **Deliverables** | Content execution | Due dates visible, status at a glance |
| **Payments & Finance** | Money view | Revenue breakdown, invoices, payment schedule |
| **Contracts** | Legal view | Signed status, renewals, key dates |
| **Commerce** | Products & drops | Inventory, sales, revenue (Exclusive only) |
| **Email & Comms** | Inbox linked to this talent | Gmail synced, conversation threads |
| **Tasks & Reminders** | Daily operations board | Status groups (Upcoming/Overdue/Done) |
| **Access & Permissions** | User linking, role control | Who can view/edit this talent |
| **Notes & History** | Audit trail | Activity log, internal notes |

**Changes:**
- Remove "Files & Assets" (low value, comes later)
- Add "Email & Comms" (currently missing, important for inbound management)
- Consolidate "Payments & Finance" into one clear view
- Rename "Content Deliverables" → "Deliverables" (shorter)
- Move Tasks to prominence (was buried, should be first-class)

### Tab Visual Treatment (Subtle Enhancement)

```
┌────────────────────────────────────────────────────┐
│ ► Overview    ► Deals    ► Opportunities   ...     │
├────────────────────────────────────────────────────┤
│                                                    │
│ [Tab content here]                                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Rules:**
- Icons remain (visual scanning)
- Remove bottom border, use subtle top-border indicator instead
- Active tab: 2px top border (brand-red)
- Padding: 12px 16px (tighter)
- Hover state: bg-brand-black/5
- Divider between header and content: 1px brand-black/10

---

## 🎨 FORM FATIGUE FIXES

### Current Problem: Inputs Clutter the Page

**Social Profiles Example (Current)**
```
[Dropdown: Platform]
[Input: Handle]
[Input: URL]
[Input: Followers]
[Button: Add Social Profile]

[List of existing socials]
```

**Problem:** Form dominates; profiles are secondary.

### Redesigned: Social Profiles as Business Signals

```
┌─────────────────────────────────────────────────┐
│ SOCIAL PROFILES                                 │
│                                                 │
│ 📷 Instagram  @handle                  1.2M 👥 │
│ 🎵 TikTok     @handle                  234k 👥 │
│ ▶️  YouTube    handle                   156k 👥 │
│                                                 │
│ [+ Add Profile]  [Edit Default]                 │
└─────────────────────────────────────────────────┘
```

**Changes:**
- Form collapsed by default (collapsed accordion)
- Click "+ Add Profile" → opens inline drawer or modal
- Profiles show as horizontal cards with key signals (platform, handle, follower count)
- Delete action accessible via hover/menu
- Remove helper text ("Public profile data will auto-populate...")
- Cleaner, scannable, signal-focused

### Similar Pattern for Other Sections

**Emails (Current)**
```
[Dropdown: Label]
[Input: Email]
[Button: Add Email]
[List of emails]
```

**Redesigned**
```
LINKED EMAILS
─────────────
primary@email.com (Primary)
work@email.com
[+ Add Email]
```

**Tasks (Current)**
- Form inputs visible in Overview tab

**Redesigned**
- Full Tasks tab (purpose-driven view)
- Grouped by status (Upcoming / Overdue / Completed)
- Each task card shows: title, due date, priority
- Inline quick actions (mark done, delete)
- Click to expand or edit

---

## 🚀 KEY REDESIGN SPECIFICS

### 1. Linked User Section

**Current:**
```
Linked User Account
─────────────────────
[Icon] email@example.com (Name)
       [Link User] or [Unlink]
```

**Redesigned:**
```
ACCOUNT LINKING
───────────────
Connected as: email@example.com
Role: Talent User
                              [Unlink]

(Not linked yet? Talent won't receive notifications.
 [Link User] or invite to activate)
```

**UX:**
- Move to Access Control tab (belongs there)
- Make it feel like account status, not a form
- Friendly text explains impact of linking

### 2. Tasks Section → Operations Panel

**Current:** Inputs in Overview, scattered

**Redesigned:** Full "Tasks & Reminders" tab with:
```
OPERATIONS BOARD
────────────────────
[Status: Upcoming] [Overdue: 2] [Done: 8]

Upcoming (4)
─────────────
□ Deliver Q4 campaign assets         Due: Jan 15
□ Review contract with ABC Corp      Due: Jan 22
□ Submit W9 form                       Due: Feb 1

Overdue (2)
──────────
✗ Final post approval (Brand X)      Due: Jan 8  [Overdue 2d]
✗ Invoice outstanding                 Due: Jan 12 [Overdue 5d]

Completed This Month (8)
────────────────────
✓ Photoshoot completed
✓ Contract signed
... [Show less]

[+ Add Task]
```

**Features:**
- Status badges (Upcoming/Overdue/Completed) are tabs/filters
- Due dates prominent and scannable
- Overdue items highlighted in red
- Inline completion (checkbox interaction)
- Click to edit task detail
- Create via "+ Add Task" button or Quick Actions dropdown

### 3. Deals & Pipeline Tab

**Current:** Complex inline editing, not scannable

**Redesigned:** Kanban-inspired stage view
```
DEAL TRACKER
─────────────────────────────────────────────────

NEW LEAD (2)              CONTRACT SIGNED (3)     PAYMENT RECEIVED (5)
─────────────            ──────────────────      ───────────────────
[Brand A Deal]           [Brand B Deal]          [Brand C Deal]
£15k | Due Jan 15        £25k | Due Feb 5        £10k | Paid
[> View]                 [> View]                [> View]

[+ New Deal]
```

**Alternative (Table View):**
```
DEAL TRACKER
──────────────────────────────────────────────────────
Brand    | Stage            | Value | Due Date | Status
─────────────────────────────────────────────────────
Brand A  | New Lead         | £15k  | Jan 15   | On track
Brand B  | Contract Signed  | £25k  | Feb 5    | Waiting signature
Brand C  | Payment Received | £10k  | Done     | ✓ Paid

[+ New Deal]
```

**Features:**
- Each deal is a card or row (click to expand)
- Inline field edits for power users (stage, value, date)
- Color-coded stage badges
- Payment status visible
- Quick actions menu (edit, delete, view details)
- Filter by stage / payment status
- Sort by due date, value, or status

### 4. Overview Tab — Simplified

**Current:** Mixes representation details, notes, emails, tasks, socials

**Redesigned:** Only high-level summaries, not inputs

```
REPRESENTATION AT A GLANCE
──────────────────────────
Type: Exclusive | Finance & Lifestyle
Status: Active
Market Fit: Premium, B2B
Regions: UK, EU
Notes: "Key talent for FY25..."

RECENT ACTIVITY
───────────────
✓ Email from Brand X (3h ago)
✓ Task completed: Deliverables approved (1d ago)
✓ Deal won: Brand Y campaign (2d ago)

[View Full History]
```

**Rationale:**
- Removes form inputs (they're in other tabs/modals)
- Shows actual intel (recent activity)
- Gives agent context without noise
- Representation details are read-only (edit via Edit modal)

---

## 🎨 VISUAL REFINEMENT RULES

Apply these across the redesign to feel "expensive":

### Spacing & Rhythm
- Increase vertical rhythm: 24px between sections (vs current 16px)
- Section padding: 24px (vs current 16px) for breathing room
- Card internal padding: 16px (consistent)
- Gap between cards in grid: 16px

### Headers & Labels
- Use clear section headers: "OPEN OPPORTUNITIES" (12px, uppercase, tracking 0.35em)
- Prefix with red pill when needed: **[🔴 Red]** "SECTION NAME"
- Avoid label-heavy UI; let data speak
- Remove redundant borders

### Border & Outline Reduction
- Reduce overall border density
- Use `border-brand-black/10` consistently
- Remove internal dividing lines where possible
- Group related items in subtle containers (bg-brand-linen/30 vs white)

### Color Accent Strategy
- Red accent: Use for CTAs (buttons), status (overdue), and section prefixes
- Avoid red on non-critical elements
- Use status colors sparingly: Green (done), Yellow (pending), Red (overdue), Black (in progress)

### Typography Hierarchy
- **Tier 1 (Talent Name):** font-display, 32px–36px, uppercase, black
- **Tier 2 (Section Headers):** 12px uppercase, tracking 0.35em, red
- **Tier 3 (Card Values):** 20px–24px, bold, black
- **Tier 4 (Labels):** 12px, tracking 0.3em, black/60
- **Tier 5 (Supporting Text):** 11px, black/50, italic

---

## 🔄 INTERACTION PATTERNS

### Inline Edits (Power User Experience)
For fields that change frequently (deal stage, task status, notes):

```
Current State:          Hover State:                Edit State:
┌────────────────┐    ┌────────────────┐         ┌────────────┐
│ Stage: New     │    │ Stage: New [·]  │ Click   │ [Dropdown] │
│ Lead           │    │ Lead            │  →      │ ✓ ✗        │
└────────────────┘    └────────────────┘         └────────────┘
```

**Rules:**
- Hover reveals pencil icon or light background
- Click opens inline editor (select, input, etc.)
- Shows checkmark + X for quick confirmation/cancel
- Auto-save on checkmark, no modal required
- Red error text if validation fails

### Modals vs. Drawers vs. Inline

| Action | Pattern | Rationale |
|--------|---------|-----------|
| Edit Talent (name, type, status) | Modal | Grouped changes, requires validation |
| Add Social Profile | Modal | Form with multiple fields, scraping |
| Add Task | Inline Drawer | Quick entry, common operation |
| Add Email | Inline Input | Single field, low friction |
| View Deal Details | Modal or Expand | Full form + history |
| Edit Deal Stage | Inline Select | Frequent operation, single field |

---

## 📝 IMPLEMENTATION ROADMAP

### Phase 1: Layout & Information Architecture (High Impact, No API Changes)
1. Extract Command Header into dedicated component
2. Redesign Business Health Snapshot cards
3. Reorganize and rename tabs
4. Simplify Overview tab content
5. Update tab visual treatment

**Files to Modify:**
- `AdminTalentDetailPage.jsx` (main layout)
- New: `TalentCommandHeader.jsx`
- New: `HealthSnapshotCards.jsx`
- Update tab content components

### Phase 2: Form Fatigue Reduction
1. Collapse Social Profiles form by default → Drawer on "+ Add"
2. Collapse Email form by default → Quick add input
3. Move Tasks to dedicated tab with grouping
4. Create Tasks Operations Panel component

**Files to Modify:**
- `TalentSocialSection` → Add drawer pattern
- `TalentEmailsSection` → Collapse by default
- New: `TalentTasksOperationsPanel.jsx`

### Phase 3: Deal Tracker Enhancement
1. Implement stage-based card view or table view
2. Add inline edits for common fields (stage, value, date)
3. Add filter/sort controls
4. Polish card design

**Files to Modify:**
- `DealsTab` component
- New: `DealCard.jsx` or `DealRow.jsx`
- New: `DealFiltersBar.jsx`

### Phase 4: Linked User & Access Control Polish
1. Move Linked User section to Access Control tab
2. Improve messaging and visual hierarchy
3. Add account status indicator

**Files to Modify:**
- `AccessControlTab` component
- `TalentAccessSettings` component

### Phase 5: Micro-interactions & Polish
1. Add hover states, transitions
2. Refine spacing and visual rhythm
3. Test on mobile and tablet
4. Accessibility audit

---

## 🎯 SUCCESS CRITERIA

✅ **An agent opens the page and within 5 seconds:**
- Knows talent name and representation type
- Sees 4 key metrics (opps, deals, campaigns, revenue)
- Understands "what matters today"

✅ **Form fatigue reduced:**
- <25% of viewport on first view is form inputs
- Most inputs live in collapsed drawers/modals
- Data is displayed as intelligence, not inputs

✅ **Tab navigation feels intuitive:**
- Tabs follow a logical workflow (Overview → Deals → Opportunities → Execution → Money)
- Each tab has one clear purpose
- No duplicate data across tabs

✅ **Visual hierarchy is clear:**
- Representation details ← Command Header
- Health metrics ← Snapshot cards
- Operational details ← Tabs

✅ **Feels "expensive" & "professional":**
- Calm, deliberate layout
- Restrained use of color (red only for intent)
- Generous spacing
- Clean outlines, no shadows
- Comparable to Stripe, Linear, or Notion

---

## 📋 SPECIFIC CODE RECOMMENDATIONS

### 1. New Component: `TalentCommandHeader.jsx`

```jsx
export function TalentCommandHeader({ talent, onEdit, onViewAs, onQuickAction }) {
  return (
    <header className="mb-8">
      <div className="flex items-start gap-6 mb-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {/* 64px avatar or initials */}
        </div>
        
        {/* Identity */}
        <div className="flex-1">
          <h1 className="font-display text-4xl uppercase mb-2">
            {talent.displayName}
          </h1>
          <p className="text-sm tracking-0.35em text-brand-red uppercase mb-4">
            {talent.representationType} | Finance & Lifestyle | UK
          </p>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button>[Back]</button>
            <button>[View As]</button>
            <button>[Edit]</button>
            <QuickActionsDropdown onAction={onQuickAction} />
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 2. Snapshot Cards Component (Refined)

```jsx
function HealthSnapshotCard({ label, value, subtext, icon: Icon, variant = "default" }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs uppercase tracking-0.35em text-brand-red font-semibold">
          {label}
        </p>
        {Icon && <Icon className="h-5 w-5 text-brand-black/30" />}
      </div>
      
      <p className="text-3xl font-bold text-brand-black mb-2">{value}</p>
      
      {subtext && (
        <p className="text-xs text-brand-black/60">{subtext}</p>
      )}
    </div>
  );
}
```

### 3. Operations Panel: Tasks (New)

```jsx
function TalentTasksOperationsPanel({ talentId, tasks }) {
  const grouped = {
    upcoming: tasks.filter(t => t.status === "TODO" && !isOverdue(t.dueDate)),
    overdue: tasks.filter(t => isOverdue(t.dueDate) && t.status !== "DONE"),
    completed: tasks.filter(t => t.status === "DONE"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex gap-2">
          <StatusFilter active={filters.status} onChange={handleFilter} />
        </div>
        <button className="ml-auto rounded-full bg-brand-red px-4 py-2 text-white text-xs uppercase">
          + Add Task
        </button>
      </div>

      {/* Upcoming Group */}
      <section>
        <h3 className="text-xs uppercase tracking-0.35em text-brand-red font-semibold mb-4">
          Upcoming ({grouped.upcoming.length})
        </h3>
        <div className="space-y-2">
          {grouped.upcoming.map(task => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      </section>

      {/* Overdue Group */}
      {grouped.overdue.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-0.35em text-brand-red font-semibold mb-4">
            ⚠️ Overdue ({grouped.overdue.length})
          </h3>
          <div className="space-y-2">
            {grouped.overdue.map(task => (
              <TaskRow key={task.id} task={task} style="error" />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      <section>
        <h3 className="text-xs uppercase tracking-0.35em text-brand-black/60 font-semibold mb-4">
          Completed This Month ({grouped.completed.length})
        </h3>
        <div className="space-y-2">
          {grouped.completed.slice(0, 3).map(task => (
            <TaskRow key={task.id} task={task} style="completed" />
          ))}
        </div>
      </section>
    </div>
  );
}
```

### 4. Deal Tracker: Stage-Based View

```jsx
function DealTrackerStageView({ deals }) {
  const stages = {
    "NEW_LEAD": { label: "New Lead", count: 0, deals: [] },
    "QUALIFIED": { label: "Qualified", count: 0, deals: [] },
    "PROPOSAL": { label: "Proposal", count: 0, deals: [] },
    "CONTRACT_SIGNED": { label: "Contract Signed", count: 0, deals: [] },
    "PAYMENT_RECEIVED": { label: "Payment Received", count: 0, deals: [] },
  };

  deals.forEach(deal => {
    if (stages[deal.stage]) {
      stages[deal.stage].deals.push(deal);
      stages[deal.stage].count++;
    }
  });

  return (
    <div className="grid grid-cols-5 gap-6">
      {Object.entries(stages).map(([key, stage]) => (
        <DealStageColumn key={key} stage={stage} />
      ))}
    </div>
  );
}
```

---

## ✨ FINAL THOUGHTS

This redesign maintains all functionality while elevating the UX to feel:
- **Professional:** Hierarchy, clarity, purpose
- **Calm:** Breathing space, reduced cognitive load
- **Intelligent:** Data as signals, not inputs
- **Expensive:** Restrained, deliberate, high-end

The result is a page where an agent feels in control, not burdened by forms. It's a **command centre**, not a **data entry panel**.

---

**Status:** Ready for implementation  
**Estimated build time:** 3–5 days (phased approach)  
**Risk level:** Low (mostly layout refactoring, no major API changes)  
**Brand alignment:** 100% (respects existing design system)
