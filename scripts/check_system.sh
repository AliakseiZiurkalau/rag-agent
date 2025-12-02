#!/bin/bash

# Скрипт проверки системы Raspberry Pi для RAG Agent

echo "=== Проверка системы Raspberry Pi ==="
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_ok() {
    echo -e "${GREEN}✓${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

# Архитектура
echo "Архитектура:"
ARCH=$(uname -m)
echo "  $ARCH"
if [[ "$ARCH" == "aarch64" || "$ARCH" == "armv7l" ]]; then
    check_ok "ARM архитектура поддерживается"
else
    check_warn "Не ARM архитектура"
fi
echo ""

# Память
echo "Память:"
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
USED_MEM=$(free -m | awk '/^Mem:/{print $3}')
FREE_MEM=$(free -m | awk '/^Mem:/{print $4}')
echo "  Всего: ${TOTAL_MEM}MB"
echo "  Использовано: ${USED_MEM}MB"
echo "  Свободно: ${FREE_MEM}MB"

if [ "$TOTAL_MEM" -ge 7500 ]; then
    check_ok "8GB RAM - отлично для llama3.2:3b"
elif [ "$TOTAL_MEM" -ge 3500 ]; then
    check_warn "4GB RAM - используйте phi3:mini"
else
    check_fail "Менее 4GB RAM - может быть недостаточно"
fi
echo ""

# Swap
echo "Swap:"
SWAP_TOTAL=$(free -m | grep Swap | awk '{print $2}')
SWAP_USED=$(free -m | grep Swap | awk '{print $3}')
echo "  Всего: ${SWAP_TOTAL}MB"
echo "  Использовано: ${SWAP_USED}MB"

if [ "$SWAP_TOTAL" -ge 2000 ]; then
    check_ok "Swap настроен"
else
    check_warn "Рекомендуется 2GB+ swap"
fi
echo ""

# Диск
echo "Дисковое пространство:"
df -h / | tail -1 | awk '{print "  Всего: "$2"\n  Использовано: "$3"\n  Свободно: "$4"\n  Использовано: "$5}'

FREE_SPACE=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$FREE_SPACE" -ge 20 ]; then
    check_ok "Достаточно места"
else
    check_warn "Рекомендуется 20GB+ свободного места"
fi
echo ""

# Docker
echo "Docker:"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "  $DOCKER_VERSION"
    check_ok "Docker установлен"
    
    if docker ps &> /dev/null; then
        check_ok "Docker работает"
    else
        check_fail "Docker не работает или нет прав"
    fi
else
    check_fail "Docker не установлен"
fi
echo ""

# Docker Compose
echo "Docker Compose:"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo "  $COMPOSE_VERSION"
    check_ok "Docker Compose установлен"
else
    check_fail "Docker Compose не установлен"
fi
echo ""

# Температура CPU
echo "Температура CPU:"
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    TEMP=$(($(cat /sys/class/thermal/thermal_zone0/temp)/1000))
    echo "  ${TEMP}°C"
    
    if [ "$TEMP" -lt 70 ]; then
        check_ok "Температура в норме"
    elif [ "$TEMP" -lt 80 ]; then
        check_warn "Температура повышена"
    else
        check_fail "Температура высокая - проверьте охлаждение"
    fi
else
    echo "  Не удалось определить"
fi
echo ""

# Сеть
echo "Сеть:"
IP=$(hostname -I | awk '{print $1}')
echo "  IP: $IP"
if ping -c 1 8.8.8.8 &> /dev/null; then
    check_ok "Интернет доступен"
else
    check_fail "Нет подключения к интернету"
fi
echo ""

# Рекомендации
echo "=== Рекомендации ==="
echo ""

if [ "$TOTAL_MEM" -lt 7500 ]; then
    echo "• Используйте облегченную модель: phi3:mini"
fi

if [ "$SWAP_TOTAL" -lt 2000 ]; then
    echo "• Создайте swap файл 2GB"
fi

if [ "$FREE_SPACE" -lt 20 ]; then
    echo "• Освободите место на диске"
fi

if [ "$TEMP" -gt 70 ]; then
    echo "• Улучшите охлаждение Raspberry Pi"
fi

echo ""
echo "=== Проверка завершена ==="
