# 🎯 PRODUCTION AUDIT - ACTIONABLE ROADMAP

**Status:** Ready for remediation planning  
**Priority:** IMMEDIATE - Do not deploy until complete  
**Timeline:** 3-4 weeks with 2-3 engineers

---

## PHASE 1: SECURITY & DATA INTEGRITY (Week 1-2) - 16-17 Hours

### Monday-Tuesday: Critical Auth & Access Control (6 hours)

**Task 1.1: Fix Data Ownership Filtering** (2 hours)  
- File: `apps/api/src/routes/talent.ts`, `apps/api/src/routes/deals.ts`, `apps/api/src/routes/crm.ts`
- What: Add WHERE clause to filter by user ownership
- Code pattern:
```typescript
// Add to every GET /list endpoint
const items = await prisma.model.findMany({
  where: {
    // Admin sees everything
    ...(req.user.role === 'ADMIN' ? {} : {
      // Others see only their assigned items
      OR: [
        { userId: req.user.id },
        { ownerId: req.user.id },
        { assignedTo: { some: { id: req.user.id } } }
      ]
    })
  }
});
```
- Test: Try accessing /api/deals as agent, verify only assigned deals return
- Checklist:
  - [ ] talent.ts GET /list
  - [ ] deals.ts GET /list
  - [ ] tasks.ts GET /list
  - [ ] approvals.ts GET /list
  - [ ] Review all other list endpoints

**Task 1.2: Move JWT to httpOnly Cookies** (1.5 hours)  
- Files: `apps/web/src/lib/jwt.js`, `apps/api/src/lib/jwt.ts`, `apps/web/src/services/authClient.js`
- What: Replace localStorage JWT with httpOnly cookie
- Backend changes:
```typescript
// In auth response, set cookie:
res.cookie('authToken', jwtToken, {
  httpOnly: true,        // Prevents JavaScript access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF prevention
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```
- Frontend changes:
```javascript
// Remove all localStorage.getItem('authToken')
// Browser automatically sends cookie with requests
// Remove token from Authorization header (use cookie instead)
```
- Test: Verify cookie visible in browser DevTools, not in localStorage
- Checklist:
  - [ ] Backend sets cookie on login
  - [ ] Frontend removes localStorage
  - [ ] All API calls use cookie (no header needed)
  - [ ] HTTPS enforced in production

**Task 1.3: Add Role Case Normalization** (1.5 hours)  
- File: `apps/api/src/middleware/auth.ts`
- What: Always uppercase roles to prevent case-sensitive bypass
```typescript
// In attachUserFromSession:
if (user) {
  user.role = user.role?.toUpperCase();
  req.user = buildSessionUser(user);
}
```
- Test: Create user with lowercase role, verify auth still works
- Checklist:
  - [ ] Middleware normalizes roles
  - [ ] All role comparisons use uppercase
  - [ ] Database validates role values

**Task 1.4: Add CSRF Protection** (1.5 hours)  
- Install: `npm install csurf cookie-parser`
- Files: `apps/api/src/index.ts`, all route files with mutations
- Setup:
```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Generate token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ token: req.csrfToken() });
});

// All POST/PUT/DELETE requests now checked automatically
```
- Frontend:
```javascript
// On page load, fetch CSRF token
const response = await fetch('/api/csrf-token');
const { token } = await response.json();

// Include in all mutations
fetch('/api/deals', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* data */ })
});
```
- Test: Try POST without token, should fail with 403
- Checklist:
  - [ ] CSRF middleware installed
  - [ ] Token endpoint works
  - [ ] Frontend fetches token on load
  - [ ] Token included in all mutations
  - [ ] Test fails without token

---

### Wednesday-Thursday: Database & Business Logic (6 hours)

