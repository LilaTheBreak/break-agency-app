#!/bin/bash

#===================================================
# Task Lifecycle Bug Fix - Verification Script
#===================================================
# This script tests the unified task system
# to verify all task types are properly surfaced

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_BASE_URL:-http://localhost:3001}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TALENT_ID="${TALENT_ID:-}"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

#===================================================
# Helper Functions
#===================================================

print_header() {
  echo -e "\n${BLUE}===================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}===================================================${NC}\n"
}

print_test() {
  echo -e "${YELLOW}TEST: $1${NC}"
}

print_pass() {
  echo -e "${GREEN}✓ PASS: $1${NC}"
  ((TESTS_PASSED++))
}

print_fail() {
  echo -e "${RED}✗ FAIL: $1${NC}"
  ((TESTS_FAILED++))
}

check_required() {
  if [ -z "$1" ]; then
    echo -e "${RED}ERROR: $2 is required${NC}"
    echo "Usage: AUTH_TOKEN=xxx TALENT_ID=yyy ./test-task-lifecycle.sh"
    exit 1
  fi
}

#===================================================
# Validation
#===================================================

check_required "$AUTH_TOKEN" "AUTH_TOKEN"
check_required "$TALENT_ID" "TALENT_ID"

print_header "Task Lifecycle Bug Fix Verification"

echo "API URL: $API_URL"
echo "Talent ID: $TALENT_ID"
echo ""

#===================================================
# Test 1: Create a TalentTask
#===================================================

print_test "Create a TalentTask"

TASK_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/talent/$TALENT_ID/tasks" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task from Bug Fix Verification",
    "notes": "Created at '"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'",
    "dueDate": "2026-01-25",
    "status": "PENDING"
  }')

TASK_ID=$(echo "$TASK_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
  print_fail "Failed to create TalentTask"
  echo "Response: $TASK_RESPONSE"
  exit 1
else
  print_pass "TalentTask created with ID: $TASK_ID"
fi

#===================================================
# Test 2: Verify task was saved in database
#===================================================

print_test "Verify task was persisted to TalentTask table"

TALENT_TASKS=$(curl -s -X GET "$API_URL/api/admin/talent/$TALENT_ID/tasks" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$TALENT_TASKS" | grep -q "$TASK_ID"; then
  print_pass "Task found in Talent's task list"
else
  print_fail "Task NOT found in Talent's task list"
  echo "Response: $TALENT_TASKS"
fi

#===================================================
# Test 3: Query unified tasks endpoint
#===================================================

print_test "Query /api/tasks/unified (new endpoint)"

UNIFIED_RESPONSE=$(curl -s -X GET "$API_URL/api/tasks/unified" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$UNIFIED_RESPONSE" | grep -q "$TASK_ID"; then
  print_pass "Task found in unified tasks endpoint ✓ BUG IS FIXED!"
else
  print_fail "Task NOT found in unified tasks endpoint ✗ BUG STILL EXISTS"
  echo "Response: $UNIFIED_RESPONSE"
fi

#===================================================
# Test 4: Verify task type in unified response
#===================================================

print_test "Verify task type is correctly identified as TALENT"

if echo "$UNIFIED_RESPONSE" | grep -A 5 "$TASK_ID" | grep -q '"taskType":"TALENT"'; then
  print_pass "Task correctly identified as TALENT type"
else
  print_fail "Task type not correctly identified"
fi

#===================================================
# Test 5: Test due today filter
#===================================================

print_test "Test due today filter"

TODAY=$(date -u +%Y-%m-%d)
TASK_RESPONSE_TODAY=$(curl -s -X POST "$API_URL/api/admin/talent/$TALENT_ID/tasks" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Task Due Today\",
    \"notes\": \"Should appear in due today list\",
    \"dueDate\": \"$TODAY\",
    \"status\": \"PENDING\"
  }")

TASK_ID_TODAY=$(echo "$TASK_RESPONSE_TODAY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$TASK_ID_TODAY" ]; then
  DUE_TODAY=$(curl -s -X GET "$API_URL/api/tasks/due-today" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  
  if echo "$DUE_TODAY" | grep -q "$TASK_ID_TODAY"; then
    print_pass "Task found in due today list"
  else
    print_fail "Task NOT found in due today list"
  fi
else
  print_fail "Failed to create task due today"
fi

#===================================================
# Test 6: Test dashboard aggregator
#===================================================

print_test "Check dashboard aggregator includes unified tasks"

DASHBOARD=$(curl -s -X GET "$API_URL/api/dashboard/aggregate" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$DASHBOARD" | grep -q '"pendingTasks"'; then
  PENDING_COUNT=$(echo "$DASHBOARD" | grep -o '"pendingTasks":[0-9]*' | cut -d':' -f2)
  print_pass "Dashboard aggregator returns pendingTasks count: $PENDING_COUNT"
else
  print_fail "Dashboard aggregator not returning pendingTasks"
  echo "Response: $DASHBOARD"
fi

#===================================================
# Test 7: Test filtering by talent ID
#===================================================

print_test "Filter unified tasks by talent ID"

TALENT_FILTERED=$(curl -s -X GET "$API_URL/api/tasks/talent/$TALENT_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$TALENT_FILTERED" | grep -q "$TASK_ID"; then
  print_pass "Task filtering by talent ID works correctly"
else
  print_fail "Task filtering by talent ID not working"
fi

#===================================================
# Test 8: Verify notifications were created
#===================================================

print_test "Check if notifications were created for TalentTask"

NOTIFICATIONS=$(curl -s -X GET "$API_URL/api/notifications" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$NOTIFICATIONS" | grep -q "task"; then
  print_pass "Task-related notifications found"
else
  echo -e "${YELLOW}NOTE: Notifications may not be available in this environment${NC}"
fi

#===================================================
# Test 9: Test overdue tasks query
#===================================================

print_test "Query overdue tasks endpoint"

YESTERDAY=$(date -u -d "yesterday" +%Y-%m-%d 2>/dev/null || date -u -v-1d +%Y-%m-%d)
TASK_OVERDUE=$(curl -s -X POST "$API_URL/api/admin/talent/$TALENT_ID/tasks" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Overdue Task\",
    \"notes\": \"This should show as overdue\",
    \"dueDate\": \"$YESTERDAY\",
    \"status\": \"PENDING\"
  }")

TASK_ID_OVERDUE=$(echo "$TASK_OVERDUE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$TASK_ID_OVERDUE" ]; then
  OVERDUE=$(curl -s -X GET "$API_URL/api/tasks/overdue" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  
  if echo "$OVERDUE" | grep -q "$TASK_ID_OVERDUE"; then
    print_pass "Overdue task query working correctly"
  else
    print_fail "Overdue task NOT found in overdue list"
  fi
else
  print_fail "Failed to create overdue task"
fi

#===================================================
# Test 10: Verify response format
#===================================================

print_test "Verify unified task response format"

if echo "$UNIFIED_RESPONSE" | grep -q '"success":true' && \
   echo "$UNIFIED_RESPONSE" | grep -q '"data":\[' && \
   echo "$UNIFIED_RESPONSE" | grep -q '"count":'; then
  print_pass "Response format is correct (success, data, count)"
else
  print_fail "Response format is incorrect"
  echo "Response: $UNIFIED_RESPONSE"
fi

#===================================================
# Summary
#===================================================

print_header "Test Results"

echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
  echo -e "${GREEN}Task lifecycle bug is FIXED!${NC}"
  exit 0
else
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  echo -e "${RED}Please review the failures above${NC}"
  exit 1
fi
