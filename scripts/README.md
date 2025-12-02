# Скрипты для управления RAG Agent

Коллекция полезных скриптов для установки, настройки и управления RAG Agent на Raspberry Pi.

## Скрипты установки

### quick_install.sh

Автоматическая установка всех зависимостей и настройка проекта.

```bash
# Использование на Raspberry Pi
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/quick_install.sh | bash

# Или локально
./scripts/quick_install.sh
```

**Что делает:**
- Проверяет систему и архитектуру
- Устанавливает Docker и Docker Compose
- Настраивает swap (если нужно)
- Создает структуру проекта
- Генерирует оптимальную конфигурацию

### setup_raspberry_pi.sh

Ручная настройка Raspberry Pi для RAG Agent.

```bash
./scripts/setup_raspberry_pi.sh
```

**Что делает:**
- Устанавливает Docker
- Настраивает swap
- Оптимизирует систему для SD карты
- Создает необходимые директории

## Скрипты переноса

### transfer_to_pi.sh

Перенос проекта с локального компьютера на Raspberry Pi.

```bash
./scripts/transfer_to_pi.sh pi@raspberrypi.local
```

**Что делает:**
- Создает архив проекта (исключая ненужные файлы)
- Копирует на Raspberry Pi через SCP
- Распаковывает и настраивает проект
- Создает .env файл

## Скрипты диагностики

### check_system.sh

Проверка системы перед установкой.

```bash
./scripts/check_system.sh
```

**Проверяет:**
- Архитектуру процессора
- Доступную память (RAM)
- Swap
- Дисковое пространство
- Docker и Docker Compose
- Температуру CPU
- Сетевое подключение

**Выдает рекомендации** по оптимизации системы.

### test_api.sh

Тестирование API endpoints.

```bash
./scripts/test_api.sh
```

**Тестирует:**
- Health check
- Статистику
- Загрузку документов (если есть тестовый файл)
- Запросы к ассистенту

## Примеры использования

### Полная установка на новый Raspberry Pi

```bash
# 1. Проверка системы
ssh pi@raspberrypi.local
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/check_system.sh | bash

# 2. Автоматическая установка
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/quick_install.sh | bash

# 3. Перезайти в систему
exit
ssh pi@raspberrypi.local

# 4. Запустить проект
cd ~/rag-agent
make install
```

### Перенос существующего проекта

```bash
# На локальном компьютере
cd /path/to/rag-agent
./scripts/transfer_to_pi.sh pi@raspberrypi.local

# На Raspberry Pi
ssh pi@raspberrypi.local
cd ~/rag-agent
make install
```

### Диагностика проблем

```bash
# Проверка системы
./scripts/check_system.sh

# Проверка API
./scripts/test_api.sh

# Просмотр логов
make logs
```

## Требования

Все скрипты требуют:
- Bash 4.0+
- SSH доступ к Raspberry Pi (для удаленных скриптов)
- Права sudo на Raspberry Pi

## Безопасность

Скрипты:
- Не содержат hardcoded паролей
- Запрашивают подтверждение перед критическими операциями
- Проверяют подключение перед выполнением
- Создают резервные копии при необходимости

## Кастомизация

Вы можете отредактировать скрипты под свои нужды:

```bash
# Изменить директорию установки
INSTALL_DIR="$HOME/my-rag-agent"

# Изменить модель по умолчанию
MODEL="phi3:mini"

# Изменить лимиты памяти
MEM_LIMIT_RAG="1G"
MEM_LIMIT_OLLAMA="3G"
```

## Troubleshooting

### Скрипт не выполняется

```bash
# Проверьте права
ls -la scripts/

# Добавьте права на выполнение
chmod +x scripts/*.sh
```

### Ошибка подключения к Raspberry Pi

```bash
# Проверьте SSH подключение
ssh pi@raspberrypi.local echo "OK"

# Проверьте имя хоста
ping raspberrypi.local

# Используйте IP адрес вместо имени
./scripts/transfer_to_pi.sh pi@192.168.1.100
```

### Ошибка при установке Docker

```bash
# Проверьте интернет
ping -c 3 8.8.8.8

# Обновите систему
sudo apt update && sudo apt upgrade -y

# Попробуйте установить вручную
curl -fsSL https://get.docker.com | sh
```