**Task 1.5: Implement Payment State Machine** (3 hours)  
- Files: `apps/api/prisma/schema.prisma`, `apps/api/src/routes/payments.ts`
- Schema changes:
```prisma
model Payment {
  id              String    @id
  dealId          String
  status          String    @default("PENDING") // PENDING, APPROVED, RELEASED, PAID
  amount          Float
  
  // Immutable after release
  releasedBy      String?   // Admin who released
  releasedAt      DateTime? // When released
  releasedAmount  Float?    // Amount locked at release
  
  // Audit trail
  createdAt       DateTime  @default(now())
  updatedAt       DateTime
  
  @@index([status])
  @@index([dealId, status])
}

model PaymentStateChange {
  id              String    @id @default(cuid())
  paymentId       String
  previousStatus  String
  newStatus       String
  changedBy       String    // User who made change
  changedAt       DateTime  @default(now())
  reason          String?
  
  @@index([paymentId])
  @@index([changedAt])
}
```
- Route changes:
```typescript
// Only allow valid state transitions
const VALID_TRANSITIONS = {
  PENDING: ['APPROVED', 'CANCELLED'],
  APPROVED: ['RELEASED', 'CANCELLED'],
  RELEASED: ['PAID'],
  PAID: [],
  CANCELLED: []
};

router.patch('/api/payments/:id/status', requireAuth, async (req, res) => {
  const { newStatus } = req.body;
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id }
  });
  
  // Validate transition
  if (!VALID_TRANSITIONS[payment.status]?.includes(newStatus)) {
    throw new Error(`Cannot transition from ${payment.status} to ${newStatus}`);
  }
  
  // Lock amount when releasing
  if (newStatus === 'RELEASED') {
    if (payment.releasedBy) {
      throw new Error('Payment already released - cannot release twice');
    }
  }
  
  // Update payment and log change
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: newStatus,
        ...(newStatus === 'RELEASED' && {
          releasedBy: req.user.id,
          releasedAt: new Date(),
          releasedAmount: payment.amount
        })
      }
    }),
    prisma.paymentStateChange.create({
      data: {
        paymentId: req.params.id,
        previousStatus: payment.status,
        newStatus,
        changedBy: req.user.id
      }
    })
  ]);
  
  res.json({ ok: true });
});
```
- Test: Try invalid transitions, verify rejected
- Checklist:
  - [ ] Migration creates new tables/fields
  - [ ] State machine enforced in code
  - [ ] Cannot release twice
  - [ ] Amount locked on release
  - [ ] Audit trail populated
  - [ ] Tests for all transitions

**Task 1.6: Fix N+1 Query in Brands Endpoint** (1.5 hours)  
- File: `apps/api/src/routes/brands.ts`, line ~380
- Problem: Each deal queries its talent separately
- Solution: Use select instead of include
```typescript
// ❌ BEFORE: N+1
const brand = await prisma.brand.findUnique({
  where: { id: brandId },
  include: {
    deals: { include: { Talent: { include: { User: {} } } } }
  }
});

// ✅ AFTER: Single query
const brand = await prisma.brand.findUnique({
  where: { id: brandId },
  select: {
    id: true,
    name: true,
    deals: {
      select: {
        id: true,
        value: true,
        Talent: {
          select: {
            id: true,
            name: true,
            User: { select: { email: true } }
          }
        }
      }
    }
  }
});

// Or add pagination:
const brand = await prisma.brand.findUnique({
  where: { id: brandId },
  include: {
    deals: {
      take: 50, // Limit results
      skip: 0,
      include: { Talent: true }
    }
  }
});
```
- Test: Monitor query count with /api/deals endpoint, verify < 2 queries
- Checklist:
  - [ ] Fixed brand/creators query
  - [ ] Added pagination
  - [ ] Verified single query
  - [ ] Performance tested

**Task 1.7: Remove Mock Financial Data** (1 hour)  
- Files: `apps/web/src/pages/BrandDashboard.jsx`, `apps/web/src/components/AdminRevenueDashboard.jsx`
- What: Don't show fallback revenue when API fails
```javascript
// ❌ BEFORE:
const revenue = apiData || { revenue: 50000 }; // Fake fallback

// ✅ AFTER:
if (apiError) {
  return <div className="p-4 text-center text-gray-500">Revenue data unavailable</div>;
}
if (!apiData) {
  return <Skeleton />;
}
return <RevenueDisplay data={apiData} />;
```
- Checklist:
  - [ ] Remove hardcoded fallback values
  - [ ] Show error/empty state instead
  - [ ] Test with simulated API failure

---

### Friday: Access Control & Validation (4-5 hours)

**Task 1.8: Add Ownership Validation to File Deletion** (1 hour)  
- File: `apps/api/src/routes/files.ts`
- Schema: Add `uploadedBy` field to File model
```prisma
model File {
  id          String   @id
  // ... existing fields
  uploadedBy  String
  User        User     @relation(fields: [uploadedBy], references: [id])
  @@index([uploadedBy])
}
```
- Route:
```typescript
router.delete('/api/files/:id', requireAuth, async (req, res) => {
  const file = await prisma.file.findUnique({
    where: { id: req.params.id }
  });
  
  if (!file) return res.status(404).json({ error: 'File not found' });
  
  if (file.uploadedBy !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'You cannot delete this file' });
  }
  
  await prisma.file.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
```
- Checklist:
  - [ ] Migration adds uploadedBy field
  - [ ] Ownership check on delete
  - [ ] Admin bypass works
  - [ ] Test as user and admin

