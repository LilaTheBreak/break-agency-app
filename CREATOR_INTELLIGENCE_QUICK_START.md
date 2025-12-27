# 🎯 CREATOR INTELLIGENCE - QUICK START

**Last Updated:** December 26, 2025  
**Status:** ✅ Production Ready

---

## WHAT WE BUILT

Two systems to help brands discover and track creators:

1. **Creator Roster** - Brand's bookmarks/favorites for creators
2. **Transparent Fit Scoring** - Explainable creator-brand matching (NO AI magic)

---

## ROSTER: THE BASICS

Think of it as a creator favorites list with 3 statuses:

- **saved** - "This creator looks interesting, bookmark for later"
- **shortlisted** - "Actively considering for a campaign"
- **active** - "Currently working together"

### Quick Commands

```bash
# Save a creator
POST /api/roster
{
  "talentId": "cm5abc123",
  "status": "saved",
  "notes": "Great for Q1 campaign"
}

# Move to shortlist
PATCH /api/roster/cm5abc123
{
  "status": "shortlisted"
}

# Check roster stats
GET /api/roster/stats
→ { total: 45, saved: 30, shortlisted: 10, active: 5 }

# Auto-sync active status (marks creators with active deals)
POST /api/roster/sync-active
```

---

## FIT SCORING: THE BASICS

**Total Score: 0-100** (higher = better fit)

### What the Score Means

- **80-100**: Excellent fit (proven track record, aligned budgets, matching categories)
- **60-79**: Good fit (some history or category overlap)
- **40-59**: Moderate fit (new relationship, limited data)
- **0-39**: Weak fit (budget mismatch, no category overlap)

### How It's Calculated (100% Transparent)

Each component = 25 points:

1. **Audience Match** - Do deal sizes align?
2. **Engagement** - Past completion rate with this brand
3. **History** - How many deals, how recent?
4. **Category** - Do brand preferences match talent niches?

**NO AI. NO MAGIC. Every number has a reason.**

### Quick Commands

```bash
# Score one creator
POST /api/creator-fit/calculate
{
  "talentId": "cm5abc123",
  "brandId": "cm5brand1",
  "saveToDatabase": true
}

# Score multiple creators at once
POST /api/creator-fit/batch
{
  "brandId": "cm5brand1",
  "talentIds": ["cm5abc123", "cm5def456", "cm5ghi789"],
  "saveToDatabase": true
}

# Get all scores for a brand (sorted high to low)
GET /api/creator-fit/brand/cm5brand1
```

---

## READING A FIT SCORE

Example response:

```json
{
  "totalScore": 87,
  "audienceScore": 24,
  "engagementScore": 25,
  "historyScore": 20,
  "categoryScore": 18,
  "explanation": "
    Total Fit Score: 87/100
    
    🎯 Audience Match (24/25):
    Excellent match: Talent's avg deal ($15,000) aligns perfectly 
    with brand's budget ($14,500)
    
    ⚡ Engagement Quality (25/25):
    Excellent track record: 5/5 deals completed (100%)
    
    🤝 Collaboration History (20/25):
    Strong relationship: 4 deals completed with 1 recent deal
    
    📊 Category Alignment (18/25):
    Good category alignment: 2 matching categories (Fashion, Beauty)
  "
}
```

**Key Insight:** Always read the `explanation` field—it tells you WHY the score is what it is.

---

## TYPICAL WORKFLOWS

### Workflow 1: Brand Discovers New Creator

```bash
# 1. Brand likes a creator's profile → save to roster
POST /api/roster { talentId: "cm5abc123", status: "saved" }

# 2. Before reaching out, check fit
POST /api/creator-fit/calculate { talentId: "cm5abc123", brandId: "cm5brand1" }

# 3. Score is 72 (moderate fit) - no past history but categories match
# → Brand decides to proceed with outreach

# 4. After successful outreach, move to shortlist
PATCH /api/roster/cm5abc123 { status: "shortlisted" }
```

