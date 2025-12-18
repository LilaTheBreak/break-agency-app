# CRM Meta-Rule Integration Examples

This document shows how to integrate the CRM Meta-Rule components into your UI.

## Components Available

All components are exported from: `../components/CrmMetaRuleHelper.jsx`

---

## 1. Inline Tooltips (Creation Flows)

Use `CrmMetaRuleTooltip` to show gentle hints during creation.

### Example: Task Creation Form

```jsx
import { CrmMetaRuleTooltip } from "../components/CrmMetaRuleHelper.jsx";

function TaskCreateModal() {
  return (
    <form>
      <input type="text" placeholder="Task title" />
      <textarea placeholder="Task description" />
      
      {/* Add the tooltip */}
      <CrmMetaRuleTooltip context="task" />
      
      <button type="submit">Create Task</button>
    </form>
  );
}
```

**Contexts available:**
- `"task"` - For task creation
- `"note"` - For note creation
- `"outreach"` - For outreach creation
- `"generic"` - For any other context

---

## 2. Object Classifier (Modal/Panel)

Use `CrmObjectClassifier` when you want users to choose what type of object to create.

### Example: "Add New" Button

```jsx
import { useState } from "react";
import { CrmObjectClassifier } from "../components/CrmMetaRuleHelper.jsx";

function AddNewButton() {
  const [showClassifier, setShowClassifier] = useState(false);
  
  const handleSelect = (type) => {
    switch(type) {
      case "person":
        navigate("/admin/contacts/new");
        break;
      case "company":
        navigate("/admin/brands/new");
        break;
      case "moment":
        navigate("/admin/campaigns/new");
        break;
      case "thing":
        navigate("/admin/deals/new");
        break;
    }
    setShowClassifier(false);
  };
  
  return (
    <>
      <button onClick={() => setShowClassifier(true)}>
        + Add New
      </button>
      
      {showClassifier && (
        <div className="modal">
          <CrmObjectClassifier
            onSelect={handleSelect}
            onCancel={() => setShowClassifier(false)}
          />
        </div>
      )}
    </>
  );
}
```

---

## 3. Long Content Warning

Use `LongContentWarning` to detect when content is getting too detailed.

### Example: Note Editor

```jsx
import { useState } from "react";
import { LongContentWarning } from "../components/CrmMetaRuleHelper.jsx";

function NoteEditor() {
  const [noteText, setNoteText] = useState("");
  
  const handleConvert = (action) => {
    if (action === "deal") {
      // Navigate to deal creation with note pre-filled
      navigate("/admin/deals/new", { state: { description: noteText } });
    } else if (action === "event") {
      navigate("/admin/events/new", { state: { description: noteText } });
    }
    // else dismiss
  };
  
  return (
    <div>
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Add a note..."
      />
      
      {/* Show warning if note exceeds 300 characters */}
      <LongContentWarning
        type="note"
        count={noteText.length}
        threshold={300}
        onConvert={handleConvert}
      />
    </div>
  );
}
```

---

## 4. Empty States with Guidance

Use `EmptyStateWithHint` for entity list pages with no data.

### Example: Tasks Page (Already Implemented)

```jsx
import { EmptyStateWithHint } from "../components/CrmMetaRuleHelper.jsx";

function AdminTasksPage() {
  const tasks = []; // Empty
  
  return (
    <DashboardShell>
      {tasks.length === 0 ? (
        <EmptyStateWithHint
          entity="tasks"
          onCreate={() => navigate("/admin/tasks/new")}
          onLearnMore={() => navigate("/admin/crm-settings")}
        />
      ) : (
        <TaskList tasks={tasks} />
      )}
    </DashboardShell>
  );
}
```

**Entities supported:**
- `"tasks"`
- `"notes"`
- `"outreach"`

---

## 5. Meta-Rule Reference Panel

Use `CrmMetaRulePanel` in settings or documentation pages.

### Example: CRM Settings Page (Already Implemented)

```jsx
import { CrmMetaRulePanel } from "../components/CrmMetaRuleHelper.jsx";

function AdminCrmSettingsPage() {
  return (
    <DashboardShell>
      <CrmMetaRulePanel />
    </DashboardShell>
  );
}
```

This shows:
- The canonical meta-rule question
- Full mapping table
- Examples
- Best practices

---

## Integration Checklist

### ✅ Already Implemented

- [x] CrmMetaRuleHelper component library
- [x] AdminCrmSettingsPage with full reference
- [x] AdminTasksPage empty state with hint
- [x] Navigation link to CRM Settings
- [x] App routing for /admin/crm-settings

### 📋 Next Steps (Optional)

When you're ready to add more guidance:

1. **Add tooltips to creation forms:**
   - Task creation modal
   - Note creation modal
   - Outreach creation modal

2. **Add long content warnings:**
   - Note editor (>300 chars)
   - Task description (>500 chars)

3. **Add empty states:**
   - Notes page
   - Outreach page

4. **Add object classifier:**
   - Global "+" button in header
   - Dashboard quick actions
   - Admin control room

5. **Add help icons:**
   - Small "?" icons that open CrmObjectClassifier
   - Link to /admin/crm-settings

---

## Copy Bank for Quick Reference

### Tooltip Copy

**Task:**
```
💡 If this is a person, company, moment, or commercial item, consider creating it as its own record.
```

**Note:**
```
💡 If this describes a person, company, moment, or deal, it might work better as a dedicated record.
```

**Outreach:**
```
💡 If you're reaching out about something specific, consider linking to an existing Deal or Campaign.
```

### Warning Copy

**Long Note:**
```
💡 This note is getting detailed. Consider if it describes a Deal, Event, or Brand worth tracking separately.
```

**Long Task:**
```
💡 This task is complex. If it involves a specific deal or event, linking it might keep things clearer.
```

---

## UX Guidelines

### DO:
✅ Show one hint at a time  
✅ Make all hints dismissible  
✅ Use supportive language ("consider", "might")  
✅ Provide one-click alternatives  
✅ Allow users to proceed regardless  

### DON'T:
❌ Block creation flows  
❌ Show multiple hints simultaneously  
❌ Use warning/error styling  
❌ Force classification  
❌ Persist dismissals across sessions  

---

## Testing the Integration

1. **Visit Tasks Page:**
   - Navigate to `/admin/tasks`
   - Should see empty state with meta-rule hint
   - "Learn more" should go to `/admin/crm-settings`

2. **Visit CRM Settings:**
   - Navigate to `/admin/crm-settings`
   - Should see full meta-rule panel
   - Should see examples and mapping

3. **Check Navigation:**
   - CRM Settings should appear in admin nav
   - Should be accessible to ADMIN and SUPERADMIN roles

---

## Future Enhancements (Not Implemented)

These are ideas for when you want to add more functionality:

1. **Pattern Detection:**
   - Detect "Company Name" in notes → suggest Brand
   - Detect £/$/€ values → suggest Deal
   - Detect dates → suggest Event

2. **Smart Suggestions:**
   - "This note mentions Nike. Link to Nike (Brand)?"
   - "This task is about Summer Campaign. Link it?"

3. **Bulk Operations:**
   - "We found 12 notes that look like Contacts. Convert?"

4. **Analytics:**
   - CRM health score
   - Object type distribution
   - Conversion suggestions

5. **API Hints:**
   - Return metadata from API when oversized content detected
   - Suggest alternatives in response

---

**End of Integration Guide**
