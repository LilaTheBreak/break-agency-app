# Advanced Export Features - Quick Start Guide

## 🎯 What's New?

You now have professional-grade export capabilities for closed deals with 3 formats, custom field selection, and automated email reports.

---

## 📊 Export Formats

### CSV Export
- **Use for**: Spreadsheet analysis, data import, universal compatibility
- **File size**: Small
- **Features**: All data in flat rows, proper escaping for special characters
- **Open with**: Excel, Google Sheets, Numbers, LibreOffice

### PDF Export  
- **Use for**: Printing, professional reports, presentations
- **File size**: Medium
- **Features**: Formatted tables, summary metrics, multi-page support, professional styling
- **Open with**: PDF reader, browser, preview

### XLSX (Excel) Export
- **Use for**: Detailed analysis, formulas, pivot tables
- **File size**: Small-Medium
- **Features**: Two sheets (Summary metrics + Closed Deals data), formatted columns
- **Open with**: Excel, Google Sheets, Numbers

---

## 🚀 How to Use - Step by Step

### Step 1: Navigate to Closed Deals
1. Go to Admin → Select a Talent
2. Click the "Opportunities" or "Deals" tab
3. Select the "Closed" tab (third tab)

### Step 2: Select Fields to Export (Optional)
1. Click **"⚙️ Show Fields"** button
2. Check/uncheck fields you want to include:
   - Brand
   - Campaign  
   - Status (Won/Lost)
   - Value
   - Currency
   - Payment Status
   - Closed Date
   - Notes
3. Click **"Select All"** to quickly enable all fields
4. Click **"⚙️ Hide Fields"** to collapse selector

### Step 3: Choose Export Format
Click one of the export buttons:
- **📥 CSV** - Spreadsheet format
- **📊 PDF** - Professional report
- **📈 Excel** - Excel workbook

### Step 4: File Downloads
- File automatically downloads with name like: `closed-deals-[date].csv`
- Only selected fields are included in export
- All 3 formats show same data, different formatting

---

## 📧 Scheduled Email Exports (Admin Setup)

### Enable Weekly Email Reports

**Via API** (for developers):
```bash
POST /api/admin/deals/closed/schedule-export
Content-Type: application/json

{
  "talentId": "talent_id_here",
  "email": "reports@company.com",
  "frequency": "weekly",
  "dayOfWeek": 1,
  "enabled": true
}
```

**Parameters**:
- `talentId` - Talent ID to export (required)
- `email` - Email address to send to (required)
- `frequency` - "weekly" or "daily" (default: weekly)
- `dayOfWeek` - 0-6 where 0=Sunday, 1=Monday, etc.
- `enabled` - true/false to turn on/off (default: true)

**Response**:
```json
{
  "success": true,
  "schedule": {
    "id": "schedule_id",
    "talentId": "talent_id",
    "email": "reports@company.com",
    "frequency": "weekly",
    "dayOfWeek": 1,
    "enabled": true,
    "lastExportAt": null,
    "createdAt": "2024-01-10T12:00:00Z"
  }
}
```

### Email Report Contents
- **Subject**: "Closed Deals Report - [Talent Name] [Date]"
- **Body**:
  - Summary metrics (Total, Won/Lost, Total Value, Paid/Unpaid)
  - Professional HTML styling
  - Link to view in dashboard
- **Attachment**: CSV file with all closed deals

### Check Existing Schedule

**Via API**:
```bash
GET /api/admin/deals/closed/schedule-export?talentId=talent_id_here
```

**Response**:
```json
{
  "talentId": "talent_id",
  "schedule": {
    "id": "schedule_id",
    "email": "reports@company.com",
    "frequency": "weekly",
    "dayOfWeek": 1,
    "enabled": true,
    "lastExportAt": "2024-01-10T09:00:00Z"
  }
}
```

### Disable Scheduled Exports

```bash
POST /api/admin/deals/closed/schedule-export
{
  "talentId": "talent_id_here",
  "email": "reports@company.com",
  "enabled": false
}
```

---

## 🔄 Export Field Reference

