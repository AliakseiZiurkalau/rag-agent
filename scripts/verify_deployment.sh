#!/bin/bash

# Скрипт проверки развертывания RAG Agent на Raspberry Pi

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Счетчики
PASSED=0
FAILED=0
WARNINGS=0

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Проверка развертывания RAG Agent                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Функции для вывода
check_ok() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. Проверка Docker
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Проверка Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null; then
    check_ok "Docker установлен: $(docker --version)"
    
    if docker ps &> /dev/null; then
        check_ok "Docker работает"
    else
        check_fail "Docker не работает или нет прав"
        info "Выполните: sudo usermod -aG docker $USER && newgrp docker"
    fi
else
    check_fail "Docker не установлен"
    info "Установите Docker: curl -fsSL https://get.docker.com | sh"
fi

if command -v docker-compose &> /dev/null; then
    check_ok "Docker Compose установлен: $(docker-compose --version)"
else
    check_fail "Docker Compose не установлен"
    info "Установите: sudo apt install docker-compose"
fi
echo ""

# 2. Проверка структуры проекта
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Проверка структуры проекта"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REQUIRED_FILES=(
    "docker-compose.yml"
    "Dockerfile"
    "requirements.txt"
    ".env"
    "Makefile"
    "main.py"
    "config.py"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_ok "Файл $file существует"
    else
        check_fail "Файл $file отсутствует"
    fi
done

