# Assisted Outreach - Quick Start Guide for Developers

## 🚀 Quick Links

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **Routes** | `apps/api/src/routes/assistedOutreach.ts` | 497 | 6 API endpoints |
| **AI Service** | `apps/api/src/services/assistedOutreachService.ts` | 180+ | AI draft generation + sentiment analysis |
| **Approval UI** | `apps/web/src/components/OutreachDraftApprovalScreen.jsx` | 350+ | 3-column draft review interface |
| **Campaign List** | `apps/web/src/components/OutreachCampaignList.jsx` | 300+ | Table view with filtering |
| **Campaign Detail** | `apps/web/src/components/OutreachCampaignDetail.jsx` | 290+ | Full campaign view with timeline |

---

## 📋 API Endpoints

```
POST   /api/assisted-outreach/campaigns                    - Create + generate drafts
GET    /api/assisted-outreach/campaigns                    - List campaigns
GET    /api/assisted-outreach/campaigns/:id                - View campaign detail
PATCH  /api/assisted-outreach/drafts/:id                   - Edit draft
POST   /api/assisted-outreach/drafts/:id/approve-and-send  - Send email
POST   /api/assisted-outreach/webhooks/reply               - Track replies
```

---

## 🔧 Configuration

### Environment Variables Needed
```
OPENAI_API_KEY          - For AI draft generation
RESEND_API_KEY          - For email (if using Resend)
GMAIL_CLIENT_ID         - For Gmail OAuth
GMAIL_CLIENT_SECRET     - For Gmail OAuth
WEBHOOK_SECRET          - For reply webhook validation
```

### Database Models
- `OutreachCampaign` - Campaign metadata + status
- `OutreachDraft` - Email versions (A/B/C)
- `OutreachReply` - Inbound replies with sentiment

---

## 🔑 Key Classes & Interfaces

### OutreachContext (AI Service Input)
```typescript
{
  campaignId: string;
  brandName: string;
  brandWebsite?: string;
  brandIndustry?: string;
  contactFirstName: string;
  contactRole: string;
  contactEmail: string;
  goal: "STRATEGY_AUDIT" | "CREATIVE_CONCEPTS" | "CREATOR_MATCHING";
  senderName: string;
}
```

### OutreachDraft (Database)
```
id                String (unique)
version           String (A, B, or C)
subject           String
body              String (long)
isApproved        Boolean
sentAt            DateTime? (if sent)
emailMessageId    String? (for reply tracking)
wasEdited         Boolean (if modified)
```

### OutreachReply (Database)
```
id                String (unique)
emailMessageId    String (links to original)
replyText         String
sentiment         String (POSITIVE|NEUTRAL|NEGATIVE)
confidenceScore   Float (0-1)
```

---

## 💡 Common Tasks

### Add New Approval Logic
File: `apps/api/src/routes/assistedOutreach.ts` (line ~315)
```typescript
// POST /api/assisted-outreach/drafts/:id/approve-and-send
// Modify here to add new requirements
```

### Change AI Prompt
File: `apps/api/src/services/assistedOutreachService.ts` (line ~25)
```typescript
// generateAssistedOutreachDrafts function
// Modify systemPrompt to change AI behavior
```

### Add New UI Fields
File: `apps/web/src/components/OutreachDraftApprovalScreen.jsx` (line ~30)
```typescript
// Add new state variables in useState()
// Add new input fields in render
```

### Change Sentiment Detection
File: `apps/api/src/services/assistedOutreachService.ts` (line ~280)
```typescript
// detectSentiment function
// Modify positiveSignals, negativeSignals arrays
```

---

## ✅ Testing the System

### 1. Create a Campaign
```bash
curl -X POST http://localhost:3000/api/assisted-outreach/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "brandId": "brand_123",
    "contactId": "contact_456",
    "goal": "STRATEGY_AUDIT",
    "senderUserId": "user_789"
  }'
```

### 2. List Campaigns
```bash
curl http://localhost:3000/api/assisted-outreach/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. View Campaign Detail
```bash
curl http://localhost:3000/api/assisted-outreach/campaigns/camp_xyz \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Send Email
```bash
curl -X POST http://localhost:3000/api/assisted-outreach/drafts/draft_123/approve-and-send \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Simulate Reply Webhook
```bash
curl -X POST http://localhost:3000/api/assisted-outreach/webhooks/reply \
  -H "Content-Type: application/json" \
  -d '{
    "originalMessageId": "msg_123",
    "replyText": "Great idea! Lets schedule a call.",
    "senderEmail": "john@acme.com",
    "senderName": "John Doe"
  }'