**Task 1.9: Fix Deal Visibility Enforcement** (1.5 hours)  
- Files: All deal endpoints (`apps/api/src/routes/deals.ts`)
- Check: GET /deals/{id}, PATCH, DELETE
```typescript
// Helper function
async function verifyDealAccess(dealId: string, userId: string, userRole: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { userId: true, talentId: true }
  });
  
  if (!deal) throw new Error('Deal not found');
  
  const hasAccess = userRole === 'ADMIN' || 
                    deal.userId === userId ||
                    deal.talentId === userId; // Assuming talent linked to user
  
  if (!hasAccess) throw new Error('You do not have access to this deal');
  return deal;
}

// Use in endpoints
router.get('/api/deals/:id', requireAuth, async (req, res) => {
  await verifyDealAccess(req.params.id, req.user.id, req.user.role);
  const deal = await prisma.deal.findUnique({
    where: { id: req.params.id }
  });
  res.json(deal);
});
```
- Checklist:
  - [ ] Helper function created
  - [ ] Applied to GET, PATCH, DELETE
  - [ ] Test as talent, agent, admin
  - [ ] Cross-talent access blocked

**Task 1.10: Add Admin Impersonation Safeguards** (1 hour)  
- File: `apps/api/src/routes/admin.ts`
- Changes:
  1. Limit to SUPERADMIN only (not ADMIN)
  2. Require reason parameter
  3. Log all impersonations
  4. Disable in production or feature-gate it
```typescript
// Require SUPERADMIN, not ADMIN
if (req.user.role !== 'SUPERADMIN') {
  return res.status(403).json({ error: 'Only SUPERADMIN can impersonate' });
}

// Require reason
if (!req.body.reason) {
  return res.status(400).json({ error: 'Reason required for impersonation' });
}

// Log impersonation
await prisma.auditLog.create({
  data: {
    action: 'IMPERSONATE_USER',
    userId: req.user.id,
    entityId: req.params.userId,
    metadata: { reason: req.body.reason }
  }
});

// Disable in production
if (process.env.NODE_ENV === 'production') {
  return res.status(403).json({ error: 'Impersonation disabled in production' });
}
```
- Checklist:
  - [ ] SUPERADMIN only
  - [ ] Reason required
  - [ ] Impersonation logged
  - [ ] Disabled in production

---

## PHASE 2: SECONDARY ISSUES (Week 3) - 10-12 Hours

- [ ] Add timezone handling (UTC conversions)
- [ ] Implement approval state machine (irreversible states)
- [ ] Add comprehensive audit logging
- [ ] Add rate limiting to auth endpoints
- [ ] Add file upload size/type validation
- [ ] Add missing database indexes
- [ ] Add HTTP security headers (CSP, HSTS, etc.)

---

## PHASE 3: NICE-TO-HAVE (Post-Launch)

- [ ] Implement caching layer (Redis)
- [ ] Add pagination to all list endpoints
- [ ] Add API documentation (Swagger)
- [ ] Implement 2FA for admins
- [ ] Add data export functionality (GDPR)
- [ ] Setup distributed tracing
- [ ] Add performance monitoring (APM)

---

## Verification Checklist Before Deployment

- [ ] All 11 critical issues resolved
- [ ] Code reviewed by 2+ engineers
- [ ] Automated tests cover critical paths (80%+ coverage)
- [ ] Manual security testing completed
- [ ] Load tested with 1000+ concurrent users
- [ ] Staging deployment successful
- [ ] Database backups tested and restorable
- [ ] Rollback plan documented and tested
- [ ] Monitoring alerts configured
- [ ] Support team trained
- [ ] Incident response plan reviewed
- [ ] Penetration test by external firm (optional but recommended)

---

## Success Metrics

After remediation, the platform should:

✅ Enforce data ownership on all endpoints  
✅ Have immutable payment workflows  
✅ Use secure authentication (httpOnly cookies)  
✅ Protect against CSRF, XSS, and common attacks  
✅ Have audit logs for all critical actions  
✅ Handle edge cases gracefully  
✅ Scale to 1000+ concurrent users  
✅ Pass security review  
✅ Be ready for live users  

---

**Questions?** Contact the security/platform team  
**Timeline?** 3-4 weeks with 2-3 engineers  
**Risk of skipping?** 🔴 CRITICAL - Do not proceed without fixes

