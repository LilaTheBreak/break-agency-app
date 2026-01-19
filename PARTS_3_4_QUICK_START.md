# PARTS 3 & 4 QUICK START GUIDE

## Using the New Components

### Part 3: Brand Feedback

#### Integrate BrandFeedbackForm

```tsx
import BrandFeedbackForm from '@/components/BrandFeedbackForm';

export function CampaignDetailPage({ campaignId }) {
  return (
    <div>
      <h1>Campaign Details</h1>
      <BrandFeedbackForm 
        campaignId={campaignId}
        onSuccess={() => {
          // Refresh campaign data or show success message
          alert('Feedback submitted!');
        }}
        defaultType="CONCERN"
      />
    </div>
  );
}
```

#### Integrate AdminOverridePanel

```tsx
import AdminOverridePanel from '@/components/AdminOverridePanel';

export function CampaignAdminPage({ campaignId }) {
  return (
    <div>
      <h1>Campaign Admin</h1>
      <AdminOverridePanel 
        campaignId={campaignId}
        onSuccess={() => {
          // Refresh pending rejections
          console.log('Override applied');
        }}
      />
    </div>
  );
}
```

### Part 4: Campaign Reports

#### Integrate CampaignReportGenerator

```tsx
import CampaignReportGenerator from '@/components/CampaignReportGenerator';

export function AdminReportingPage({ campaignId, campaignName }) {
  return (
    <div className="p-6">
      <CampaignReportGenerator 
        campaignId={campaignId}
        campaignName={campaignName}
      />
    </div>
  );
}
```

#### Integrate BrandCampaignReportView

```tsx
import BrandCampaignReportView from '@/components/BrandCampaignReportView';

export function BrandReportPage({ campaignId, campaignName }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BrandCampaignReportView 
        campaignId={campaignId}
        campaignName={campaignName}
      />
    </div>
  );
}
```

---

## API Reference

### Feedback Endpoints

#### Submit Feedback
```bash
POST /api/brand/feedback/:campaignId/feedback

Body:
{
  "feedbackType": "REJECTION|APPROVAL|CONCERN|PREFERENCE",
  "content": "Detailed feedback text",
  "relatedShortlistId": "optional_creator_id",
  "signals": ["audience_mismatch", "budget_constraint"]
}

Response: { feedbackId, message, timestamp }
```

#### View Feedback (Brand)
```bash
GET /api/brand/feedback/:campaignId/feedback

Response: { feedback: [], count: number }
```

#### View Feedback (Admin)
```bash
GET /api/admin/feedback/:campaignId/feedback

Response: { 
  campaign: { id, campaignName },
  feedback: [],
  count: number,
  signals: { signal_name: count, ... }
}
```

### Report Endpoints

#### Generate Report
```bash
POST /api/admin/campaigns/:campaignId/report/generate

Response: { 
  reportId, 
  message, 
  report: { executiveSummary, metrics, ... }
}
```

#### View Admin Report
```bash
GET /api/admin/campaigns/:campaignId/report

Response: { 
  report: { id, status, reportContent, ... },
  editable: boolean,
  message: string
}
```

#### Edit Pending Report
```bash
PUT /api/admin/campaigns/:campaignId/report/edit

Body: {
  "reportContent": { ...updated content },
  "editNotes": "What was changed"
}

Response: { message, report }
```

#### Approve Report
```bash
PUT /api/admin/campaigns/:campaignId/report/approve

Body: {
  "approvalNotes": "Optional approval notes"
}

Response: { message, report, brandVisible: true }
```

#### Reject Report
```bash
PUT /api/admin/campaigns/:campaignId/report/reject

Body: {
  "rejectionReason": "Why the report needs changes"
}

Response: { message, report, action: "REGENERATE" }
```

#### View Brand Report
```bash
GET /api/brand/reports/:campaignId

Response: {
  campaignId,
  campaignName,
  generatedAt,
  report: {
    executiveSummary,
    timeline,
    creatorsInvolved,
    performance,
    feedback,
    recommendations,
    nextSteps
  }
}
```

---

## Common Workflows

### Workflow 1: Brand Submits Feedback

