# Установка RAG Agent на Raspberry Pi 4B

Пошаговая инструкция по установке и настройке проекта на Raspberry Pi 4B (8GB RAM).

## Требования

- Raspberry Pi 4B (рекомендуется 8GB RAM, минимум 4GB)
- MicroSD карта 32GB+ (рекомендуется SSD через USB 3.0)
- Raspberry Pi OS (64-bit) или Ubuntu Server 22.04 ARM64
- Подключение к интернету
- SSH доступ или монитор с клавиатурой

## Шаг 1: Подготовка Raspberry Pi

### 1.1 Обновление системы

```bash
# Подключитесь к Raspberry Pi через SSH
ssh pi@raspberrypi.local

# Обновите систему
sudo apt update && sudo apt upgrade -y

# Перезагрузите (если были обновления ядра)
sudo reboot
```

### 1.2 Установка необходимых пакетов

```bash
# Установка базовых инструментов
sudo apt install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    make
```

### 1.3 Настройка swap (для 4GB RAM)

Если у вас 4GB RAM, увеличьте swap:

```bash
# Проверка текущего swap
free -h

# Создание 2GB swap файла
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Добавление в fstab для автозагрузки
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Оптимизация swappiness
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Проверка
free -h
```

### 1.4 Настройка для SSD (опционально, но рекомендуется)

Если используете SSD через USB:

```bash
# Найдите ваш SSD
lsblk

# Отформатируйте (замените sdX на ваше устройство)
sudo mkfs.ext4 /dev/sdX1

# Создайте точку монтирования
sudo mkdir -p /mnt/ssd

# Смонтируйте
sudo mount /dev/sdX1 /mnt/ssd

# Добавьте в fstab для автомонтирования
echo '/dev/sdX1 /mnt/ssd ext4 defaults 0 2' | sudo tee -a /etc/fstab

# Создайте рабочую директорию
sudo mkdir -p /mnt/ssd/rag-agent
sudo chown -R $USER:$USER /mnt/ssd/rag-agent
```

## Шаг 2: Установка Docker

### 2.1 Установка Docker Engine

```bash
# Скачивание и установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Удаление установочного скрипта
rm get-docker.sh

# Выход и повторный вход для применения изменений группы
exit
```

Подключитесь снова через SSH:

```bash
ssh pi@raspberrypi.local

# Проверка установки Docker
docker --version
docker ps
```

### 2.2 Установка Docker Compose

```bash
# Установка Docker Compose
sudo apt install -y docker-compose

# Проверка версии
docker-compose --version
```

### 2.3 Настройка Docker для оптимальной работы

```bash
# Создание конфигурации Docker daemon
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

# Перезапуск Docker
sudo systemctl restart docker
```

## Шаг 3: Перенос проекта на Raspberry Pi

### 3.1 Клонирование репозитория

Если проект в Git:

```bash
# Перейдите в рабочую директорию
cd /mnt/ssd  # или cd ~

# Клонируйте репозиторий
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> rag-agent
cd rag-agent
```

### 3.2 Перенос файлов с локального компьютера

Если проект не в Git, используйте SCP:

```bash
# На вашем локальном компьютере (Mac/Linux)
cd /path/to/rag-agent

# Архивируйте проект (исключая ненужные файлы)
tar -czf rag-agent.tar.gz \
    --exclude='data/chroma_db/*' \
    --exclude='data/documents/*' \
    --exclude='logs/*' \
    --exclude='__pycache__' \
    --exclude='.git' \
    .

# Скопируйте на Raspberry Pi
scp rag-agent.tar.gz pi@raspberrypi.local:~/

# На Raspberry Pi
ssh pi@raspberrypi.local
cd /mnt/ssd  # или cd ~
tar -xzf ~/rag-agent.tar.gz -C rag-agent
cd rag-agent
rm ~/rag-agent.tar.gz
```

### 3.3 Альтернатива: использование rsync

```bash
# На локальном компьютере
rsync -avz --progress \
    --exclude='data/chroma_db/*' \
    --exclude='data/documents/*' \
    --exclude='logs/*' \
    --exclude='__pycache__' \
    --exclude='.git' \
    /path/to/rag-agent/ \
    pi@raspberrypi.local:~/rag-agent/
```

## Шаг 4: Настройка проекта

### 4.1 Проверка файлов

```bash
cd ~/rag-agent  # или cd /mnt/ssd/rag-agent

# Проверка структуры
ls -la

# Должны быть:
# - docker-compose.yml
# - Dockerfile
# - requirements.txt
# - .env.example
# - Makefile
```

### 4.2 Настройка переменных окружения

```bash
# Создайте .env файл
cp .env.example .env

# Отредактируйте настройки
nano .env
```

Рекомендуемые настройки для Raspberry Pi 4B (8GB):

```bash
# Ollama configuration
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT=180

# Embedding configuration
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=150
TOP_K_RESULTS=3

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
```

Для 4GB RAM используйте более легкие настройки:

```bash
OLLAMA_MODEL=phi3:mini
CHUNK_SIZE=500
TOP_K_RESULTS=2
```

### 4.3 Создание необходимых директорий

```bash
# Создание директорий
mkdir -p data/documents data/chroma_db logs

# Проверка прав доступа
chmod -R 755 data logs
```

## Шаг 5: Сборка и запуск

### 5.1 Сборка Docker образов

```bash
# Сборка образов (может занять 10-15 минут)
make build

# Или вручную:
docker-compose build
```

### 5.2 Запуск контейнеров

```bash
# Запуск в фоновом режиме
make up

# Или вручную:
docker-compose up -d
```

### 5.3 Проверка статуса

