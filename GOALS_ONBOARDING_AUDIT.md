# Goals Onboarding System — Audit Report

**Date**: 17 December 2025  
**Status**: ⚠️ PARTIALLY IMPLEMENTED — REQUIRES ENHANCEMENT

---

## PHASE 1 — EXISTING MODEL AUDIT

### ✅ Models That Exist and Are Reusable

#### 1. **CreatorGoal** (Existing)
- **Location**: `apps/api/prisma/schema.prisma` (line 639)
- **Status**: ✅ EXISTS — ⚠️ NEEDS ENHANCEMENT
- **Current Fields**:
  ```prisma
  id          String   @id @default(uuid())
  creatorId   String
  goalType    String   // revenue | product | events | personal | content
  title       String
  targetValue Float?
  timeframe   String?
  progress    Float    @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  ```
- **Current Relations**: Talent (Creator)
- **Current Indexes**:
  - `[creatorId, active]`
  - `[goalType]`

**Assessment**: 
- ✅ Core model exists with most required fields
- ⚠️ Missing `goal_category` (creative | commercial | growth | personal | wellbeing)
- ⚠️ Missing `target_unit` field (revenue_range, count, timeframe)
- ⚠️ `goalType` values don't align with spec (speaking | product | revenue | content | balance | other)
- ✅ Soft-delete via `active` flag already implemented
- ✅ Timestamps and creator relation correct

**Required Changes**:
1. Add `goalCategory` enum field
2. Rename/expand `goalType` to match onboarding categories
3. Add `targetUnit` optional field
4. Keep existing fields for backward compatibility

---

#### 2. **Talent** (Existing Creator Model)
- **Location**: `apps/api/prisma/schema.prisma` (line 357)
- **Status**: ✅ EXISTS — FULLY REUSABLE
- **Relevant Fields**:
  ```prisma
  id         String @id
  userId     String @unique
  name       String
  categories String[]
  stage      String?
  ```
- **Relations**: Already includes `CreatorGoal[]`

**Assessment**: ✅ No changes needed — primary creator model is solid

---

#### 3. **User** (Base Authentication)
- **Location**: `apps/api/prisma/schema.prisma` (line 399)
- **Status**: ✅ EXISTS — RELEVANT FIELDS PRESENT
- **Relevant Fields**:
  ```prisma
  onboarding_status    String?  @default("pending_review")
  onboardingComplete   Boolean? @default(false)
  role                 String   @default("CREATOR")
  ```

**Assessment**: 
- ✅ Onboarding state tracking exists
- ✅ Role-based permissions already enforced
- ✅ No changes needed

---

### ❌ Models That Do NOT Exist

#### 1. **CreatorGoalVersion** (Tracking/History)
- **Status**: ❌ MISSING — REQUIRED FOR INTERNAL CONTEXT
- **Purpose**: Track goal changes over time without exposing to creators
- **Required Fields**:
  ```prisma
  id             String   @id @default(uuid())
  creatorGoalId  String
  snapshot       Json     // Full goal state at time of change
  changedAt      DateTime @default(now())
  changedBy      String   // creator | agent | admin
  changeType     String   // created | updated | archived
  ```

**Rationale**: 
- Agents need to see evolution of creator intent
- AI can learn from goal drift patterns
- No UI exposure = safe for sensitive changes

---

#### 2. **CreatorProfile** (Preference Storage)
- **Status**: ❌ MISSING — NOT REQUIRED
- **Rationale**: 
  - User model already has `bio`, `socialLinks`, `location`, `timezone`, `pronouns`
  - Talent model has `categories`, `stage`
  - Goals provide intent context
  - No need for duplicate profile model

**Decision**: ✅ DO NOT CREATE — use existing User + Talent models

---

#### 3. **CreatorPreferences / Settings**
- **Status**: ❌ MISSING — NOT REQUIRED FOR GOALS
- **Rationale**: 
  - Goals ARE the preferences for AI/recommendations
  - No evidence of other preference models needed
  - User.onboardingComplete tracks completion state

**Decision**: ✅ DO NOT CREATE — goals system replaces need for separate preferences

---

