# Brand Onboarding - Quick Reference

## What Was Built?

A **complete 6-step brand onboarding wizard** that captures strategic business data and enables founder-led redirection.

## Key Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/onboarding/brand` | GET | Access brand onboarding page |
| `/api/brands/onboarding/start` | POST | Initialize profile |
| `/api/brands/onboarding/step/1-6` | POST | Save step data & advance |
| `/api/brands/onboarding/current` | GET | Fetch saved progress |
| `/api/brands/onboarding/skip/:step` | POST | Skip optional steps |

## The 6 Steps

```
1. Company Basics
   ├─ Company name (required)
   ├─ Website URL
   ├─ Industry
   ├─ Markets (multi-select)
   └─ Company size

2. Your Role & Authority
   ├─ Role (Founder, CEO, CMO, etc.)
   └─ Decision authority (final/influencer/research)

3. Platform Goals
   └─ Multi-select from 8 strategic goals
      (Brand Awareness, Product Launch, Sales, etc.)

4. Commercial Focus
   ├─ Primary objective (textarea)
   ├─ Products/services (textarea)
   └─ Desired outcome (textarea)

5. Founder-Led? ⭐ BRANCHING LOGIC
   └─ IF "Yes" AND role="Founder"
      → Redirect to /onboarding/founder

6. Activations & Experiences (Final)
   ├─ Interested in activations?
   └─ Types: Pop-ups, Experiential, Seeding, etc.
```

## Database

**Model**: `BrandProfile`  
**Location**: `apps/api/prisma/schema.prisma` (line 4081)  
**Fields**: 15+ fields covering all 6 steps  
**Relation**: One-to-one with `User` (optional)

## Critical Feature: Founder-Led Redirect

**Conditions**:
- User selects "Interested in founder-led partnerships"
- AND user's role is "Founder" or "Co-Founder"

**Result**:
```json
{
  "redirectToFounderOnboarding": true,
  "founderLedRedirectedAt": "2025-01-15T10:30:00Z"
}
```

Frontend detects this and navigates to `/onboarding/founder`

## File Locations

### Backend
```
apps/api/src/routes/brandOnboarding.ts (410 lines)
├─ 9 endpoints
├─ Zod validation
└─ Prisma integration
```

### Frontend
```
apps/web/src/
├─ pages/BrandOnboardingPage.jsx (main page)
└─ components/BrandOnboarding/
   ├─ Progress.jsx (progress bar)
   ├─ Step1Basics.jsx
   ├─ Step2Context.jsx
   ├─ Step3Goals.jsx
   ├─ Step4Commercial.jsx
   ├─ Step5Founder.jsx
   └─ Step6Activations.jsx
```

## Accessing the Flow

1. **As Authenticated User**:
   ```
   GET /onboarding/brand
   Authorization: Bearer {token}
   ```

2. **From Signup**:
   - User selects "Create as Brand"
   - Route to `/onboarding/brand`
   - Complete flow

3. **Resume Saved Progress**:
   ```
   GET /api/brands/onboarding/current
   ```
   Returns `currentStep` to resume from

## Integration Points

### Signup Flow
```javascript
// When user selects "I am a Brand"
navigate('/onboarding/brand');
```

### Completion
```javascript
// Sets on User record
User.onboardingComplete = true
User.onboarding_status = "completed"
```

### Dashboard Usage
- Pre-populate defaults from brand data
- Filter creators matching platformGoals
- AI recommendations based on objectives
- Activate features based on activation interests

## Testing

**Quick Test Flow**:
1. Login as any user
2. Visit `/onboarding/brand`
3. Fill Step 1 (just company name required)
4. Click "Continue" → saves and moves to Step 2
5. Complete all steps
6. Verify database: `BrandProfile.onboardingCompletedAt` is set

**Founder Redirect Test**:
1. Go to Step 2
2. Select "Founder/Co-Founder" as role
3. Go to Step 5
4. Check "Interested in founder-led partnerships"
5. Click "Proceed to Founder Onboarding"
6. Should redirect (or show in response: `redirectToFounderOnboarding: true`)

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Missing required field | Show validation error, block continue |
| Network error on save | Show error message, provide "Try Again" |
| Step validation fails | 400 response with validation details |
| Skip non-skippable step | 400 error "Step X cannot be skipped" |

## What's NOT Built (Future)

- [ ] `/onboarding/founder` - Founder-specific flow
- [ ] Email notifications on completion
- [ ] Analytics dashboard integration
- [ ] Team member invitations
- [ ] Goal-based dynamic questions

## Build Status

✅ **All systems go**

```
✓ TypeScript: 0 errors
✓ Build: Passed all 3 workspaces
✓ Database: Schema synced
✓ Routes: Registered in server.ts
✓ Components: All imported correctly
```

---

**Last Updated**: Commit `7e37dda`  
**Status**: Production Ready
