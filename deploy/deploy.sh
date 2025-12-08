#!/bin/bash

# Скрипт деплоя RAG Agent на локальный сервер
set -e

# Загружаем конфигурацию
source "$(dirname "$0")/server_config.sh"

echo "🚀 Начинаем деплой RAG Agent на $SERVER_NAME ($SERVER_HOST)"
echo ""

# Проверка подключения
echo "📡 Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER_HOST "echo 'Подключение успешно'" 2>/dev/null; then
    echo "❌ Не удалось подключиться к серверу"
    echo "Проверьте:"
    echo "  - SSH доступ: ssh $SERVER_USER@$SERVER_HOST"
    echo "  - Сетевое подключение"
    echo "  - SSH ключи настроены"
    exit 1
fi
echo "✅ Подключение установлено"
echo ""

# Создание директории на сервере
echo "📁 Создание директории проекта..."
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $REMOTE_DIR"
echo "✅ Директория создана: $REMOTE_DIR"
echo ""

# Копирование файлов
echo "📦 Копирование файлов на сервер..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.venv' \
    --exclude 'venv' \
    --exclude 'data/chroma_db' \
    --exclude 'data/documents' \
    --exclude 'logs' \
    --exclude '.env' \
    ./ $SERVER_USER@$SERVER_HOST:$REMOTE_DIR/

echo "✅ Файлы скопированы"
echo ""

# Копирование .env.example как .env если .env не существует
echo "⚙️  Настройка конфигурации..."
ssh $SERVER_USER@$SERVER_HOST "cd $REMOTE_DIR && [ ! -f .env ] && cp .env.example .env || echo '.env уже существует'"
echo "✅ Конфигурация готова"
echo ""

# Установка зависимостей на сервере
echo "📥 Установка зависимостей на сервере..."
ssh $SERVER_USER@$SERVER_HOST "bash -s" << 'ENDSSH'
set -e

cd /home/admin/rag-agent

echo "🐍 Проверка Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 не установлен"
    exit 1
fi
python3 --version

echo "📦 Создание виртуального окружения..."
python3 -m venv venv
source venv/bin/activate

echo "📥 Установка Python зависимостей..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🔧 Проверка Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama не установлен. Установите вручную:"
    echo "   curl -fsSL https://ollama.com/install.sh | sh"
else
    echo "✅ Ollama установлен"
    ollama --version
fi

echo "📦 Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js не установлен. Установите вручную:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
else
    echo "✅ Node.js установлен"
    node --version
    npm --version
fi

echo "📥 Установка Frontend зависимостей..."
cd frontend
npm install
cd ..

echo "✅ Все зависимости установлены"
ENDSSH

echo "✅ Зависимости установлены"
echo ""

# Создание systemd сервисов
echo "🔧 Создание systemd сервисов..."
ssh $SERVER_USER@$SERVER_HOST "sudo bash -s" << 'ENDSSH'
set -e

# Backend service
cat > /tmp/rag-agent-backend.service << 'EOF'
[Unit]
Description=RAG Agent Backend
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/rag-agent
Environment="PATH=/home/admin/rag-agent/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/admin/rag-agent/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/rag-agent-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable rag-agent-backend

# Frontend service
cat > /tmp/rag-agent-frontend.service << 'EOF'
[Unit]
Description=RAG Agent Frontend
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/rag-agent/frontend
Environment="PATH=/usr/bin:/bin"
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/rag-agent-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable rag-agent-frontend

echo "✅ Systemd сервисы созданы"
ENDSSH

echo "✅ Systemd сервисы настроены"
echo ""

# Запуск сервисов
echo "🚀 Запуск сервисов..."
ssh $SERVER_USER@$SERVER_HOST "sudo systemctl restart rag-agent-backend && sudo systemctl restart rag-agent-frontend"
echo "✅ Сервисы запущены"
echo ""

# Проверка статуса
echo "📊 Проверка статуса сервисов..."
ssh $SERVER_USER@$SERVER_HOST "sudo systemctl status rag-agent-backend --no-pager | head -10"
echo ""
ssh $SERVER_USER@$SERVER_HOST "sudo systemctl status rag-agent-frontend --no-pager | head -10"
echo ""

echo "✅ Деплой завершён!"
echo ""
echo "🌐 Доступ к приложению:"
echo "   Frontend: http://$SERVER_HOST:$FRONTEND_PORT"
echo "   Backend:  http://$SERVER_HOST:$BACKEND_PORT"
echo ""
echo "📝 Полезные команды:"
echo "   Логи backend:  ssh $SERVER_USER@$SERVER_HOST 'sudo journalctl -u rag-agent-backend -f'"
echo "   Логи frontend: ssh $SERVER_USER@$SERVER_HOST 'sudo journalctl -u rag-agent-frontend -f'"
echo "   Статус:        ssh $SERVER_USER@$SERVER_HOST 'sudo systemctl status rag-agent-*'"
echo "   Перезапуск:    ssh $SERVER_USER@$SERVER_HOST 'sudo systemctl restart rag-agent-*'"
echo ""
