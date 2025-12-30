# Phase 4: Feature Implementation Plan

## Current State Assessment

### ✅ Already Implemented (Just Need Feature Flags Enabled)

1. **Opportunities Marketplace API**
   - ✅ Full CRUD operations (`/api/opportunities`)
   - ✅ Application workflow (`/api/opportunities/:id/apply`)
   - ✅ Admin review endpoints
   - ✅ Auto-deal creation from approved applications
   - ✅ Creator-facing endpoints (`/api/opportunities/creator/all`)
   - **Status:** Complete, just needs feature flags enabled

2. **Brief Submission API**
   - ✅ Full CRUD operations (`/api/submissions`)
   - ✅ Links to opportunities
   - ✅ File upload support
   - ✅ Revision tracking
   - **Status:** Complete, just needs feature flags enabled

3. **Stripe Integration**
   - ✅ Payment intents (`/api/payments/intent`)
   - ✅ Invoice creation (`/api/payments/invoice`)
   - ✅ Payout webhooks (`/api/payments/stripe/webhook`)
   - ✅ Payout event handling
   - ✅ Creator balance tracking
   - **Status:** Mostly complete, may need payout creation endpoint

### ⚠️ Partially Implemented (Need Completion)

4. **Xero Integration**
   - ⚠️ Connection endpoints exist (`/api/admin/finance/xero/connect`, `/api/admin/finance/xero/sync`)
   - ⚠️ Status endpoint exists
   - ❌ Actual Xero API calls are placeholders
   - ❌ Token refresh not implemented
   - ❌ Invoice sync not implemented
   - **Status:** Structural only, needs real Xero API integration

5. **E-Signature Integration**
   - ⚠️ Infrastructure exists (providers, webhooks, orchestrator)
   - ⚠️ Contract signing endpoints exist
   - ❌ DocuSign provider is stub
   - ❌ Native provider is stub
   - ❌ Actual signature sending not implemented
   - **Status:** Infrastructure ready, needs provider implementation

## Implementation Tasks

### Task 1: Enable Opportunities Marketplace ✅ (Quick Win)

**Status:** API is complete, just enable flags

**Actions:**
1. Enable `BRAND_OPPORTUNITIES_ENABLED: true`
2. Enable `CREATOR_OPPORTUNITIES_ENABLED: true`
3. Enable `BRIEF_APPLICATIONS_ENABLED: true`
4. Enable `CREATOR_SUBMISSIONS_ENABLED: true`
5. Verify frontend pages work with real API

**Files to Change:**
- `apps/web/src/config/features.js`

**Estimated Effort:** 5 minutes

### Task 2: Complete Brief Submission Workflow ✅ (Quick Win)

**Status:** API is complete, just enable flags

**Actions:**
1. Enable `CREATOR_SUBMISSIONS_ENABLED: true`
2. Verify submission endpoints work
3. Test file upload integration

**Files to Change:**
- `apps/web/src/config/features.js`

**Estimated Effort:** 5 minutes

### Task 3: Complete Stripe Payouts

**Status:** Webhooks and event handling exist, need payout creation endpoint

**Actions:**
1. Add endpoint to create Stripe payouts (`POST /api/payments/payout`)
2. Link payouts to deals/contracts
3. Test payout flow end-to-end
4. Enable `PAYOUT_TRACKING_ENABLED: true`

**Files to Change:**
- `apps/api/src/routes/payments.ts` (add payout creation)
- `apps/web/src/config/features.js`

**Estimated Effort:** 1-2 hours

### Task 4: Implement Xero Sync

**Status:** Placeholder routes exist, need real Xero API integration

**Actions:**
1. Install Xero API client (`xero-node` or similar)
2. Implement OAuth flow for Xero
3. Implement token refresh
4. Implement invoice sync (`GET /api/admin/finance/xero/invoices`)
5. Implement invoice creation in Xero
6. Enable `XERO_INTEGRATION_ENABLED: true`

**Files to Change:**
- `apps/api/src/services/xeroService.ts` (new)
- `apps/api/src/routes/admin/finance.ts` (complete Xero endpoints)
- `apps/api/package.json` (add xero-node dependency)
- `apps/web/src/config/features.js`

**Estimated Effort:** 4-6 hours

### Task 5: Implement E-Signature Integration

**Status:** Infrastructure exists, providers are stubs

**Options:**
- **Option A:** DocuSign (requires DocuSign account, API keys)
- **Option B:** HelloSign (requires HelloSign account, API keys)
- **Option C:** Native (custom signing flow)

**Actions:**
1. Choose provider (DocuSign recommended for production)
2. Install provider SDK (`docusign-esign` or `hellosign-sdk`)
3. Implement `sendSignatureRequest()` in provider
4. Implement `getSignedPdf()` in provider
5. Implement `parseWebhook()` in provider
6. Test signature flow end-to-end
7. Enable `CONTRACT_SIGNING_ENABLED: true`

**Files to Change:**
- `apps/api/src/services/signature/providers/docusignProvider.ts` (implement)
- `apps/api/package.json` (add docusign-esign dependency)
- `apps/web/src/config/features.js`

**Estimated Effort:** 3-4 hours (DocuSign) or 2-3 hours (HelloSign)

## Recommended Implementation Order

1. **Enable Opportunities & Submissions** (10 min) - Quick wins, API ready
2. **Complete Stripe Payouts** (1-2 hours) - Mostly done, just needs endpoint
3. **Implement E-Signature** (3-4 hours) - High business value
4. **Implement Xero Sync** (4-6 hours) - Can defer if not critical

## Environment Variables Needed

### For Stripe Payouts:
```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### For Xero:
```bash
XERO_CLIENT_ID=...
XERO_CLIENT_SECRET=...
XERO_REDIRECT_URI=https://...
```

### For DocuSign:
```bash
DOCUSIGN_INTEGRATION_KEY=...
DOCUSIGN_USER_ID=...
DOCUSIGN_ACCOUNT_ID=...
DOCUSIGN_RSA_PRIVATE_KEY=...
SIGN_PROVIDER=docusign
```

### For HelloSign:
```bash
HELLOSIGN_API_KEY=...
SIGN_PROVIDER=hellosign
```

## Acceptance Criteria

### Opportunities Marketplace
- ✅ Brands can create opportunities
- ✅ Creators can browse and apply to opportunities
- ✅ Admin can review applications
- ✅ Approved applications auto-create deals
- ✅ Feature flags enabled

### Brief Submissions
- ✅ Creators can submit brief responses
- ✅ Submissions link to opportunities
- ✅ File uploads work
- ✅ Revision tracking works
- ✅ Feature flags enabled

### Stripe Payouts
- ✅ Payouts can be created via API
- ✅ Webhooks update payout status
- ✅ Creator balances update correctly
- ✅ Feature flags enabled

### Xero Sync
- ✅ Xero OAuth connection works
- ✅ Invoices sync from Xero
- ✅ Invoices can be created in Xero
- ✅ Token refresh works
- ✅ Feature flags enabled

### E-Signature
- ✅ Signature requests can be sent
- ✅ Signers receive emails
- ✅ Webhooks update signature status
- ✅ Signed PDFs are stored
- ✅ Feature flags enabled

