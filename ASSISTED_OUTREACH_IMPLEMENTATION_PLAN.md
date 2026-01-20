# Assisted Outreach Feature - Implementation Plan

**Date**: January 20, 2026  
**Status**: IN PROGRESS  
**Version**: 1.0

---

## 🎯 Feature Overview

Semi-automated, approval-based, premium outreach system.

**NOT bulk sending. NOT spammy. Quality-first.**

Flow:
```
User selects brand & contact
→ Choose outreach goal
→ Select sender (Lila / Maureen)
→ AI generates 3 draft emails
  - Version A: Strategic / Consultative
  - Version B: Creative / Opportunity-led
  - Version C: Founder-to-Founder
→ User reviews & approves one
→ Email sent
→ System tracks reply
→ If positive → trigger booking flow
```

---

## 📊 Data Models - COMPLETE ✅

### OutreachCampaign
```prisma
id                String
brandId           String         // FK Brand
contactId         String         // FK CrmBrandContact
goal              String         // STRATEGY_AUDIT, CREATIVE_CONCEPTS, CREATOR_MATCHING
status            String         // DRAFT_REQUIRES_APPROVAL, APPROVED, SENT, REPLIED, BOOKED, CLOSED
createdByUserId   String         // Who initiated
senderUserId      String         // Who is "sending" (Lila/Maureen)
approvedDraftId   String?        // Which draft was approved
sentAt, repliedAt, bookedAt // Timestamps
```

### OutreachDraft  
```prisma
id                String
campaignId        String         // FK OutreachCampaign
version           String         // A, B, or C
subject           String
body              String
isApproved        Boolean
wasEdited         Boolean
emailMessageId    String?        // External email service ID
```

### OutreachReply
```prisma
id                String
campaignId        String         // FK OutreachCampaign
emailMessageId    String         // Links back to sent email
replyText         String
sentiment         String         // POSITIVE, NEUTRAL, NEGATIVE
confidenceScore   Float?         // 0-1
```

---

## 🤖 AI Service Requirements

### Service: `generateAssistedOutreachDrafts`

**Input:**
- campaignId
- brand (name, website, industry, socials)
- contact (name, role, company)
- goal (STRATEGY_AUDIT / CREATIVE_CONCEPTS / CREATOR_MATCHING)
- sender (Lila / Maureen)

**Output:** 3 OutreachDraft objects
- Version A: Strategic positioning
- Version B: Creative opportunity
- Version C: Founder-to-founder

**Rules:**
- ❌ NO auto-send
- ❌ NO calendar links
- ❌ NO emojis
- ❌ NO sales language
- ✅ Professional, consultative tone
- ✅ Personalized with brand/contact data
- ✅ 2-3 short paragraphs max

---

## 🔨 Backend Requirements

### 1. POST /api/outreach/campaigns (Create Campaign)
```
Request:
{
  brandId: string
  contactId: string
  goal: "STRATEGY_AUDIT" | "CREATIVE_CONCEPTS" | "CREATOR_MATCHING"
  senderUserId: string
}

Response:
{
  campaignId: string
  status: "DRAFT_REQUIRES_APPROVAL"
  drafts: OutreachDraft[]  // 3 drafts generated
}

Permissions: Admin/Superadmin only
```

### 2. GET /api/outreach/campaigns/:id (View Campaign)
```
Response:
{
  campaign: OutreachCampaign
  drafts: OutreachDraft[]
  replies: OutreachReply[]
  contact: CrmBrandContact
  brand: Brand
}
```

### 3. PATCH /api/outreach/drafts/:id (Edit Draft)
```
Request:
{
  subject?: string
  body?: string
}

Response:
{
  draft: OutreachDraft (with wasEdited = true)
}

Permissions: Creator or Admin
```

### 4. POST /api/outreach/drafts/:id/approve-and-send (Approve & Send)
```
Request:
{}

Response:
{
  campaign: { status: "SENT", sentAt: DateTime, emailMessageId: string }
  draft: { isApproved: true, isApprovedVersion: true, sentAt: DateTime }
}

Permissions: Admin/Superadmin
```

### 5. POST /api/outreach/webhooks/reply (Incoming Reply - Webhook)
```
Request (from email service):
{
  originalMessageId: string
  replyText: string
  senderEmail: string
  senderName: string
  timestamp: DateTime
}

Logic:
- Match originalMessageId to OutreachDraft.emailMessageId
- Find OutreachCampaign
- Analyze sentiment
- Create OutreachReply
- If POSITIVE → update campaign status to "REPLIED"
```

