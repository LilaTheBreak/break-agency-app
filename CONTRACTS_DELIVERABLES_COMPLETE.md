# Contracts & Deliverables System - Complete Implementation

**Status**: ✅ COMPLETE  
**Date**: January 2025  
**Approach**: Manual-First (No E-Signature Integration Yet)

---

## 🎯 Overview

This system provides complete contract generation and deliverable tracking **without external e-signature dependencies**. It's designed for agencies that want to start managing contracts and deliverables immediately while planning for future e-signature integration.

### Key Features

1. **Contract Generation from Deals** - Automatic contract creation using deal data
2. **Contract Templates** - Professional influencer agreement templates
3. **PDF Generation** - Convert contracts to styled PDF documents
4. **Manual Signature Tracking** - Track signature dates and status manually
5. **Deliverable Workflow** - Create → Upload Proof → Approve/Reject → Complete
6. **File Upload Integration** - Attach proof of completion files
7. **Timeline Tracking** - All actions logged in DealTimeline
8. **Automatic Deal Advancement** - Deal progresses when all deliverables approved

---

## 📊 Database Schema

### Contract Model

```prisma
model Contract {
  id               String    @id
  dealId           String
  title            String
  fileUrl          String?    // Uploaded contract file
  pdfUrl           String?    // Generated PDF
  status           String    @default("draft")
  sentAt           DateTime?
  talentSignedAt   DateTime?
  brandSignedAt    DateTime?
  fullySignedAt    DateTime?
  terms            Json?      // Contract text and metadata
  templateId       String?    // Template identifier
  metadata         Json?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime
  Deal             Deal      @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId])
  @@index([status])
  @@index([sentAt])
}
```

**Status Values**:
- `draft` - Contract created, not yet sent
- `sent` - Contract sent to parties
- `partially_signed` - One party signed
- `fully_signed` - Both parties signed

### Deliverable Model

```prisma
model Deliverable {
  id              String        @id
  dealId          String
  title           String
  description     String?
  deliverableType String?       // "post", "story", "reel", "video"
  usageRights     String?
  frequency       String?
  dueAt           DateTime?
  approvedAt      DateTime?     // When approved (null = not approved)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime
  Deal            Deal          @relation(fields: [dealId], references: [id], onDelete: Cascade)
}
```

### DeliverableItem Model

```prisma
model DeliverableItem {
  id              String    @id
  dealId          String
  userId          String?
  title           String
  description     String?
  deliverableType String?
  platform        String?
  usageRights     String?
  frequency       String?
  dueDate         DateTime?
  dueAt           DateTime?
  approvedAt      DateTime?
  locked          Boolean?  @default(false)
  status          String    @default("pending")
  metadata        Json?     // Stores fileUrl, deliverableId, etc.
  createdAt       DateTime  @default(now())
  updatedAt       DateTime

  @@index([dealId])
  @@index([status])
  @@index([userId])
}
```

**Status Values**:
- `pending` - Not yet uploaded
- `submitted` - Proof uploaded, awaiting review
- `approved` - Approved by reviewer
- `rejected` - Rejected, needs resubmission

---

## 🚀 API Endpoints

### Contracts API

#### Core CRUD

```
GET    /api/contracts                List all contracts
POST   /api/contracts                Create contract manually
GET    /api/contracts/:id            Get contract details
PUT    /api/contracts/:id            Update contract
DELETE /api/contracts/:id            Delete contract
```

#### Deal Integration

```
GET    /api/deals/:dealId/contracts  List contracts for deal
POST   /api/deals/:dealId/contracts  Create contract from deal (uses template)
```

#### Workflow Actions

```
POST   /api/contracts/:id/generate-pdf   Generate PDF from contract text
POST   /api/contracts/:id/upload          Upload signed contract file
POST   /api/contracts/:id/send            Mark as sent
POST   /api/contracts/:id/sign/talent     Record talent signature
POST   /api/contracts/:id/sign/brand      Record brand signature
POST   /api/contracts/:id/finalise        Mark as fully signed
POST   /api/contracts/:id/analyse         Run AI analysis (future)
```

### Deliverables API (v2)

#### Core CRUD

