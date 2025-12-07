#!/bin/bash

echo "=========================================="
echo "  Тестирование всех исправлений"
echo "=========================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки результата
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}=== Тест 1: Удаление сайтов ===${NC}"
echo ""

# 1. Импорт тестового сайта
echo "1.1. Импорт тестового сайта..."
IMPORT_RESULT=$(curl -s -X POST "http://localhost:8000/web/import" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "max_pages": 1, "site_name": "Test Site Delete"}')

if echo "$IMPORT_RESULT" | grep -q "success"; then
    check_result 0 "Сайт импортирован"
else
    check_result 1 "Ошибка импорта сайта"
fi

sleep 1

# 2. Проверка наличия сайта
echo "1.2. Проверка наличия сайта в списке..."
WEBSITES=$(curl -s "http://localhost:8000/documents")
if echo "$WEBSITES" | grep -q "Test Site Delete"; then
    check_result 0 "Сайт найден в списке"
else
    check_result 1 "Сайт не найден в списке"
fi

# 3. Удаление сайта
echo "1.3. Удаление сайта..."
DELETE_RESULT=$(curl -s -X DELETE "http://localhost:8000/websites/Test%20Site%20Delete")
if echo "$DELETE_RESULT" | grep -q "success"; then
    check_result 0 "Сайт удален"
else
    check_result 1 "Ошибка удаления сайта"
fi

sleep 1

# 4. Проверка отсутствия сайта
echo "1.4. Проверка отсутствия сайта после удаления..."
WEBSITES_AFTER=$(curl -s "http://localhost:8000/documents")
if echo "$WEBSITES_AFTER" | grep -q "Test Site Delete"; then
    check_result 1 "Сайт все еще в списке (ошибка)"
else
    check_result 0 "Сайт успешно удален из списка"
fi

echo ""
echo -e "${YELLOW}=== Тест 2: Загрузка моделей ===${NC}"
echo ""

# 5. Проверка эндпоинта загрузки
echo "2.1. Проверка доступности эндпоинта загрузки..."
DOWNLOAD_TEST=$(curl -s -N "http://localhost:8000/models/download?model_name=llama3.2:1b" --max-time 5 2>&1)
if echo "$DOWNLOAD_TEST" | grep -q "data:"; then
    check_result 0 "Эндпоинт загрузки работает (SSE)"
else
    check_result 1 "Эндпоинт загрузки не работает"
fi

# 6. Проверка списка моделей
echo "2.2. Проверка списка моделей..."
MODELS=$(curl -s "http://localhost:8000/models/list")
if echo "$MODELS" | grep -q "models"; then
    check_result 0 "Список моделей доступен"
else
    check_result 1 "Ошибка получения списка моделей"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  Все тесты пройдены успешно!"
echo -e "==========================================${NC}"
echo ""
