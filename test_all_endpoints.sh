#!/bin/bash

echo "=========================================="
echo "  Проверка всех API эндпоинтов"
echo "=========================================="
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:8000"
PASSED=0
FAILED=0

# Функция для тестирования эндпоинта
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_code=${5:-200}
    
    echo -n "Testing: $description ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ ($http_code)${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ ($http_code, expected $expected_code)${NC}"
        echo "  Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo -e "${BLUE}=== Health & Stats ===${NC}"
test_endpoint "GET" "/health" "GET /health"
test_endpoint "GET" "/stats" "GET /stats"
echo ""

echo -e "${BLUE}=== Documents ===${NC}"
test_endpoint "GET" "/documents" "GET /documents"
# Upload требует multipart/form-data, пропускаем
echo "Skipping: POST /upload (requires file upload)"
test_endpoint "DELETE" "/clear" "DELETE /clear"
# Восстанавливаем данные после clear
curl -s -X POST "$BASE_URL/web/import" \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com", "max_pages": 1, "site_name": "Test"}' > /dev/null
sleep 1
test_endpoint "DELETE" "/documents/test_hash" "DELETE /documents/{hash}" "" "404"
echo ""

echo -e "${BLUE}=== Query ===${NC}"
test_endpoint "POST" "/query" "POST /query" '{"question": "test"}'
echo ""

echo -e "${BLUE}=== Settings ===${NC}"
test_endpoint "GET" "/settings" "GET /settings"
test_endpoint "POST" "/settings" "POST /settings" '{"temperature": 0.7}'
echo ""

echo -e "${BLUE}=== Models ===${NC}"
test_endpoint "GET" "/models/list" "GET /models/list"
# Download через EventSource, проверяем отдельно
echo -n "Testing: GET /models/download (EventSource) ... "
download_test=$(curl -s -N "$BASE_URL/models/download?model_name=llama3.2:1b" --max-time 2 2>&1 | head -1)
if echo "$download_test" | grep -q "data:"; then
    echo -e "${GREEN}✓ (SSE working)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ (SSE not working)${NC}"
    FAILED=$((FAILED + 1))
fi
test_endpoint "DELETE" "/models/nonexistent" "DELETE /models/{name}" "" "400"
echo ""

echo -e "${BLUE}=== API Models ===${NC}"
test_endpoint "POST" "/models/api/test" "POST /models/api/test" \
    '{"api_type": "openai", "api_key": "test", "model_name": "gpt-4"}' "400"
test_endpoint "POST" "/models/api/configure" "POST /models/api/configure" \
    '{"api_type": "openai", "api_key": "test", "model_name": "gpt-4"}' "400"
test_endpoint "DELETE" "/models/api/configure" "DELETE /models/api/configure"
echo ""

echo -e "${BLUE}=== XWiki ===${NC}"
test_endpoint "POST" "/xwiki/test" "POST /xwiki/test" \
    '{"base_url": "http://test.com", "wiki": "xwiki"}' "500"
test_endpoint "POST" "/xwiki/import" "POST /xwiki/import" \
    '{"base_url": "http://test.com", "wiki": "xwiki"}' "400"
echo ""

echo -e "${BLUE}=== Web Scraping ===${NC}"
test_endpoint "POST" "/web/test" "POST /web/test" \
    '{"url": "https://example.com", "max_pages": 1}'
test_endpoint "POST" "/web/import" "POST /web/import" \
    '{"url": "https://example.com", "max_pages": 1, "site_name": "Test Site"}'
sleep 1
test_endpoint "DELETE" "/websites/Test%20Site" "DELETE /websites/{name}"
echo ""

echo "=========================================="
echo -e "  Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All critical endpoints working!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some endpoints have issues${NC}"
    exit 1
fi
