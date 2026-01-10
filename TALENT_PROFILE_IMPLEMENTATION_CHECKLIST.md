# Admin Talent Profile — Implementation Checklist

**Objective:** Execute the redesign in phased, measurable steps.

**Timeline:** 3–5 days (staggered by impact/complexity)

---

## PHASE 1: Layout & Information Architecture (Days 1–2)

### ✅ Checkpoint: Visual Hierarchy Established

**Goal:** Agent sees talent identity + health metrics before scrolling.

#### Task 1.1: Create TalentCommandHeader Component
- [ ] Extract current header section into new `TalentCommandHeader.jsx`
- [ ] Update avatar to 64px (vs current size)
- [ ] Add one-liner: "Exclusive | Finance & Lifestyle | UK"
  - Requires new optional Talent fields: `markets` (string[]), `regions` (string[])
  - For MVP: hardcode example, add fields later
- [ ] Reorganize action buttons: [Back] [View As] [Edit] [⋯ Actions]
- [ ] Style: Clean spacing, no background container needed
- [ ] Test: Responsive on mobile/tablet

**Files:**
- Create: `apps/web/src/components/TalentCommandHeader.jsx`
- Modify: `AdminTalentDetailPage.jsx` (import + use new component)

**Acceptance Criteria:**
- Header is first element on page
- Avatar is prominent (64px)
- One-liner business summary visible
- All actions accessible in one row

---

#### Task 1.2: Refine HealthSnapshotCards Component
- [ ] Update card design: 
  - Padding: 24px (vs 16px)
  - Value font size: 32px (vs 24px) for presence
  - Label: 12px, uppercase, red, tracking 0.35em
  - Micro-text: 11px, black/60, italic (optional)
- [ ] Ensure 4-column grid (desktop), 2-column (tablet), 1-column (mobile)
- [ ] Cards: brand-white background, border brand-black/10, no shadow
- [ ] Icon placement: top-right (subtle, not dominant)
- [ ] Update snapshot data logic:
  - Opportunities: Count from Opportunity table (or 0 if not available)
  - Deals: Count of deals where stage !== "CLOSED"
  - Campaigns: Count of campaigns in progress
  - Revenue: Show "£X.Xk paid | £X.Xk outstanding" for exclusive talent

**Files:**
- Modify: `AdminTalentDetailPage.jsx` (update SnapshotCard component)

**Acceptance Criteria:**
- Cards render in correct grid layout
- Values are large and prominent
- Micro-text provides context
- Responsive on all screen sizes
- Mobile: Cards stack naturally

---

#### Task 1.3: Reorganize Tabs
- [ ] Rename tabs as per strategy:
  - "Overview" → "Overview"
  - "Deals" → "Deals & Pipeline"
  - "Opportunities" → "Opportunities"
  - "Deliverables" → "Content Deliverables" (keep as-is)
  - "Contracts" → "Contracts"
  - "Payments" → "Payments & Finance"
  - "Commerce" → "Commerce"
  - "Access" → "Access & Permissions"
  - "Notes" → "Notes & History"
  - Remove "Files" (low priority)
- [ ] Update TABS constant in `AdminTalentDetailPage.jsx`
- [ ] Update tab styling:
  - Remove bottom border, use top border (2px brand-red when active)
  - Hover state: bg-brand-black/5
  - Padding: 12px 16px
  - Divider between header + content: 1px brand-black/10

**Files:**
- Modify: `AdminTalentDetailPage.jsx` (TABS array + tab style)

**Acceptance Criteria:**
- New tab order is logical (Overview → Deals → Opps → Execution → Money)
- Tab styling is subtle and professional
- Icons are visible and scannable
- Divider between header + content is clear

---

### ✅ Phase 1 Validation

Before moving to Phase 2, verify:
- [ ] Page layout feels clean and spacious (not cramped)
- [ ] Talent identity is clear at first glance
- [ ] Health metrics are scannable in <5 seconds
- [ ] Tab navigation is intuitive
- [ ] Mobile responsiveness is maintained
- [ ] No broken links or errors in console

---

## PHASE 2: Form Fatigue Reduction (Days 2–3)

### ✅ Checkpoint: Input Forms Collapsed

