# Быстрый старт RAG Agent

## Для Raspberry Pi 4B

### Вариант 1: Автоматическая установка (рекомендуется)

```bash
# На Raspberry Pi выполните:
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/quick_install.sh | bash

# Перезайдите в систему
exit
ssh pi@raspberrypi.local

# Перейдите в директорию и запустите
cd ~/rag-agent
make install
```

### Вариант 2: Ручная установка

```bash
# 1. Установите Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Установите Docker Compose
sudo apt install -y docker-compose

# 3. Клонируйте проект
git clone <YOUR_REPO_URL> ~/rag-agent
cd ~/rag-agent

# 4. Настройте окружение
cp .env.example .env
nano .env  # Отредактируйте при необходимости

# 5. Запустите
make install
```

### Вариант 3: Перенос с локального компьютера

```bash
# На вашем компьютере (Mac/Linux)
cd /path/to/rag-agent
./scripts/transfer_to_pi.sh pi@raspberrypi.local

# На Raspberry Pi
ssh pi@raspberrypi.local
cd ~/rag-agent
make install
```

## Для других систем (Mac, Linux, Windows WSL)

```bash
# 1. Клонируйте проект
git clone <YOUR_REPO_URL>
cd rag-agent

# 2. Настройте окружение
cp .env.example .env

# 3. Запустите
make install
```

## Проверка работы

```bash
# Статус контейнеров
make status

# Проверка здоровья
curl http://localhost:8000/health

# Открыть веб-интерфейс
make test-web
# Или откройте вручную: http://localhost:8000
```

## Первое использование

### 1. Откройте веб-интерфейс

```
http://localhost:8000
```

Или для Raspberry Pi с другого компьютера:

```
http://raspberrypi.local:8000
```

### 2. Загрузите документ

- Перетащите PDF или DOCX файл в область загрузки
- Или нажмите "выберите файл"
- Дождитесь обработки

### 3. Задайте вопрос

- Введите вопрос в текстовое поле
- Нажмите Enter или кнопку отправки
- Получите ответ на основе загруженных документов

## Полезные команды

```bash
# Просмотр логов
make logs

# Перезапуск
make restart

# Остановка
make down

# Очистка базы данных
curl -X DELETE http://localhost:8000/clear

# Статистика
curl http://localhost:8000/stats
```

## Настройка для вашего железа

### Raspberry Pi 4B (8GB RAM)

Используйте настройки по умолчанию в `.env`:

```bash
OLLAMA_MODEL=llama3.2:3b
CHUNK_SIZE=1000
TOP_K_RESULTS=5
```

### Raspberry Pi 4B (4GB RAM)

Облегченная конфигурация в `.env`:

```bash
OLLAMA_MODEL=phi3:mini
CHUNK_SIZE=500
TOP_K_RESULTS=3
```

### Мощный сервер

Максимальная производительность в `.env`:

```bash
OLLAMA_MODEL=llama3.2:7b
CHUNK_SIZE=1500
TOP_K_RESULTS=10
```

## Troubleshooting

### Проблема: Docker не запускается

```bash
sudo systemctl status docker
sudo systemctl restart docker
```

### Проблема: Ollama не отвечает

```bash
docker-compose restart ollama
docker-compose logs ollama
```

### Проблема: Нехватка памяти

```bash
# Проверка памяти
free -h

# Используйте более легкую модель
docker-compose exec ollama ollama pull phi3:mini

# Обновите .env
nano .env
# OLLAMA_MODEL=phi3:mini
```

### Проблема: Медленная работа

1. Уменьшите TOP_K_RESULTS в .env
2. Используйте более легкую модель
3. Включите кэширование (ENABLE_CACHE=true)
4. Проверьте температуру CPU: `vcgencmd measure_temp`

## Дополнительная информация

- [INSTALL_RASPBERRY_PI.md](INSTALL_RASPBERRY_PI.md) - Подробная установка
- [README_DOCKER.md](README_DOCKER.md) - Docker документация
- [README_WEB.md](README_WEB.md) - Веб-интерфейс

## Поддержка

Если возникли проблемы:

1. Проверьте систему: `./scripts/check_system.sh`
2. Просмотрите логи: `make logs`
3. Создайте issue в репозитории
