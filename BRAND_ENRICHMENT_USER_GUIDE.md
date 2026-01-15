# 🔄 MANUAL BRAND ENRICHMENT - QUICK GUIDE

**New Feature:** On-demand brand enrichment with real-time feedback  
**Endpoint:** `POST /api/crm-brands/{brandId}/enrich`  
**Status:** ✅ Live

---

## 📍 When to Use

Use this endpoint when:
- ✅ You created a brand but no data was populated
- ✅ You want to retry enrichment after updating the website URL
- ✅ You want to see why enrichment failed
- ✅ You want real-time feedback instead of async waiting

---

## 🚀 How to Use

### Option 1: Using cURL
```bash
curl -X POST http://localhost:3000/api/crm-brands/BRAND_ID_HERE/enrich \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### Option 2: Using JavaScript/Fetch
```javascript
const response = await fetch(
  `/api/crm-brands/${brandId}/enrich`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  }
);

const result = await response.json();
console.log(result);
```

### Option 3: From Browser Console (if authenticated)
```javascript
// Get brand ID from current page
const brandId = "your-brand-id";

// Call enrichment
fetch(`/api/crm-brands/${brandId}/enrich`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log('Result:', data));
```

---

## 📊 Example Responses

### ✅ Success Response
```json
{
  "success": true,
  "message": "Brand enriched successfully",
  "enrichment": {
    "logoUrl": "https://example.com/logo.png",
    "about": "We are a leading brand in technology...",
    "industry": "Technology",
    "socialLinks": {
      "instagram": "https://instagram.com/example",
      "linkedin": "https://linkedin.com/company/example",
      "twitter": "https://twitter.com/example"
    }
  },
  "brand": {
    "id": "brand-123",
    "brandName": "Example Corp",
    "website": "https://example.com",
    "logoUrl": "https://example.com/logo.png",
    "about": "We are a leading brand in technology...",
    "industry": "Technology",
    "enrichedAt": "2026-01-15T12:34:56.000Z",
    "enrichmentSource": "website"
  }
}
```

### ❌ Failure Response (Website Blocked)
```json
{
  "success": false,
  "message": "No data could be extracted from the website",
  "error": "HTTP 403: Forbidden"
}
```

### ❌ Failure Response (Timeout)
```json
{
  "success": false,
  "message": "No data could be extracted from the website",
  "error": "The operation was aborted"
}
```

### ❌ Failure Response (Invalid)
```json
{
  "error": "Brand not found"
}
```

---

## 🔍 Troubleshooting

| Response | Cause | Solution |
|----------|-------|----------|
| `HTTP 403: Forbidden` | Website blocks scrapers | Manually add logo/info |
| `The operation was aborted` | Website too slow (>10s) | Try again, or update URL |
| `HTTP 404: Not Found` | Website doesn't exist | Verify URL is correct |
| `No data could be extracted` | Website has no meta tags | Website doesn't provide data |
| `Brand not found` | Invalid brand ID | Check brand ID is correct |

---

## 💡 Common Issues

### "I created a brand but it didn't enrich"
**Action:**
1. Click the brand to open details
2. Use the enrich endpoint
3. Check the response to see why it failed
4. If website blocks scrapers, manually add logo from their site

### "The website has a logo but it wasn't pulled"
**Why:** The logo might be:
- Rendered by JavaScript (we get raw HTML only)
- Not in standard locations (og:image, favicon, etc.)
- Blocked by CORS

**Solution:** Manually add the logo from their website

### "I updated the website URL, now enrich it"
**Action:**
1. First update the website via PATCH /api/crm-brands/{id}
2. Then call POST /api/crm-brands/{id}/enrich
3. Check response for new enriched data

---

## 🎯 What Gets Extracted

When enrichment succeeds, it pulls:

| Field | Source | Examples |
|-------|--------|----------|
| **Logo** | og:image, apple-touch-icon, favicon, /logo.png | https://example.com/logo.png |
| **About** | meta description, og:description | "Leading tech company..." |
| **Industry** | Keyword scanning | Technology, Fashion, Food |
| **Social Links** | All links on page | Instagram, LinkedIn, Twitter, TikTok, Facebook |

---

## ⚡ Pro Tips

### Tip 1: Check logs for errors
If enrichment fails mysteriously, check server logs:
```
[BRAND ENRICHMENT] Result for {brandId}: { success: false, error: "..." }
```

### Tip 2: Website timing matters
Some websites are slow:
- First request: might timeout (>10s)
- Second request: might succeed (cached)
- Try again if it times out

### Tip 3: Websites can block you
These sites typically block scrapers:
- Facebook, LinkedIn (require API)
- Banks, financial sites
- Fitness studios (like David Lloyd)
- Government sites

### Tip 4: Use real data sources
For critical enrichment, use APIs:
- Hunter.io for emails/socials
- Clearbit for company info
- Apollo for comprehensive data

---

## 🔐 Security Notes

- ✅ Endpoint requires authentication
- ✅ Only admins can trigger enrichment
- ✅ No sensitive data is exposed
- ✅ Timeout protection (10 seconds max)
- ✅ Error messages don't leak system info

---

## 📈 Performance

- **Request timeout:** 10 seconds
- **Expected response time:** 1-5 seconds
- **Database update:** <100ms
- **Retry safe:** Yes, can retry multiple times

---

## 🐛 Known Limitations

1. **JavaScript rendering:** Can't execute JS, so JS-rendered content won't be extracted
2. **CORS issues:** Some websites block cross-origin requests
3. **Bot detection:** Websites with aggressive bot detection will block us
4. **Large websites:** Might take longer to fetch/parse
5. **Rate limiting:** Some websites rate-limit requests

---

## 📚 Related Documentation

- [Brand Enrichment Audit](BRAND_SCRAPER_AUDIT.md) - Technical details
- [Enrichment Fix Report](BRAND_ENRICHMENT_FIX_REPORT.md) - What was fixed and why
- [Enrichment Feature Audit](ENRICHMENT_AUDIT_START_HERE.md) - Contact discovery feature

---

**Status:** ✅ Ready to use  
**Last Updated:** January 15, 2026  
**Feedback:** Check logs for enrichment details