**Goal:** Most of the page is data intelligence, not form inputs.

#### Task 2.1: Collapse Social Profiles Form
- [ ] Create `TalentSocialSection.jsx` with accordion pattern:
  - Section header: "SOCIAL PROFILES" (12px, uppercase, red)
  - Collapsed state: Shows existing profiles as cards
  - Expanded state: Shows "+ Add Profile" form
- [ ] Update profile cards:
  - Layout: Icon | Platform | Handle | Follower Count | [Delete menu]
  - Example: "📷 Instagram @username 1.2M followers"
  - No background, just text + icon
  - Click to expand profile details or delete via menu
- [ ] Form hidden by default, click "+ Add Profile" to show
- [ ] Form in modal or inline drawer (recommend modal for consistency)

**Files:**
- Modify: `TalentSocialSection.jsx` (existing component)
- Consider: Extract form into separate `AddSocialModal.jsx`

**Acceptance Criteria:**
- Social profiles collapsed by default
- Form hidden from initial view
- Existing profiles displayed as clean, scannable cards
- Follower counts visible at a glance
- Delete action via hover menu (not form input)

---

#### Task 2.2: Collapse Email Form
- [ ] Update `TalentEmailsSection.jsx`:
  - Collapsed state: List of emails with labels (primary, work, etc.)
  - Expanded state: Show "+ Add Email" inline input
  - Remove verbose form layout
- [ ] Email list format:
  ```
  primary@email.com        [Primary]
  work@email.com           [Business]
  [+ Add Email]
  ```
- [ ] Inline add: Click "+ Add Email" → input appears → type email + label → enter to confirm

**Files:**
- Modify: `TalentEmailsSection.jsx` (existing component)

**Acceptance Criteria:**
- Email list is compact and scannable
- Form inputs hidden until "+ Add Email" clicked
- Inline add is frictionless (no modal)
- Primary email highlighted

---

#### Task 2.3: Create Tasks Operations Panel
- [ ] Move tasks from Overview tab to dedicated "Tasks & Reminders" tab
- [ ] Create `TalentTasksOperationsPanel.jsx` component:
  - Grouped by status: Upcoming | Overdue | Completed
  - Each group shows count badge
  - Filter tabs at top: [Upcoming] [Overdue] [Completed]
  - Each task row: Checkbox | Title | Due Date | Priority | [Menu]
  - Overdue items styled in red (warning color)
- [ ] Task row interactions:
  - Checkbox: Mark complete/incomplete
  - Click row: Expand or open edit modal
  - Hover: Show menu (edit, delete, comment)
- [ ] "+ Add Task" button in section header (or Quick Actions dropdown)

**Files:**
- Create: `apps/web/src/components/TalentTasksOperationsPanel.jsx`
- Modify: `AdminTalentDetailPage.jsx` (update Overview tab, add Tasks tab content)

**Acceptance Criteria:**
- Tasks grouped by status with clear labels
- Overdue count visible at top
- Due dates are prominent and scannable
- Completion checkbox works inline
- No form visible until "+ Add Task" clicked

---

#### Task 2.4: Simplify Overview Tab
- [ ] Remove form inputs and task inputs from Overview
- [ ] New Overview content:
  - Representation at a glance (read-only, no inputs)
    - Type, Status, Markets, Regions
  - Internal notes (read-only, display only)
  - Recent activity snapshot (show 3–5 recent items)
    - "✓ Deal won: Brand X (2d ago)"
    - "📧 Email from Brand Y (3h ago)"
    - "✓ Task completed: Deliverables (1d ago)"
  - Link to full Notes & History tab
- [ ] Remove: Email form, Social form, Task form
- [ ] Keep: Linked User section (move to Access tab in Phase 4)

**Files:**
- Modify: `OverviewTab` component in `AdminTalentDetailPage.jsx`

**Acceptance Criteria:**
- Overview tab is now a summary, not a form hub
- All content is read-only
- Recent activity gives context at a glance
- User must navigate to other tabs for data entry

---

### ✅ Phase 2 Validation

Before moving to Phase 3, verify:
- [ ] <25% of viewport is form inputs on initial load
- [ ] All forms are collapsible or modal-based
- [ ] Data is displayed as intelligence (cards, lists, etc.), not inputs
- [ ] No form fatigue visual impression
- [ ] Mobile: Form inputs don't crowd small screens

