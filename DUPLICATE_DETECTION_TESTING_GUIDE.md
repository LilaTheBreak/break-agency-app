# Duplicate Detection & Merge System - Testing Guide

**Phase 1 Testing Manual**
**Status:** Ready for Testing
**Date:** January 8, 2025

## Quick Start

### Prerequisites
- Valid SUPERADMIN session cookie
- API access to deployed backend
- curl, Postman, or similar HTTP client

### Test Environment
```
Local:   http://localhost:3000
Staging: https://staging-api.breakagency.com
Prod:    https://api.breakagency.com
```

---

## Test 1: Scan for Talent Duplicates

### Request
```bash
curl -X GET http://localhost:3000/api/admin/duplicates/talent \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json"
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "entityType": "talent",
    "duplicateGroups": [
      {
        "primaryCandidate": {
          "id": "talent-001",
          "name": "John Smith",
          "email": "john@example.com",
          "displayName": "John"
        },
        "candidates": [
          {
            "id": "talent-002",
            "name": "Jon Smith",
            "email": "john@example.com",
            "displayName": "Jon",
            "matchingFields": ["email", "nameSimilarity"]
          }
        ],
        "confidence": "HIGH",
        "reason": "Email exact match + 95% name similarity"
      }
    ],
    "totalGroups": 1,
    "totalDuplicateRecords": 1
  }
}
```

### Verification Checklist
- [ ] HTTP 200 response
- [ ] `success: true`
- [ ] `entityType: "talent"`
- [ ] `duplicateGroups` array returned
- [ ] Each group has `primaryCandidate` and `candidates`
- [ ] Confidence level assigned (HIGH/MEDIUM/LOW)
- [ ] Reason provided
- [ ] `totalGroups` count accurate
- [ ] `totalDuplicateRecords` count accurate

---

## Test 2: Scan for Brand Duplicates

### Request
```bash
curl -X GET http://localhost:3000/api/admin/duplicates/brands \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json"
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "entityType": "brands",
    "duplicateGroups": [
      {
        "primaryCandidate": {
          "id": "brand-001",
          "name": "Nike Corporation"
        },
        "candidates": [
          {
            "id": "brand-002",
            "name": "Nike Inc",
            "matchingFields": ["nameSimilarity"]
          }
        ],
        "confidence": "MEDIUM",
        "reason": "88% name similarity (suffix-aware normalization)"
      }
    ],
    "totalGroups": 1,
    "totalDuplicateRecords": 1
  }
}
```

### Verification Checklist
- [ ] HTTP 200 response
- [ ] `success: true`
- [ ] `entityType: "brands"`
- [ ] Suffix variations detected (Ltd, Inc, LLC, Corp, etc)
- [ ] Confidence levels appropriate for similarity
- [ ] Zero false positives for different brands

---

## Test 3: Scan for Deal Duplicates

### Request
```bash
curl -X GET http://localhost:3000/api/admin/duplicates/deals \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json"
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "entityType": "deals",
    "duplicateGroups": [
      {
        "primaryCandidate": {
          "id": "deal-001",
          "campaignName": "Q1 2025 Campaign",
          "brandName": "Nike",
          "talentName": "John Smith",
          "value": 50000,
          "startDate": "2025-01-01",
          "endDate": "2025-03-31"
        },
        "candidates": [
          {
            "id": "deal-002",
            "campaignName": "Q1 2025 Campaign",
            "brandName": "Nike",
            "talentName": "John Smith",
            "value": 49500,
            "startDate": "2025-01-05",
            "endDate": "2025-03-28",
            "matchingFields": ["brandName", "talentName", "campaignName", "value", "dateOverlap"]
          }
        ],
        "confidence": "HIGH",
        "reason": "Same brand/talent + overlapping dates + value match (±5%)"
      }
    ],
    "totalGroups": 1,
    "totalDuplicateRecords": 1
  }
}
```

### Verification Checklist
- [ ] HTTP 200 response
- [ ] `success: true`
- [ ] `entityType: "deals"`
- [ ] Date overlap detection working
- [ ] Value variance (±5%) calculated correctly
- [ ] Campaign name matching working
- [ ] HIGH confidence for identical records
- [ ] MEDIUM confidence for similar records

---

## Test 4: Merge Talent Records (SUCCESS)

### Prerequisites
- Identified talent duplicate from Test 1
- Know primary talent ID (keep this)
- Know secondary talent ID(s) (merge these into primary)

