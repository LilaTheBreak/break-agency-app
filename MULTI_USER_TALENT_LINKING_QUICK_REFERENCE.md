# Multi-User Talent Linking - Quick Reference

## Feature at a Glance

**Link multiple user accounts to a talent with different roles and relationship types.**

```
One Talent Profile
    ├── Manager 1 (EXCLUSIVE, MANAGE) - Full control
    ├── Manager 2 (EXCLUSIVE, VIEW) - Read-only oversight
    └── Agency Contact (MANAGEMENT, MANAGE) - Payments & contracts
```

---

## Representation Types

```
┌─────────────────────────────────────────────────────────┐
│                REPRESENTATION TYPES                      │
├─────────────────────────────────────────────────────────┤
│ 🔴 EXCLUSIVE         Full-service rep, exclusive deal  │
│ 🟠 NON_EXCLUSIVE     Project-based, can work elsewhere │
│ 🟡 MANAGEMENT        Handles business/legal side       │
│ 🟢 UGC               User-generated content creator    │
│ ⚪ OTHER             Custom relationship types          │
└─────────────────────────────────────────────────────────┘
```

## Access Roles

```
┌─────────────────────────────────────────────────────────┐
│                   ACCESS ROLES                           │
├─────────────────────────────────────────────────────────┤
│ 👁️  VIEW             Read-only access                  │
│ ✏️  MANAGE            Full management permissions       │
└─────────────────────────────────────────────────────────┘
```

---

## UI Flow

### Add Account

```
1. Click "Link Account" button
                  ↓
2. Modal opens with:
   - User selector (searchable)
   - Representation type dropdown
   - Access role dropdown
   - Optional notes field
                  ↓
3. Click "Link"
                  ↓
4. Account appears in list
```

### Edit Account

```
1. Click edit (✏️) icon on account
                  ↓
2. Modal opens with current values
                  ↓
3. Modify representation type, role, or status
                  ↓
4. Click "Update"
                  ↓
5. Changes reflected immediately
```

### Delete Account

```
1. Click delete (🗑️) icon
                  ↓
2. Confirm dialog appears
                  ↓
3. Click "Delete"
                  ↓
4. Account removed from list
                  ↓
5. Change logged to audit trail
```

---

## API Quick Reference

### List All Linked Accounts
```bash
GET /api/admin/talent/TALENT_ID/linked-users

Response: Array of linked account objects
```

### Add New Account
```bash
POST /api/admin/talent/TALENT_ID/linked-users

Body: {
  "userId": "user_id",
  "role": "VIEW|MANAGE",
  "representationType": "EXCLUSIVE|NON_EXCLUSIVE|MANAGEMENT|UGC|OTHER",
  "notes": "optional notes"
}
```

### Update Account
```bash
PATCH /api/admin/talent/TALENT_ID/linked-users/ACCESS_ID

Body: {
  "role": "VIEW|MANAGE",              // optional
  "representationType": "...",        // optional
  "status": "ACTIVE|INACTIVE",        // optional
  "notes": "updated notes"            // optional
}
```

### Remove Account
```bash
DELETE /api/admin/talent/TALENT_ID/linked-users/ACCESS_ID

Response: { "message": "Linked account removed successfully" }
```

---

## Common Workflows

### Workflow 1: Sign Exclusive Talent

```step
1. Create talent in system
2. Link primary manager account
   → representationType: EXCLUSIVE
   → role: MANAGE
3. Link secondary contact
   → representationType: EXCLUSIVE
   → role: VIEW
✅ Talent ready with management team
```

### Workflow 2: Setup UGC Creator

```step
1. Create talent (creator)
2. Link creator's own account
   → representationType: UGC
   → role: MANAGE
3. Link management company
   → representationType: MANAGEMENT
   → role: MANAGE
✅ Creator + agency structure established
```

### Workflow 3: Multi-Agency Representation

```step
1. Create talent
2. Link Fashion Agency
   → representationType: EXCLUSIVE
   → role: MANAGE
   → notes: "Fashion/runway"
3. Link Digital Agency
   → representationType: NON_EXCLUSIVE
   → role: MANAGE
   → notes: "Social/digital content"
✅ Multiple agencies configured
```

