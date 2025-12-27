# GMAIL SETUP & INBOX USAGE GUIDE

**Last Updated:** December 26, 2025  
**For:** Brand Users & Admins

---

## OVERVIEW

The Break Agency platform integrates with Gmail to help you manage brand outreach, track email conversations, and never miss important opportunities.

**Key Features:**
- Gmail inbox sync (automatic)
- Priority email detection
- Email tracking (opens, clicks)
- Awaiting reply notifications
- Email → Deal conversion

---

## INITIAL SETUP

### Step 1: Connect Your Gmail Account

1. Navigate to Brand Dashboard
2. Look for "Gmail Inbox" section
3. Click "Connect Gmail" button
4. Authorize Break Agency to access your Gmail:
   - ✅ Read emails
   - ✅ Send emails (coming soon)
   - ✅ Modify labels (for categorization)

**Security Note:** We only access emails, never passwords. You can revoke access anytime in your Google Account settings.

---

### Step 2: Initial Sync

**What Happens:**
1. Platform starts syncing your inbox
2. Progress bar shows sync status
3. Recent emails (last 30 days) synced first
4. Full sync may take 5-10 minutes

**During Sync:**
- You can continue using the platform
- Don't disconnect Gmail during sync
- Progress updates automatically

**After Sync:**
- Inbox shows your recent emails
- Priority emails highlighted
- Awaiting reply emails tracked

---

### Step 3: Configure Sync Settings (Optional)

**Navigate to:** Settings → Gmail Integration

**Options:**
- **Sync Frequency:** Every 5 minutes (default)
- **Sync History:** Last 30 days (default)
- **Auto-Categorize:** Enabled (recommended)
- **Track Opens:** Enabled (if premium)

**Recommendations:**
- Keep sync frequency at 5 minutes
- Extend history to 90 days for deep analysis
- Enable auto-categorize for better organization

---

## USING THE UNIFIED INBOX

### Dashboard Sections

**1. Priority Emails**
- Emails from important contacts (brands, partners)
- Flagged by AI as high-value
- Require your attention soon

**2. Awaiting Reply**
- Emails you sent but haven't received response
- Shows days since sent
- Auto-reminders for follow-ups

**3. Recently Opened**
- Emails recipients opened (if tracking enabled)
- Shows open count and timestamps
- Indicates interest level

**4. All Emails**
- Full inbox view
- Search and filter options
- Categorized by type (brand, creator, etc.)

---

## EMAIL CATEGORIES

**Automatically Detected:**

**Brand Inquiry**
- Emails from potential brand partners
- Keywords: "collaboration", "partnership", "campaign"
- Marked as high priority

**Creator Outreach**
- Your outreach to influencers
- Tracked for replies
- Auto-added to awaiting reply

**General**
- Regular emails
- Not immediately actionable
- Lower priority

**Spam/Noise**
- Newsletters, promotions
- Auto-filtered (not shown by default)
- Review in "All Emails" if needed

---

## PRIORITY EMAIL DETECTION

**How It Works:**
- AI analyzes email content
- Checks sender reputation
- Looks for opportunity keywords
- Assigns priority score (1-10)

**Priority Levels:**
- 🔴 **High (8-10):** Urgent, potential deals
- 🟡 **Medium (5-7):** Important, review today
- 🟢 **Low (1-4):** Can wait, review when time allows

**Managing Priority:**
- Click email to view full content
- Mark as "Not Priority" if incorrect
- System learns from your feedback

---

## TRACKING EMAIL OPENS

**How to Enable:**
1. Navigate to Settings → Email Tracking
2. Toggle "Track Opens" to ON
3. Tracking pixels added to outgoing emails

**What You See:**
- 📧 Email sent
- 👁️ Email opened (timestamp)
- 🔄 Multiple opens (engagement indicator)
- 📍 Open location (approximate)

**Best Practices:**
- Use tracking for outreach campaigns
- Follow up after opens
- Don't spam users who don't open

**Privacy Note:** Recipients can block tracking pixels. Not all opens will be tracked.

---

## AWAITING REPLY WORKFLOW

### How It Works

1. **You send email** → Auto-added to awaiting reply
2. **Recipient replies** → Removed from awaiting reply
3. **No reply after X days** → Reminder notification