```
POST   /api/deliverables-v2              Create deliverable
GET    /api/deliverables-v2/:id          Get deliverable
PUT    /api/deliverables-v2/:id          Update deliverable
DELETE /api/deliverables-v2/:id          Delete deliverable
```

#### Workflow Actions

```
POST   /api/deliverables-v2/:id/proof    Upload proof of completion
POST   /api/deliverables-v2/:id/approve  Approve deliverable
POST   /api/deliverables-v2/:id/revise   Request revision
POST   /api/deliverables-v2/:id/reject   Reject deliverable
```

#### Deal Integration

```
GET    /api/deals/:dealId/deliverables-v2      List deliverables for deal
GET    /api/deliverables-v2/:id/items          Get uploaded proofs for deliverable
```

---

## 💼 Contract Generation Workflow

### 1. Create Contract from Deal

```bash
POST /api/deals/{dealId}/contracts
```

**What happens:**
1. Fetches deal with Brand, Talent, and Deliverable data
2. Loads default influencer agreement template
3. Populates template with:
   - Brand name
   - Creator name
   - Deal value
   - Currency
   - Deliverables list (title, type, due date, usage rights)
   - Payment terms
   - Start/end dates
4. Creates Contract record with:
   - `status: "draft"`
   - `terms` JSON containing contract text
   - `templateId: "default-influencer-agreement"`
5. Logs `contract_created` in DealTimeline

**Response:**
```json
{
  "id": "cm5abc123",
  "dealId": "cm5deal456",
  "title": "Acme Corp x Jane Doe Agreement",
  "status": "draft",
  "terms": {
    "contractText": "# Standard Influencer Agreement\n\n...",
    "brandName": "Acme Corp",
    "creatorName": "Jane Doe",
    "dealValue": 5000,
    "currency": "USD",
    "deliverableCount": 3
  },
  "templateId": "default-influencer-agreement",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 2. Generate PDF

```bash
POST /api/contracts/{contractId}/generate-pdf
```

**What happens:**
1. Fetches contract with `terms.contractText` (markdown)
2. Converts markdown to HTML with professional styling:
   - Times New Roman font
   - A4 page size
   - 2cm margins
   - Proper section headings
   - Signature blocks
3. Uses Puppeteer to render HTML as PDF
4. Saves to `/uploads/contracts/{contractId}.pdf`
5. Updates Contract with `pdfUrl: "/uploads/contracts/{contractId}.pdf"`
6. Logs `contract_pdf_generated` in DealTimeline

**Response:**
```json
{
  "id": "cm5abc123",
  "pdfUrl": "/uploads/contracts/cm5abc123.pdf",
  "status": "draft"
}
```

### 3. Send Contract

```bash
POST /api/contracts/{contractId}/send
```

**What happens:**
1. Updates Contract:
   - `status: "sent"`
   - `sentAt: <current timestamp>`
2. Logs `contract_sent` in DealTimeline

**Manual Step:** Admin downloads PDF and emails to parties

### 4. Record Signatures

```bash
# Talent signs
POST /api/contracts/{contractId}/sign/talent

# Brand signs
POST /api/contracts/{contractId}/sign/brand
```

**What happens (per signature):**
1. Updates Contract with signature timestamp:
   - Talent: `talentSignedAt: <timestamp>`
   - Brand: `brandSignedAt: <timestamp>`
2. If only one party signed:
   - `status: "partially_signed"`
   - Logs `contract_signed_talent` or `contract_signed_brand`
3. If both parties signed:
   - `status: "fully_signed"`
   - `fullySignedAt: <timestamp>`
   - Updates Deal: `contractSignedAt: <timestamp>`
   - Logs `contract_fully_signed`

---

## 📦 Deliverable Workflow

### 1. Create Deliverables

**Option A: Create from Contract**
When contract is generated, deliverables are already in deal. You can:

```bash
POST /api/deliverables-v2
{
  "dealId": "cm5deal456",
  "title": "Instagram Reel #1",
  "description": "Product showcase reel",
  "deliverableType": "reel",
  "usageRights": "Organic + Paid for 6 months",
  "frequency": "One-time",
  "dueAt": "2025-02-15T12:00:00Z"
}
```

**Option B: Batch Create from List**
```javascript
const deliverables = [
  { title: "Instagram Reel #1", deliverableType: "reel", dueAt: "2025-02-15" },
  { title: "TikTok Video #1", deliverableType: "video", dueAt: "2025-02-20" },
  { title: "Story Series", deliverableType: "story", dueAt: "2025-02-25" }
];

