#!/bin/bash

# Скрипт для переноса проекта на Raspberry Pi
# Использование: ./scripts/transfer_to_pi.sh pi@raspberrypi.local

if [ -z "$1" ]; then
    echo "Использование: $0 <user@raspberry-pi-host>"
    echo "Пример: $0 pi@raspberrypi.local"
    exit 1
fi

TARGET=$1
PROJECT_NAME="rag-agent"

echo "=== Перенос проекта на Raspberry Pi ==="
echo "Цель: $TARGET"
echo ""

# Проверка подключения
echo "Проверка подключения..."
if ! ssh -o ConnectTimeout=5 "$TARGET" "echo 'OK'" &> /dev/null; then
    echo "Ошибка: Не удалось подключиться к $TARGET"
    exit 1
fi
echo "✓ Подключение установлено"
echo ""

# Создание архива
echo "Создание архива проекта..."
tar -czf /tmp/${PROJECT_NAME}.tar.gz \
    --exclude='data/chroma_db/*' \
    --exclude='data/documents/*' \
    --exclude='logs/*' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.env' \
    .

echo "✓ Архив создан"
echo ""

# Копирование на Raspberry Pi
echo "Копирование на Raspberry Pi..."
scp /tmp/${PROJECT_NAME}.tar.gz "$TARGET":~/

echo "✓ Файлы скопированы"
echo ""

# Распаковка на Raspberry Pi
echo "Распаковка на Raspberry Pi..."
ssh "$TARGET" << 'EOF'
    mkdir -p ~/rag-agent
    cd ~/rag-agent
    tar -xzf ~/${PROJECT_NAME}.tar.gz
    rm ~/${PROJECT_NAME}.tar.gz
    
    # Создание директорий
    mkdir -p data/documents data/chroma_db logs
    
    # Копирование .env.example в .env если не существует
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "✓ Создан .env файл"
    fi
    
    echo "✓ Проект распакован в ~/rag-agent"
EOF

# Очистка локального архива
rm /tmp/${PROJECT_NAME}.tar.gz

echo ""
echo "=== Перенос завершен ==="
echo ""
echo "Следующие шаги:"
echo "1. Подключитесь к Raspberry Pi:"
echo "   ssh $TARGET"
echo ""
echo "2. Перейдите в директорию проекта:"
echo "   cd ~/rag-agent"
echo ""
echo "3. Отредактируйте .env при необходимости:"
echo "   nano .env"
echo ""
echo "4. Запустите проект:"
echo "   make install"
echo ""
