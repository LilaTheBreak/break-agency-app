# Brands Feature - Phase 1 (Backend Complete)

**Date**: January 9, 2026
**Status**: ✅ Backend Implementation Complete | 🔄 Frontend In Progress

---

## Overview

Added **Brands** as a first-class user type in The Break platform. Brands can now:
- Create accounts with instant onboarding (< 60 seconds)
- Invite and manage team members with role-based access
- Track audit sources for AI-driven insights (foundation)
- Collaborate on campaigns

---

## Architecture

### Prisma Models

#### Brand (Enhanced)
```prisma
model Brand {
  id: String @id @default(cuid())
  name: String
  domain: String @unique
  websiteUrl: String
  industry: String?
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  BrandUsers: BrandUser[]
  AuditSources: AuditSource[]
}
```

#### BrandUser (New)
```prisma
model BrandUser {
  id: String @id @default(cuid())
  brandId: String
  userId: String
  role: String // ADMIN, EDITOR, VIEWER
  status: String // ACTIVE, INVITED, INACTIVE
  permissions: Json?
  
  brand: Brand @relation(...)
  user: User @relation(...)
  
  @@unique([brandId, userId])
}
```

#### AuditSource (New - Extensible Foundation)
```prisma
model AuditSource {
  id: String @id @default(cuid())
  brandId: String
  type: String // website | social | community | product | campaign
  source: String
  status: String // connected | pending | error
  metadata: Json?
  lastCheckedAt: DateTime?
  error: String?
  
  @@unique([brandId, type, source])
}
```

---

## API Endpoints

### Brands

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/brands/onboard` | Onboard new brand (4 steps) |
| GET | `/api/brands/my-brands` | Get user's brands |
| GET | `/api/brands/:brandId` | Get brand details |
| PUT | `/api/brands/:brandId` | Update brand info |
| GET | `/api/brands` | List all brands (admin) |

### Brand Team

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/brand-team/:brandId/invite` | Invite user to brand |
| GET | `/api/brand-team/:brandId/members` | Get team members |
| PUT | `/api/brand-team/:brandId/members/:memberId/role` | Update role |
| DELETE | `/api/brand-team/:brandId/members/:memberId` | Remove member |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/brand-audit/:brandId/sources` | Add audit source |
| GET | `/api/brand-audit/:brandId/sources` | Get audit sources |
| GET | `/api/brand-audit/:brandId/summary` | Get audit summary |
| PUT | `/api/brand-audit/:brandId/sources/:auditSourceId` | Update audit |
| DELETE | `/api/brand-audit/:brandId/sources/:auditSourceId` | Delete audit |

---

## Onboarding Flow (Frontend - In Progress)

### Step 1: Brand URL
- Input website URL
- Validate domain format
- Extract domain (e.g., company.com)

### Step 2: Work Email
- Require email from same domain
- Reject public email providers
- Validate domain match

### Step 3: Role Selection
- Founder
- Marketing
- Brand Partnerships
- Community
- Product
- Other

### Step 4: Create Brand
- Auto-create Brand entity
- Create first admin user
- Initialize audit sources
- Redirect to dashboard

---

## Validation & Security

### Domain Validation (`domainValidator.ts`)
- ✅ URL format validation
- ✅ Domain extraction
- ✅ Public email domain detection (blocks gmail, yahoo, etc.)
- ✅ Email domain matching (must match brand domain)
- ✅ Root domain extraction (handles subdomains)

### Permission Model (`permissionHelper.ts`)

**Roles & Permissions**:

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| Edit Brand | ✓ | ✗ | ✗ |
| Manage Team | ✓ | ✗ | ✗ |
| Create Campaign | ✓ | ✓ | ✗ |
| Edit Campaign | ✓ | ✓ | ✗ |
| Delete Campaign | ✓ | ✓ | ✗ |
| View Analytics | ✓ | ✓ | ✓ |
| Manage Audit | ✓ | ✗ | ✗ |
| Invite Members | ✓ | ✗ | ✗ |
| Remove Members | ✓ | ✗ | ✗ |

---

## Audit Foundation (For AI)

The AuditSource system is extensible and designed for future AI features:

```javascript
// Example: Track social media presence
await auditSourceService.upsertAuditSource({
  brandId: "brand_123",
  type: "social",
  source: "https://instagram.com/mybrand",
  metadata: {
    platform: "instagram",
    handle: "mybrand",
    followers: 50000,
  }
});