for (const d of deliverables) {
  await fetch('/api/deliverables-v2', {
    method: 'POST',
    body: JSON.stringify({ ...d, dealId: 'cm5deal456' })
  });
}
```

### 2. Upload Proof of Completion

```bash
POST /api/deliverables-v2/{deliverableId}/proof
{
  "fileUrl": "https://storage.com/files/proof-reel-1.mp4",
  "fileName": "instagram-reel-1.mp4"
}
```

**What happens:**
1. Creates DeliverableItem:
   - `title: "Proof: instagram-reel-1.mp4"`
   - `status: "submitted"`
   - `metadata`: { deliverableId, fileUrl, fileName, uploadedAt }
2. Logs `deliverable_proof_uploaded` in DealTimeline

### 3. Review & Approve

```bash
# Approve
POST /api/deliverables-v2/{deliverableId}/approve

# Request Revision
POST /api/deliverables-v2/{deliverableId}/revise
{
  "reason": "Please adjust color grading"
}

# Reject
POST /api/deliverables-v2/{deliverableId}/reject
{
  "reason": "Does not match brand guidelines"
}
```

**What happens on approval:**
1. Updates Deliverable: `approvedAt: <timestamp>`
2. Logs `deliverable_approved`
3. Checks if ALL deliverables for deal are approved
4. If all approved:
   - Updates Deal: `deliverablesCompletedAt: <timestamp>`
   - Logs `all_deliverables_approved`
   - Deal can advance to payment stage

**What happens on revision/rejection:**
1. Clears `approvedAt` (if previously approved)
2. Updates associated DeliverableItems to `status: "rejected"`
3. Logs action with reason
4. Creator resubmits via `/proof` endpoint

---

## 🏗️ Architecture

### Services

**contractTemplateService.ts**
- Manages contract templates
- Populates templates with deal data
- Generates contract text (markdown format)
- Handles signature status tracking

**pdfGenerationService.ts**
- Converts markdown to styled HTML
- Renders HTML to PDF using Puppeteer
- Manages file storage in `/uploads/contracts/`
- Returns public URLs for PDF access

**contractService.ts**
- Orchestrates contract workflows
- Integrates template and PDF services
- Manages Contract CRUD operations
- Handles timeline logging

**deliverablesService.ts**
- Manages Deliverable lifecycle
- Tracks proof uploads via DeliverableItem
- Approval/revision/rejection workflow
- Automatic deal advancement logic

### Controllers

**contractController.ts**
- HTTP request handlers for contracts API
- Input validation with Zod schemas
- Error handling and response formatting

**deliverablesController.ts**
- HTTP request handlers for deliverables API
- Input validation with Zod schemas
- User context from auth middleware

### Routes

**contracts.ts**
- Contract CRUD endpoints
- Workflow action endpoints
- Deal integration endpoints

**deliverables-v2.ts**
- Deliverable CRUD endpoints
- Proof upload endpoint
- Approval workflow endpoints

---

## 📝 Contract Template Structure

### Default Influencer Agreement

The default template includes these sections:

1. **Parties** - Brand and Creator identification
2. **Scope of Services** - List of deliverables
3. **Compensation** - Deal value and payment terms
4. **Usage Rights** - Content usage permissions
5. **Creator Obligations** - Creator responsibilities
6. **Brand Obligations** - Brand responsibilities
7. **Intellectual Property** - IP rights transfer
8. **Confidentiality** - NDA clause
9. **Term and Termination** - Contract duration and exit
10. **Signatures** - Signature blocks for both parties

### Template Placeholders

```
{{CONTRACT_DATE}}       - Contract creation date
{{BRAND_NAME}}          - Brand.name from deal
{{CREATOR_NAME}}        - Talent.User.name from deal
{{DEAL_VALUE}}          - Deal.value formatted
{{CURRENCY}}            - Deal.currency (USD, EUR, etc.)
{{DELIVERABLES_LIST}}   - Formatted list of deliverables
{{PAYMENT_TERMS}}       - Payment schedule/terms
{{USAGE_RIGHTS}}        - Combined usage rights from deliverables
{{START_DATE}}          - Campaign start date
{{END_DATE}}            - Campaign end date (or +90 days)
```

---

## 🎨 PDF Styling

Generated PDFs use:

- **Font**: Times New Roman (professional/legal standard)
- **Size**: A4 (210mm × 297mm)
- **Margins**: 2cm top/bottom, 2.5cm left/right
- **Headings**: 
  - H1: 18pt, centered, uppercase
  - H2: 13pt, uppercase
  - H3: 11pt, bold
- **Body**: 11pt, 1.6 line height, justified
- **Signatures**: 2cm margin above, signature lines with dates

---

## 🔄 Timeline Events

### Contract Events

```javascript
contract_created          // Contract generated from deal
contract_pdf_generated    // PDF successfully created
contract_uploaded         // Manual contract file uploaded
contract_sent             // Contract sent to parties
contract_signed_talent    // Talent signature recorded
contract_signed_brand     // Brand signature recorded
contract_fully_signed     // Both parties signed
contract_deleted          // Contract removed
```

### Deliverable Events

```javascript
deliverable_created               // Deliverable added to deal
deliverable_due_date_changed      // Due date modified
deliverable_proof_uploaded        // Proof file attached
deliverable_approved              // Deliverable approved
deliverable_revision_requested    // Revision requested
deliverable_rejected              // Deliverable rejected
deliverable_deleted               // Deliverable removed
all_deliverables_approved         // All deliverables complete
```

---

## 🚦 Feature Flags

```javascript
// apps/web/src/config/features.js