### Workflow 2: Brand Plans Campaign

```bash
# 1. Brand has 20 potential creators
# 2. Batch score all of them
POST /api/creator-fit/batch {
  brandId: "cm5brand1",
  talentIds: [...20 ids...],
  saveToDatabase: true
}

# 3. Review sorted results (high to low scores)
GET /api/creator-fit/brand/cm5brand1

# 4. Shortlist top 5
POST /api/roster/bulk {
  talentIds: [...top 5 ids...],
  status: "shortlisted"
}
```

### Workflow 3: Track Active Relationships

```bash
# 1. Brand has multiple active deals
# 2. Auto-sync roster with deal status
POST /api/roster/sync-active

# Response:
# {
#   promoted: ["cm5abc123", "cm5def456"],  // Now marked "active"
#   demoted: ["cm5ghi789"]                 // Deals completed, moved to "saved"
# }

# 3. Check current active roster
GET /api/roster?status=active
```

---

## FEATURE FLAGS

```javascript
// apps/web/src/config/features.js

CREATOR_ROSTER_ENABLED: true               // ✅ Roster management
BRAND_CREATOR_MATCHES_ENABLED: true        // ✅ Fit scoring
CREATOR_FIT_BATCH_ENABLED: true            // ✅ Batch processing
```

All enabled and ready to use!

---

## COMMON QUESTIONS

### Q: Why is the fit score neutral (~50) for all my talents?

**A:** New relationships have limited data. Scores improve after:
- Completing deals together (improves engagement score)
- Establishing deal value history (improves audience score)
- Defining talent categories (improves category score)

### Q: Can I customize the scoring weights?

**A:** Yes, edit `creatorFitScoringService.ts`. Each component is 25 points, but you can adjust the logic inside each function.

### Q: Does "active" status auto-update?

**A:** Not automatically. Run `POST /api/roster/sync-active` manually or set up a cron job to sync weekly.

### Q: What if I want to use AI for scoring?

**A:** The old AI-based system is in `services/ai/creatorFitEngine.ts` (disabled). You can re-enable it, but we recommend keeping the transparent system for explainability.

---

## FILES TO KNOW

### Backend
- `services/creatorFitScoringService.ts` - Scoring logic (550 lines)
- `services/creatorRosterService.ts` - Roster management (380 lines)
- `controllers/creatorFitController.ts` - Fit endpoints
- `controllers/rosterController.ts` - Roster endpoints

### Database
- `schema.prisma` - BrandSavedTalent & CreatorFitScore models

### Routes
- `GET/POST/PATCH/DELETE /api/roster/*`
- `GET/POST /api/creator-fit/*`

---

## TESTING

```bash
# Start servers
cd apps/api && pnpm run dev

# Test roster
curl -X GET http://localhost:3001/api/roster/stats

# Test fit scoring
curl -X POST http://localhost:3001/api/creator-fit/calculate \
  -H "Content-Type: application/json" \
  -d '{"talentId":"cm5abc123","brandId":"cm5brand1"}'
```

---

## LIMITATIONS

1. **Cold start** - New brands/talents have neutral scores (expected)
2. **Requires deal data** - Scoring improves as deals complete
3. **No social metrics** - Doesn't use follower count yet (social schema removed)
4. **Manual sync** - Active status requires manual sync (for now)

---

## NEXT STEPS

1. **Frontend Integration** - Build UI components for roster and fit scores
2. **Batch Cron** - Set up nightly batch scoring for all brand-talent pairs
3. **Social Data** - Add follower counts back to improve audience scoring
4. **Auto-Sync** - Add cron job for `sync-active` weekly

---

**Need More Detail?** See `CREATOR_INTELLIGENCE_COMPLETE.md` (full 850-line guide)

**Questions?** The `explanation` field in every score tells you exactly how it was calculated.

---

✅ **Ready to use in production!**
