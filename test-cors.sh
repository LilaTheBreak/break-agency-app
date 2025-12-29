#!/bin/bash

# CORS Production Test Script
# Run this after Railway deploys to verify CORS is working

echo "=========================================="
echo "CORS PRODUCTION TEST"
echo "=========================================="
echo ""

API_URL="https://breakagencyapi-production.up.railway.app"
FRONTEND_ORIGIN="https://www.tbctbctbc.online"

echo "Testing API: $API_URL"
echo "Frontend Origin: $FRONTEND_ORIGIN"
echo ""

echo "=========================================="
echo "TEST 1: OPTIONS Preflight Request"
echo "=========================================="
echo ""

curl -i -X OPTIONS "$API_URL/api/auth/me" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  2>&1 | grep -E "(HTTP|access-control|Access-Control)"

echo ""
echo "=========================================="
echo "TEST 2: GET Request with Origin"
echo "=========================================="
echo ""

curl -i -X GET "$API_URL/api/auth/me" \
  -H "Origin: $FRONTEND_ORIGIN" \
  2>&1 | grep -E "(HTTP|access-control|Access-Control)"

echo ""
echo "=========================================="
echo "TEST 3: Google Auth URL"
echo "=========================================="
echo ""

curl -i -X OPTIONS "$API_URL/api/auth/google/url" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  2>&1 | grep -E "(HTTP|access-control|Access-Control)"

echo ""
echo "=========================================="
echo "EXPECTED RESULTS"
echo "=========================================="
echo ""
echo "✅ OPTIONS requests should return:"
echo "   - HTTP/2 204"
echo "   - access-control-allow-origin: $FRONTEND_ORIGIN"
echo "   - access-control-allow-credentials: true"
echo "   - access-control-allow-methods: GET,POST,PATCH,DELETE,OPTIONS,PUT"
echo ""
echo "✅ GET requests should return:"
echo "   - HTTP/2 401 (or 200 if authenticated)"
echo "   - access-control-allow-origin: $FRONTEND_ORIGIN"
echo "   - access-control-allow-credentials: true"
echo ""
echo "❌ If you see ONLY HTTP status without CORS headers:"
echo "   → FRONTEND_ORIGIN env var is NOT set in Railway"
echo "   → Go to Railway dashboard and add:"
echo "     FRONTEND_ORIGIN=$FRONTEND_ORIGIN"
echo ""