**Default Reminders:**
- 3 days: First reminder
- 7 days: Second reminder
- 14 days: Final reminder

---

### Taking Action

**For Each Awaiting Reply Email:**

**Option 1: Send Follow-Up**
- Click "Follow Up" button
- Pre-filled template loads
- Customize and send
- Resets reminder timer

**Option 2: Mark as Closed**
- Click "Close" button
- Removes from awaiting reply
- Use if no response expected

**Option 3: Convert to Deal**
- Click "Create Deal" button
- Email context added to deal
- Continue in CRM workflow

---

## CONVERTING EMAILS TO DEALS

**When to Convert:**
- Brand expresses interest in campaign
- Creator responds to outreach
- Partnership opportunity identified

**How to Convert:**
1. Open email in inbox
2. Click "Create Deal" button
3. Deal form pre-fills with:
   - Contact name (from email)
   - Company (if detected)
   - Email content (as notes)
4. Add deal details:
   - Deal value
   - Expected close date
   - Stage (lead, qualified, etc.)
5. Click "Create Deal"
6. Email linked to deal automatically

**Result:** Deal appears in CRM with full email context

---

## MANAGING INBOX OVERLOAD

### Filters & Search

**Quick Filters:**
- Priority only
- Awaiting reply only
- Opened emails only
- Unread only
- Date range

**Search:**
- By sender email
- By subject keywords
- By content (full-text search)
- By category

**Example Searches:**
- "brand:nike" → All emails from Nike
- "subject:campaign" → Emails about campaigns
- "category:inquiry" → All brand inquiries

---

### Batch Actions

**Select Multiple Emails:**
1. Check boxes next to emails
2. Choose bulk action:
   - Mark as priority
   - Mark as not priority
   - Archive
   - Create deals (bulk)
   - Mark as read/unread

**Use Cases:**
- Archive old campaigns
- Bulk prioritize brand inquiries
- Clean up inbox periodically

---

## SYNC STATUS & TROUBLESHOOTING

### Check Sync Status

**Dashboard Indicator:**
- 🟢 **Syncing** - Active sync in progress
- ✅ **Synced** - Up to date (last synced X minutes ago)
- ⚠️ **Warning** - Sync delayed (check connection)
- ❌ **Error** - Sync failed (reconnect Gmail)

**Last Synced Timestamp:**
- Shows when inbox last updated
- Updates every 5 minutes
- Click to force manual sync

---

### Common Issues

**Issue 1: Emails Not Showing**

**Causes:**
- Sync still in progress
- Gmail connection lost
- Sync settings exclude those emails

**Solutions:**
1. Wait for sync to complete
2. Check Gmail connection (Settings → Integrations)
3. Click "Force Sync" button
4. Reconnect Gmail if needed

---

**Issue 2: Priority Detection Wrong**

**Causes:**
- AI still learning your preferences
- Email doesn't match typical patterns
- Sender not in contacts

**Solutions:**
1. Mark as "Not Priority" (teaches AI)
2. Add sender to priority contacts
3. Update category manually
4. AI improves over time

---

**Issue 3: Tracking Not Working**

**Causes:**
- Tracking disabled in settings
- Recipient blocks tracking pixels
- Email sent before tracking enabled

**Solutions:**
1. Enable tracking in settings
2. Accept that some opens won't track (normal)
3. Use alternative engagement signals (replies, clicks)

---

**Issue 4: Sync Failed**

**Error Message:** "Gmail sync failed"

**Causes:**
- Gmail OAuth token expired
- Google API rate limits
- Network connectivity issues

**Solutions:**
1. Reconnect Gmail (Settings → Integrations → Reconnect)
2. Wait 15 minutes (rate limit reset)
3. Check internet connection
4. Contact admin if persists

---

## GMAIL WEBHOOKS (ADVANCED)

**What Are Webhooks?**
- Real-time email notifications
- Faster than polling (instant updates)
- Better user experience

**Setup (Admin Only):**
1. Navigate to Admin Dashboard
2. Gmail Integrations → Webhooks
3. Click "Register Webhook"
4. Webhook registered with Google
5. Platform receives instant notifications

**Renewal:**
- Webhooks expire after 7 days
- Auto-renewed by cron job (daily)
- Manual renewal: Admin Dashboard → "Renew Webhooks"