---

## PHASE 3: Deal Tracker Enhancement (Days 3–4)

### ✅ Checkpoint: Pipeline Feels Like a Control Centre

**Goal:** Deal view is intuitive, scannable, and powerful.

#### Task 3.1: Implement Deal Stage View (Kanban-Inspired)
- [ ] Update `DealsTab` component to offer two view options:
  - **Option A:** Kanban columns (NEW_LEAD | QUALIFIED | PROPOSAL | CONTRACT_SIGNED | PAYMENT_RECEIVED)
  - **Option B:** Table view (Deal, Brand, Stage, Value, Due Date, Status)
  - Recommend: Start with Table (simpler), add Kanban as Phase 3b
- [ ] Table view structure:
  ```
  DEAL TRACKER
  ────────────────────────────────────────────────────────
  Brand    | Stage                 | Value | Due Date | Payment Status
  ─────────────────────────────────────────────────────────
  Brand A  | New Lead             | £15k  | Jan 15   | Pending
  Brand B  | Contract Signed      | £25k  | Feb 5    | Awaiting
  Brand C  | Payment Received     | £10k  | —        | ✓ Paid
  ```
- [ ] Each row is clickable → Expand or open detail modal
- [ ] Add filters above table:
  - Filter by Stage: [All] [New Lead] [Qualified] [Proposal] [Contract] [Payment]
  - Filter by Payment Status: [All] [Pending] [Awaiting] [Paid]
  - Sort by: [Due Date ↓] [Value ↓] [Status]
- [ ] Row actions (hover menu or click):
  - Edit
  - Change stage (inline select with quick save)
  - View details
  - Delete

**Files:**
- Modify: `DealsTab` component in `AdminTalentDetailPage.jsx`
- Consider: Extract `DealTableView.jsx` for clarity

**Acceptance Criteria:**
- Deal list is scannable in table format
- Filters and sort work correctly
- Stage field can be edited inline (select dropdown)
- Payment status is clear at a glance
- Row selection/expansion works smoothly

---

#### Task 3.2: Add Inline Field Edits (Power User Feature)
- [ ] Implement inline editing for common fields:
  - Stage (dropdown select)
  - Value (number input)
  - Due Date (date input)
  - Payment Status (derived from stage)
- [ ] Interaction pattern:
  - Hover row → pencil icon appears on editable field
  - Click field → inline editor appears (select, input, date picker)
  - On change → auto-save with loading indicator
  - Error state: Show red text below field
- [ ] Preserve existing `handleEditField` logic, integrate with new UI

**Files:**
- Modify: `DealsTab` component

**Acceptance Criteria:**
- Editable fields are visually distinct on hover
- Inline edit is fast and frictionless
- Auto-save works without modal overhead
- Error states are handled gracefully

---

#### Task 3.3: Add Deal Creation from Quick Actions or "+ New Deal" Button
- [ ] "+ New Deal" button in table header or Quick Actions dropdown
- [ ] Clicking opens "Create Deal" modal (existing component, no changes needed)
- [ ] After creation, table refreshes and shows new deal

**Files:**
- Modify: `DealsTab` component + Quick Actions dropdown

**Acceptance Criteria:**
- Deal creation is accessible and quick
- New deal appears immediately in table
- Modal is already implemented (no new code)

---

### ✅ Phase 3 Validation

Before moving to Phase 4, verify:
- [ ] Deal table is scannable and not cluttered
- [ ] Filters work correctly
- [ ] Inline edits are fast and intuitive
- [ ] Responsive on tablet (may need horizontal scroll for full table)
- [ ] Deal creation is seamless

---

## PHASE 4: Access Control & Linked User Polish (Day 4)

### ✅ Checkpoint: Account Management is Clear

**Goal:** User linking and permissions are intuitive and well-explained.

#### Task 4.1: Move Linked User to Access Control Tab
- [ ] Remove Linked User section from main header/Overview
- [ ] Update `AccessControlTab` component:
  - Section: "ACCOUNT LINKING"
  - Display: Email address, role, connection status
  - If not linked: "Not linked to a user account. [Link User] or send invitation to activate."
  - If linked: "Connected as {email}. [Unlink] or [View Account]"