CONTRACT_GENERATION_ENABLED: true        // ✅ Template system ready
CONTRACT_MANUAL_TRACKING_ENABLED: true   // ✅ Manual signatures
CONTRACT_SIGNING_ENABLED: false          // ⏸️ E-signature future
DELIVERABLES_WORKFLOW_ENABLED: true      // ✅ Complete workflow
```

---

## 📦 Dependencies

### Backend

```json
{
  "puppeteer": "^24.34.0",  // PDF generation
  "marked": "^17.0.1"        // Markdown to HTML
}
```

### Installation

```bash
cd apps/api
pnpm add puppeteer marked
```

---

## 🧪 Testing Workflow

### 1. Create a Test Deal

```bash
# Ensure deal has:
# - Brand relationship
# - Talent relationship
# - At least 1 Deliverable
# - Deal value set
# - Currency specified
```

### 2. Generate Contract

```bash
curl -X POST http://localhost:3001/api/deals/cm5deal456/contracts \
  -H "Authorization: Bearer {token}"
```

Expected: Contract created with draft status

### 3. Generate PDF

```bash
curl -X POST http://localhost:3001/api/contracts/cm5abc123/generate-pdf \
  -H "Authorization: Bearer {token}"
```

Expected: PDF saved to `/uploads/contracts/cm5abc123.pdf`

### 4. Mark as Sent

```bash
curl -X POST http://localhost:3001/api/contracts/cm5abc123/send \
  -H "Authorization: Bearer {token}"
```

Expected: `sentAt` timestamp set, status = "sent"

### 5. Record Signatures

```bash
# Talent signs
curl -X POST http://localhost:3001/api/contracts/cm5abc123/sign/talent \
  -H "Authorization: Bearer {token}"

# Brand signs
curl -X POST http://localhost:3001/api/contracts/cm5abc123/sign/brand \
  -H "Authorization: Bearer {token}"
```

Expected: Both timestamps set, status = "fully_signed"

### 6. Test Deliverable Workflow

```bash
# Create deliverable
curl -X POST http://localhost:3001/api/deliverables-v2 \
  -H "Authorization: Bearer {token}" \
  -d '{"dealId":"cm5deal456","title":"Test Reel","deliverableType":"reel"}'

# Upload proof
curl -X POST http://localhost:3001/api/deliverables-v2/cm5deliv789/proof \
  -H "Authorization: Bearer {token}" \
  -d '{"fileUrl":"https://example.com/proof.mp4","fileName":"proof.mp4"}'

