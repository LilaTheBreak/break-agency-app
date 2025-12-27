# USER APPROVAL WORKFLOW GUIDE

**Last Updated:** December 26, 2025  
**For:** Platform Administrators

---

## OVERVIEW

New users must be approved by an admin before accessing the platform. This guide explains the approval process and best practices.

---

## THE APPROVAL PROCESS

### Step 1: User Registration

**What Happens:**
1. User visits Break Agency platform
2. Clicks "Sign in with Google"
3. Completes Google OAuth authentication
4. Selects desired role (Brand, Creator, Exclusive)
5. Submits registration

**User Status:** `pending` (cannot access platform yet)

---

### Step 2: Admin Review

**Where to Review:**
- Admin Dashboard → "Pending Approvals" section
- Or navigate to `/admin/users?status=pending`

**Information Shown:**
- User email address
- Requested role
- Registration date
- Google profile (if available)

**What to Check:**
1. **Email Domain** - Does it match known clients/partners?
2. **Role Request** - Is the role appropriate for this user?
3. **Duplicate Accounts** - Is this user already registered?

---

### Step 3: Approval Decision

**Option A: Approve ✅**

**When to Approve:**
- Email domain matches known client/partner
- Role request matches user's actual need
- No red flags or suspicious activity

**How to Approve:**
1. Click "Approve" button next to user
2. Confirm approval in modal
3. User status changes to `approved`
4. User receives email notification (if configured)
5. User can now log in immediately

**Result:** User gains access to platform with approved role

---

**Option B: Reject ❌**

**When to Reject:**
- Unknown email domain
- Suspicious registration pattern
- Role request doesn't match known user
- Duplicate account for same person

**How to Reject:**
1. Click "Reject" button next to user
2. Optionally add rejection reason
3. Confirm rejection
4. User status changes to `rejected`
5. User cannot log in

**Result:** User sees "Access Denied" message on login

---

**Option C: Request More Info 📧**

**When to Use:**
- Need clarification on role request
- Email domain unclear
- Want to verify user identity

**How to Request Info:**
1. Click "Contact" button (if available)
2. Or manually email user
3. Ask for:
   - Company/organization name
   - Why they need platform access
   - Which role they need and why
4. Once clarified, approve or reject

---

## USER ROLES EXPLAINED

### Brand Role

**Access:**
- Brand Dashboard
- CRM (contacts, deals, campaigns)
- Campaign Builder
- Outreach System
- Contracts & Deliverables

**Typical Users:**
- Brand managers
- Marketing teams
- Agency account managers
- Campaign coordinators

**When to Assign:**
- User works for a brand/company
- User manages influencer campaigns
- User needs CRM access

---

### Creator Role

**Access:**
- Creator Dashboard
- Portfolio management
- Contract inbox
- Performance analytics
- Payment history

**Typical Users:**
- Influencers
- Content creators
- Talent representatives
- Agency talent coordinators

**When to Assign:**
- User is a content creator
- User represents talent
- User needs creator-side tools

---

### Exclusive Role

**Access:**
- Everything in Creator Role
- Exclusive Talent Analytics
- Enhanced performance tracking
- Priority features (beta)

**Typical Users:**
- Top-tier creators
- Premium talent
- VIP agency clients

**When to Assign:**
- User is premium talent
- User has exclusive deal with agency
- User needs advanced analytics

**Note:** This is a premium tier, approve sparingly

---

### Admin Role

**Access:**
- Everything
- User management
- System monitoring
- Platform configuration

**Typical Users:**
- Platform administrators
- Agency leadership
- Technical support staff

**When to Assign:**
- User is trusted admin
- User needs to approve others
- User manages platform operations

**⚠️ Warning:** Only assign to trusted individuals

---

## APPROVAL TIMELINES

**Response Time Expectations:**

**Ideal:** Within 24 hours
- Users expect quick approval
- Delays hurt first impression
- Check pending users daily

**Maximum:** Within 48 hours
- Longer delays = frustrated users
- May abandon platform
- Set up email alerts for new registrations

**Immediate (Same Day):**
- Known clients/partners
- Urgent campaign launches
- Executive requests

---

## BEST PRACTICES

### ✅ DO

1. **Check Pending Users Daily**
   - Set reminder for 9 AM check
   - Process approvals within 24 hours
   - Clear backlog before weekends

2. **Verify Email Domains**
   - Known domains = instant approve
   - Unknown domains = verify first
   - Free emails (gmail.com) = investigate

3. **Match Roles to Needs**
   - Brand manager → Brand role
   - Influencer → Creator role
   - Premium talent → Exclusive role
   - Internal staff → Admin role

4. **Document Approval Decisions**
   - Add notes for unusual approvals
   - Log rejections with reasons
   - Track patterns in requests

5. **Communicate Delays**
   - If approval takes >24 hours, notify user
   - Explain what info you need
   - Set expectation for timeline

---

### ❌ DON'T

1. **Don't Auto-Approve Everything**
   - Security risk
   - Role mismatch issues
   - Data access concerns

