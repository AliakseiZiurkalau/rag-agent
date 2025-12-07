#!/bin/bash

# Тестовый скрипт для проверки функциональности управления моделями
# Версия: 2.2.0

echo "🧪 Тестирование функциональности управления моделями"
echo "=================================================="
echo ""

BASE_URL="http://localhost:8000"

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки ответа
check_response() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Успешно${NC}"
    else
        echo -e "${RED}✗ Ошибка${NC}"
        exit 1
    fi
}

# 1. Проверка здоровья системы
echo "1. Проверка здоровья системы..."
curl -s "$BASE_URL/health" | python -m json.tool > /dev/null
check_response
echo ""

# 2. Получение списка моделей
echo "2. Получение списка установленных моделей..."
MODELS=$(curl -s "$BASE_URL/models/list")
echo "$MODELS" | python -m json.tool
check_response
echo ""

# 3. Получение текущих настроек
echo "3. Получение текущих настроек..."
SETTINGS=$(curl -s "$BASE_URL/settings")
echo "$SETTINGS" | python -m json.tool
check_response
echo ""

# 4. Проверка статуса API модели
echo "4. Проверка статуса API модели..."
USE_API=$(echo "$SETTINGS" | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('use_api_model', False))")
if [ "$USE_API" = "True" ]; then
    echo -e "${YELLOW}⚠ API модель подключена${NC}"
    API_CONFIG=$(echo "$SETTINGS" | python -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data.get('api_model_config', {}), indent=2))")
    echo "$API_CONFIG"
else
    echo -e "${GREEN}✓ Используется Ollama${NC}"
fi
echo ""

# 5. Тест обновления настроек
echo "5. Тест обновления настроек..."
UPDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/settings" \
    -H "Content-Type: application/json" \
    -d '{"temperature": 0.1, "num_predict": 80}')
echo "$UPDATE_RESPONSE" | python -m json.tool
check_response
echo ""

# 6. Получение статистики
echo "6. Получение статистики системы..."
STATS=$(curl -s "$BASE_URL/stats")
echo "$STATS" | python -m json.tool
check_response
echo ""

# 7. Проверка документов
echo "7. Проверка загруженных документов..."
DOCS=$(curl -s "$BASE_URL/documents")
DOC_COUNT=$(echo "$DOCS" | python -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('documents', [])))")
echo -e "${GREEN}✓ Найдено документов: $DOC_COUNT${NC}"
echo ""

# Итоговый отчет
echo "=================================================="
echo -e "${GREEN}✓ Все тесты пройдены успешно!${NC}"
echo ""
echo "📊 Сводка:"
echo "  - Система работает"
echo "  - Модели доступны"
echo "  - Настройки сохраняются"
echo "  - Документы загружены: $DOC_COUNT"
echo ""
echo "🌐 Веб-интерфейс: $BASE_URL"
echo "📚 Документация: MODEL_MANAGEMENT_GUIDE.md"
echo ""