# Approve
curl -X POST http://localhost:3001/api/deliverables-v2/cm5deliv789/approve \
  -H "Authorization: Bearer {token}"
```

Expected: DeliverableItem created, approval logged, deal check runs

---

## 🔮 Future Enhancements

### E-Signature Integration

When ready to add DocuSign/HelloSign:

1. **Update Contract Model**
   ```prisma
   model Contract {
     // ... existing fields
     esignatureEnvelopeId  String?
     esignatureProvider    String?  // "docusign", "hellosign"
     esignatureStatus      String?
   }
   ```

2. **Add E-Signature Service**
   ```typescript
   // services/esignatureService.ts
   - createEnvelope()
   - sendForSignature()
   - webhookHandler()
   - getSignatureStatus()
   ```

3. **Update Contract Workflow**
   - Replace manual signature endpoints with e-signature flow
   - Keep manual tracking as fallback option
   - Add webhook endpoint for signature completion

4. **Feature Flag**
   ```javascript
   CONTRACT_SIGNING_ENABLED: true
   ```

### AI Contract Review

```typescript
// services/contractAnalysisService.ts
- analyzeContract(contractText)
- identifyRisks()
- suggestImprovements()
- compareToStandard()
```

### Custom Templates

```typescript
// services/contractTemplateService.ts
- createCustomTemplate(name, sections)
- listTemplates()
- selectTemplate(dealId, templateId)
```

---

## 📚 Quick Reference

### Create Contract & Generate PDF

```javascript
// 1. Create from deal
const contract = await fetch('/api/deals/cm5deal456/contracts', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Generate PDF
const withPdf = await fetch(`/api/contracts/${contract.id}/generate-pdf`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 3. Download PDF
window.open(withPdf.pdfUrl, '_blank');
```

### Complete Signature Flow

```javascript
// Send
await fetch(`/api/contracts/${id}/send`, { method: 'POST' });

// Record signatures (manually after parties sign)
await fetch(`/api/contracts/${id}/sign/talent`, { method: 'POST' });
await fetch(`/api/contracts/${id}/sign/brand`, { method: 'POST' });

// Check status
const contract = await fetch(`/api/contracts/${id}`).then(r => r.json());
console.log(contract.status); // "fully_signed"
```

### Complete Deliverable Approval

```javascript
// Upload proof
await fetch(`/api/deliverables-v2/${id}/proof`, {
  method: 'POST',
  body: JSON.stringify({
    fileUrl: 'https://storage.com/file.mp4',
    fileName: 'deliverable-proof.mp4'
  })
});

// Approve
await fetch(`/api/deliverables-v2/${id}/approve`, { method: 'POST' });

// Check if deal complete
const deliverables = await fetch(`/api/deals/${dealId}/deliverables-v2`)
  .then(r => r.json());
const allApproved = deliverables.every(d => d.approvedAt !== null);
```

---

## ✅ Implementation Checklist

- [x] Contract model added to database schema
- [x] Contract templates service created
- [x] PDF generation service implemented
- [x] Contract service with workflow methods
- [x] Contract controller and routes
- [x] Deliverable service with approval workflow
- [x] Deliverable controller and routes
- [x] Timeline logging for all actions
- [x] Feature flags enabled
- [x] Routes registered in server
- [x] Puppeteer and marked dependencies installed
- [x] File upload directory configured
- [x] Manual signature tracking implemented
- [x] Automatic deal advancement on full approval
- [x] Documentation complete

---

## 🎉 Summary

The Contracts & Deliverables system is now **fully operational** with:

- ✅ **Contract Generation**: Automatic creation from deal data using templates
- ✅ **PDF Generation**: Professional PDF documents with proper styling
- ✅ **Manual Signature Tracking**: Track signature dates without e-signature integration
- ✅ **Deliverable Workflow**: Complete upload → review → approve cycle
- ✅ **File Upload**: Attach proof files to deliverables
- ✅ **Timeline Tracking**: All actions logged for audit trail
- ✅ **Automatic Progression**: Deal advances when deliverables complete

**Ready for production use!** 🚀

The system can be extended with e-signature integration later without changing the core architecture. All manual processes can be kept as fallback options even after automation is added.