#### 4. **AI Context Storage**
- **Status**: ✅ HANDLED BY EXISTING MODELS
- **Evidence**: 
  - `AIPromptHistory` model exists (line 632)
  - Stores `prompt`, `response`, `category`, `helpful` flag
  - CreatorGoal provides structured AI context

**Decision**: ✅ DO NOT CREATE — use CreatorGoal + AIPromptHistory

---

### ⚠️ Analytics / Insights Models (Adjacent Systems)

#### 1. **CreatorInsight** (Existing)
- **Status**: ✅ EXISTS — SEPARATE CONCERN
- **Purpose**: Performance insights, not goal tracking
- **No changes needed**

#### 2. **CreatorEvent** (Existing)
- **Status**: ✅ EXISTS — SEPARATE CONCERN
- **Purpose**: Event invitations, will be matched against goals
- **No changes needed**

#### 3. **WellnessCheckin** (Existing)
- **Status**: ✅ EXISTS — SEPARATE CONCERN
- **Purpose**: Mental health tracking, may inform wellbeing goals
- **No changes needed**

---

## PHASE 2 — EXISTING API AUDIT

### ✅ Endpoints That Exist

#### Goals Endpoints (Current Implementation)
- **Location**: `apps/api/src/routes/exclusive.ts` (line 243-295)

1. **GET /api/exclusive/goals**
   - ✅ Returns active goals only
   - ✅ Creator-scoped via middleware
   - ✅ Graceful fallback to empty array
   - ⚠️ No categorization or intent summary

2. **POST /api/exclusive/goals**
   - ✅ Creates single goal
   - ✅ Validates required fields (goalType, title)
   - ✅ Sets active=true, progress=0 by default
   - ⚠️ Does NOT support batch creation (required for onboarding)
   - ⚠️ Does NOT create version snapshot

3. **PATCH /api/exclusive/goals/:id**
   - ✅ Updates goal fields
   - ✅ Creator ownership verification
   - ✅ Partial update support
   - ⚠️ Does NOT create version snapshot
   - ⚠️ Does NOT validate goal_category

4. **DELETE /api/exclusive/goals/:id**
   - ✅ Soft-deletes via active=false
   - ✅ Creator ownership verification
   - ⚠️ Should be renamed to archive endpoint for clarity

---

### ❌ Missing Endpoints (Required for Onboarding)

#### 1. **POST /api/creator/goals** (Batch Creation)
- **Purpose**: Accept array of goals during onboarding
- **Behaviour**: 
  - Archive old goals automatically
  - Create new goals with version snapshots
  - Accept partial/empty submissions
  - Return categorized goal summary

**Status**: ❌ MISSING — CRITICAL FOR ONBOARDING FLOW

---

#### 2. **POST /api/exclusive/goals/:id/archive**
- **Purpose**: Explicit archive action (clearer than DELETE)
- **Behaviour**: 
  - Set active=false
  - Create version snapshot with changeType="archived"
  - Optional archive reason field

**Status**: ❌ MISSING — BETTER UX THAN CURRENT DELETE

---

#### 3. **GET /api/creator/intent-profile** (Virtual/Computed)
- **Purpose**: Return structured AI context from goals
- **Response**:
  ```json
  {
    "activeGoals": [...],
    "categories": ["creative", "wellbeing"],
    "priorities": ["balance", "speaking"],
    "personalFlags": ["wellbeing_focus"],
    "aiContext": "This creator is focusing on speaking opportunities and maintaining balance.",
    "sensitiveGoals": 2
  }
  ```

**Status**: ❌ MISSING — REQUIRED FOR AI INTEGRATION

---

## PHASE 3 — MIDDLEWARE & SAFETY AUDIT

### ✅ Security Middleware (Existing)
- **Location**: `apps/api/src/middleware/creatorAuth.ts`

1. **requireCreator**: ✅ Role check (CREATOR/TALENT only)
2. **attachCreatorProfile**: ✅ Loads Talent record
3. **requireOwnCreatorData**: ✅ Prevents cross-creator access

**Assessment**: ✅ ALL ROUTES ALREADY PROTECTED — no additional middleware needed

---

### ⚠️ Missing Safety Features

#### 1. **Goal Category Sensitivity Detection**
- **Purpose**: Flag personal/wellbeing goals as sensitive
- **Implementation**: Utility function in middleware
- **Usage**: Hide from agent dashboards by default

