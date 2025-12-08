#!/bin/bash

# Скрипт первоначальной настройки сервера
set -e

source "$(dirname "$0")/server_config.sh"

echo "🔧 Настройка сервера $SERVER_NAME ($SERVER_HOST)"
echo ""

echo "📦 Установка необходимых пакетов..."
ssh $SERVER_USER@$SERVER_HOST "sudo bash -s" << 'ENDSSH'
set -e

echo "🔄 Обновление системы..."
sudo apt-get update

echo "📦 Установка базовых пакетов..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    build-essential \
    rsync

echo "✅ Базовые пакеты установлены"

# Установка Node.js
echo "📦 Установка Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js установлен"
else
    echo "✅ Node.js уже установлен"
fi
node --version
npm --version

# Установка Ollama
echo "📦 Установка Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✅ Ollama установлен"
else
    echo "✅ Ollama уже установлен"
fi
ollama --version

# Запуск Ollama как сервис
echo "🚀 Настройка Ollama сервиса..."
sudo systemctl enable ollama
sudo systemctl start ollama

# Скачивание базовой модели
echo "📥 Скачивание базовой модели llama3.2:1b..."
ollama pull llama3.2:1b

echo "✅ Сервер настроен!"
ENDSSH

echo ""
echo "✅ Настройка сервера завершена!"
echo ""
echo "📝 Следующий шаг:"
echo "   ./deploy/deploy.sh"
echo ""
