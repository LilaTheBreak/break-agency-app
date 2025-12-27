# Contracts & Deliverables - Quick Start Guide

**For**: Agency Team, Brand Managers, Account Managers  
**System Status**: ✅ Fully Operational  
**Last Updated**: January 2025

---

## 🚀 Quick Start

### Contract Generation (3 Steps)

```bash
# 1. Generate contract from deal
POST /api/deals/{dealId}/contracts

# 2. Generate PDF
POST /api/contracts/{contractId}/generate-pdf

# 3. Download PDF and email to parties
GET /uploads/contracts/{contractId}.pdf
```

### Manual Signature Tracking

```bash
# Mark as sent (after emailing)
POST /api/contracts/{contractId}/send

# Record talent signature (after they sign)
POST /api/contracts/{contractId}/sign/talent

# Record brand signature (after they sign)
POST /api/contracts/{contractId}/sign/brand

# Auto-advances to "fully_signed" when both sign
```

### Deliverable Workflow

```bash
# 1. Creator uploads proof
POST /api/deliverables-v2/{deliverableId}/proof
{
  "fileUrl": "https://storage.com/proof.mp4",
  "fileName": "proof.mp4"
}

# 2. Manager reviews and approves/rejects
POST /api/deliverables-v2/{deliverableId}/approve
# OR
POST /api/deliverables-v2/{deliverableId}/revise
{
  "reason": "Please adjust color grading"
}

# 3. System checks if all deliverables approved
# If yes: Deal.deliverablesCompletedAt is set
```

---

## 📋 Contract Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `draft` | Contract created, not sent yet | Generate PDF → Send |
| `sent` | Contract sent to parties | Wait for signatures |
| `partially_signed` | One party signed | Wait for other party |
| `fully_signed` | Both parties signed | Contract complete! |

---

## 📦 Deliverable Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| No `approvedAt` | Waiting for proof or approval | Upload proof |
| Has `approvedAt` | Approved | None (complete) |

**DeliverableItem Status:**
| Status | Meaning |
|--------|---------|
| `pending` | No proof uploaded |
| `submitted` | Proof uploaded, awaiting review |
| `approved` | Approved |
| `rejected` | Rejected, needs resubmission |

---

## 🎯 Common Workflows

### New Deal → Contract → Signatures

```
1. Deal created in CRM
2. POST /api/deals/{dealId}/contracts (creates draft contract)
3. POST /api/contracts/{contractId}/generate-pdf (generates PDF)
4. Download PDF from /uploads/contracts/{contractId}.pdf
5. Email PDF to brand and talent
6. POST /api/contracts/{contractId}/send (marks as sent)
7. After talent signs: POST /api/contracts/{contractId}/sign/talent
8. After brand signs: POST /api/contracts/{contractId}/sign/brand
9. System auto-updates deal.contractSignedAt
```

### Contract Signed → Deliverables → Approval

```
1. Contract fully signed
2. Deal.deliverables already created (from contract generation)
3. Creator completes work and uploads proof:
   POST /api/deliverables-v2/{id}/proof
4. Manager reviews in admin panel
5. Manager approves: POST /api/deliverables-v2/{id}/approve
   OR requests revision: POST /api/deliverables-v2/{id}/revise
6. Repeat for all deliverables
7. When last deliverable approved:
   - System sets deal.deliverablesCompletedAt
   - Logs "all_deliverables_approved" event
   - Deal can advance to payment stage
```

---

## 📝 Contract Template

The default template includes:

1. **Parties** - Brand and creator info
2. **Scope** - List of deliverables from deal
3. **Compensation** - Deal value and payment terms
4. **Usage Rights** - Content usage permissions
5. **Obligations** - Responsibilities for both parties
6. **IP Rights** - Content ownership
7. **Confidentiality** - NDA clause
8. **Term & Termination** - Duration and exit terms
9. **Signatures** - Signature blocks

**Populated automatically from:**
- Deal.brandName → Brand name
- Deal.Talent.User.name → Creator name
- Deal.value → Compensation amount
- Deal.currency → Currency
- Deal.Deliverable[] → Deliverables list
- Deal.campaignLiveAt → Start date