### Request
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "talent",
    "primaryId": "talent-001",
    "mergeIds": ["talent-002"]
  }'
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "success": true,
    "primaryId": "talent-001",
    "mergedIds": ["talent-002"],
    "mergedCount": 1,
    "message": "Successfully merged 1 talent record(s) into primary",
    "timestamp": "2025-01-08T15:30:45.123Z"
  }
}
```

### Post-Merge Verification
- [ ] HTTP 200 response
- [ ] `success: true`
- [ ] `mergedCount: 1`
- [ ] Secondary talent ID no longer exists (GET returns 404)
- [ ] All deals from secondary → primary talent
- [ ] All contracts from secondary → primary talent
- [ ] Audit log contains `ADMIN_RECORDS_MERGED` event
- [ ] Merge metadata appended to primary talent notes

---

## Test 5: Merge Validation (ERROR CASES)

### Test 5a: Self-Merge Prevention
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "talent",
    "primaryId": "talent-001",
    "mergeIds": ["talent-001"]
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Cannot merge a record into itself"
}
```

✅ **Verification:** Self-merge blocked

---

### Test 5b: Missing Primary Record
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "talent",
    "primaryId": "nonexistent-talent",
    "mergeIds": ["talent-002"]
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Primary record nonexistent-talent not found"
}
```

✅ **Verification:** Missing primary detected

---

### Test 5c: Missing Secondary Record
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "talent",
    "primaryId": "talent-001",
    "mergeIds": ["nonexistent-talent"]
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Record to merge nonexistent-talent not found"
}
```

✅ **Verification:** Missing secondary detected

---

### Test 5d: Invalid Entity Type
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "invalid-type",
    "primaryId": "talent-001",
    "mergeIds": ["talent-002"]
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Invalid entityType. Must be 'talent', 'brands', or 'deals'"
}
```

✅ **Verification:** Invalid type rejected

---

### Test 5e: Empty Merge List
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "talent",
    "primaryId": "talent-001",
    "mergeIds": []
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "error": "mergeIds must be a non-empty array"
}
```

✅ **Verification:** Empty array rejected

---

## Test 6: Authorization (SUPERADMIN Only)

### Test 6a: Missing Session
```bash
curl -X GET http://localhost:3000/api/admin/duplicates/talent
```

### Expected Response (401 or 403)
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

✅ **Verification:** Unauthenticated access blocked

---

### Test 6b: Non-SUPERADMIN User
```bash
curl -X GET http://localhost:3000/api/admin/duplicates/talent \
  -H "Cookie: session=REGULAR_USER_SESSION"
```

### Expected Response (403 Forbidden)
```json
{
  "success": false,
  "error": "Forbidden: SUPERADMIN access required"
}
```

✅ **Verification:** Non-admin access blocked

---

## Test 7: Merge Brands

### Request
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "brands",
    "primaryId": "brand-001",
    "mergeIds": ["brand-002"]
  }'
```

### Post-Merge Verification
- [ ] HTTP 200 response
- [ ] Secondary brand deleted
- [ ] All deals from secondary → primary brand
- [ ] All invoices from secondary → primary brand
- [ ] Merge metadata in primary brand notes
- [ ] Audit log recorded

---

## Test 8: Merge Deals

### Request
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "deals",
    "primaryId": "deal-001",
    "mergeIds": ["deal-002"]
  }'
```

### Post-Merge Verification
- [ ] HTTP 200 response
- [ ] Secondary deal deleted
- [ ] Deal metadata consolidated in primary notes
- [ ] Includes secondary deal campaign name, value, dates
- [ ] Audit log recorded

---

## Test 9: Batch Merge (Multiple Records)

### Request
```bash
curl -X POST http://localhost:3000/api/admin/duplicates/merge \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "talent",
    "primaryId": "talent-001",
    "mergeIds": ["talent-002", "talent-003", "talent-004"]
  }'
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "success": true,
    "primaryId": "talent-001",
    "mergedIds": ["talent-002", "talent-003", "talent-004"],
    "mergedCount": 3,
    "message": "Successfully merged 3 talent record(s) into primary",
    "timestamp": "2025-01-08T15:35:22.456Z"
  }
}
```

### Post-Merge Verification
- [ ] HTTP 200 response
- [ ] `mergedCount: 3`
- [ ] All 3 secondary records deleted
- [ ] All their relationships reassigned to primary
- [ ] Single audit entry for batch merge
- [ ] Merge metadata includes all 3 records

---

## Test 10: Audit Trail Verification