| Field | What It Includes | Format |
|-------|------------------|--------|
| **Brand** | Brand/Partner name | Text |
| **Campaign** | Campaign name or deal description | Text |
| **Status** | Won or Lost | Text |
| **Value** | Deal amount | Number |
| **Currency** | GBP, USD, EUR, etc. | Text |
| **Payment Status** | PAID, UNPAID, PARTIAL | Text |
| **Closed Date** | When deal closed | Date |
| **Notes** | Additional details | Text |

---

## 💡 Pro Tips

### Tip 1: Export Fewer Fields for Cleaner Sheets
- Toggle off fields you don't need
- Results in cleaner, easier-to-read exports
- Smaller file sizes

### Tip 2: Use Excel for Analysis
- Excel format has summary metrics in separate sheet
- Better for formulas and pivot tables
- Try filtering and sorting in Excel

### Tip 3: Schedule Daily Reports for Busy Teams
- Set frequency to "daily" for frequently-updated deals
- Emails arrive at 9 AM UTC automatically
- No manual intervention needed

### Tip 4: Create Different Schedules
- Sales team: All fields including Notes
- Finance team: Value, Currency, Payment Status only
- Executive: Summary metrics only

---

## ❓ FAQ

**Q: Can I export deals from a specific date range?**
A: Yes! The system filters deals by their closed date. You can pass `fromDate` and `toDate` parameters to the API.

**Q: What if I have no deals to export?**
A: The export will be empty. In PDF, you'll see headers with 0 deals. In CSV/XLSX, you'll get just headers.

**Q: Can I schedule multiple exports for one talent?**
A: Currently only one schedule per talent per user. Update the existing schedule to change settings.

**Q: What time do emails send?**
A: 9 AM UTC (coordinated universal time) on the specified day.

**Q: Which timezone is the exported date in?**
A: Dates use the user's local timezone formatting (from the server context).

**Q: Can I test the export before scheduling?**
A: Yes! Click the export buttons manually first to verify the data and format.

**Q: What if the email fails to send?**
A: Errors are logged. The system will retry according to Resend's retry policy. Check server logs for "[SCHEDULED_EXPORT_JOB]" entries.

---

## 🐛 Troubleshooting

### Export Button Not Working
1. Check that there are closed deals to export
2. Verify your browser allows downloads
3. Check browser console for errors (F12)
4. Try a different export format

### Field Selector Not Showing
1. Click "⚙️ Show Fields" button
2. Look for checkbox grid below export buttons
3. Fields should appear with checkboxes
4. Try refreshing page if not visible

### Email Not Received
1. Check that email address is correct in schedule
2. Check spam folder
3. Server logs should show "[SCHEDULED_EXPORT_JOB]" with status
4. Verify server was restarted after enabling schedule

### Wrong Fields in Export
1. Click "Show Fields" to verify selection
2. Check that only desired fields are checked
3. Click "Select All" to reset if confused
4. Try exporting again

---

## 📚 Documentation

For more detailed information:
- **Complete Feature Guide**: `ADVANCED_EXPORT_FEATURES_COMPLETE.md`
- **Field Selection Details**: `EXPORT_FIELD_SELECTOR_GUIDE.md`
- **Implementation Summary**: `ADVANCED_EXPORT_IMPLEMENTATION_SUMMARY.md`

---

## 🎬 Video Tutorial (If Available)

[Coming soon]

---

## 📞 Support

For issues or questions:
1. Check the FAQ section above
2. Review the detailed documentation files
3. Check browser console for error messages (F12 → Console)
4. Review server logs for "[EXPORT]" or "[SCHEDULED]" entries
5. Contact the development team with error messages

---

## Version Info

**Feature Release**: Advanced Export Features v1.0
**Release Date**: January 2024
**Status**: Production Ready ✅

**Components**:
- CSV Export: ✅
- Advanced PDF: ✅  
- XLSX Export: ✅
- Custom Fields: ✅
- Scheduled Emails: ✅

---

## What's Coming Next?

Future enhancements may include:
- [ ] Scheduled export dashboard UI
- [ ] Email preview before scheduling
- [ ] Multiple recipients per schedule
- [ ] Custom email templates
- [ ] Export history/logs
- [ ] More export formats (Google Sheets, JSON)
- [ ] Bulk exports for multiple talents

---

**Happy exporting! 📊**