```

---

## 🐛 Debugging

### Check AI Service
```typescript
// In assistedOutreachService.ts
console.log("[ASSISTED_OUTREACH] AI Request:", context);
console.log("[ASSISTED_OUTREACH] AI Response:", aiResponse);
```

### Check Email Sending
```typescript
// In assistedOutreach.ts route
console.log("[ASSISTED_OUTREACH] Email sent for campaign", campaign.id, "- messageId:", emailMessageId);
```

### Check Sentiment Detection
```typescript
// In assistedOutreachService.ts
const { sentiment, confidence } = detectSentiment(replyText);
console.log("[ASSISTED_OUTREACH] Detected sentiment:", sentiment, "confidence:", confidence);
```

### Database Queries
```bash
# View campaigns
SELECT * FROM "OutreachCampaign" ORDER BY "createdAt" DESC LIMIT 10;

# View drafts for campaign
SELECT * FROM "OutreachDraft" WHERE "campaignId" = 'camp_xyz' ORDER BY "version";

# View replies
SELECT * FROM "OutreachReply" WHERE "campaignId" = 'camp_xyz' ORDER BY "detectedAt" DESC;
```

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Unauthorized" 401 | No auth token | Add Authorization header |
| "Access denied" 403 | Non-admin user | Must be Admin/Superadmin |
| "Brand not found" 404 | Invalid brandId | Check brand exists in DB |
| "Email send failed" 500 | Gmail OAuth issue | Check Gmail config |
| Drafts not generating | AI timeout | Check OPENAI_API_KEY |
| Replies not tracked | Wrong messageId | Check webhook is called correctly |
| "Sent draft cannot be edited" 400 | Already sent | Cannot modify sent drafts |

---

## 📊 Schema Overview

```
Brand (existing)
  ├── id
  ├── name
  └── OutreachCampaigns (new relation)

User (existing)
  ├── id
  ├── role
  └── OutreachCampaignsCreatedBy (new relation)
     OutreachCampaignsSent (new relation)
     OutreachDraftsApproved (new relation)

OutreachCampaign (new)
  ├── id
  ├── brandId → Brand
  ├── contactId → CrmBrandContact
  ├── goal (STRATEGY_AUDIT | CREATIVE_CONCEPTS | CREATOR_MATCHING)
  ├── status (DRAFT_REQUIRES_APPROVAL | SENT | REPLIED)
  ├── createdByUserId → User
  ├── senderUserId → User
  ├── approvedDraftId → OutreachDraft
  ├── drafts → OutreachDraft[]
  ├── replies → OutreachReply[]
  └── timestamps (createdAt, sentAt, repliedAt)

OutreachDraft (new)
  ├── id
  ├── campaignId → OutreachCampaign
  ├── version (A, B, or C)
  ├── subject
  ├── body
  ├── isApproved
  ├── approvedByUserId → User
  ├── wasEdited
  ├── sentAt
  ├── emailMessageId (for webhook matching)
  └── timestamps

OutreachReply (new)
  ├── id
  ├── campaignId → OutreachCampaign
  ├── emailMessageId (matches OutreachDraft.emailMessageId)
  ├── replyText
  ├── senderEmail
  ├── sentiment (POSITIVE | NEUTRAL | NEGATIVE)
  ├── confidenceScore
  └── timestamps
```

---

## 📈 Performance Tips

1. **Drafts Generation:** Takes 3-5 seconds (GPT-4 API)
   - Add loading indicator in UI
   - Don't block user while generating

2. **Email Sending:** Takes 1-2 seconds (Gmail API)
   - Use async/await
   - Save messageId immediately

3. **Reply Tracking:** Instant (webhook)
   - Lightweight sentiment detection
   - No database queries in hot path

4. **List Campaigns:** May load 100+ campaigns
   - Use pagination (not yet implemented)
   - Consider adding limit/offset parameters

---

## 🔐 Security Notes

✅ All routes require authentication (`requireAuth`)
✅ Write operations require admin role
✅ Permission checks on campaign access
✅ Input validation on all endpoints
✅ No sensitive data in logs
✅ No SQL injection (Prisma ORM)
✅ No XSS (React escaping)

⚠️ Rate limiting not yet implemented (add soon)
⚠️ Webhook signature validation recommended
⚠️ CORS policy should be configured
⚠️ API rate limits for OpenAI need monitoring

---

## 📚 Related Files

- Schema: `apps/api/prisma/schema.prisma` (OutreachCampaign, OutreachDraft, OutreachReply models)
- Logger: `apps/api/src/lib/logger.ts` (logError function)
- OpenAI: `apps/api/src/lib/openai.js` (openai client)
- Email: `apps/api/src/services/email/sendOutbound.ts` (sendEmailWithGmail)
- Router: `apps/api/src/routes/index.ts` (route mounting)

---

## 🎯 Next Steps

1. Configure environment variables
2. Test endpoints with sample data
3. Deploy to staging environment
4. Run end-to-end test campaign
5. Monitor logs for errors
6. Deploy to production
7. Add monitoring/alerting
8. Gather user feedback
9. Plan enhancements

---

**Build Status:** ✅ All systems go  
**Last Updated:** 2024  
**Maintainer:** Break Agency Dev Team
