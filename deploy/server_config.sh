#!/bin/bash

# Конфигурация сервера для деплоя
SERVER_HOST="192.168.100.25"
SERVER_USER="admin"
SERVER_NAME="localpiserver"
PROJECT_NAME="rag-agent"
REMOTE_DIR="/home/admin/rag-agent"

# Порты
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Python версия
PYTHON_VERSION="3.9"

echo "=== Конфигурация сервера ==="
echo "Хост: $SERVER_HOST"
echo "Пользователь: $SERVER_USER"
echo "Имя сервера: $SERVER_NAME"
echo "Удалённая директория: $REMOTE_DIR"
echo "Backend порт: $BACKEND_PORT"
echo "Frontend порт: $FRONTEND_PORT"