REQUIRED_DIRS=(
    "api"
    "src"
    "data/documents"
    "data/chroma_db"
    "logs"
    "static"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check_ok "Директория $dir существует"
    else
        check_fail "Директория $dir отсутствует"
        info "Создайте: mkdir -p $dir"
    fi
done
echo ""

# 3. Проверка конфигурации
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Проверка конфигурации"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    check_ok "Файл .env существует"
    
    # Проверка ключевых параметров
    if grep -q "OLLAMA_MODEL" .env; then
        MODEL=$(grep "OLLAMA_MODEL" .env | cut -d'=' -f2)
        info "Модель: $MODEL"
    else
        check_warn "OLLAMA_MODEL не настроен"
    fi
    
    if grep -q "API_PORT" .env; then
        PORT=$(grep "API_PORT" .env | cut -d'=' -f2)
        info "Порт API: $PORT"
    fi
else
    check_fail "Файл .env отсутствует"
    info "Создайте: cp .env.example .env"
fi
echo ""

# 4. Проверка Docker контейнеров
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Проверка Docker контейнеров"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps &> /dev/null; then
    # Проверка rag-agent
    if docker ps --format '{{.Names}}' | grep -q "rag-agent"; then
        STATUS=$(docker ps --filter "name=rag-agent" --format "{{.Status}}")
        check_ok "Контейнер rag-agent запущен ($STATUS)"
    else
        check_fail "Контейнер rag-agent не запущен"
        info "Запустите: make up или docker-compose up -d"
    fi
    
    # Проверка ollama
    if docker ps --format '{{.Names}}' | grep -q "ollama"; then
        STATUS=$(docker ps --filter "name=ollama" --format "{{.Status}}")
        check_ok "Контейнер ollama запущен ($STATUS)"
    else
        check_fail "Контейнер ollama не запущен"
        info "Запустите: make up или docker-compose up -d"
    fi
    
    # Статистика контейнеров
    echo ""
    info "Статистика контейнеров:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | grep -E "rag-agent|ollama|NAME"
else
    check_fail "Не удалось получить список контейнеров"
fi
echo ""

# 5. Проверка сети
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Проверка сети и портов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Проверка порта 8000
if netstat -tuln 2>/dev/null | grep -q ":8000 " || ss -tuln 2>/dev/null | grep -q ":8000 "; then
    check_ok "Порт 8000 открыт (API)"
else
    check_fail "Порт 8000 не открыт"
fi

# Проверка порта 11434
if netstat -tuln 2>/dev/null | grep -q ":11434 " || ss -tuln 2>/dev/null | grep -q ":11434 "; then
    check_ok "Порт 11434 открыт (Ollama)"
else
    check_warn "Порт 11434 не открыт (Ollama может быть в Docker сети)"
fi

# IP адрес
IP=$(hostname -I | awk '{print $1}')
info "IP адрес: $IP"
echo ""

# 6. Проверка API
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Проверка API endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health check
if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
    check_ok "Health endpoint доступен"
    
    HEALTH=$(curl -s http://localhost:8000/health)
    OLLAMA_STATUS=$(echo $HEALTH | grep -o '"ollama":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$OLLAMA_STATUS" = "healthy" ]; then
        check_ok "Ollama работает корректно"
    else
        check_warn "Ollama статус: $OLLAMA_STATUS"
    fi
else
    check_fail "Health endpoint недоступен"
    info "Проверьте логи: make logs-rag"
fi

# Stats endpoint
if curl -s -f http://localhost:8000/stats > /dev/null 2>&1; then
    check_ok "Stats endpoint доступен"
    
    STATS=$(curl -s http://localhost:8000/stats)
    DOCS_COUNT=$(echo $STATS | grep -o '"documents_count":[0-9]*' | cut -d':' -f2)
    info "Документов в базе: $DOCS_COUNT"
else
    check_fail "Stats endpoint недоступен"
fi

# Web interface
if curl -s -f http://localhost:8000/ > /dev/null 2>&1; then
    check_ok "Веб-интерфейс доступен"
else
    check_fail "Веб-интерфейс недоступен"
fi
echo ""

# 7. Проверка Ollama
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Проверка Ollama"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps --format '{{.Names}}' | grep -q "ollama"; then
    # Список моделей
    MODELS=$(docker exec ollama ollama list 2>/dev/null)
    if [ $? -eq 0 ]; then
        check_ok "Ollama доступен"
        echo ""
        info "Установленные модели:"
        echo "$MODELS"
        
        # Проверка наличия модели из .env
        if [ -f ".env" ] && grep -q "OLLAMA_MODEL" .env; then
            MODEL=$(grep "OLLAMA_MODEL" .env | cut -d'=' -f2)
            if echo "$MODELS" | grep -q "$MODEL"; then
                check_ok "Модель $MODEL установлена"
            else
                check_fail "Модель $MODEL не установлена"
                info "Установите: make pull-model"
            fi
        fi
    else
        check_fail "Не удалось получить список моделей"
    fi
else
    check_fail "Контейнер ollama не запущен"
fi
echo ""

# 8. Проверка ресурсов
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. Проверка ресурсов системы"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Память
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
USED_MEM=$(free -m | awk '/^Mem:/{print $3}')
FREE_MEM=$(free -m | awk '/^Mem:/{print $4}')
MEM_PERCENT=$((USED_MEM * 100 / TOTAL_MEM))

info "Память: ${USED_MEM}MB / ${TOTAL_MEM}MB (${MEM_PERCENT}%)"

if [ $MEM_PERCENT -lt 80 ]; then
    check_ok "Использование памяти в норме"
elif [ $MEM_PERCENT -lt 90 ]; then
    check_warn "Высокое использование памяти"
else
    check_fail "Критическое использование памяти"
fi

# Диск
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_FREE=$(df -h / | tail -1 | awk '{print $4}')

info "Диск: ${DISK_USAGE}% использовано, свободно: ${DISK_FREE}"

if [ $DISK_USAGE -lt 80 ]; then
    check_ok "Достаточно места на диске"
elif [ $DISK_USAGE -lt 90 ]; then
    check_warn "Мало места на диске"
else
    check_fail "Критически мало места на диске"
fi

# Температура CPU (для Raspberry Pi)
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    TEMP=$(($(cat /sys/class/thermal/thermal_zone0/temp)/1000))
    info "Температура CPU: ${TEMP}°C"
    
    if [ $TEMP -lt 70 ]; then
        check_ok "Температура в норме"
    elif [ $TEMP -lt 80 ]; then
        check_warn "Температура повышена"
    else
        check_fail "Температура высокая - проверьте охлаждение"
    fi
fi
echo ""

# 9. Проверка логов
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. Проверка логов"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "logs" ]; then
    check_ok "Директория logs существует"
    
    if [ -f "logs/rag_agent.log" ]; then
        LOG_SIZE=$(du -h logs/rag_agent.log | cut -f1)
        info "Размер лога: $LOG_SIZE"
        
        # Проверка на ошибки в последних 50 строках
        ERROR_COUNT=$(tail -50 logs/rag_agent.log 2>/dev/null | grep -i "error" | wc -l)
        if [ $ERROR_COUNT -eq 0 ]; then
            check_ok "Нет ошибок в последних логах"
        else
            check_warn "Найдено ошибок в логах: $ERROR_COUNT"
            info "Просмотрите: tail -50 logs/rag_agent.log | grep -i error"
        fi
    else
        check_warn "Файл лога не создан"
    fi
else
    check_fail "Директория logs отсутствует"
fi
echo ""

# Итоги
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Итоги проверки                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Успешно:${NC} $PASSED"
echo -e "${YELLOW}Предупреждения:${NC} $WARNINGS"
echo -e "${RED}Ошибки:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Проект развернут корректно!${NC}"
    echo ""
    echo "Доступ к веб-интерфейсу:"
    echo "  http://localhost:8000"
    echo "  http://$IP:8000"
    echo ""
    echo "Полезные команды:"
    echo "  make logs       - просмотр логов"
    echo "  make status     - статус контейнеров"
    echo "  make restart    - перезапуск"
else
    echo -e "${RED}✗ Обнаружены проблемы при развертывании${NC}"
    echo ""
    echo "Рекомендации:"
    echo "  1. Проверьте логи: make logs"
    echo "  2. Перезапустите: make restart"
    echo "  3. Проверьте документацию: INSTALL_RASPBERRY_PI.md"
fi
echo ""
