# ADMIN DASHBOARD GUIDE

**Last Updated:** December 26, 2025  
**For:** Platform Administrators

---

## OVERVIEW

The Admin Dashboard is your command center for managing the Break Agency platform. Use it to approve new users, monitor platform health, and access key management tools.

**Access:** Navigate to `/admin` (requires admin role)

---

## DASHBOARD SECTIONS

### 1. USER MANAGEMENT

**Purpose:** Approve or reject new user registrations

**Workflow:**
1. New users appear in "Pending Approvals" section
2. Review user details (email, role requested)
3. Click "Approve" to grant access
4. Click "Reject" to deny (optional: add reason)

**User Roles:**
- **Admin** - Full platform access, can approve users
- **Brand** - Brand dashboard, CRM, campaigns
- **Creator** - Creator dashboard, analytics, contracts
- **Exclusive** - Exclusive talent features, enhanced analytics

**Best Practices:**
- Verify email domain matches known clients/partners
- Check role matches user's actual need
- Approve within 24 hours for good UX

---

### 2. PLATFORM HEALTH

**Purpose:** Monitor system status at a glance

**Indicators:**
- 🟢 **Green** - All systems operational
- 🟡 **Yellow** - Non-critical warnings (high memory, stale cron)
- 🔴 **Red** - Critical issues (database down, cron failed)

**Quick Actions:**
- Click "View Details" to see full health check
- Check cron status if background jobs fail
- Review error logs if alerts firing

**When to Act:**
- Red indicators = investigate immediately
- Yellow indicators = review within 1 hour
- Check daily even when green

---

### 3. SYSTEM STATS (BETA)

**Purpose:** Overview of platform usage

**Metrics Shown:**
- Total users by role
- Active campaigns
- Recent activity count

**Note:** This section is in beta. More analytics coming in future releases.

---

### 4. QUICK ACTIONS

**Common Admin Tasks:**

**User Management:**
- "Pending Users" → Review approvals
- "All Users" → Search/filter users
- "Add User" → Manual user creation (optional)

**System Monitoring:**
- "Health Check" → View system status
- "Error Logs" → Review recent errors
- "Cron Status" → Check background jobs

**Data Management:**
- "Export Data" → Download platform data
- "Import Users" → Bulk user upload
- "System Settings" → Configure platform

---

## COMMON WORKFLOWS

### Approve New User

1. Navigate to Admin Dashboard (`/admin`)
2. Locate "Pending Approvals" section
3. Review user email and requested role
4. Click "Approve" to grant access
5. User receives email notification
6. User can now log in with approved role

**Timeline:** Instant (user can log in immediately)

---

### Handle User Role Change Request

1. User submits role change via support/email
2. Admin verifies legitimacy
3. Navigate to "All Users" → Find user
4. Click "Edit" → Change role
5. Click "Save" → Role updated immediately
6. User sees new permissions on next login

**Note:** Role changes don't require re-approval

---

### Investigate System Issues

1. Check Platform Health section for red/yellow indicators
2. Click "View Details" to see failing component
3. Common issues:
   - **Database unhealthy** → Check DATABASE_URL
   - **Cron warning** → Review cron status
   - **Memory warning** → Check for memory leaks
4. Review error logs for recent failures
5. Contact developer if issue persists

---

### Monitor Background Jobs

1. Navigate to "Cron Status" (or `/api/cron/status`)
2. Review job list:
   - **gmail-sync** - Should run every 5 minutes
   - **webhook-renewal** - Should run daily
3. Check "Last Run" timestamp (should be recent)
4. Review "Last Status" (should be "success")
5. If failed, check "Last Error" message
6. Common issues:
   - **Gmail sync failed** → Check Gmail OAuth tokens
   - **Webhook renewal failed** → Check Google API credentials

---

## FEATURE FLAGS

Some features are hidden behind flags. To enable/disable:

**Beta Features (Currently Hidden):**
- Exclusive Talent Dashboard (show with `FEATURE_EXCLUSIVE_ANALYTICS=true`)
- Campaign Auto Builder (show with `FEATURE_CAMPAIGN_AUTO=true`)
- Advanced Outreach (show with `FEATURE_OUTREACH_SEQUENCES=true`)

**How to Enable:**
1. Set environment variable to `true`
2. Restart server
3. Feature appears in relevant dashboards

**Note:** Beta features may have incomplete functionality

---

## TROUBLESHOOTING

### Users Can't Log In

**Check:**
1. User status = "approved" (not "pending" or "rejected")
2. User role assigned correctly
3. Google OAuth configured (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
4. Frontend origin in `FRONTEND_ORIGIN` env var

**Fix:**
- Re-approve user if status wrong
- Update role if incorrect
- Check environment variables
- Review OAuth settings

---

### Gmail Sync Not Working

**Check:**
1. Cron status shows "gmail-sync" running
2. Last status = "success" (not "error")
3. Gmail OAuth tokens valid
4. Gmail webhook registered

**Fix:**
- Review cron error logs
- Re-authenticate Gmail OAuth
- Renew Gmail webhooks
- Check `GMAIL_REDIRECT_URI` env var

---

### Platform Health Shows Red

**Immediate Actions:**
1. Note which component is failing
2. Check detailed health endpoint (`/health/detailed`)
3. Review recent error logs
4. Contact developer if critical

**Common Causes:**
- Database connection lost
- Memory limit exceeded
- Cron jobs failing repeatedly
- Missing environment variables

---

## BEST PRACTICES

### Daily Operations
- ✅ Check pending user approvals (morning)
- ✅ Review platform health indicators
- ✅ Scan error logs for critical issues
- ✅ Verify cron jobs running (via status page)

### Weekly Reviews
- ✅ Review user growth and role distribution
- ✅ Check memory usage trends
- ✅ Audit recent user approvals
- ✅ Review error rate trends

### Monthly Tasks
- ✅ Clean up rejected/inactive users
- ✅ Review feature flag usage
- ✅ Update admin documentation if workflows change
- ✅ Plan beta feature rollouts

---

## KEYBOARD SHORTCUTS

**Navigation:**
- `Ctrl + K` → Command palette (quick search)
- `Shift + ?` → Show keyboard shortcuts
- `G + A` → Go to Admin Dashboard
- `G + U` → Go to Users page

**Actions:**
- `A` → Approve selected user
- `R` → Reject selected user
- `E` → Edit selected user
- `Esc` → Close modal/cancel action

---

## GETTING HELP

**Resources:**
- `/docs` → Full documentation
- `/health/detailed` → System health details
- `/api/cron/status` → Cron job status

**Support:**
- Technical issues → Contact developer
- User questions → Check user guides
- Feature requests → Submit via feedback form

---

**Admin Dashboard Guide** — Version 1.0  
**Status:** Production Ready