---

## 🎨 Frontend Requirements

### Component: OutreachDraftApprovalScreen

**Layout:**
```
┌──────────────────────────────────────────────┐
│ OUTREACH CAMPAIGN DETAILS                    │
├──────────────────────────────────────────────┤
│ Brand: Nike                                  │
│ Contact: Sarah Johnson (Partnership Manager) │
│ Goal: Strategy Audit                         │
│ Sender: Lila                                 │
├──────────────────────────────────────────────┤
│ DRAFT A: Strategic / Consultative            │
│ ┌──────────────────────────────────────────┐ │
│ │ Subject: [editable]                      │ │
│ │ Body: [editable textarea]                │ │
│ │ [Approve Only] [Approve & Send]          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ DRAFT B: Creative / Opportunity-led          │
│ ┌──────────────────────────────────────────┐ │
│ │ Subject: [editable]                      │ │
│ │ Body: [editable textarea]                │ │
│ │ [Approve Only] [Approve & Send]          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ DRAFT C: Founder-to-Founder                  │
│ ┌──────────────────────────────────────────┐ │
│ │ Subject: [editable]                      │ │
│ │ Body: [editable textarea]                │ │
│ │ [Approve Only] [Approve & Send]          │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Features:**
- All 3 versions displayed
- Editable subject + body for each
- Live character counter
- "Approve Only" (saves but doesn't send)
- "Approve & Send" (saves + sends + updates campaign)
- Status indicators (Draft / Approved / Sent)

### Component: OutreachCampaignList

**Shows:**
- Brand name
- Contact name
- Goal
- Status (Draft / Sent / Replied)
- Date sent
- Reply sentiment (if replied)
- Actions: View | Resend | Book Call

---

## 📧 Email Service Integration

### Requirements:
1. **Send Email**
   - Use existing email service (Gmail / SendGrid / etc)
   - Log messageId for tracking
   - Save messageId to OutreachDraft.emailMessageId

2. **Track Reply**
   - Webhook endpoint for inbound mail
   - Match messageId to original sent email
   - Create OutreachReply record
   - Trigger sentiment analysis

3. **Sentiment Detection**
   - Lightweight analysis (keyword-based is fine)
   - POSITIVE: "interested", "call", "meeting", "let's", etc
   - NEGATIVE: "not interested", "busy", "no", "remove", etc
   - NEUTRAL: Everything else

---

## 🔐 Permissions

**Who can:**
- **Create campaign:** Admin, Superadmin
- **Edit draft:** Creator (who created campaign), Admin, Superadmin
- **Approve & Send:** Admin, Superadmin only
- **View campaign:** Creator, Admin, Superadmin

**Who CANNOT:**
- Brand users (read-only for now)
- Other admins (see only campaigns they created?)
- Talent (no access)

---

## ✅ Success Criteria

1. ✅ 3 draft emails generated automatically
2. ✅ User can edit all 3 before approving
3. ✅ User chooses which version to send
4. ✅ Email sent via existing service
5. ✅ Reply tracked and attached to campaign
6. ✅ Sentiment detected (positive/neutral/negative)
7. ✅ CTA shown when positive reply detected
8. ✅ No permission bypasses
9. ✅ Clear audit trail
10. ✅ Premium feel (not spammy)

---

## 📋 Implementation Checklist

- [ ] Prisma models created ✅ DONE
- [ ] AI service: generateAssistedOutreachDrafts
- [ ] Backend endpoints:
  - [ ] POST /api/outreach/campaigns
  - [ ] GET /api/outreach/campaigns/:id
  - [ ] PATCH /api/outreach/drafts/:id
  - [ ] POST /api/outreach/drafts/:id/approve-and-send
  - [ ] POST /api/outreach/webhooks/reply
- [ ] Frontend components:
  - [ ] OutreachDraftApprovalScreen
  - [ ] OutreachCampaignList
  - [ ] OutreachCampaignDetail
- [ ] Email service integration
- [ ] Reply webhook handler
- [ ] Permission checks
- [ ] End-to-end testing
- [ ] Documentation

---

## 🚀 Deployment Sequence

1. Schema migration + Prisma generate ✅
2. AI service created
3. Backend endpoints tested
4. Email integration verified
5. Frontend components built
6. End-to-end flow tested
7. Deploy to Railway

---

**Next**: Create AI service
