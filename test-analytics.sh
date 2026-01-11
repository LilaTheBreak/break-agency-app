#!/bin/bash

# Analytics Testing Script
# Tests the full analytics pipeline with public Instagram accounts

echo "🔍 Analytics Page Debugging Test Suite"
echo "======================================"
echo ""

API_URL="${API_URL:-http://localhost:3001}"
TEST_ACCOUNTS=(
  "@nasa"
  "@nasa" 
  "@instagram"
)

echo "Testing API: $API_URL"
echo ""

# Test 1: Public Instagram Account
echo "TEST 1: Fetch analytics for @nasa (public account)"
echo "--------"
echo "Sending: POST /api/admin/analytics/analyze"
echo "Body: { \"url\": \"https://instagram.com/nasa\" }"
echo ""

curl -s -X POST "$API_URL/api/admin/analytics/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://instagram.com/nasa"
  }' | jq '.' > /tmp/analytics_response.json

echo "Response received. Processing..."
echo ""

# Parse response
TOTAL_REACH=$(jq '.overview.totalReach' /tmp/analytics_response.json)
ENGAGEMENT_RATE=$(jq '.overview.engagementRate' /tmp/analytics_response.json)
POST_COUNT=$(jq '.overview.postCount' /tmp/analytics_response.json)
PLATFORM=$(jq '.platform' /tmp/analytics_response.json)
USERNAME=$(jq '.username' /tmp/analytics_response.json)
ERROR=$(jq '.error' /tmp/analytics_response.json)

echo "Results:"
echo "--------"
echo "Platform: $PLATFORM"
echo "Username: $USERNAME"
echo "Total Reach: $TOTAL_REACH"
echo "Engagement Rate: $ENGAGEMENT_RATE"
echo "Post Count: $POST_COUNT"
echo "Error: $ERROR"
echo ""

if [ "$TOTAL_REACH" != "null" ] && [ "$TOTAL_REACH" != "0" ]; then
  echo "✅ TEST 1 PASSED: Data successfully fetched"
else
  echo "❌ TEST 1 FAILED: No data returned"
  echo "Full response:"
  jq '.' /tmp/analytics_response.json
fi

echo ""
echo "======================================"
echo ""

# Test 2: Check for debug logs
echo "TEST 2: Backend Debug Logging"
echo "--------"
echo "Check server logs for patterns:"
echo "  - [INSTAGRAM] Attempting scrape (strategy 1: HTML parse)"
echo "  - [INSTAGRAM] HTML response received: 200"
echo "  - [INSTAGRAM] Extracted data from meta tags"
echo "  - [INSTAGRAM] Profile scraped successfully"
echo "  - [ANALYTICS] Instagram profile fetched"
echo ""
echo "Run this to tail logs:"
echo "  docker logs -f break-agency-api-1 | grep INSTAGRAM"
echo ""

# Test 3: Performance metrics
echo "TEST 3: Response Time"
echo "--------"
START=$(date +%s%N)

curl -s -X POST "$API_URL/api/admin/analytics/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://instagram.com/instagram"}' > /dev/null

END=$(date +%s%N)
DURATION=$(( ($END - $START) / 1000000 ))

echo "Request took: ${DURATION}ms"
if [ "$DURATION" -lt 5000 ]; then
  echo "✅ TEST 3 PASSED: Response time acceptable"
else
  echo "⚠️  TEST 3 WARNING: Response time slow (${DURATION}ms > 5000ms)"
fi

echo ""
echo "======================================"
echo ""

# Test 4: Error handling (non-existent account)
echo "TEST 4: Error Handling (Non-existent Account)"
echo "--------"
echo "Testing with account: @definitely_not_real_12345"
echo ""

curl -s -X POST "$API_URL/api/admin/analytics/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://instagram.com/definitely_not_real_12345"}' | jq '.' > /tmp/analytics_error.json

ERROR_MSG=$(jq '.error' /tmp/analytics_error.json)

if [ "$ERROR_MSG" != "null" ]; then
  echo "✅ TEST 4 PASSED: Error properly returned: $ERROR_MSG"
else
  echo "❌ TEST 4 FAILED: No error for invalid account"
fi

echo ""
echo "======================================"
echo ""

# Test 5: Frontend debug logging check
echo "TEST 5: Frontend Debug Logging"
echo "--------"
echo "To verify frontend logs:"
echo ""
echo "1. Open AdminAnalyticsPage in browser"
echo "2. Open DevTools (F12) → Console tab"
echo "3. Paste any Instagram URL"
echo "4. Look for logs starting with '[ANALYTICS_DEBUG]'"
echo ""
echo "Expected logs:"
echo "  [ANALYTICS_DEBUG] Profile selected: { type: 'external', platform: 'INSTAGRAM', ... }"
echo "  [ANALYTICS_DEBUG] Request body: { url: '...' }"
echo "  [ANALYTICS_DEBUG] Using POST /api/admin/analytics/analyze endpoint"
echo "  [ANALYTICS_DEBUG] API Response received: { status: 200, ok: true }"
echo "  [ANALYTICS_DEBUG] API Response data: { overview: { totalReach: 123456, ... } }"
echo "  [ANALYTICS_DEBUG] Analytics data set successfully"
echo ""

echo "======================================"
echo ""
echo "📊 Test Summary"
echo "--------"
echo "Run the tests above to verify:"
echo "✓ Instagram data fetching works"
echo "✓ Error handling for invalid accounts"
echo "✓ Response time acceptable (<5s)"
echo "✓ Backend logs show HTML parsing strategy"
echo "✓ Frontend logs show data flow"
echo ""
echo "📝 For detailed debugging:"
echo "   See ANALYTICS_DEBUGGING_REPORT.md"
echo ""
