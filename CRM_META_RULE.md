# CRM Object Meta-Rule
## Design & UX Guidance (No Backend Enforcement)

**Last Updated:** December 18, 2025  
**Status:** Design-only | No blocking | No enforcement

---

## 🎯 The Canonical Meta-Rule

> **"Is this a person, a company, a moment, or a thing?"**

For every new thing added to the CRM, ask this question to determine if it should exist as its own object.

---

## 🗺️ Object Mapping

| Classification | CRM Object | When to Use |
|----------------|------------|-------------|
| **👤 Person** | User or Contact | Someone you work with, communicate with, or manage |
| **🏢 Company** | Brand | An organization, brand, or business entity |
| **📅 Moment** | Event or Campaign | A time-bound activity, launch, or milestone |
| **💼 Thing** | Deal, Contract, Invoice | A commercial item with value, terms, or status |

---

## 📍 Where This Rule Appears

### 1. Creation Flows (Soft Guidance)

**Context:** When users create Tasks, Notes, Outreach, Deals, Campaigns, or Events

**Copy:**
```
💡 If this is a person, company, moment, or commercial item, consider creating it as its own record.
```

**Behavior:**
- Subtle inline hint or tooltip
- Dismissible (×)
- Never blocking
- Appears once per session

---

### 2. Control Room Settings (Visible Reference)

**Location:** Control Room → CRM Settings → System

**Purpose:**
- Reference for admins and developers
- Explains the "why" behind the rule
- Shows examples and mapping

**Sections:**
- The Meta-Rule (canonical wording)
- Object mapping table
- When to create each object type
- What the rule does NOT do (guardrails)

---

### 3. Empty States (Gentle Encouragement)

**Tasks Empty State:**
```
✓ No tasks yet
Tasks track actions. If you're planning something bigger, consider creating a Campaign or Deal first.
```

**Notes Empty State:**
```
📝 No notes yet
Notes capture context. If this is about a specific person or company, create a Contact or Brand.
```

**Outreach Empty State:**
```
📧 No outreach yet
Outreach tracks communication. Link it to Contacts and Deals to see the full story.
```

---

### 4. Long Content Warnings (Suggestive)

**Trigger:** Note exceeds 300 characters OR Task has >500 characters

**Copy:**
```
💡 This [note/task] is getting detailed. Consider if it describes a Deal, Event, or Brand worth tracking separately.

[Create Deal] [Create Event] [Keep as note]
```

**Behavior:**
- Not corrective, purely suggestive
- One-click conversion helpers
- "Keep as is" always available
- Never blocks saving

---

## 🧱 Object Classifier Component

**Component:** `CrmObjectClassifier`

**When to Use:**
- Behind a "?" icon in complex forms
- Admin-only flows
- Optional in creation modals

**Interface:**
```
What is this?
Choose the best fit to keep your CRM organized

[👤 A person] → Create Contact
[🏢 A company] → Create Brand
[📅 A moment] → Create Event/Campaign
[💼 A commercial item] → Create Deal/Contract

[Skip] This helps keep things trackable. You can always proceed without choosing.
```

---

## 🔗 Relationship to Existing Objects

### What This Rule Does:
✅ Prevents Tasks, Notes, and Outreach from becoming dumping grounds  
✅ Encourages clean linking between objects  
✅ Helps maintain scalable, focused entities  

### What This Rule Does NOT Replace:
- Tasks (still needed for actions)
- Notes (still needed for context)
- Outreach (still needed for communication tracking)

### Examples:

| User Input | Correct Classification |
|------------|------------------------|
| "Follow up with Sarah at Nike" | **Task** (action item) |
| "Sarah prefers WhatsApp" | **Note** on Contact (context) |
| "Sarah - Head of Partnerships, Nike" | **Contact** (person) |
| "Nike" | **Brand** (company) |
| "Nike Summer Launch" | **Campaign** (moment) |
| "£25k creator partnership" | **Deal** (commercial item) |
| "Nike x Creator Contract" | **Contract** (thing with terms) |

---

## 🚫 Explicitly Out of Scope

This is **guidance only**. The following are NOT included:

❌ Hard enforcement  
❌ Blocking creation  
❌ AI auto-classification  
❌ Backend validation  
❌ Preventing saves  

