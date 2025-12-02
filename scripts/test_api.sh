#!/bin/bash

# Скрипт для тестирования API

BASE_URL="http://localhost:8000"

echo "=== Testing RAG Agent API ==="
echo ""

# 1. Health check
echo "1. Health check..."
curl -s "$BASE_URL/health" | jq .
echo ""

# 2. Stats
echo "2. Getting stats..."
curl -s "$BASE_URL/stats" | jq .
echo ""

# 3. Upload document (если есть тестовый файл)
if [ -f "test_document.pdf" ]; then
    echo "3. Uploading test document..."
    curl -s -X POST "$BASE_URL/upload" \
        -F "file=@test_document.pdf" | jq .
    echo ""
fi

# 4. Query
echo "4. Testing query..."
curl -s -X POST "$BASE_URL/query" \
    -H "Content-Type: application/json" \
    -d '{"question": "Тестовый вопрос"}' | jq .
echo ""

echo "=== Tests completed ==="
