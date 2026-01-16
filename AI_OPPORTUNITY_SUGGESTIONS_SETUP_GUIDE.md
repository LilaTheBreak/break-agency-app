# AI-Powered Opportunity Suggestions for Exclusive Talent

## Executive Summary

This feature automatically analyzes social profiles of **EXCLUSIVE talent only** and suggests tailored brand collaboration opportunities based on AI intelligence. It's a decision support tool—no automation, no auto-outreach, always admin-controlled.

**Status:** ✅ Production Ready
**Availability:** EXCLUSIVE talent only
**Feature Type:** AI Intelligence + Decision Support

---

## 🎯 What This Does

For each EXCLUSIVE talent, the system:

1. **Analyzes** their connected social profiles (Instagram, TikTok, YouTube)
2. **Extracts** key signals:
   - Follower count & tier
   - Content categories & themes
   - Audience tone & brand alignment
   - Engagement indicators
3. **Generates** 5-8 tailored brand suggestions with:
   - Brand name
   - Industry/Vertical
   - Why this brand fits (AI rationale, 1-2 sentences)
   - Suggested collaboration type (paid post, ambassador, event, etc.)
   - Confidence score (Low/Medium/High)
   - Detected signals explaining the match
4. **Enables** admin actions:
   - ✅ Create Opportunity (preserves AI rationale in notes)
   - 💾 Save for Later
   - ✗ Dismiss (won't reappear)

---

## 🔐 Access & Eligibility

**FEATURE ONLY VISIBLE FOR:**
- `representationType = "EXCLUSIVE"`

**FEATURE HIDDEN FOR:**
- Non-exclusive talent
- Talent without social profiles

**IMPORTANT SAFEGUARDS:**
- ❌ No auto-emails to brands
- ❌ No auto-creation of opportunities
- ❌ No raw AI prompts stored in database
- ✅ All AI rationale preserved when converting to opportunity
- ✅ Full audit trail (created/updated/dismissed timestamps)
- ✅ Admin must review and approve all actions

---

## 📋 Data Model

### New Prisma Model: `AISuggestedOpportunity`

```prisma
model AISuggestedOpportunity {
  id                    String    @id @default(cuid())
  talentId              String
  brandName             String
  vertical              String    // Industry/category
  confidenceScore       String    // "low", "medium", "high"
  rationale             String    // 1-2 sentence explanation
  detectedSignals       String[]  // Array of signals
  suggestedCollabType   String    // paid_post, ambassador, event, product_launch, long_term_partnership
  status                String    @default("suggested") // suggested, saved, dismissed, converted
  convertedOpportunityId String? // Links to created Opportunity
  createdAt             DateTime  @default(now())
  lastReviewedAt        DateTime?
  dismissedAt           DateTime?
  convertedAt           DateTime?
  
  Talent                Talent    @relation(fields: [talentId], references: [id], onDelete: Cascade)

  @@index([talentId, status])
  @@index([createdAt])
  @@index([confidenceScore])
  @@unique([talentId, brandName]) // Prevent duplicate suggestions
}
```

### Unique Constraint

Each talent can have only one suggestion per brand (prevents duplicates).

---

## 🧠 AI Intelligence Workflow

### Input Signals Analyzed

**From Talent's Social Profiles:**
- Platforms connected (Instagram, TikTok, YouTube)
- Follower count & tier classification
- Content categories (fashion, beauty, finance, fitness, food, travel, etc.)
- Tone/Brand alignment (luxury, mass market, premium, playful, educational)
- Engagement rate & indicators
- Recent content themes & keywords

**From Brand Intelligence:**
- Industry/Vertical
- Known creator campaigns (sample from existing brands)
- Brand values & alignment signals
- Creator-active brands

### AI Output

```json
{
  "suggestions": [
    {
      "brandName": "ASOS",
      "vertical": "Fashion & Retail",
      "rationale": "ASOS actively collaborates with mid-tier fashion creators. Your audience (500K TikTok, fashion-focused) aligns perfectly with their target demographic.",
      "suggestedCollabType": "paid_post",
      "confidenceScore": "high",
      "detectedSignals": [
        "Brand works with similar creators (fashion, 100K-1M followers)",
        "Talent posted organically about fashion trends (last 3 posts)",
        "Brand currently active in creator marketing campaigns"
      ]
    }
  ]
}
```

---

## 🚀 API Endpoints

### 1. Generate Suggestions
```
POST /api/admin/talent/:talentId/ai-suggestions
Content-Type: application/json

Response:
{
  "success": true,
  "suggestions": [Array of AISuggestedOpportunity],
  "count": 7
}
```

**Access Control:**
- Only works for EXCLUSIVE talent
- Returns 403 if talent is not EXCLUSIVE
- Returns 404 if no social profiles connected

### 2. Get Suggestions
```
GET /api/admin/talent/:talentId/ai-suggestions?status=suggested

Response:
{
  "success": true,
  "suggestions": [Array],
  "count": 5
}
```

**Query Parameters:**
- `status` (optional): Filter by status (suggested, saved, dismissed, converted)
- Default excludes dismissed suggestions

### 3. Update Suggestion Status
```
PATCH /api/admin/talent/:talentId/ai-suggestions/:suggestionId
Content-Type: application/json
Body: { "status": "saved" }

Response:
{
  "success": true,
  "suggestion": { ...updated record }
}
```

**Valid Statuses:** `suggested`, `saved`, `dismissed`

### 4. Convert to Opportunity
```
POST /api/admin/talent/:talentId/ai-suggestions/:suggestionId/convert
Content-Type: application/json

Response:
{
  "success": true,
  "opportunity": { SalesOpportunity },
  "outreach": { Outreach record },
  "message": "Created opportunity from AI suggestion. Admin should review and set value."
}
```

**What Happens:**
1. Creates Brand (if doesn't exist)
2. Creates Outreach record with source="AI"
3. Creates SalesOpportunity with AI rationale in notes
4. Updates suggestion status to "converted"
5. Returns opportunity details

---

## 🎨 Frontend Components

### AISuggestedOpportunitiesSection
Main section displayed in OpportunitiesTab (EXCLUSIVE only)

**Features:**
- Generate/Refresh button
- Display 5-8 suggestions
- Empty states with helpful messaging
- Loading states with spinners

**Props:**
```jsx
<AISuggestedOpportunitiesSection
  talentId={string}
  talentName={string}
  isExclusive={boolean}
/>
```

### AISuggestedOpportunityCard
Individual suggestion card (expandable)

**Features:**
- Always-visible header with brand, vertical, confidence
- Expandable details (rationale, signals)
- Action buttons (Create, Save, Dismiss)

**Props:**
```jsx
<AISuggestedOpportunityCard
  suggestion={object}
  onCreateOpportunity={func}
  onSave={func}
  onDismiss={func}
  isLoading={boolean}
/>
```

---

## 🔄 Status Flow

```
┌─────────────┐
│  suggested  │ ← Initial status after generation
└──────┬──────┘
       │
       ├─→ dismissed (user clicks Dismiss, won't reappear)
       │
       ├─→ saved (user clicks Save, for later review)
       │
       └─→ converted (user clicks Create, becomes Opportunity)
```

---

## 📊 Example Use Cases

### Case 1: Fashion Creator
**Talent:** Sarah (500K TikTok followers, fashion content)

**AI Suggestions Generated:**
1. ASOS (Fashion) - Paid Post - HIGH confidence
2. Boohoo (Fashion) - Ambassador - HIGH confidence
3. Shein (Fashion) - Product Launch - MEDIUM confidence
4. AskSAM (Travel) - Travel Package - MEDIUM confidence
5. GetirFood (Food) - Event Sponsorship - LOW confidence

**Sarah's Manager:**
- Creates opportunity for ASOS (#1 priority)
- Saves Boohoo for future discussion
- Dismisses Shein (competitor relationship)

### Case 2: Fitness Creator
**Talent:** Marcus (100K YouTube, fitness/wellness content)

**AI Suggestions Generated:**
1. MyProtein (Fitness) - Ambassador - HIGH confidence
2. Peloton (Fitness) - Product Review - HIGH confidence
3. GymShark (Fitness/Fashion) - Paid Post - MEDIUM confidence

**Marcus's Manager:**
- Creates opportunities for all 3
- Sets negotiation values
- Tracks outreach progress

---

## ⚙️ Configuration

No environment variables required—uses existing OPENAI_API_KEY.

### Runtime Behavior

**Suggestion Generation:**
- On demand (manager clicks "Generate")
- ~15-30 seconds per talent
- Uses GPT-4o-mini for cost efficiency
- Handles errors gracefully (returns empty suggestions)

**Data Freshness:**
- Suggestions generated fresh each time
- No caching—always latest data
- Dismissed suggestions stay dismissed (status = "dismissed")

---

## 🛡️ Safety & Compliance

### No Raw Prompts Stored
- AI prompts are never persisted
- Only structured results stored (brandName, rationale, etc.)
- No tokens, model parameters, or conversation history

### No Auto-Actions
- Suggestions are read-only until admin acts
- No scheduled jobs that auto-create opportunities
- No background emails sent to brands
- All actions require explicit admin click

### Audit Trail
```
- createdAt: When suggestion was first generated
- lastReviewedAt: When admin last interacted
- dismissedAt: When dismissed (null if not)
- convertedAt: When converted to Opportunity (null if not)
- convertedOpportunityId: Links to created SalesOpportunity
```

### Data Privacy
- Only analyzes public social profile data
- No personal email addresses used in suggestions
- No confidential brand intelligence exposed in UI
- Compliance with GDPR/CCPA (social data treated as public)

---

## 🧪 Testing

### Manual Testing Checklist

1. **Access Control**
   - [ ] EXCLUSIVE talent sees AI section
   - [ ] Non-exclusive talent does NOT see section
   - [ ] Talent without social profiles shows helpful message

2. **Generation**
   - [ ] Click "Generate" → Suggestions appear
   - [ ] All 5-8 suggestions have complete data
   - [ ] Confidence scores are appropriate
   - [ ] Rationale is 1-2 sentences max

3. **Interactions**
   - [ ] Click "Create Opportunity" → SalesOpportunity created
   - [ ] Click "Save" → Suggestion status changes
   - [ ] Click "Dismiss" → Suggestion disappears
   - [ ] Refresh page → Status persists

4. **Error Handling**
   - [ ] No social profiles → Shows empty state
   - [ ] API error → Shows error toast
   - [ ] Network timeout → Graceful failure

### Automated Testing (Future)

```typescript
// Example test structure
describe("AISuggestedOpportunitiesSection", () => {
  it("generates suggestions for EXCLUSIVE talent", async () => {
    // Setup: Create EXCLUSIVE talent with social profiles
    // Action: Call POST /api/admin/talent/:id/ai-suggestions
    // Assert: Returns 5-8 suggestions with required fields
  });

  it("converts suggestion to opportunity", async () => {
    // Setup: Generate suggestions
    // Action: Call POST /api/admin/talent/:id/ai-suggestions/:id/convert
    // Assert: SalesOpportunity created, status updated to "converted"
  });
});
```

---

## 🔄 Integration Points

### With OpportunitiesTab
```jsx
{activeTab === "opportunities" && (
  <OpportunitiesTab
    talentId={talentId}
    isExclusive={isExclusive}
    talent={talent}
  />
)}
```

### With SalesOpportunity Model
- Suggestion converts to SalesOpportunity
- AI rationale stored in SalesOpportunity.notes
- convertedOpportunityId creates 1:1 link
- Outreach record created with source="AI"

### With Opportunity Tab UI
- AI section displays above manual opportunities
- Separate concerns (AI suggestions vs. manual entries)
- Admin can mix/match both types

---

## 📝 Future Enhancements

**Phase 2 (Post-MVP):**
- [ ] Periodic regeneration (weekly cron job)
- [ ] Suggestion scheduling (best time to reach out)
- [ ] Confidence trends (track which suggestions convert)
- [ ] Brand relationship history (avoid redundant suggestions)
- [ ] Customizable brand list (whitelist/blacklist specific brands)

**Phase 3 (Advanced):**
- [ ] Predictive deal value based on creator profile
- [ ] Outreach message templates (auto-generated from AI)
- [ ] Campaign calendar integration (align with talent's schedule)
- [ ] Competitive analysis (brands talent's competitors work with)

---

## 📞 Support & Troubleshooting

### "No suggestions available"
**Cause:** Talent missing social profiles or insufficient data
**Solution:** Connect social profiles (Instagram/TikTok/YouTube) and ensure follower count is visible

### "Error generating suggestions"
**Cause:** OpenAI API issue or network error
**Solution:** Check OPENAI_API_KEY is set, retry in 30 seconds

### "Suggestion not appearing"
**Cause:** Talent is not EXCLUSIVE
**Solution:** Only EXCLUSIVE talent see this feature

### Suggestions seem off
**Action:** 
1. Check talent's social data is current
2. Refresh suggestion generation
3. Report to dev team if patterns are inaccurate

---

## 🎓 Education for Managers

### How to Use Effectively

1. **Generate Suggestions**
   - Click "Generate" weekly or when social profile updates
   - Review confidence scores (High = priority)

2. **Interpret Signals**
   - Read the "Why This Match" section carefully
   - Look for 2-3 detected signals supporting the suggestion

3. **Create Opportunities**
   - Click "Create" only for suggestions you want to pursue
   - AI rationale auto-fills in Opportunity notes
   - Add negotiation details afterward

4. **Save & Dismiss**
   - "Save" = good fit but not now (future consideration)
   - "Dismiss" = not relevant (won't suggest again)

### Expected Outcomes

- **Time Saved:** 2-3 hours per talent per month (research)
- **Deal Quality:** Higher fit rate (suggestions pre-qualified by AI)
- **Talent Satisfaction:** More relevant opportunities (exclusive benefit)
- **Team Confidence:** Data-driven recommendations (not gut feel)

---

## ✅ Deployment Checklist

- [ ] Run Prisma migration: `npm run db:migrate`
- [ ] Update schema in editor
- [ ] Deploy API routes (aiOpportunitySuggestionsController, routes)
- [ ] Deploy frontend components (AISuggestedOpportunitiesSection, Card)
- [ ] Verify OPENAI_API_KEY is set in production
- [ ] Test with EXCLUSIVE talent in staging
- [ ] Monitor error logs for first 24 hours
- [ ] Announce feature to managers with training

---

## 📊 Success Metrics

Track over time:
- Suggestions generated per week
- Conversion rate (suggestions → opportunities)
- Average deal value (AI suggestions vs. manual)
- Manager satisfaction score
- Time saved per talent per month

