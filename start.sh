#!/bin/bash

# Скрипт запуска RAG Agent

echo "🚀 Запуск RAG Agent..."

# Проверка виртуального окружения
if [ ! -d "venv" ]; then
    echo "❌ Виртуальное окружение не найдено!"
    echo "Создайте его командой: python3 -m venv venv"
    exit 1
fi

# Проверка Ollama
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama не установлен!"
    echo "Установите Ollama: https://ollama.com/download"
    exit 1
fi

# Проверка, запущен ли Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama не запущен. Запускаем..."
    ollama serve &
    sleep 3
fi

# Активация виртуального окружения
source venv/bin/activate

# Проверка .env файла
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден. Копируем из .env.example..."
    cp .env.example .env
fi

# Запуск приложения
echo "✅ Запуск сервера на http://localhost:8000"
python main.py
