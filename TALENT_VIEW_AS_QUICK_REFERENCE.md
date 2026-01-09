# Talent View As Feature - Quick Reference

## What Is It?

The "View As Talent" feature allows SUPERADMIN users to view the application exactly as a specific talent would see it - without logging in as them. This is useful for:
- Testing talent-facing features
- Debugging issues from talent perspective  
- Supporting talent by seeing their exact experience
- Quality assurance of talent features

## Key Components

### 1. ViewAsTalentButton
- **Location:** Talent profile pages (AdminTalentDetailPage)
- **Shows:** "View as Talent" button
- **Visible to:** SUPERADMIN only
- **Triggers:** Impersonation start

### 2. ImpersonationBanner
- **Location:** Top of every page
- **Shows:** Talent name, session duration, "Exit View As" button
- **Color:** Yellow/amber (distinctive)
- **Always visible:** When impersonating

### 3. ImpersonationContext
- **Manages:** Impersonation state
- **Stores:** Talent ID, name, start time
- **Persists:** In localStorage
- **Access:** Via `useImpersonation()` hook

## API Endpoints

### Start Impersonation
```
POST /api/admin/impersonate/start
{
  "talentUserId": "user-id-123"
}
```

### Stop Impersonation
```
POST /api/admin/impersonate/stop
{
  "originalAdminId": "admin-id-456",
  "actingAsUserId": "user-id-123"
}
```

### Check Status
```
GET /api/admin/impersonate/status
```

## Security Features

✅ **Only SUPERADMIN** can use this feature  
✅ **Cannot impersonate** other admins, superadmins, or founders  
✅ **IP address** is tracked and logged  
✅ **Audit trail** records all impersonations  
✅ **Session-based** - not account-based  
✅ **Logout** automatically ends impersonation  

## User Workflow

### Start Viewing as Talent
1. Go to talent profile page
2. Click "View as Talent" button
3. Confirm in dialog
4. Banner appears - you're now viewing as them

### Stop Viewing as Talent
1. Click "Exit View As" in the banner
2. Or click button again on talent profile
3. View returns to admin mode

## Files Changed

| File | Purpose |
|------|---------|
| `ImpersonationContext.jsx` | State management |
| `ViewAsTalentButton.jsx` | UI button component |
| `ImpersonationBanner.jsx` | Top banner display |
| `impersonate.ts` | Backend API routes |
| `auditLogger.ts` | Audit logging service |
| `App.jsx` | Banner integration |
| `AdminTalentDetailPage.jsx` | Button integration |
| `server.ts` | Route registration |

## Audit Trail

All impersonations are logged with:
- Admin user ID (who did it)
- Talent user ID (who was viewed as)
- IP address
- Timestamp
- Session duration
- Talent metadata

**Query audit logs:**
```sql
SELECT * FROM "AuditLog"
WHERE "eventType" LIKE 'IMPERSONATION%'
ORDER BY "createdAt" DESC;
```

## Testing Quick Checks

- [ ] Only SUPERADMIN see the button
- [ ] Banner appears when impersonating
- [ ] Banner has duration counter
- [ ] "Exit View As" button works
- [ ] Impersonation survives page refresh
- [ ] Can't impersonate other admins
- [ ] Logout ends impersonation
- [ ] Audit log records events

## Common Issues & Solutions

### Button not showing
**Cause:** User is not SUPERADMIN  
**Solution:** Check user role in database

### Impersonation doesn't start
**Cause:** API error or network issue  
**Solution:** Check browser console for error message

### Banner stuck after refresh
**Cause:** localStorage has old state  
**Solution:** Clear localStorage and refresh

### Can't see talent-specific features
**Cause:** Role-based filtering not working  
**Solution:** Check that context is properly passed to components

## Deployment Checklist

- [x] Frontend components created
- [x] Backend routes created
- [x] Audit logging implemented
- [x] Security checks in place
- [x] Context providers integrated
- [x] Button added to profile page
- [x] Banner added to main app layout
- [x] Routes registered in server
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor audit logs for usage

## Monitoring

**After deployment, watch for:**
- Admin usage patterns
- Session durations
- Failed attempts
- Unusual access patterns
- Performance impact

**Key metrics:**
- Impersonations per day
- Average session duration
- Most viewed talents
- Admin activity patterns

## Need Help?

1. **Feature not working?** Check browser console and server logs
2. **Security concerns?** Review audit logs in database
3. **Bug reports?** Include error message and user ID
4. **Feature requests?** See TALENT_VIEW_AS_IMPLEMENTATION.md for future enhancements

---

**Status:** ✅ Implementation Complete  
**Version:** 1.0  
**Last Updated:** January 2025
