#!/bin/bash
# Test Patricia Bright profile image refresh

PATRICIA_ID="hzjgtd1yhmltkxf6aprwtb1o"

echo "Testing profile image sync for Patricia Bright..."
echo "Patricia ID: $PATRICIA_ID"

# Call the sync endpoint (assumes API is running on localhost:3001)
curl -X POST "http://localhost:3001/api/admin/talent/$PATRICIA_ID/profile-image/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v 2>&1 | head -50

echo ""
echo "✓ Test request sent"
