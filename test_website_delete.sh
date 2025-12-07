#!/bin/bash

echo "=== Testing Website Import and Delete ==="
echo ""

# Импортируем тестовый сайт
echo "1. Importing test website..."
IMPORT_RESULT=$(curl -s -X POST "http://localhost:8000/web/import" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "max_pages": 1,
    "site_name": "Test Site"
  }')

echo "Import result: $IMPORT_RESULT"
echo ""

# Ждем немного
sleep 2

# Проверяем список сайтов
echo "2. Checking websites list..."
WEBSITES=$(curl -s "http://localhost:8000/documents" | python -m json.tool | grep -A 20 "websites")
echo "$WEBSITES"
echo ""

# Удаляем сайт
echo "3. Deleting website 'Test Site'..."
DELETE_RESULT=$(curl -s -X DELETE "http://localhost:8000/websites/Test%20Site")
echo "Delete result: $DELETE_RESULT"
echo ""

# Проверяем список сайтов снова
echo "4. Checking websites list after deletion..."
WEBSITES_AFTER=$(curl -s "http://localhost:8000/documents" | python -m json.tool | grep -A 20 "websites")
echo "$WEBSITES_AFTER"
echo ""

echo "=== Test Complete ==="
