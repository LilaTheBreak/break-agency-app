# Talent Management System Expansion - Implementation Complete

**Status:** ✅ Backend API Complete | ⏳ Frontend Integration Remaining
**Commits:** 
- `8bb835f` - B Logo Mark asset  
- `3499af7` - TalentEmail, TalentTask, TalentSocial models + APIs
- `23f42b6` - WIP commit

---

## ✅ WHAT'S BEEN IMPLEMENTED

### 1. Database Schema (Complete)

**New Tables Created:**

#### TalentEmail
```sql
CREATE TABLE "TalentEmail" (
  id TEXT PRIMARY KEY,
  talentId TEXT NOT NULL (FK → Talent),
  email TEXT NOT NULL,
  label TEXT,
  isPrimary BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  UNIQUE(talentId, email)
)
```

**Key Constraint:** Only ONE email per talent can have `isPrimary = true`. Enforced in API layer.

#### TalentTask  
```sql
CREATE TABLE "TalentTask" (
  id TEXT PRIMARY KEY,
  talentId TEXT NOT NULL (FK → Talent),
  title TEXT NOT NULL,
  notes TEXT,
  dueDate TIMESTAMP,
  status ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
  createdBy TEXT NOT NULL (user ID),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  completedAt TIMESTAMP
)
```

#### TalentSocial
```sql
CREATE TABLE "TalentSocial" (
  id TEXT PRIMARY KEY,
  talentId TEXT NOT NULL (FK → Talent),
  platform ENUM('INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'X', 'LINKEDIN', 'FACEBOOK', 'GMAIL'),
  handle TEXT NOT NULL,
  url TEXT NOT NULL,
  followers INT,
  verified BOOLEAN DEFAULT false,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  UNIQUE(talentId, platform, handle)
)
```

**Migration:** `20260107151316_add_talent_email_task_social/migration.sql`

---

### 2. Backend API Routes (Complete)

#### Email Management
```
POST   /api/admin/talent/:id/emails           - Add email to talent
GET    /api/admin/talent/:id/emails           - List all emails for talent
PATCH  /api/admin/talent/emails/:emailId      - Update email (label, isPrimary)
DELETE /api/admin/talent/emails/:emailId      - Delete email
```

**Primary Email Constraint:**
- When setting `isPrimary: true`, all other emails for that talent are automatically set to `false`
- Enforced in POST and PATCH routes
- Activity logged via `logAdminActivity()`

**Request Body (POST):**
```json
{
  "email": "manager@example.com",
  "label": "Manager", // optional
  "isPrimary": false
}
```

**Response (201):**
```json
{
  "id": "cluxxxxxxxx",
  "talentId": "xxx",
  "email": "manager@example.com",
  "label": "Manager",
  "isPrimary": false,
  "verified": false,
  "createdAt": "2026-01-07T...",
  "updatedAt": "2026-01-07T..."
}
```

---

#### Task Management
```
POST   /api/admin/talent/:id/tasks            - Create task for talent
GET    /api/admin/talent/:id/tasks            - List all tasks (ordered by dueDate)
PATCH  /api/admin/talent/tasks/:taskId        - Update task
DELETE /api/admin/talent/tasks/:taskId        - Delete task
```

**Request Body (POST):**
```json
{
  "title": "Follow up brand deal",
  "notes": "Contact after product launch",
  "dueDate": "2026-02-01T00:00:00Z",
  "status": "PENDING"  // optional, defaults to PENDING
}
```

**Response (201):**
```json
{
  "id": "cluxxxxxxxx",
  "talentId": "xxx",
  "title": "Follow up brand deal",
  "notes": "Contact after product launch",
  "dueDate": "2026-02-01T00:00:00Z",
  "status": "PENDING",
  "createdBy": "user_id",
  "createdAt": "2026-01-07T...",
  "updatedAt": "2026-01-07T...",
  "completedAt": null
}
```

**PATCH /api/admin/talent/tasks/:taskId:**
```json
{
  "status": "COMPLETED",
  "completedAt": "2026-01-07T...",
  "notes": "Completed successfully"
}
```

---

#### Social Profile Management
```
POST   /api/admin/talent/:id/socials          - Add social profile
GET    /api/admin/talent/:id/socials          - List all social profiles
DELETE /api/admin/talent/socials/:socialId    - Delete social profile
```