**Status**: ❌ MISSING — REQUIRED FOR PRIVACY

---

#### 2. **Agent Read-Only Enforcement**
- **Current State**: No agent-specific endpoints exist yet
- **Required**: When agent endpoints are built, must be read-only
- **Implementation**: New middleware `requireAgent` + permissions check

**Status**: ⚠️ NOT APPLICABLE YET — will be needed for agent dashboard

---

## PHASE 4 — INTEGRATION REQUIREMENTS

### ❌ AI Context Injection (Not Implemented)
- **Required**: Utility function to convert goals → AI prompt
- **Format**: Human-readable intent summary
- **Filtering**: Exclude raw targets, soft-weight personal goals
- **Location**: Should be in `src/utils/aiContext.ts` (does not exist)

**Example Output**:
```
This creator is focusing on:
- Speaking opportunities (high priority)
- Product launches (medium priority)
- Maintaining work-life balance (personal)

Avoid suggesting: late-night events, high-pressure campaigns
```

---

### ❌ Event/Opportunity Matching (Not Implemented)
- **Required**: Query utilities to filter events/opportunities by goal alignment
- **Implementation**: 
  - `matchEventToGoals(event, goals)` → confidence score
  - `matchOpportunityToGoals(opportunity, goals)` → relevance rank
- **Location**: Should be in `src/utils/goalMatching.ts` (does not exist)

---

### ⚠️ Onboarding Flow Integration
- **Current State**: 
  - `GET /api/exclusive/onboarding-status` exists
  - `POST /api/exclusive/onboarding-complete` exists
  - ✅ User.onboardingComplete flag exists
- **Missing**: 
  - Goals completion step not tracked separately
  - No validation of minimum goal count
  - No "skip goals" flow (should be allowed)

**Decision**: ✅ EXISTING FLOW SUFFICIENT — just add batch goal creation

---

## SUMMARY — WHAT NEEDS TO BE BUILT

### 🔴 CRITICAL (Required for Launch)

1. **Add `goalCategory` field to CreatorGoal** (schema change)
2. **Expand `goalType` enum values** (align with onboarding categories)
3. **Add `targetUnit` field** (schema change)
4. **Create `CreatorGoalVersion` model** (new model)
5. **Build batch POST /api/creator/goals endpoint** (onboarding flow)
6. **Create version snapshots on create/update** (middleware)
7. **Build AI context injection utility** (goalToAIContext function)

### 🟡 IMPORTANT (Launch-Ready but Deferrable)

8. **Add POST /api/exclusive/goals/:id/archive** (clearer UX)
9. **Build GET /api/creator/intent-profile** (virtual endpoint)
10. **Create event/opportunity matching utilities** (recommendation engine)
11. **Add sensitivity detection for personal/wellbeing goals** (privacy flag)

### 🟢 NICE-TO-HAVE (Post-Launch)

12. **Agent read-only endpoints** (when agent dashboard built)
13. **Goal progress auto-calculation** (from deals/deliverables)
14. **Goal suggestion engine** (based on creator category)

---

## VERDICT

**Current State**: ⚠️ 60% COMPLETE

**Existing Assets**:
- ✅ CreatorGoal model (needs enhancement)
- ✅ Creator authentication/security middleware
- ✅ Basic CRUD endpoints (single-goal operations)
- ✅ Onboarding completion tracking
- ✅ Soft-delete pattern already implemented

**Critical Gaps**:
- ❌ No batch creation for onboarding flow
- ❌ No version tracking (agent context lost)
- ❌ No AI context utilities
- ❌ Goal categories incomplete

**Recommendation**: 
**ENHANCE EXISTING SYSTEM** rather than rebuild. The foundation is solid—we need to add versioning, batch operations, and AI integration utilities.

---

## NEXT STEPS

1. Schema changes (add fields to CreatorGoal, create CreatorGoalVersion)
2. Push to database (npx prisma db push)
3. Implement batch onboarding endpoint
4. Add versioning to create/update operations
5. Build AI context utilities
6. Test with real onboarding flow
7. Generate final audit checklist

---

**Audit Completed By**: GitHub Copilot  
**Implementation Priority**: 🔴 HIGH — Core Onboarding Feature