1. Brand fills out `BrandFeedbackForm`
2. Component calls `POST /api/brand/feedback/...`
3. Feedback stored + logged
4. Success message shown
5. (Optional) Dashboard refreshes

### Workflow 2: Admin Overrides Rejection

1. Admin views `AdminOverridePanel`
2. Selects rejection to override
3. Provides reasoning (dropdown + optional text)
4. Component calls `PUT /api/admin/shortlist/.../override`
5. Creator status updated
6. Audit log captures action

### Workflow 3: Admin Generates & Approves Report

1. Admin opens `CampaignReportGenerator`
2. Clicks "Generate Report" button
3. AI creates report (shown in component)
4. Admin reviews content
5. [Optional] Clicks "Edit" to modify
6. Clicks "Approve" button
7. Report locked + visible to brand

### Workflow 4: Brand Views Report

1. Brand navigates to campaign
2. Report section shows with "Loading..." initially
3. Report content loads
4. Brand sees: summary, metrics, recommendations (no admin data)
5. Brand clicks "Export" to download

---

## Error Handling

### Common Errors

**403 Forbidden:**
```
"You are not linked to any brand"
→ User not added to BrandUser table

"Only brand users can submit feedback"
→ User role is not BRAND

"Only admins can generate reports"
→ User role is not ADMIN/SUPERADMIN
```

**404 Not Found:**
```
"Campaign not found"
→ Campaign doesn't exist or belongs to different brand

"Report not available yet"
→ Report not approved yet or doesn't exist
```

**400 Bad Request:**
```
"feedbackType and content are required"
→ Validate form before submitting

"Cannot edit approved reports"
→ Can only edit PENDING_APPROVAL status

"Report is not pending approval"
→ Can only approve/reject PENDING_APPROVAL reports
```

---

## Styling & Customization

### BrandFeedbackForm Props
- `campaignId` - Required
- `onSuccess` - Optional callback
- `defaultType` - Optional feedback type

### AdminOverridePanel Props
- `campaignId` - Required
- `onSuccess` - Optional callback

### CampaignReportGenerator Props
- `campaignId` - Required
- `campaignName` - Required for display

### BrandCampaignReportView Props
- `campaignId` - Required
- `campaignName` - Required for display

---

## Permissions Required

For Brand Users:
- Must have `role = 'BRAND'`
- Must be linked to brand via BrandUser table
- Can only access own campaigns

For Admin Users:
- Must have `role = 'ADMIN'` or `role = 'SUPERADMIN'`
- Can access all campaigns
- Can override and approve

---

## Troubleshooting

### Form Won't Submit
- Check browser console for errors
- Verify API endpoints are accessible
- Check user permissions (role, brand link)
- Verify campaign ID is valid

### Report Won't Generate
- Check that campaign exists
- Verify admin user has proper role
- Try refreshing page
- Check browser console for errors

### Brand Can't See Report
- Verify report status is APPROVED
- Check that report was generated
- Verify brand owns the campaign
- Try refreshing page

### Feedback Not Appearing
- Check that feedback was submitted (success message)
- Verify brand owns the campaign
- Try refreshing feedback list
- Check admin can see it in admin view

---

## Performance Notes

- Feedback submissions: ~100ms (depends on network)
- Report generation: ~500-1000ms (AI processing)
- Report loading: ~200-300ms (JSON parsing)
- Override application: ~100ms (depends on network)

For large campaigns, consider:
- Pagination for feedback lists
- Background report generation
- Caching approved reports
- Lazy loading report sections

---

## Next Steps

1. **Integrate Components:** Add to your admin/brand pages
2. **Test Workflows:** Try all 4 main workflows
3. **Customize Styling:** Adapt components to your design
4. **Monitor Usage:** Track feature adoption
5. **Gather Feedback:** Collect user feedback
6. **Plan Enhancements:** Email notifications, exports, etc.

---

## Support

For questions about:
- **API Endpoints:** See PARTS_3_4_SUMMARY.md
- **Code Examples:** See component files (fully commented)
- **Database Schema:** See schema.prisma for CampaignFeedback, CampaignReport
- **Error Codes:** Check error responses in endpoints

Happy shipping! 🚀
