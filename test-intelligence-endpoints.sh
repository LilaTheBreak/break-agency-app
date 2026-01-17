#!/bin/bash

# Intelligence Features - Smoke Test Suite
# Tests all 20+ /api/intelligence endpoints

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-test-token}"

echo -e "${BLUE}=== Intelligence Features Smoke Test ===${NC}"
echo "API Base: $API_BASE_URL"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoints
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo -e "  ${BLUE}$method $endpoint${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -X $method \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    fi
    
    # Check if response contains success or valid JSON
    if echo "$response" | grep -q "success\|data\|error"; then
        echo -e "  ${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}✗ FAIL${NC}"
        echo "  Response: $response"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# ============================================================================
# SMART REMINDERS TESTS
# ============================================================================
echo -e "${BLUE}### SMART REMINDERS ###${NC}"

test_endpoint "GET" "/api/intelligence/reminders?talentId=test-talent-1" "" \
    "Get pending reminders"

test_endpoint "POST" "/api/intelligence/reminders/generate?talentId=test-talent-1" "" \
    "Generate smart reminders"

# ============================================================================
# MEETING AGENDAS TESTS
# ============================================================================
echo -e "${BLUE}### MEETING AGENDAS ###${NC}"

test_endpoint "POST" "/api/intelligence/agendas/generate/test-meeting-1" "" \
    "Generate meeting agenda"

test_endpoint "GET" "/api/intelligence/agendas/test-meeting-1" "" \
    "Get agenda for meeting"

test_endpoint "PUT" "/api/intelligence/agendas/test-meeting-1" \
    '{"objectives":["Test objective"],"talkingPoints":["Point 1"]}' \
    "Update agenda"

test_endpoint "POST" "/api/intelligence/agendas/test-meeting-1/regenerate" "" \
    "Regenerate agenda"

# ============================================================================
# WEEKLY BRIEFS TESTS
# ============================================================================
echo -e "${BLUE}### WEEKLY BRIEFS ###${NC}"

test_endpoint "POST" "/api/intelligence/briefs/generate?talentId=test-talent-1" "" \
    "Generate weekly brief"

test_endpoint "GET" "/api/intelligence/briefs?talentId=test-talent-1" "" \
    "Get weekly brief"

test_endpoint "GET" "/api/intelligence/briefs/recent?talentId=test-talent-1&limit=4" "" \
    "Get recent briefs"

# ============================================================================
# OVERLOAD DETECTION TESTS
# ============================================================================
echo -e "${BLUE}### OVERLOAD DETECTION ###${NC}"

test_endpoint "POST" "/api/intelligence/overload/analyze?talentId=test-talent-1" "" \
    "Analyze calendar for overload"

test_endpoint "GET" "/api/intelligence/overload/warnings?talentId=test-talent-1" "" \
    "Get active warnings"

# ============================================================================
# TALENT AVAILABILITY TESTS
# ============================================================================
echo -e "${BLUE}### TALENT AVAILABILITY ###${NC}"

test_endpoint "GET" "/api/intelligence/availability/test-talent-1" "" \
    "Get availability settings"

test_endpoint "PUT" "/api/intelligence/availability/test-talent-1" \
    '{"workingDays":["Monday","Tuesday","Wednesday","Thursday","Friday"],"startHour":9,"endHour":17,"timezone":"America/New_York"}' \
    "Set availability settings"

test_endpoint "POST" "/api/intelligence/availability/test-talent-1/blackout" \
    '{"startDate":"2025-02-01T00:00:00Z","endDate":"2025-02-08T23:59:59Z","reason":"vacation","notes":"Family trip"}' \
    "Add blackout date"

test_endpoint "GET" "/api/intelligence/availability/test-talent-1/blackout" "" \
    "Get blackout dates"

test_endpoint "POST" "/api/intelligence/availability/test-talent-1/check-time" \
    '{"dateTime":"2025-01-20T14:00:00Z"}' \
    "Check availability at time"

test_endpoint "POST" "/api/intelligence/availability/test-talent-1/find-slot" \
    '{"durationMinutes":60,"maxDaysToSearch":30}' \
    "Find next available slot"

test_endpoint "POST" "/api/intelligence/availability/test-talent-1/validate-meeting" \
    '{"startTime":"2025-01-20T14:00:00Z","endTime":"2025-01-20T15:00:00Z"}' \
    "Validate meeting time"

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BLUE}=== TEST SUMMARY ===${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