**Troubleshooting:**
- Check `/api/cron/status` for webhook renewal job
- Verify webhook status in health check
- Re-register if expired

---

## BEST PRACTICES

### Daily Workflow

**Morning (9 AM):**
1. Check priority emails
2. Review awaiting reply (>3 days)
3. Respond to urgent inquiries

**Midday (12 PM):**
1. Check opened emails (if tracking enabled)
2. Follow up on warm leads
3. Convert hot inquiries to deals

**Evening (5 PM):**
1. Clear inbox to zero (mark as read/archive)
2. Set follow-up reminders
3. Review tomorrow's priorities

---

### Email Management Tips

**DO:**
- ✅ Respond to priority emails within 24 hours
- ✅ Follow up on awaiting reply after 3-5 days
- ✅ Convert real opportunities to deals immediately
- ✅ Use categories to organize inbox
- ✅ Archive old emails regularly

**DON'T:**
- ❌ Ignore priority emails
- ❌ Let awaiting reply pile up
- ❌ Track every single email (privacy concerns)
- ❌ Manually sync constantly (trust automation)
- ❌ Delete important emails (archive instead)

---

### Optimization Tips

**Reduce Noise:**
- Filter out newsletters
- Unsubscribe from irrelevant senders
- Use Gmail filters for common spam

**Prioritize Effectively:**
- Train AI by marking priority correctly
- Add VIP contacts to priority list
- Review priority settings weekly

**Track Strategically:**
- Only track outreach campaigns
- Don't track internal emails
- Review open rates to gauge interest

**Convert Quickly:**
- Hot lead? Create deal immediately
- Don't let opportunities sit in inbox
- Link related emails to same deal

---

## KEYBOARD SHORTCUTS

**Navigation:**
- `I` → Go to inbox
- `P` → Filter priority only
- `A` → Filter awaiting reply
- `R` → Mark as read
- `U` → Mark as unread

**Actions:**
- `Enter` → Open selected email
- `D` → Create deal from email
- `F` → Follow up
- `C` → Close (remove from awaiting)
- `X` → Archive

**Bulk Actions:**
- `Ctrl + A` → Select all visible
- `Shift + Click` → Select range
- `Esc` → Deselect all

---

## PRIVACY & SECURITY

**What We Access:**
- ✅ Email content (for categorization)
- ✅ Sender/recipient info
- ✅ Email metadata (dates, labels)
- ✅ Read/unread status

**What We DON'T Access:**
- ❌ Gmail password
- ❌ Other Google services
- ❌ Contacts outside email context
- ❌ Google Drive files

**Data Storage:**
- Emails synced to our database
- Encrypted in transit (TLS)
- Encrypted at rest
- Deleted when you disconnect Gmail

**Revoking Access:**
1. Navigate to Settings → Integrations
2. Click "Disconnect Gmail"
3. Confirm disconnection
4. All synced emails remain (historical data)
5. New emails won't sync

**Or Revoke in Google:**
1. Visit https://myaccount.google.com/permissions
2. Find "Break Agency"
3. Click "Remove Access"
4. Platform stops syncing immediately

---

## GETTING HELP

**For Sync Issues:**
- Check sync status indicator
- Try manual sync first
- Reconnect Gmail if failed
- Contact admin if persists

**For Priority Detection:**
- Mark emails correctly (trains AI)
- Add VIP contacts to priority list
- Review priority settings
- Give AI 1-2 weeks to learn

**For Tracking Problems:**
- Verify tracking enabled
- Accept some opens won't track
- Use replies as engagement signal
- Contact admin for technical issues

---

## ADVANCED FEATURES (COMING SOON)

**Roadmap:**
- 📧 **Send from Platform** - Compose and send emails directly
- 🤖 **AI Reply Suggestions** - Smart reply templates
- 📊 **Advanced Analytics** - Email performance metrics
- 🔗 **Calendar Integration** - Link emails to meetings
- 👥 **Team Inbox** - Shared inbox for team collaboration

**Beta Access:**
- Features released to pilot users first
- Sign up for beta: Settings → Beta Features
- Provide feedback to improve features

---

**Gmail Setup & Inbox Usage Guide** — Version 1.0  
**Status:** Production Ready