**Request Body (POST):**
```json
{
  "platform": "INSTAGRAM",
  "handle": "talent_handle",
  "url": "https://instagram.com/talent_handle",
  "followers": 150000  // optional
}
```

**Response (201):**
```json
{
  "id": "cluxxxxxxxx",
  "talentId": "xxx",
  "platform": "INSTAGRAM",
  "handle": "talent_handle",
  "url": "https://instagram.com/talent_handle",
  "followers": 150000,
  "verified": false,
  "createdAt": "2026-01-07T...",
  "updatedAt": "2026-01-07T..."
}
```

---

### 3. Permissions & Auth
All routes require:
- `requireAuth` middleware
- Admin/SuperAdmin role check
- Activity logging via `logAdminActivity()`

---

## ⏳ FRONTEND IMPLEMENTATION (TODO)

### What Needs to be Built

#### 1. AdminTalentPage - Add New Sections

Add tabs or expanded view for each talent:

**A. Linked Emails Section**
```jsx
function TalentEmailsSection({ talentId }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', label: '' });

  const loadEmails = async () => {
    setLoading(true);
    const data = await apiFetch(`/api/admin/talent/${talentId}/emails`);
    setEmails(data);
    setLoading(false);
  };

  const handleAddEmail = async () => {
    if (!form.email) return;
    await apiFetch(`/api/admin/talent/${talentId}/emails`, {
      method: 'POST',
      body: JSON.stringify({
        email: form.email,
        label: form.label || null,
        isPrimary: form.email === talent.primaryEmail
      })
    });
    setForm({ email: '', label: '' });
    await loadEmails(); // CRITICAL: Refetch after success
  };

  const handleSetPrimary = async (emailId) => {
    await apiFetch(`/api/admin/talent/emails/${emailId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPrimary: true })
    });
    await loadEmails();
  };

  const handleDelete = async (emailId) => {
    await apiFetch(`/api/admin/talent/emails/${emailId}`, {
      method: 'DELETE'
    });
    await loadEmails();
  };

  useEffect(() => {
    loadEmails();
  }, [talentId]);

  return (
    <div className="rounded-lg border border-brand-black/10 p-4">
      <h3 className="font-semibold mb-4">Linked Emails</h3>
      
      {/* Add Email Form */}
      <div className="flex gap-2 mb-4">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="flex-1 px-3 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="px-3 py-2 border rounded"
        />
        <button
          onClick={handleAddEmail}
          className="px-4 py-2 bg-brand-red text-white rounded"
        >
          Add
        </button>
      </div>

      {/* Email List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {emails.map(email => (
            <div key={email.id} className="flex items-center justify-between p-3 bg-brand-black/5 rounded">
              <div>
                <p className="font-mono text-sm">{email.email}</p>
                {email.label && <p className="text-xs text-brand-black/60">{email.label}</p>}
                {email.isPrimary && <span className="text-xs bg-brand-red text-white px-2 py-1 rounded">Primary</span>}
              </div>
              <div className="flex gap-2">
                {!email.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(email.id)}
                    className="text-xs text-brand-blue hover:underline"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => handleDelete(email.id)}
                  className="text-xs text-brand-red hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**B. Tasks/To-Do Section**
```jsx
function TalentTasksSection({ talentId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', notes: '', dueDate: '' });

  const loadTasks = async () => {
    setLoading(true);
    const data = await apiFetch(`/api/admin/talent/${talentId}/tasks`);
    setTasks(data);
    setLoading(false);
  };

  const handleAddTask = async () => {
    if (!form.title) return;
    await apiFetch(`/api/admin/talent/${talentId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        title: form.title,
        notes: form.notes || null,
        dueDate: form.dueDate || null,
        status: 'PENDING'
      })
    });
    setForm({ title: '', notes: '', dueDate: '' });
    await loadTasks(); // CRITICAL: Refetch
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
    await apiFetch(`/api/admin/talent/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
      })
    });
    await loadTasks();
  };

  const handleDelete = async (taskId) => {
    await apiFetch(`/api/admin/talent/tasks/${taskId}`, {
      method: 'DELETE'
    });
    await loadTasks();
  };

  useEffect(() => {
    loadTasks();
  }, [talentId]);

  return (
    <div className="rounded-lg border border-brand-black/10 p-4">
      <h3 className="font-semibold mb-4">Tasks / To-Do</h3>
      
      {/* Add Task Form */}
      <div className="space-y-2 mb-4">
        <input
          type="text"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
        <textarea
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full px-3 py-2 border rounded text-sm"
          rows="2"
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="px-3 py-2 border rounded"
        />
        <button
          onClick={handleAddTask}
          className="w-full px-4 py-2 bg-brand-red text-white rounded"
        >
          Add Task
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className={`p-3 rounded border ${task.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'border-brand-black/10'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.status === 'COMPLETED'}
                      onChange={() => handleToggleComplete(task.id, task.status)}
                    />
                    <span className={task.status === 'COMPLETED' ? 'line-through text-brand-black/50' : ''}>
                      {task.title}
                    </span>
                  </label>
                  {task.notes && <p className="text-xs text-brand-black/60 mt-1 ml-6">{task.notes}</p>}
                  {task.dueDate && (
                    <p className="text-xs text-brand-black/60 mt-1 ml-6">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-xs text-brand-red hover:underline ml-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**C. Social Profiles Section**
```jsx
function TalentSocialSection({ talentId }) {
  const [socials, setSocials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    platform: 'INSTAGRAM',
    handle: '',
    url: '',
    followers: ''
  });

  const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'X', 'LINKEDIN'];

  const loadSocials = async () => {
    setLoading(true);
    const data = await apiFetch(`/api/admin/talent/${talentId}/socials`);
    setSocials(data);
    setLoading(false);
  };

  const handleAddSocial = async () => {
    if (!form.handle || !form.url) return;
    await apiFetch(`/api/admin/talent/${talentId}/socials`, {
      method: 'POST',
      body: JSON.stringify({
        platform: form.platform,
        handle: form.handle,
        url: form.url,
        followers: form.followers ? parseInt(form.followers) : null
      })
    });
    setForm({ platform: 'INSTAGRAM', handle: '', url: '', followers: '' });
    await loadSocials(); // CRITICAL: Refetch
  };

  const handleDelete = async (socialId) => {
    await apiFetch(`/api/admin/talent/socials/${socialId}`, {
      method: 'DELETE'
    });
    await loadSocials();
  };

  useEffect(() => {
    loadSocials();
  }, [talentId]);

  return (
    <div className="rounded-lg border border-brand-black/10 p-4">
      <h3 className="font-semibold mb-4">Social Profiles</h3>
      
      {/* Add Social Form */}
      <div className="space-y-2 mb-4">
        <select
          value={form.platform}
          onChange={(e) => setForm({ ...form, platform: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        >
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="text"
          placeholder="Handle (e.g., talent_name)"
          value={form.handle}
          onChange={(e) => setForm({ ...form, handle: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="url"
          placeholder="Profile URL"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="number"
          placeholder="Followers (optional)"
          value={form.followers}
          onChange={(e) => setForm({ ...form, followers: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          onClick={handleAddSocial}
          className="w-full px-4 py-2 bg-brand-red text-white rounded"
        >
          Add Social Profile
        </button>
      </div>

      {/* Social List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {socials.map(social => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-brand-black/5 rounded hover:bg-brand-black/10"
            >
              <div>
                <p className="font-semibold text-sm">{social.platform}</p>
                <p className="text-xs text-brand-black/60">@{social.handle}</p>
                {social.followers && (
                  <p className="text-xs text-brand-black/60">{social.followers.toLocaleString()} followers</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(social.id);
                }}
                className="text-xs text-brand-red hover:underline"
              >
                Delete
              </button>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 2. Deal Creation Flow - Cleanup Required

**Current Status:** ✅ Works but has UI Theatre

**Issues:**
1. Frontend creates fake deal object with client-side ID
2. Sends many UI-specific fields that backend ignores
3. Includes derived data like `activity` array

**Fix Required:**
Simplify AdminDealsPage deal creation to only send required fields:

```jsx
// BEFORE (lines ~490-515 in AdminDealsPage.jsx)
const deal = {
  id: `deal-${Date.now()}`,
  dealName: createForm.dealName.trim(),
  brandId: createForm.brandId,
  userId: session.id,
  talentId: talentId,
  dealType: createForm.dealType,           // ❌ Backend doesn't use
  status: createForm.status,
  estimatedValueBand: createForm.estimatedValueBand,  // ❌ Backend doesn't use
  confidence: createForm.confidence,        // ❌ Backend doesn't use
  expectedCloseDate: createForm.expectedCloseDate,
  deliveryDate: createForm.deliveryDate,   // ❌ Backend doesn't use
  internalSummary: createForm.internalSummary,  // ❌ Backend doesn't use
  notes: createForm.notes || "",
  campaignId: createForm.campaignId,       // ❌ Backend doesn't use
  eventIds: [],                             // ❌ Backend doesn't use
  talentIds: createForm.talentIds,          // ❌ Backend doesn't use
  owner: createForm.owner,                  // ❌ Backend doesn't use
  createdAt,                                // ❌ Backend sets this
  updatedAt: createdAt,                     // ❌ Backend sets this
  lastActivityAt: createdAt,                // ❌ Backend doesn't have this
  linkedTaskIds: [],                        // ❌ Backend doesn't use
  linkedOutreachIds: [],                    // ❌ Backend doesn't use
  activity: [{ at: createdAt, label: "Deal created" }]  // ❌ Backend doesn't use
};

// AFTER (Clean payload)
const dealPayload = {
  dealName: createForm.dealName.trim(),
  brandId: createForm.brandId,
  userId: session.id,
  talentId: talentId,
  status: createForm.status,
  estimatedValue: createForm.estimatedValueBand ? parseValue(createForm.estimatedValueBand) : null,
  expectedCloseDate: createForm.expectedCloseDate || null,
  notes: createForm.notes || null
};
```

**Backend Expected Fields** (from crmDeals.ts POST):
- `dealName` ✅
- `brandId` ✅
- `userId` ✅
- `talentId` ✅
- `status` ✅
- `estimatedValue` ✅
- `expectedCloseDate` ✅
- `notes` ✅

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend (Ready to Deploy)
- [x] Schema updated with 3 new models
- [x] Migration SQL file created
- [x] All CRUD routes implemented
- [x] Auth guards in place
- [x] Activity logging configured
- [x] Error handling implemented
- [x] Pushed to GitHub

### Frontend (Next Steps)
- [ ] Add TalentEmailsSection component to talent detail page
- [ ] Add TalentTasksSection component to talent detail page
- [ ] Add TalentSocialSection component to talent detail page
- [ ] Clean up AdminDealsPage deal creation payload
- [ ] Test each flow end-to-end
- [ ] Verify database persistence
- [ ] Test with browser DevTools network tab

---

## 📝 API TESTING (cURL Examples)

### Add Email
```bash
curl -X POST http://localhost:3000/api/admin/talent/{talentId}/emails \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "label": "Manager",
    "isPrimary": true
  }'
```

### Get Emails
```bash
curl http://localhost:3000/api/admin/talent/{talentId}/emails
```

### Add Task
```bash
curl -X POST http://localhost:3000/api/admin/talent/{talentId}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Follow up deal",
    "notes": "After launch",
    "dueDate": "2026-02-01T00:00:00Z",
    "status": "PENDING"
  }'
```

### Add Social
```bash
curl -X POST http://localhost:3000/api/admin/talent/{talentId}/socials \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "INSTAGRAM",
    "handle": "talent_name",
    "url": "https://instagram.com/talent_name",
    "followers": 150000
  }'
```

---

## ✅ VERIFICATION STEPS

After deploying, verify:

1. **Database Migration Ran**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('TalentEmail', 'TalentTask', 'TalentSocial');
   ```

2. **API Endpoints Respond**
   - GET `/api/admin/talent/{id}/emails` → 200 with `[]`
   - GET `/api/admin/talent/{id}/tasks` → 200 with `[]`
   - GET `/api/admin/talent/{id}/socials` → 200 with `[]`

3. **Primary Email Constraint Works**
   - Create 2 emails with `isPrimary: true` for same talent
   - Verify only the last one has `isPrimary: true`

4. **Activity Logging Works**
   - Create email/task/social
   - Check admin activity log

---

## 🎯 SUMMARY

**What's Complete:**
- ✅ 3 new database models with proper relations
- ✅ 12 new API endpoints (3 per feature)
- ✅ Primary email constraint enforcement
- ✅ Activity logging integration
- ✅ Error handling and validation
- ✅ Auth guards on all routes

**What's Next:**
- [ ] Build 3 React components for frontend
- [ ] Integrate into talent detail page
- [ ] Clean up deal creation in AdminDealsPage
- [ ] End-to-end testing

**Commit History:**
- `8bb835f` - B Logo Mark asset added
- `3499af7` - TalentEmail, TalentTask, TalentSocial models + APIs  
- `23f42b6` - Work-in-progress commit