---

## 🔍 Finding Contracts & Deliverables

### List all contracts for a deal
```
GET /api/deals/{dealId}/contracts
```

### Get contract details
```
GET /api/contracts/{contractId}
```

### List deliverables for a deal
```
GET /api/deals/{dealId}/deliverables-v2
```

### Get deliverable proof uploads
```
GET /api/deliverables-v2/{deliverableId}/items
```

---

## ⚠️ Important Notes

### Contracts
- **No E-Signature Yet**: Signatures are tracked manually. We email PDFs and record signature dates after parties sign offline.
- **PDF Storage**: PDFs stored in `/uploads/contracts/`. In production, move to S3/CDN.
- **Template Customization**: Currently one template. Custom templates coming in future update.

### Deliverables
- **File Upload**: `fileUrl` must be publicly accessible URL (use existing file upload system).
- **Multiple Proofs**: Can upload multiple proofs per deliverable via repeated `/proof` calls.
- **Revision Loop**: Unlimited revisions supported. Just request revision and creator resubmits.
- **Auto-Advancement**: Deal only advances when ALL deliverables approved.

---

## 🛠️ Troubleshooting

### PDF Generation Fails

**Symptom**: 500 error on `/generate-pdf`  
**Cause**: Puppeteer not installed or contract has no text  
**Fix**:
```bash
cd apps/api
pnpm install puppeteer
```

### Contract Missing Template Text

**Symptom**: Contract created but no `terms.contractText`  
**Cause**: Deal missing Brand or Talent relationships  
**Fix**: Ensure deal has valid `brandId` and `talentId` before creating contract

### Deliverable Won't Approve

**Symptom**: Deliverable approval fails  
**Cause**: Invalid deliverable ID or missing deal relationship  
**Fix**: Verify deliverable exists and has valid `dealId`

### PDF Not Accessible

**Symptom**: 404 on PDF URL  
**Cause**: `/uploads/contracts/` directory not created or not served statically  
**Fix**:
```javascript
// In server.ts, ensure:
app.use('/uploads', express.static('uploads'));
```

---

## 📊 Timeline Events

All contract and deliverable actions are logged in `DealTimeline`. Check timeline to audit:

- When contract was created
- When PDF was generated
- When contract was sent
- When each party signed
- When deliverables were uploaded
- When deliverables were approved/rejected
- When all deliverables completed

```
GET /api/deal-timeline?dealId={dealId}
```

---

## 🔮 Future Features

Coming soon:

- [ ] **E-Signature Integration** (DocuSign/HelloSign)
- [ ] **Custom Contract Templates** (per brand or deal type)
- [ ] **AI Contract Review** (risk analysis, improvement suggestions)
- [ ] **Bulk Actions** (approve all deliverables, batch signature)
- [ ] **Deliverable Reminders** (automated due date notifications)
- [ ] **Performance Tracking** (deliverable quality scoring)

---

## 📞 Support

For questions or issues:

1. Check full docs: `CONTRACTS_DELIVERABLES_COMPLETE.md`
2. Review timeline events for debugging
3. Verify feature flags enabled in `apps/web/src/config/features.js`
4. Check API logs for error details

---

## ✅ Quick Checklist

Before using the system, verify:

- [ ] Contract model exists in database (run migrations)
- [ ] Puppeteer installed (`pnpm add puppeteer marked`)
- [ ] `/uploads/contracts/` directory exists
- [ ] Feature flags enabled:
  - `CONTRACT_GENERATION_ENABLED: true`
  - `CONTRACT_MANUAL_TRACKING_ENABLED: true`
  - `DELIVERABLES_WORKFLOW_ENABLED: true`
- [ ] Routes registered in `server.ts`:
  - `/api/contracts`
  - `/api/deliverables-v2`

---

**Ready to use!** 🎉

Generate your first contract with:
```bash
curl -X POST http://localhost:3001/api/deals/{yourDealId}/contracts \
  -H "Authorization: Bearer {yourToken}"
```