- [ ] Use friendly language explaining why linking matters
- [ ] Link/Unlink buttons are clear and accessible

**Files:**
- Modify: `AccessControlTab` component in `AdminTalentDetailPage.jsx`
- Modify: Remove Linked User from header

**Acceptance Criteria:**
- Linked User section is now in Access Control tab
- UI clearly shows connection status
- Link/Unlink actions are accessible
- Explanatory text is helpful

---

#### Task 4.2: Polish Quick Actions Dropdown
- [ ] Create `QuickActionsDropdown.jsx` component
- [ ] Menu items:
  - Add Deal
  - Add Task
  - Add Note
  - Link User (or Unlink User if already linked)
  - [Divider]
  - View Activity Log
  - Download Report
  - (Future: Send Email, Schedule Call, etc.)
- [ ] Dropdown appears in Command Header (top-right)
- [ ] Triggers corresponding modals or actions

**Files:**
- Create: `apps/web/src/components/QuickActionsDropdown.jsx`
- Modify: `TalentCommandHeader.jsx` (integrate dropdown)

**Acceptance Criteria:**
- Dropdown opens cleanly (top-right or center-aligned)
- Menu items are clearly labeled
- Clicking item triggers correct action
- Visual style matches brand

---

### ✅ Phase 4 Validation

Before moving to Phase 5, verify:
- [ ] Access Control tab is comprehensive and clear
- [ ] Linked User info is easy to find and understand
- [ ] Quick Actions dropdown works smoothly
- [ ] No broken navigation

---

## PHASE 5: Micro-interactions & Final Polish (Days 4–5)

### ✅ Checkpoint: Professional Feel

**Goal:** Transitions, hover states, and visual feedback feel intentional and expensive.

#### Task 5.1: Add Hover States & Transitions
- [ ] Cards: Subtle shadow or bg shift on hover
  - Hover: `bg-brand-black/2` or `shadow-sm`
- [ ] Buttons: Smooth transition on hover
  - Active: text-brand-red, border-brand-red
  - Hover: bg-brand-black/5
- [ ] Rows in tables/lists: Subtle highlight on hover
  - Hover: `bg-brand-black/3`
- [ ] Apply `transition` class universally (e.g., `transition-colors`, `transition-all`)

**Files:**
- Modify: All components (add transition + hover states)

**Acceptance Criteria:**
- Interactions feel smooth and intentional
- No jarring color changes or delays
- Hover states are visually apparent but not aggressive

---

#### Task 5.2: Refine Spacing & Rhythm
- [ ] Audit all spacing:
  - Section margins: 32px (vs current 24px, for breathing room)
  - Card padding: 24px internal (consistent)
  - Grid gaps: 16px (consistent)
  - Tab padding: 12px 16px (tighter, more refined)
- [ ] Ensure vertical rhythm feels generous and calm
- [ ] Test on mobile: Spacing should reduce proportionally (16px sections on mobile)

**Files:**
- Modify: All layout components (update Tailwind classes)

**Acceptance Criteria:**
- Page feels spacious and calm
- Breathing room between sections
- Mobile spacing is proportional
- No visual crowding

---

#### Task 5.3: Accessibility Audit
- [ ] WCAG 2.1 AA compliance check:
  - Contrast ratios (text vs background) ✓ 4.5:1 for normal, 3:1 for large
  - Focus states: All buttons + inputs have visible focus ring
  - Keyboard navigation: All functionality accessible via keyboard
  - Semantic HTML: Use proper headings, landmarks, labels
  - ARIA labels: Buttons, dropdowns, modals
- [ ] Test with screen reader (VoiceOver on Mac)
- [ ] Test keyboard navigation (Tab through all elements)

**Files:**
- Audit all components for accessibility

**Acceptance Criteria:**
- All contrast ratios pass WCAG AA
- Focus states are visible
- Full keyboard navigation works
- Screen reader labels are present
- No accessibility errors in console

---