**Philosophy:** This should feel like wisdom, not restriction.

---

## 📝 Copy Bank (For UI Implementation)

### Tooltips (Contextual Hints)

**Generic:**
```
💡 Person → Contact | Company → Brand | Moment → Event/Campaign | Thing → Deal/Contract
```

**Task Creation:**
```
💡 If this is a person, company, moment, or commercial item, consider creating it as its own record.
```

**Note Creation:**
```
💡 If this describes a person, company, moment, or deal, it might work better as a dedicated record.
```

**Outreach Creation:**
```
💡 If you're reaching out about something specific, consider linking to an existing Deal or Campaign.
```

### Long Content Warning

**Note:**
```
💡 This note is getting detailed. Consider if it describes a Deal, Event, or Brand worth tracking separately.

[Create Deal] [Create Event] [Keep as note]
```

**Task:**
```
💡 This task is complex. If it involves a specific deal or event, linking it might keep things clearer.

[Link to Deal] [Link to Campaign] [Keep as is]
```

### Empty States

**Tasks:**
```
✓ No tasks yet
Tasks track actions. If you're planning something bigger, consider creating a Campaign or Deal first.
```

**Notes:**
```
📝 No notes yet
Notes capture context. If this is about a specific person or company, create a Contact or Brand.
```

**Outreach:**
```
📧 No outreach yet
Outreach tracks communication. Link it to Contacts and Deals to see the full story.
```

---

## 🎨 UX Guardrails

1. **Never show more than one hint at a time**  
   - One tooltip OR one warning OR one empty state
   - Avoid overwhelming the user

2. **Always allow proceeding**  
   - No blocking
   - No required fields based on this rule
   - "Skip" or "Dismiss" always available

3. **Hints are dismissible**  
   - Store dismissal in session (not persistent)
   - Don't show the same hint twice in one session

4. **Tone is supportive, not corrective**  
   - Use "consider" not "you must"
   - Use "might" not "should"
   - Use "helps" not "required"

5. **Visual hierarchy**  
   - Hints are subtle (small, light borders)
   - Never use red/error colors
   - Use 💡 or ? icons, not ⚠️

---

## 🔮 Future Considerations (Notes for Later)

When ready to add enforcement or AI:

1. **Pattern Detection**
   - Detect "Company Name" patterns in notes → suggest Brand
   - Detect £/$/€ values → suggest Deal
   - Detect dates/deadlines → suggest Event

2. **Relationship Suggestions**
   - "This note mentions Nike. Link to Nike (Brand)?"
   - "This task is about Summer Campaign. Link it?"

3. **Bulk Migration**
   - "We found 12 notes that look like Contacts. Want to convert?"

4. **Metrics Dashboard**
   - Show how many Tasks/Notes could be objects
   - CRM health score

5. **API-Level Validation** (Optional)
   - Warn (not block) on API when creating oversized notes
   - Suggest alternatives via response metadata

---

## 📦 Components Provided

### `CrmMetaRuleHelper.jsx`

**Exports:**
- `CrmMetaRuleTooltip` - Inline hints for creation flows
- `CrmObjectClassifier` - Modal/panel for "What is this?"
- `CrmMetaRulePanel` - Full reference panel for settings
- `LongContentWarning` - Alert for oversized content
- `EmptyStateWithHint` - Empty states with guidance

### `AdminCrmSettingsPage.jsx`

- Settings page showing the full meta-rule
- Examples and mapping
- Best practices
- Guardrails explanation

---

## 🎓 Philosophy

> "This is wisdom, not restriction. The CRM should guide users toward better decisions without ever getting in their way."

The meta-rule exists to:
- Prevent future technical debt
- Keep entities clean and focused
- Help teams make consistent modeling decisions
- Scale gracefully as the platform grows

It does NOT:
- Block users
- Enforce rules
- Judge decisions
- Create friction

---

## ✅ Success Criteria

This feature succeeds when:
- Users naturally create more structured objects
- Tasks and Notes stay focused
- Fewer "misc" fields get added
- Developers understand the modeling philosophy
- The CRM remains clean and scalable

This feature fails if:
- Users feel restricted or policed
- Creation flows become slower
- Hints become annoying
- The rule is ignored entirely

---

**End of Document**
