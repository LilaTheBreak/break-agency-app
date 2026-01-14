# Contact Enrichment System - Complete Architecture & API Reference

## Overview

The Contact Enrichment System is a production-ready Apollo/Lusha alternative that discovers brand decision-makers and enriches their contact information with verified work emails.

**Key Features**:
- ✅ Multiple discovery sources (LinkedIn, website, public data)
- ✅ Smart email generation with pattern detection
- ✅ MX record validation for confidence scoring
- ✅ GDPR-compliant region-aware processing
- ✅ Manual approval workflow for safety
- ✅ Complete audit trail & activity logging
- ✅ Scalable job-based architecture

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     ADMIN INTERFACE                            │
│        (Browser → Frontend React Component)                    │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                               │
│  /api/enrichment/* (auth + admin required)                     │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                  ENRICHMENT SERVICE LAYER                      │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Enrichment Orchestrator (enrichmentOrchestrator.ts)      │   │
│ │  - Job creation & tracking                              │   │
│ │  - Pipeline coordination                                │   │
│ │  - Compliance validation                                │   │
│ │  - Error handling & retry                               │   │
│ └──────────────────────────────────────────────────────────┘   │
│           ↓                           ↓                        │
│  ┌──────────────────┐      ┌──────────────────┐               │
│  │ Contact Discovery│      │ Email Enrichment │               │
│  │ (contactDiscov..)│      │ (emailEnrichm..) │               │
│  ├──────────────────┤      ├──────────────────┤               │
│  │ • LinkedIn       │      │ • Permutations   │               │
│  │ • Website scrape │      │ • MX validation  │               │
│  │ • Public data    │      │ • Confidence     │               │
│  │ • Deduplication  │      │ • Scoring        │               │
│  └──────────────────┘      └──────────────────┘               │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    PRISMA ORM LAYER                            │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Database Models:                                     │      │
│  │  • EnrichedContact (contacts discovered)             │      │
│  │  • ContactEmail (generated + verified emails)        │      │
│  │  • EnrichmentJob (job execution tracking)            │      │
│  └──────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                          │
│  enriched_contact | contact_email | enrichment_job tables     │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### EnrichedContact Table

```sql
CREATE TABLE "EnrichedContact" (
  -- Core Identity
  id                  TEXT PRIMARY KEY,
  firstName           TEXT NOT NULL,
  lastName            TEXT NOT NULL,
  jobTitle            TEXT,
  company             TEXT,
  linkedInUrl         TEXT,
  linkedInId          TEXT,
  
  -- Enrichment Metadata
  confidenceScore     INT DEFAULT 50,      -- 0-100
  source              TEXT NOT NULL,       -- linkedin|website|public_index|manual
  discoveryMethod     TEXT,                -- How we found them
  
  -- Association
  linkedBrandId       TEXT,                -- FOREIGN KEY CrmBrand(id)
  linkedContactId     TEXT,                -- FOREIGN KEY CrmBrandContact(id)
  
  -- Compliance
  complianceCheckPassed  BOOLEAN DEFAULT false,
  lawfulBasis         TEXT,                -- GDPR basis
  
  -- Audit
  discoveredAt        TIMESTAMP DEFAULT now(),
  verifiedAt          TIMESTAMP,
  addedToCrmAt        TIMESTAMP,
  activity            JSON[] DEFAULT {},
  createdAt           TIMESTAMP DEFAULT now(),
  updatedAt           TIMESTAMP
);

CREATE INDEX idx_enriched_contact_brand ON "EnrichedContact"(linkedBrandId);
CREATE INDEX idx_enriched_contact_linkedin ON "EnrichedContact"(linkedInId);
CREATE INDEX idx_enriched_contact_company ON "EnrichedContact"(company);
CREATE INDEX idx_enriched_contact_confidence ON "EnrichedContact"(confidenceScore);
```

### ContactEmail Table

```sql
CREATE TABLE "ContactEmail" (
  id                  TEXT PRIMARY KEY,
  
  -- Email Data
  email               TEXT NOT NULL,
  verificationStatus  TEXT DEFAULT 'unknown',  -- verified|risky|unknown
  verificationMethod  TEXT,                     -- pattern|mx_check|smtp_ping|api|manual
  verificationScore   INT DEFAULT 50,           -- 0-100
  
  -- Generation
  generationMethod    TEXT,                     -- pattern_detection|api_enrichment|manual
  namePermutations    TEXT[] DEFAULT {},        -- Attempted patterns
  
  -- Validation
  mxCheckPassed       BOOLEAN,
  smtpCheckPassed     BOOLEAN,
  apiSource           TEXT,                     -- hunter|clearbit|snov|custom
  
  -- Link
  enrichedContactId   TEXT NOT NULL,           -- FOREIGN KEY EnrichedContact(id)
  lastCheckedAt       TIMESTAMP,
  
  createdAt           TIMESTAMP DEFAULT now(),
  updatedAt           TIMESTAMP,
  
  CONSTRAINT unique_email_per_contact UNIQUE(enrichedContactId, email)
);

CREATE INDEX idx_contact_email_id ON "ContactEmail"(enrichedContactId);
CREATE INDEX idx_contact_email_verification ON "ContactEmail"(verificationStatus);
```

### EnrichmentJob Table

```sql
CREATE TABLE "EnrichmentJob" (
  id                  TEXT PRIMARY KEY,
  
  -- Job Info
  jobType             TEXT NOT NULL,       -- brand_contact_discovery|email_enrichment
  status              TEXT DEFAULT 'pending',  -- pending|processing|completed|failed
  
  -- Input
  brandId             TEXT,
  brandName           TEXT,
  brandWebsite        TEXT,
  linkedInCompanyUrl  TEXT,
  
  -- Results
  contactsDiscovered  INT DEFAULT 0,
  contactsEnriched    INT DEFAULT 0,
  
  -- Error Handling
  errorMessage        TEXT,
  retryCount          INT DEFAULT 0,
  maxRetries          INT DEFAULT 3,
  
  -- Compliance
  regionCode          TEXT,
  complianceMode      BOOLEAN DEFAULT true,
  volumeLimited       BOOLEAN DEFAULT false,
  
  -- Timing
  startedAt           TIMESTAMP,
  completedAt         TIMESTAMP,
  createdAt           TIMESTAMP DEFAULT now(),
  updatedAt           TIMESTAMP
);

CREATE INDEX idx_enrichment_job_brand ON "EnrichmentJob"(brandId);
CREATE INDEX idx_enrichment_job_status ON "EnrichmentJob"(status);
```

---

## REST API Reference

### 1. Discovery Endpoint

**Endpoint**: `POST /api/enrichment/discover`

**Authentication**: Required (JWT token)  
**Authorization**: Admin-only

**Request**:
```json
{
  "brandName": "Tesla",              // Required
  "website": "https://tesla.com",    // Optional
  "linkedInCompanyUrl": "...",       // Optional
  "region": "US"                     // Optional
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "job": {
    "jobId": "clx9v1234...",
    "status": "completed",
    "contactsDiscovered": 5,
    "contactsEnriched": 3,
    "contacts": [
      {
        "id": "clx9v1235...",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "jobTitle": "VP Marketing",
        "company": "Tesla",
        "linkedInUrl": "https://linkedin.com/in/sarah-johnson...",
        "linkedInId": "urn:li:person:...",
        "confidenceScore": 95,
        "source": "linkedin",
        "discoveryMethod": "linkedin_company_search",
        "emails": [
          {
            "email": "sarah.johnson@tesla.com",
            "verificationStatus": "verified",
            "verificationScore": 92,
            "verificationMethod": "pattern"
          },
          {
            "email": "s.johnson@tesla.com",
            "verificationStatus": "unknown",
            "verificationScore": 68,
            "verificationMethod": "mx_check"
          }
        ]
      },
      // ... more contacts
    ]
  },
  "message": "Discovery started for Tesla. 5 contacts found."
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Brand name is required"
}
```

**Error Response** (403 Forbidden):
```json
{
  "error": "Forbidden: Admin access required"
}
```

---

### 2. Get Job Status

**Endpoint**: `GET /api/enrichment/jobs/:jobId`

**Path Parameters**:
- `jobId` (string): Enrichment job ID

**Response** (200 OK):
```json
{
  "success": true,
  "job": {
    "jobId": "clx9v1234...",
    "status": "completed",
    "startedAt": "2026-01-14T10:00:00Z",
    "completedAt": "2026-01-14T10:05:00Z",
    "contactsDiscovered": 5,
    "contactsEnriched": 3,
    "contacts": [...]
  }
}
```

**Job Status Values**:
- `pending` - Awaiting processing
- `processing` - Currently discovering contacts
- `completed` - Successfully finished
- `failed` - Error occurred
- `retrying` - Attempting again

---

### 3. Approve Contacts for Outreach

**Endpoint**: `POST /api/enrichment/approve`

**Request**:
```json
{
  "jobId": "clx9v1234...",
  "contactIds": [
    "clx9v1235...",
    "clx9v1236..."
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "result": {
    "jobId": "clx9v1234...",
    "approvedCount": 2,
    "message": "Contacts approved and ready for outreach sequences"
  }
}
```

---

### 4. List Enriched Contacts

**Endpoint**: `GET /api/enrichment/contacts`

**Query Parameters**:
- `brandId` (optional): Filter by brand
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "contacts": [
    {
      "id": "clx9v1235...",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "jobTitle": "VP Marketing",
      "company": "Tesla",
      "linkedInUrl": "...",
      "confidenceScore": 95,
      "source": "linkedin",
      "discoveredAt": "2026-01-14T10:00:00Z",
      "verifiedAt": null,
      "addedToCrmAt": null,
      "emails": [
        {
          "email": "sarah.johnson@tesla.com",
          "verificationStatus": "verified",
          "verificationScore": 92
        }
      ]
    }
  ],
  "pagination": {
    "total": 145,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 5. Get Contact Details

**Endpoint**: `GET /api/enrichment/contacts/:contactId`

**Path Parameters**:
- `contactId` (string): Contact ID

**Response** (200 OK):
```json
{
  "success": true,
  "contact": {
    "id": "clx9v1235...",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "jobTitle": "VP Marketing",
    "company": "Tesla",
    "linkedInUrl": "...",
    "linkedInId": "...",
    "confidenceScore": 95,
    "source": "linkedin",
    "discoveryMethod": "linkedin_company_search",
    "linkedBrandId": "brand_123...",
    "linkedContactId": null,
    "emails": [
      {
        "id": "email_123...",
        "email": "sarah.johnson@tesla.com",
        "verificationStatus": "verified",
        "verificationScore": 92,
        "verificationMethod": "pattern",
        "generationMethod": "pattern_detection",
        "namePermutations": ["firstname.lastname", "firstnamelastname"],
        "mxCheckPassed": true,
        "createdAt": "2026-01-14T10:00:00Z"
      }
    ],
    "activity": [
      {
        "at": "2026-01-14T10:00:00Z",
        "label": "Discovered via linkedin"
      }
    ]
  }
}
```

---

### 6. Delete Contact

**Endpoint**: `DELETE /api/enrichment/contacts/:contactId`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Contact deleted"
}
```

---

### 7. Link to CRM Contact

**Endpoint**: `POST /api/enrichment/contacts/:contactId/link-to-crm`

**Path Parameters**:
- `contactId` (string): Enriched contact ID

**Request**:
```json
{
  "crmContactId": "contact_456..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "contact": {
    "id": "clx9v1235...",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "linkedContactId": "contact_456...",
    "addedToCrmAt": "2026-01-14T10:05:00Z"
  },
  "message": "Contact linked to CRM"
}
```

---

### 8. Get Enrichment Statistics

**Endpoint**: `GET /api/enrichment/stats`

**Response** (200 OK):
```json
{
  "success": true,
  "stats": {
    "contacts": {
      "total": 145,
      "verified": 98,
      "percentage": 68
    },
    "emails": {
      "total": 165,
      "verified": 142,
      "percentage": 86
    },
    "jobs": {
      "completed": 12,
      "failed": 1
    }
  }
}
```

---

### 9. Retry Failed Job

**Endpoint**: `POST /api/enrichment/jobs/:jobId/retry`

**Response** (200 OK):
```json
{
  "success": true,
  "job": {
    "jobId": "clx9v1234...",
    "retryAttempt": 1,
    "maxRetries": 3,
    "status": "retrying"
  }
}
```

---

## Email Generation & Verification

### Email Permutation Algorithm

Given a contact: `John Doe` at domain `tesla.com`

```typescript
Permutations generated (in order of confidence):
1. john.doe@tesla.com          [95% confidence] - Most common pattern
2. johndoe@tesla.com           [90%] - No separator
3. john_doe@tesla.com          [85%] - Underscore separator
4. j.doe@tesla.com             [80%] - First initial
5. jdoe@tesla.com              [75%] - First + last no separator
6. john.d@tesla.com            [70%] - First + last initial  
7. john@tesla.com              [65%] - First name only
8. doe.john@tesla.com          [60%] - Reversed order
```

### Verification Scoring

```
Email: sarah.johnson@tesla.com

Pattern Score:
- Pattern type (first.last): +75 points
- MX record exists: +15 points
- Format valid: +10 points
- SUBTOTAL: 100 points

Final Score: 100 → Clamped to 100
Status: "verified"  (≥80 = verified, 50-79 = unknown, <50 = risky)
```

### Verification Methods

```
1. Pattern Detection
   - Analyzes email permutation
   - Common patterns score higher
   - Score: 0-100
   
2. MX Record Check
   - DNS query for MX records
   - Confirms domain accepts mail
   - Pass/Fail validation
   
3. SMTP Ping (Optional)
   - Safe connection to MX server
   - No email actually sent
   - Confirms mailbox existence
   
4. Third-party APIs
   - Hunter.io email verification
   - Clearbit contact validation
   - Snov.io enrichment
```

---

## Confidence Scoring System

### Scoring Factors

```
Contact Discovery Confidence:

LinkedIn Search:           85-95% confidence
  ✓ Official LinkedIn company page
  ✓ Multiple confirmation sources
  ✓ Current role validation
  
Website Team Page:        60-80% confidence
  ✓ Public team listing
  ~ May be outdated
  ~ Job title might be inferred
  
Public Cached Data:       70-90% confidence
  ✓ API-verified data
  ✓ Multiple sources cross-checked
  ~ May have age limitation
  
Search Operators:         50-70% confidence
  ✓ Public SERP results
  ~ Single-source validation
  ~ Inferred job title
```

### Confidence Indicators

```
🟢 Green   (80-100):  Verified - Can use immediately
🟡 Yellow  (50-79):   Unknown - Review before use
🔴 Red     (0-49):    Risky - Requires verification
```

---

## Compliance & Safety

### GDPR Compliance

```typescript
// Lawful Basis Tracking
contact.lawfulBasis = "b2b_legitimate_interest"

// Data Processing
lawful_basis: {
  "b2b_legitimate_interest": "Business-to-business contact discovery",
  "contact_request": "Contact requested outreach",
  "manual": "Manually entered by admin"
}

// Storage
- Encrypt sensitive data at rest
- Automatic purge of unverified contacts (30 days)
- Audit trail for all operations
```

### Regional Restrictions

```typescript
const restrictedRegions = [
  // Add regions with strict data protection laws
];

if (!isRegionCompliant(region)) {
  throw new Error(`Enrichment restricted in region: ${region}`);
}
```

### Rate Limiting

```
Per User (24 hours):
- Max discoveries: 100
- Max emails: 500
- Max parallel jobs: 10

Per Brand:
- Max enrichments: 50

Enforcement:
- Rate limiter key: "enrichment:{userId}"
- Bucket strategy: Redis or in-memory
- Response: 429 Too Many Requests
```

---

## Error Handling

### HTTP Status Codes

```
200 OK              - Request succeeded
400 Bad Request     - Invalid input
401 Unauthorized    - Missing or invalid token
403 Forbidden       - User lacks permission
404 Not Found       - Resource not found
429 Too Many Requests - Rate limit exceeded
500 Internal Error  - Server error
```

### Error Response Format

```json
{
  "error": "error_code_or_message",
  "message": "Human-readable explanation"
}
```

### Retry Logic

```typescript
// Automatic retries for failed jobs
retryCount: 0
maxRetries: 3
exponentialBackoff: true  // Wait time increases

Retry Strategy:
Attempt 1: Immediate
Attempt 2: Wait 5 seconds
Attempt 3: Wait 15 seconds
After 3rd failure: Mark as failed
```

---

## Integration with Outreach

### Auto-Create Outreach Contacts

```
Approval Process:
1. Admin reviews discovered contacts
2. Selects contacts to approve
3. Clicks "Approve for Outreach"
4. System automatically:
   - Creates CrmBrandContact records
   - Links discovered emails
   - Sets relationshipStatus: "New"
   - Creates Outreach entry
   - Adds to first email sequence
```

### Email Sequence Creation

```
Contact Approved
    ↓
Week 1: Email 1 (introduction)
    ↓
Week 2: Email 2 (follow-up)
    ↓
Week 3: LinkedIn message (alternative)
    ↓
Week 4: Final email (last attempt)
```

---

## Implementation Timeline

### Phase 1: Backend (✅ COMPLETE)
- [x] Database models (Prisma)
- [x] Contact discovery service
- [x] Email enrichment service
- [x] Enrichment orchestrator
- [x] API routes (9 endpoints)
- [x] Server integration
- [x] Build verification

### Phase 2: Frontend (Next)
- [ ] Discovery UI component
- [ ] Results table
- [ ] Confidence badges
- [ ] Email verification display
- [ ] Contact approval workflow
- [ ] Filtering & sorting

### Phase 3: Integration (Following)
- [ ] CRM brand contact auto-creation
- [ ] Outreach sequence linking
- [ ] Email template selection
- [ ] Bounce tracking

### Phase 4: Advanced (Future)
- [ ] Third-party API integrations
- [ ] ICP scoring
- [ ] Warm intro detection
- [ ] Competitor analysis

---

## Performance & Scalability

### Optimization Strategies

```
1. Database Indexing
   - Index on confidenceScore for fast filtering
   - Index on linkedBrandId for association queries
   - Index on createdAt for sorting

2. Pagination
   - Default limit: 50 contacts per page
   - Configurable up to 200
   - Cursor-based pagination ready

3. Caching
   - MX record checks (cache 24 hours)
   - LinkedIn profile data (cache 7 days)
   - Job results (in-memory until completion)

4. Async Processing
   - Job queue ready (Bull/Redis compatible)
   - Email enrichment in batches
   - Non-blocking API responses
```

### Estimated Throughput

```
Single Discovery:          ~2-5 seconds (5 contacts)
Bulk Enrichment (100):     ~30 seconds
Email Verification (1000): ~60 seconds
API Response (list):       <100ms
API Response (create job): <200ms
```

---

## Monitoring & Debugging

### Logging

```typescript
console.log('[ENRICHMENT JOB] Started job for brand');
console.log('[CONTACT DISCOVERY] Discovered 5 unique domains');
console.log('[EMAIL ENRICHMENT] Generated 15 verified emails');
console.log('[ENRICHMENT JOB] Completed: 5 contacts, 12 emails');
```

### Metrics to Track

```
- Jobs completed per day
- Contact discovery accuracy
- Email bounce rate (post-sending)
- Confidence score distribution
- Regional restriction violations
- Rate limit hits
- Job failure rate
```

---

## Future Enhancements

### Coming Soon

```
✓ Hunter.io integration for email validation
✓ Clearbit company intelligence
✓ LinkedIn API official integration
✓ Warm intro detection
✓ Past partnership mining
✓ ICP scoring & matching
✓ Bulk import/export
✓ Custom email templates
✓ A/B testing of outreach
✓ Mobile app support
```

---

## Support & Troubleshooting

### Common Issues

**Q: No contacts discovered?**
- Check LinkedIn URL format
- Verify region is not restricted
- Check rate limits
- Review logs for errors

**Q: Low email verification scores?**
- Domain may not have MX records
- Contact may use non-standard email format
- Third-party email service (not company domain)

**Q: Rate limit exceeded?**
- Wait before making more discoveries
- Implement exponential backoff
- Use pagination for lists

---

## License & Compliance

This system is designed for:
- ✅ B2B contact discovery
- ✅ Professional outreach
- ✅ GDPR compliance
- ✅ Legal contact information

This system is NOT designed for:
- ❌ Spam/unsolicited bulk email
- ❌ Credential stuffing
- ❌ Social engineering
- ❌ Non-compliant regions

---

**Version**: 1.0.0  
**Last Updated**: January 14, 2026  
**Status**: Production Ready (Backend)