#### Task 5.4: Mobile Responsiveness
- [ ] Test all views on iPhone 14 Pro (375px) and iPad (768px)
- [ ] Verify:
  - Header: Avatar + name stack on mobile, layout adjusts
  - Snapshot cards: Single column on mobile, 2-column on tablet
  - Tabs: Scroll horizontally if needed (or collapse to dropdown)
  - Tables: Horizontal scroll or card view on mobile
  - Modals: Full-height with scroll on mobile
- [ ] Touch targets: All buttons ≥44px × 44px

**Files:**
- Modify: All responsive classes in components

**Acceptance Criteria:**
- Page is usable on all screen sizes
- No horizontal scroll (except tables)
- Touch targets are large enough
- Text is readable without zoom

---

#### Task 5.5: Performance Check
- [ ] Audit component re-renders:
  - Use React DevTools Profiler
  - Identify unnecessary re-renders
  - Optimize with `useMemo`, `useCallback` if needed
- [ ] Check API calls:
  - Fetch data only when needed
  - Avoid duplicate fetches
  - Add loading states

**Files:**
- Profile all components with React DevTools

**Acceptance Criteria:**
- No excessive re-renders
- API calls are efficient
- Page loads quickly
- No performance warnings in console

---

### ✅ Phase 5 Validation

Before shipping, verify:
- [ ] Page feels professional and calm
- [ ] All interactions are smooth
- [ ] Mobile is fully functional
- [ ] Accessibility is solid
- [ ] Performance is good
- [ ] No console errors or warnings

---

## FINAL VALIDATION CHECKLIST

Before marking redesign as complete:

### Visual Design
- [ ] Command Header is prominent and clear
- [ ] Business Health cards are scannable in <5 seconds
- [ ] Form inputs are collapsed or modal-based
- [ ] Tabs feel purpose-driven and organized
- [ ] Spacing is generous and intentional
- [ ] Color usage is restrained (red only for intent)
- [ ] Borders and outlines reduced for cleaner feel
- [ ] Responsive on mobile, tablet, desktop

### Functionality
- [ ] All existing features still work (Deals, Opportunities, etc.)
- [ ] Inline edits save correctly
- [ ] Forms are fully functional
- [ ] Modals work smoothly
- [ ] Navigation is intuitive
- [ ] No broken links or APIs

### UX & Interaction
- [ ] Agent can answer key questions in <5 seconds:
  - What's this talent's name and type?
  - How many open opportunities?
  - How many active deals?
  - Is anything overdue?
- [ ] Form fatigue is noticeably reduced
- [ ] Power user features (inline edits) are fast
- [ ] Hover states and transitions feel polished
- [ ] Mobile experience is seamless

### Accessibility & Performance
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] No excessive re-renders
- [ ] Page loads quickly

### Brand Alignment
- [ ] Existing colors maintained (cream, black, red)
- [ ] Typography unchanged
- [ ] Rounded corners, clean outlines preserved
- [ ] No flashy gradients or neon
- [ ] Feels expensive and professional

---

## ROLLOUT PLAN

### Pre-Deployment
1. Create feature branch: `feature/talent-profile-redesign`
2. Implement phases 1–5 in sequence
3. Get design review sign-off at each phase end
4. Test on real data (staging environment)
5. QA testing: Desktop, tablet, mobile

### Deployment
1. Merge to `main`
2. Deploy to staging for final smoke test
3. Deploy to production
4. Monitor for errors (Sentry, console logs)
5. Get agent feedback (collect UX insights)

### Post-Deployment
1. Monitor error rates for first 48 hours
2. Collect user feedback (Slack survey)
3. Plan Phase 3b (Kanban deal view) if time allows
4. Document learnings for future redesigns

---

## SUCCESS METRICS

Measure redesign impact after 2 weeks:

- **Engagement:** Time spent on Talent Detail page (expect +10–20% as features are more discoverable)
- **Errors:** API error rate (expect no change, should decrease if inline edits catch validation issues)
- **Satisfaction:** Agent feedback on UX (goal: 4.5/5 or higher)
- **Performance:** Page load time (goal: <2s on 4G)
- **Accessibility:** A11y audit score (goal: 95+/100)

---

**Status:** Ready to implement  
**Estimated total time:** 3–5 days  
**Team:** 1–2 frontend engineers  
**Risk:** Low (mostly layout and styling)  
**Blockers:** None identified