### Workflow 4: Deactivate Account

```step
1. Find account in list
2. Click edit
3. Change status: ACTIVE → INACTIVE
4. Click "Update"
✅ Account hidden but not deleted
```

---

## Data Structure

```javascript
// Linked Account Object
{
  id: "acc_xyz123",
  userId: "user_abc456",
  talentId: "talent_def789",
  role: "MANAGE",                    // VIEW | MANAGE
  representationType: "EXCLUSIVE",   // 5 types
  status: "ACTIVE",                  // ACTIVE | INACTIVE
  notes: "Primary exclusive rep",
  createdAt: "2026-01-24T10:00:00Z",
  updatedAt: "2026-01-24T10:00:00Z",
  
  // Related user object (included in responses)
  user: {
    id: "user_abc456",
    email: "manager@agency.com",
    name: "Jane Manager",
    avatarUrl: "...",
    role: "ADMIN"
  }
}
```

---

## Feature Comparison

### Before
```
Single User Link
├─ Only 1 user per talent
├─ No role distinction
├─ No relationship type
└─ Limited functionality
```

### After
```
Multiple Account Links
├─ Unlimited accounts per talent
├─ Role-based access (VIEW/MANAGE)
├─ 5 relationship types
├─ Account status management
├─ Detailed audit logs
├─ Searchable user selection
└─ Rich notes field
```

---

## Icons & Visual Indicators

| Icon | Meaning |
|------|---------|
| 🔴 | EXCLUSIVE representation |
| 🟠 | NON_EXCLUSIVE representation |
| 🟡 | MANAGEMENT representation |
| 🟢 | UGC representation |
| 👁️ | VIEW access role |
| ✏️ | Edit button |
| 🗑️ | Delete button |
| 📅 | Date stamp |
| ⚠️ | Inactive status |

---

## Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| "User not found" | User ID doesn't exist | Select valid user |
| "User already linked" | Same user linked twice | Select different user |
| "Invalid role" | Role not VIEW/MANAGE | Choose valid role |
| "Invalid type" | Unknown representation type | Choose from 5 types |
| "Account not found" | Access ID invalid | Refresh page |

---

## Tips & Tricks

✅ **Search for users** - Type in user search to find quickly  
✅ **Bulk operations** - Edit one, then add another  
✅ **Use notes** - Document why each person is linked  
✅ **Manage status** - Deactivate instead of delete  
✅ **Check audit logs** - All changes tracked automatically  
✅ **Multiple managers** - Add backup contacts  

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus search (when modal open) |
| `Escape` | Close modal |
| `Enter` | Submit form |
| `Tab` | Navigate form fields |

---

## Performance Notes

- **Indexes:** representationType and status indexed for fast filtering
- **Limit:** 100+ accounts supported per talent
- **Response Time:** < 100ms for typical queries
- **Caching:** Accounts cached in frontend state

---

## Security Reminders

🔒 All endpoints require admin authentication  
🔒 Unique constraint prevents duplicate links  
🔒 All changes logged to audit trail  
🔒 Soft-delete via status field  
🔒 User permissions validated on server  

---

## Troubleshooting

**Problem:** Account not appearing after adding
- *Solution:* Refresh page or wait for API response

**Problem:** Can't edit representation type
- *Solution:* Click edit icon, select dropdown, change value

**Problem:** Need to unlink account
- *Solution:* Click delete icon, confirm removal

**Problem:** Want to reactivate old account
- *Solution:* Edit account, change status to ACTIVE

---

## Related Features

- 👤 **TalentAccessSettings** - Different permission system
- 📊 **Audit Logs** - Track all changes
- 🔐 **Role-Based Access** - Admin permissions
- 📧 **User Management** - Create/manage users

---

## Version Info

| Component | Version |
|-----------|---------|
| Feature | 1.0 |
| Commit | fd98af6 |
| Released | 2026-01-24 |
| Status | Production Ready |

---

## Support

For help:
1. Check MULTI_USER_TALENT_LINKING_GUIDE.md for detailed docs
2. Review audit logs for what changed
3. Ensure user exists in system
4. Verify admin permissions
5. Check database constraints

---

*Last Updated: 2026-01-24*
