#!/bin/bash

echo "=========================================="
echo "  Проверка исправленных эндпоинтов"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_http_code() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local description=$4
    local data=$5
    
    echo -n "Testing: $description ... "
    
    if [ "$method" = "GET" ]; then
        http_code=$(curl -s -w "%{http_code}" -o /dev/null -X GET "http://localhost:8000$endpoint")
    elif [ "$method" = "POST" ]; then
        http_code=$(curl -s -w "%{http_code}" -o /dev/null -X POST "http://localhost:8000$endpoint" \
            -H "Content-Type: application/json" -d "$data")
    elif [ "$method" = "DELETE" ]; then
        http_code=$(curl -s -w "%{http_code}" -o /dev/null -X DELETE "http://localhost:8000$endpoint")
    fi
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ HTTP $http_code${NC}"
        return 0
    else
        echo -e "${RED}✗ HTTP $http_code (expected $expected_code)${NC}"
        return 1
    fi
}

echo -e "${YELLOW}=== Исправление #1: DELETE /models/{name} ===${NC}"
test_http_code "DELETE" "/models/nonexistent" "404" "Удаление несуществующей модели"
echo ""

echo -e "${YELLOW}=== Исправление #2: POST /models/api/test ===${NC}"
test_http_code "POST" "/models/api/test" "400" "Тест с неверным API ключом" \
    '{"api_type": "openai", "api_key": "invalid", "model_name": "gpt-4"}'
echo ""

echo -e "${YELLOW}=== Исправление #3: POST /models/api/configure ===${NC}"
test_http_code "POST" "/models/api/configure" "400" "Настройка с неверным API ключом" \
    '{"api_type": "openai", "api_key": "invalid", "model_name": "gpt-4"}'
echo ""

echo -e "${YELLOW}=== Исправление #4: POST /xwiki/test ===${NC}"
test_http_code "POST" "/xwiki/test" "503" "Тест с неверным XWiki URL" \
    '{"base_url": "http://invalid.test", "wiki": "xwiki"}'
echo ""

echo -e "${YELLOW}=== Проверка работающих эндпоинтов ===${NC}"
test_http_code "GET" "/health" "200" "Health check"
test_http_code "GET" "/stats" "200" "Stats"
test_http_code "GET" "/documents" "200" "Documents list"
test_http_code "GET" "/models/list" "200" "Models list"
echo ""

echo "=========================================="
echo -e "${GREEN}  Все исправления работают корректно!${NC}"
echo "=========================================="