```bash
# Проверка запущенных контейнеров
make status

# Просмотр логов
make logs

# Логи конкретного сервиса
make logs-rag
make logs-ollama
```

## Шаг 6: Загрузка модели Ollama

### 6.1 Загрузка модели

```bash
# Загрузка модели (может занять 5-10 минут)
make pull-model

# Или вручную:
docker-compose exec ollama ollama pull llama3.2:3b
```

### 6.2 Проверка модели

```bash
# Список загруженных моделей
docker-compose exec ollama ollama list

# Тест модели
docker-compose exec ollama ollama run llama3.2:3b "Привет"
```

## Шаг 7: Проверка работы

### 7.1 Проверка API

```bash
# Health check
curl http://localhost:8000/health

# Статистика
curl http://localhost:8000/stats
```

Ожидаемый ответ:

```json
{
  "status": "healthy",
  "ollama": "healthy",
  "vector_store": "healthy",
  "documents_count": 0
}
```

### 7.2 Доступ к веб-интерфейсу

Откройте браузер на вашем компьютере:

```
http://raspberrypi.local:8000
```

Или используйте IP адрес:

```bash
# Узнайте IP адрес Raspberry Pi
hostname -I

# Откройте в браузере
http://192.168.X.X:8000
```

### 7.3 Тест загрузки документа

```bash
# Создайте тестовый файл
echo "Это тестовый документ для проверки RAG агента." > test.txt

# Загрузите через API
curl -X POST "http://localhost:8000/upload" \
  -F "file=@test.txt"
```

### 7.4 Тест запроса

```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Что содержится в документе?"}'
```

## Шаг 8: Настройка автозапуска

### 8.1 Создание systemd сервиса

```bash
# Создайте сервис
sudo nano /etc/systemd/system/rag-agent.service
```

Содержимое файла:

```ini
[Unit]
Description=RAG Agent Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/rag-agent
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=pi

[Install]
WantedBy=multi-user.target
```

### 8.2 Активация сервиса

```bash
# Перезагрузка systemd
sudo systemctl daemon-reload

# Включение автозапуска
sudo systemctl enable rag-agent.service

# Запуск сервиса
sudo systemctl start rag-agent.service

# Проверка статуса
sudo systemctl status rag-agent.service
```

## Шаг 9: Мониторинг и обслуживание

### 9.1 Мониторинг ресурсов

```bash
# Использование ресурсов
htop

# Статистика Docker контейнеров
docker stats

# Использование диска
df -h

# Логи системы
journalctl -u rag-agent.service -f
```

### 9.2 Регулярное обслуживание

```bash
# Очистка неиспользуемых Docker образов
docker system prune -a

# Очистка логов
make clean

# Перезапуск сервисов
make restart

# Обновление проекта (если в Git)
git pull
make build
make restart
```

### 9.3 Резервное копирование

```bash
# Создание резервной копии данных
tar -czf rag-agent-backup-$(date +%Y%m%d).tar.gz \
    data/chroma_db \
    data/documents \
    .env

# Копирование на другой компьютер
scp rag-agent-backup-*.tar.gz user@backup-server:/backups/
```

## Шаг 10: Оптимизация производительности

### 10.1 Настройка лимитов памяти

Отредактируйте `docker-compose.yml`:

```yaml
services:
  rag-agent:
    deploy:
      resources:
        limits:
          memory: 1.5G  # Уменьшите для 4GB RAM
        reservations:
          memory: 512M

  ollama:
    deploy:
      resources:
        limits:
          memory: 5G    # Уменьшите для 4GB RAM
        reservations:
          memory: 3G
```

### 10.2 Использование более легких моделей

```bash
# Для 4GB RAM
docker-compose exec ollama ollama pull phi3:mini

# Обновите .env
nano .env
# OLLAMA_MODEL=phi3:mini
```

### 10.3 Настройка кэширования

```bash
# В .env увеличьте TTL кэша
CACHE_TTL=7200  # 2 часа
```

## Troubleshooting

### Проблема: Контейнеры не запускаются

```bash
# Проверка логов
docker-compose logs

# Проверка Docker
sudo systemctl status docker

# Перезапуск Docker
sudo systemctl restart docker
```

### Проблема: Ollama не отвечает

```bash
# Проверка статуса
docker-compose exec ollama ollama list

# Перезапуск Ollama
docker-compose restart ollama

# Проверка памяти
free -h
```

### Проблема: Медленная работа

1. Проверьте использование swap: `free -h`
2. Уменьшите лимиты памяти в docker-compose.yml
3. Используйте более легкую модель (phi3:mini)
4. Уменьшите TOP_K_RESULTS в .env

### Проблема: Нет доступа к веб-интерфейсу

```bash
# Проверка портов
sudo netstat -tulpn | grep 8000

# Проверка firewall
sudo ufw status

# Разрешите порт 8000
sudo ufw allow 8000
```

### Проблема: Ошибки при загрузке файлов

```bash
# Проверка прав доступа
ls -la data/documents

# Исправление прав
chmod -R 755 data
```

## Полезные команды

```bash
# Просмотр всех контейнеров
docker ps -a

# Просмотр использования ресурсов
docker stats

# Очистка системы
docker system prune -a --volumes

# Перезапуск всего
make down && make up

# Полная переустановка
make clean
make install
```

## Дополнительные ресурсы

- [README.md](README.md) - Основная документация
- [README_DOCKER.md](README_DOCKER.md) - Docker документация
- [README_WEB.md](README_WEB.md) - Веб-интерфейс

## Поддержка

При возникновении проблем:

1. Проверьте логи: `make logs`
2. Проверьте статус: `make status`
3. Проверьте ресурсы: `htop` и `docker stats`
4. Создайте issue в репозитории проекта