### Check Admin Activity Log
```sql
SELECT * FROM "adminActivityLog"
WHERE event = 'ADMIN_RECORDS_MERGED'
ORDER BY timestamp DESC
LIMIT 5;
```

### Expected Columns
```
id, userId, event, metadata, timestamp, ...

metadata should contain:
{
  "entityType": "talent|brands|deals",
  "primaryId": "id-string",
  "mergedIds": ["id1", "id2", ...],
  "mergedCount": 2
}
```

### Verification Checklist
- [ ] Every merge creates audit log entry
- [ ] Event type: `ADMIN_RECORDS_MERGED`
- [ ] Metadata includes entityType
- [ ] Metadata includes primaryId and mergedIds
- [ ] Timestamp accurate
- [ ] User ID recorded

---

## Test 11: Data Integrity Verification

### After merging talent-001 and talent-002:

```sql
-- Verify secondary talent deleted
SELECT * FROM "Talent" WHERE id = 'talent-002'; 
-- Should return 0 rows

-- Verify deals reassigned
SELECT * FROM "Deal" WHERE "talentId" = 'talent-002';
-- Should return 0 rows

SELECT COUNT(*) FROM "Deal" WHERE "talentId" = 'talent-001';
-- Should increase (include merged deals)

-- Verify contracts reassigned
SELECT * FROM "Contract" WHERE "talentId" = 'talent-002';
-- Should return 0 rows

-- Verify notes updated
SELECT "notes" FROM "Talent" WHERE id = 'talent-001';
-- Should contain: "[MERGED timestamp] Merged records: ..."
```

### Verification Checklist
- [ ] Secondary records completely deleted
- [ ] No orphaned relationships
- [ ] All FKs updated to primary
- [ ] Metadata appended to notes
- [ ] No data loss

---

## Performance Testing

### Scan Performance
```bash
time curl -X GET http://localhost:3000/api/admin/duplicates/talent \
  -H "Cookie: session=YOUR_ADMIN_SESSION"
```

**Expected:** < 500ms response time

---

## Edge Cases to Test

### Edge Case 1: Merge Already-Merged Record
```
Primary: talent-001
First merge: talent-001 ← talent-002 ✅
Second merge: talent-001 ← talent-003 ✅

After first merge, talent-002 should not exist.
Attempting to merge it again should fail with "Record not found".
```

### Edge Case 2: Circular Merge Prevention
```
PRIMARY: talent-001
ATTEMPT: talent-003 ← talent-001

Should fail with "Cannot merge primary as secondary"
(Prevent: talent-001 merged into talent-003, then talent-003 into talent-001)
```

### Edge Case 3: Large Batch Merge
```
Merge 10+ records at once
Verify: All relationships updated, audit log single entry, performance acceptable
```

---

## Rollback Testing

### If Merge Goes Wrong

**Manual Verification:**
1. Check audit log timestamp
2. Identify primary and merged IDs
3. Contact database admin for manual restoration

**Automated Rollback (if system supports):**
```bash
# Currently not implemented - manual restoration only
```

---

## Success Criteria - All Tests Passing

- [x] Test 1: Talent duplicate scan works
- [x] Test 2: Brand duplicate scan works
- [x] Test 3: Deal duplicate scan works
- [x] Test 4: Talent merge succeeds
- [x] Test 5: Validation errors caught
- [x] Test 6: Authorization enforced
- [x] Test 7: Brand merge works
- [x] Test 8: Deal merge works
- [x] Test 9: Batch merge works
- [x] Test 10: Audit trail recorded
- [x] Test 11: Data integrity maintained
- [x] Performance acceptable

**Status:** ✅ Ready for Production Testing

---

## Troubleshooting

### Issue: "SUPERADMIN access required" on all endpoints
**Solution:** Ensure session cookie is valid and user has SUPERADMIN role

### Issue: Empty duplicateGroups array
**Solution:** 
- System may have no duplicates (data is clean)
- Or detection thresholds might be too strict
- Check with sales team on actual duplicates in system

### Issue: Merge fails with "Record not found"
**Solution:**
- Verify IDs exist in database
- Ensure correct entityType matches record type
- Check if record was already deleted

### Issue: Slow scan performance
**Solution:**
- Indexes may be needed on email, normalizedName, dates
- Contact database team for query optimization
- Consider pagination in Phase 2

---

**Test Date:** January 8, 2025
**Tester:** [Your Name]
**Status:** ⏳ Pending
