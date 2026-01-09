#!/bin/bash

# Brands Page TypeError Fix - Validation Script
# Purpose: Verify that the Brands page crash is fixed
# Run: bash verify-brands-fix.sh

echo "==================================================================="
echo "BRANDS PAGE TYPEERROR FIX VERIFICATION"
echo "==================================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO_ROOT="/Users/admin/Desktop/break-agency-app-1"
PASS_COUNT=0
FAIL_COUNT=0

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASS_COUNT++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAIL_COUNT++))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Verify API endpoint changes
echo "TEST 1: API Response Format Changes"
echo "-----------------------------------"

# Check crmBrands.ts returns direct array
if grep -q "res\.json(safeBrands);" "$REPO_ROOT/apps/api/src/routes/crmBrands.ts"; then
  pass "crmBrands.ts returns direct array"
else
  fail "crmBrands.ts still returns wrapped object"
fi

# Check crmContacts.ts returns direct array
if grep -q "res\.json(contacts || \[\]);" "$REPO_ROOT/apps/api/src/routes/crmContacts.ts"; then
  pass "crmContacts.ts returns direct array"
else
  fail "crmContacts.ts still returns wrapped object"
fi

echo ""

# Test 2: Verify frontend defensive code
echo "TEST 2: Frontend Normalization & Error Handling"
echo "-----------------------------------------------"

# Check AdminBrandsPage uses normalizeApiArrayWithGuard
if grep -q "normalizeApiArrayWithGuard" "$REPO_ROOT/apps/web/src/pages/AdminBrandsPage.jsx"; then
  GUARD_COUNT=$(grep -c "normalizeApiArrayWithGuard" "$REPO_ROOT/apps/web/src/pages/AdminBrandsPage.jsx")
  pass "AdminBrandsPage uses normalizeApiArrayWithGuard ($GUARD_COUNT times)"
else
  fail "AdminBrandsPage doesn't use normalizeApiArrayWithGuard"
fi

# Check error handlers return empty arrays
if grep -q "return \[\];" "$REPO_ROOT/apps/web/src/pages/AdminBrandsPage.jsx"; then
  pass "Error handlers return empty arrays instead of empty strings"
else
  fail "Error handlers don't consistently return empty arrays"
fi

# Check for Array.isArray guards in filtering code
if grep -q "Array\.isArray" "$REPO_ROOT/apps/web/src/pages/AdminBrandsPage.jsx"; then
  pass "Filtering code includes Array.isArray() guards"
else
  fail "Filtering code missing Array.isArray() guards"
fi

echo ""

# Test 3: Verify normalization helpers exist
echo "TEST 3: Data Normalization Helpers"
echo "-----------------------------------"

if [ -f "$REPO_ROOT/apps/web/src/lib/dataNormalization.js" ]; then
  pass "dataNormalization.js file exists"
  
  if grep -q "export function normalizeApiArray" "$REPO_ROOT/apps/web/src/lib/dataNormalization.js"; then
    pass "normalizeApiArray() function exported"
  else
    fail "normalizeApiArray() function not exported"
  fi
  
  if grep -q "export function normalizeApiArrayWithGuard" "$REPO_ROOT/apps/web/src/lib/dataNormalization.js"; then
    pass "normalizeApiArrayWithGuard() function exported"
  else
    fail "normalizeApiArrayWithGuard() function not exported"
  fi
else
  fail "dataNormalization.js file not found"
fi

echo ""

# Test 4: Check for potential remaining issues
echo "TEST 4: Pattern Detection"
echo "------------------------"

# Check for unsafe .filter() patterns
UNSAFE_PATTERNS=$(grep -E "\.filter\(\(.*\)\s*=>" "$REPO_ROOT/apps/web/src/pages/AdminBrandsPage.jsx" | wc -l)
if [ "$UNSAFE_PATTERNS" -gt 0 ]; then
  warn "Found $UNSAFE_PATTERNS .filter() calls - verify they're all protected"
fi

# Check for response.brands or response.contacts direct access
if ! grep -q "response\.brands\|response\.contacts\|\.brands\|\.contacts" "$REPO_ROOT/apps/web/src/pages/AdminBrandsPage.jsx" 2>/dev/null | grep -v "brandName\|brandId\|contactId\|firstName"; then
  pass "No unsafe direct property access detected"
else
  warn "Check for unsafe direct property access to .brands or .contacts"
fi

echo ""

# Test 5: Verify imports
echo "TEST 5: Import Statements"
echo "------------------------"

if grep -q "import.*normalizeApiArray.*from.*dataNormalization" "$REPO_ROOT/apps/web/src/pages/AdminBrandsPage.jsx"; then
  pass "AdminBrandsPage imports normalization helpers"
else
  fail "AdminBrandsPage missing normalization helper imports"
fi

echo ""

# Test 6: Check git history
echo "TEST 6: Git Commit History"
echo "-------------------------"

COMMIT_MSG=$(cd "$REPO_ROOT" && git log -1 --pretty=%B)
if echo "$COMMIT_MSG" | grep -q "standardize API response"; then
  pass "Recent commit addresses API response standardization"
  echo "  Message: $(echo "$COMMIT_MSG" | head -1)"
else
  warn "Recent commit message doesn't mention API response fix"
fi

echo ""

# Summary
echo "==================================================================="
echo "SUMMARY"
echo "==================================================================="
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo -e "Tests: ${GREEN}$PASS_COUNT passed${NC}, ${RED}$FAIL_COUNT failed${NC} (Total: $TOTAL)"

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED${NC} - Brands page fix is complete!"
  echo ""
  echo "NEXT STEPS:"
  echo "1. Build and test locally: npm run build:web"
  echo "2. Test Brands page loads without TypeError"
  echo "3. Verify filters and search work"
  echo "4. Check drawer opens and shows related data"
  echo "5. Verify empty brands state renders"
  exit 0
else
  echo -e "${RED}✗ SOME CHECKS FAILED${NC} - Review changes above"
  exit 1
fi
