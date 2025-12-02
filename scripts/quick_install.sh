#!/bin/bash

# Быстрая установка RAG Agent на Raspberry Pi
# Использование: curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/quick_install.sh | bash

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         RAG Agent - Быстрая установка для Raspberry Pi    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функции для вывода
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка архитектуры
ARCH=$(uname -m)
if [[ "$ARCH" != "aarch64" && "$ARCH" != "armv7l" ]]; then
    error "Этот скрипт предназначен для ARM архитектуры (Raspberry Pi)"
fi

info "Архитектура: $ARCH"

# Проверка памяти
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
info "Доступная память: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 3500 ]; then
    warn "Обнаружено менее 4GB RAM. Будут использованы облегченные настройки."
    USE_LIGHT_CONFIG=true
else
    USE_LIGHT_CONFIG=false
fi

# Шаг 1: Обновление системы
info "Обновление системы..."
sudo apt update
sudo apt upgrade -y

# Шаг 2: Установка базовых пакетов
info "Установка базовых пакетов..."
sudo apt install -y git curl wget vim htop make

# Шаг 3: Установка Docker
if ! command -v docker &> /dev/null; then
    info "Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    info "Docker установлен"
else
    info "Docker уже установлен: $(docker --version)"
fi

# Шаг 4: Установка Docker Compose
if ! command -v docker-compose &> /dev/null; then
    info "Установка Docker Compose..."
    sudo apt install -y docker-compose
    info "Docker Compose установлен"
else
    info "Docker Compose уже установлен: $(docker-compose --version)"
fi

# Шаг 5: Настройка swap (если нужно)
SWAP_SIZE=$(free -m | grep Swap | awk '{print $2}')
if [ "$SWAP_SIZE" -lt 2048 ] && [ "$USE_LIGHT_CONFIG" = true ]; then
    info "Создание swap файла (2GB)..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
        echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
        sudo sysctl -p
    fi
    
    info "Swap настроен"
fi

# Шаг 6: Настройка Docker
info "Настройка Docker..."
sudo mkdir -p /etc/docker

sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl restart docker

# Шаг 7: Клонирование проекта
INSTALL_DIR="$HOME/rag-agent"

if [ -d "$INSTALL_DIR" ]; then
    warn "Директория $INSTALL_DIR уже существует"
    read -p "Удалить и переустановить? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        error "Установка отменена"
    fi
fi

info "Создание директории проекта..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Если проект в Git, раскомментируйте:
# info "Клонирование репозитория..."
# git clone <YOUR_REPO_URL> .

# Шаг 8: Создание структуры проекта
info "Создание структуры директорий..."
mkdir -p data/documents data/chroma_db logs static api src scripts

# Шаг 9: Настройка .env
info "Создание конфигурации..."

if [ "$USE_LIGHT_CONFIG" = true ]; then
    MODEL="phi3:mini"
    CHUNK_SIZE="500"
    TOP_K="2"
    MEM_LIMIT_RAG="1G"
    MEM_LIMIT_OLLAMA="2.5G"
else
    MODEL="llama3.2:3b"
    CHUNK_SIZE="1000"
    TOP_K="5"
    MEM_LIMIT_RAG="2G"
    MEM_LIMIT_OLLAMA="6G"
fi

cat > .env <<EOF
# Ollama configuration
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=$MODEL
OLLAMA_TIMEOUT=180

# Embedding configuration
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
CHUNK_SIZE=$CHUNK_SIZE
CHUNK_OVERLAP=150
TOP_K_RESULTS=$TOP_K

# API configuration
API_HOST=0.0.0.0
API_PORT=8000
MAX_UPLOAD_SIZE=10485760
ALLOWED_ORIGINS=*

# Logging
LOG_LEVEL=INFO

# Cache
ENABLE_CACHE=true
CACHE_TTL=3600
EOF

info "Конфигурация создана"

# Шаг 10: Информация о следующих шагах
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  Установка завершена!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
info "Проект установлен в: $INSTALL_DIR"
echo ""
echo "Следующие шаги:"
echo ""
echo "1. Перезайдите в систему для применения прав Docker:"
echo "   ${GREEN}exit${NC}"
echo "   ${GREEN}ssh pi@raspberrypi.local${NC}"
echo ""
echo "2. Перейдите в директорию проекта:"
echo "   ${GREEN}cd $INSTALL_DIR${NC}"
echo ""
echo "3. Скопируйте файлы проекта (если не используете Git)"
echo ""
echo "4. Запустите проект:"
echo "   ${GREEN}make install${NC}"
echo ""
echo "5. Откройте веб-интерфейс:"
echo "   ${GREEN}http://$(hostname -I | awk '{print $1}'):8000${NC}"
echo ""
echo "Используемая конфигурация:"
echo "  - Модель: $MODEL"
echo "  - Размер чанков: $CHUNK_SIZE"
echo "  - Top-K: $TOP_K"
echo ""
echo "Полная документация: $INSTALL_DIR/INSTALL_RASPBERRY_PI.md"
echo ""
