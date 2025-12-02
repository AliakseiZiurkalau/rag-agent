#!/bin/bash

# Скрипт для настройки Raspberry Pi 4B для RAG Agent

echo "=== RAG Agent Setup for Raspberry Pi 4B ==="
echo ""

# Проверка системы
echo "Checking system..."
echo "OS: $(uname -a)"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
echo ""

# Установка Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed. Please log out and log back in."
else
    echo "Docker already installed: $(docker --version)"
fi

# Установка Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-compose
else
    echo "Docker Compose already installed: $(docker-compose --version)"
fi

# Настройка swap (рекомендуется для 4GB RAM)
SWAP_SIZE=$(free -m | grep Swap | awk '{print $2}')
if [ "$SWAP_SIZE" -lt 2048 ]; then
    echo "Current swap: ${SWAP_SIZE}MB"
    echo "Recommended: 2GB+ for better performance"
    read -p "Create 2GB swap file? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        echo "Swap created and enabled"
    fi
fi

# Оптимизация для SD карты
echo ""
echo "Optimizing for SD card..."
sudo bash -c 'echo "vm.swappiness=10" >> /etc/sysctl.conf'
sudo sysctl -p

# Создание директорий
echo ""
echo "Creating directories..."
mkdir -p data/documents data/chroma_db logs

# Копирование .env
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit .env file with your settings"
fi

echo ""
echo "=== Setup completed ==="
echo ""
echo "Next steps:"
echo "1. Edit .env file if needed"
echo "2. Run: make install"
echo "3. Wait for services to start"
echo "4. Test: curl http://localhost:8000/health"