2. **Don't Ignore Pending Users**
   - Bad user experience
   - Users may leave platform
   - Reflects poorly on agency

3. **Don't Assign Wrong Roles**
   - Brand users need Brand role (not Creator)
   - Creators need Creator role (not Brand)
   - Don't give Admin role lightly

4. **Don't Reject Without Reason**
   - Always log rejection reason
   - Help identify approval criteria
   - Useful for audit trails

5. **Don't Approve Duplicate Accounts**
   - Check if user already exists
   - One account per email
   - Merge duplicates if needed

---

## COMMON SCENARIOS

### Scenario 1: Brand Manager Registration

**User:** sarah@nike.com  
**Role Requested:** Brand  
**Action:** ✅ Approve immediately  
**Reason:** Known brand domain, role matches need

---

### Scenario 2: Unknown Email

**User:** john.doe@gmail.com  
**Role Requested:** Brand  
**Action:** 📧 Request more info  
**Reason:** Free email domain, need to verify company

**Follow-up Questions:**
- What company do you work for?
- What campaigns will you manage?
- Why do you need Brand access?

---

### Scenario 3: Influencer Registration

**User:** @fashionista.jane@gmail.com  
**Role Requested:** Creator  
**Action:** ✅ Approve (if recognized) or 📧 Request info  
**Reason:** Creator role appropriate for influencer

**Verification:**
- Check social media profiles
- Verify follower count
- Confirm they work with agency

---

### Scenario 4: Suspicious Registration

**User:** admin@test.com  
**Role Requested:** Admin  
**Action:** ❌ Reject  
**Reason:** Test email, suspicious admin request

---

### Scenario 5: Role Change Request

**User:** Existing Brand user wants Creator role  
**Action:** Update role (don't require re-approval)  
**How:**
1. Navigate to "All Users"
2. Find user
3. Click "Edit"
4. Change role to "Creator"
5. Save

**Note:** Role changes don't need approval workflow

---

## BULK APPROVALS

**When to Use:**
- Multiple users from same company
- Known partner organization onboarding
- Campaign launch with multiple team members

**How to Bulk Approve:**
1. Select multiple pending users (checkboxes)
2. Click "Bulk Approve" button
3. Confirm approval
4. All selected users approved at once

**⚠️ Warning:** Only use for verified users from known organizations

---

## REJECTION HANDLING

### Communicating Rejections

**Option 1: Automated Email (if configured)**
- User receives rejection email automatically
- Includes generic reason
- Provides support contact

**Option 2: Manual Email**
- More personal touch
- Explain specific reason
- Offer alternative (e.g., different role)

**Email Template:**
```
Subject: Break Agency Platform Access

Hi [Name],

Thank you for your interest in the Break Agency platform. 

Unfortunately, we're unable to approve your access request at this time because:
[Specific reason - unknown domain, role mismatch, etc.]

If you believe this is an error, please reply with:
- Your company/organization name
- Why you need platform access
- Which features you'll use

We're happy to reconsider once we have more information.

Best regards,
Break Agency Admin Team
```

---

### Re-Approval After Rejection

**Process:**
1. User provides additional information
2. Admin verifies information
3. Navigate to "Rejected Users"
4. Find user
5. Click "Reconsider" or "Approve"
6. User status changes to `approved`

---

## MONITORING & AUDITING

### Track Approval Metrics

**Weekly Review:**
- Total pending users
- Average approval time
- Approval vs rejection rate
- Role distribution

**Look For:**
- Backlog building up (approve faster)
- High rejection rate (criteria too strict?)
- Role imbalance (mostly one type)

---

### Audit Trail

**What's Logged:**
- Who approved/rejected each user
- When approval/rejection happened
- Role assigned
- Any notes added

**Access Audit Log:**
- Navigate to `/admin/audit-log`
- Filter by "User Approvals"
- Review recent decisions

---

## TROUBLESHOOTING

### User Says They're Approved But Can't Log In

**Check:**
1. User status = `approved` (not `pending`)
2. Role assigned correctly
3. No system errors in logs

**Fix:**
- Verify approval saved
- Check user's email in database
- Have user try logging out and back in

---

### Pending Users Not Showing

**Check:**
1. Filter settings (show only `pending` status)
2. Pagination (users on other pages)
3. Database connection

**Fix:**
- Clear filters
- Check all pages
- Refresh page

---

### Approval Button Doesn't Work

**Check:**
1. Admin permissions (are you actually an admin?)
2. Network errors (check console)
3. User already approved (refresh page)

**Fix:**
- Verify admin role in your profile
- Check browser console for errors
- Try different browser

---

## GETTING HELP

**For Approval Issues:**
- Check pending users list daily
- Review user email/role before deciding
- Contact developer if technical issues

**For Role Questions:**
- See role descriptions above
- Ask user what they need to do
- Assign most restrictive role needed

**For System Problems:**
- Check platform health dashboard
- Review error logs
- Contact technical support

---

**User Approval Workflow Guide** — Version 1.0  
**Status:** Production Ready