// Get audit summary
const summary = await auditSourceService.getAuditSummary("brand_123");
// Returns: { website: { total: 1, connected: 1 }, social: { total: 2, connected: 1 }, ... }
```

### Supported Audit Types
1. **website** - Domain reachability
2. **social** - Social media presence
3. **community** - Community channels (Discord, Slack, etc.)
4. **product** - Product feedback sources
5. **campaign** - Internal campaign tracking

---

## Backend Files Created

### Services (2 files)
- `apps/api/src/services/brandUserService.ts` (210 lines)
  - Brand CRUD, workspace creation, team management
- `apps/api/src/services/auditSourceService.ts` (180 lines)
  - Audit source tracking and health checks

### Controllers (3 files)
- `apps/api/src/controllers/brandController.ts` (190 lines)
  - Brand onboarding, CRUD, listing
- `apps/api/src/controllers/brandTeamController.ts` (150 lines)
  - Team invites, role management, member removal
- `apps/api/src/controllers/auditController.ts` (240 lines)
  - Audit source management and reporting

### Routes (3 files)
- `apps/api/src/routes/brands.ts` (30 lines)
- `apps/api/src/routes/brandTeam.ts` (30 lines)
- `apps/api/src/routes/brandAudit.ts` (35 lines)

### Utilities (2 files)
- `apps/api/src/utils/domainValidator.ts` (110 lines)
- `apps/api/src/utils/permissionHelper.ts` (120 lines)

### Schema (Updated)
- `apps/api/prisma/schema.prisma`
  - Enhanced Brand model (+15 lines)
  - Added BrandUser model (+20 lines)
  - Added AuditSource model (+20 lines)

**Total**: ~1,250 lines of production-ready code

---

## Verification

### Build Status
✅ API Build: PASS (0 errors)
✅ Web Build: PASS (14.91s)

### Git Commit
- Commit: `539447e`
- Message: "Add Brands as first-class user type: complete backend system..."
- Files: 12 changed, 1709 insertions(+), 11 deletions(-)

---

## Next Steps (Frontend - In Progress)

### Phase 1B (In Progress)
1. ✅ Backend complete
2. 🔄 BrandOnboarding component (4-step form)
3. 🔄 BrandDashboard (snapshot, campaigns, audit status)
4. 🔄 BrandTeamManagement (invites, member list)

### Phase 2 (Future)
1. Campaign creation & management
2. Analytics & metrics
3. Social media account linking
4. Community sentiment analysis
5. AI-driven talent suggestions
6. Revenue impact analysis

---

## Future-Proofing Comments

All services include `// TODO: AI` markers for future enhancements:

```typescript
// In snapshotResolver.ts
async function resolveAuditInsights(brandId: string) {
  // TODO: AI - Analyze audit sources, generate insights
  // TODO: AI - Recommend actions based on missing data
  // TODO: AI - Score brand completeness
  return insights;
}
```

---

## Key Design Decisions

1. **Extensible Audit System**: AuditSource stores flexible `metadata` for different audit types
2. **Light Onboarding**: Only URL, email, role - no heavy forms
3. **Role-Based Access**: Simple 3-tier system (ADMIN, EDITOR, VIEWER)
4. **Domain Validation**: Enforces company email, prevents fake signups
5. **Lazy Loading**: Audit sources created on-demand, not pre-populated

---

## Commits in This Session

1. `539447e` - Brands backend system complete (1,709 lines added)

---

**Status**: Backend ready for production. Frontend components next.
