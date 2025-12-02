# RAG Agent для Raspberry Pi 4B

Локальный AI-агент с использованием Ollama, ChromaDB и sentence-transformers.

## Возможности

- Парсинг PDF и DOCX документов
- Векторное хранилище на ChromaDB
- RAG (Retrieval-Augmented Generation)
- REST API для интеграции
- Docker контейнеризация
- Кэширование запросов
- Multilingual эмбеддинги для русского языка
- Улучшенный семантический чанкинг

## Быстрый старт с Docker (рекомендуется)

### Для Raspberry Pi

Полная инструкция: [INSTALL_RASPBERRY_PI.md](INSTALL_RASPBERRY_PI.md)

Быстрая установка одной командой:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/quick_install.sh | bash
```

### Для других систем

```bash
# Полная установка одной командой
make install

# Или пошагово:
docker-compose up -d
docker-compose exec ollama ollama pull llama3.2:3b
```

### Проверка работы

```bash
make status
curl http://localhost:8000/health
```

Подробная документация:
- [INSTALL_RASPBERRY_PI.md](INSTALL_RASPBERRY_PI.md) - Установка на Raspberry Pi
- [README_DOCKER.md](README_DOCKER.md) - Docker документация

## Установка без Docker

### 1. Установка Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:3b
```

### 2. Установка Python зависимостей

```bash
pip install -r requirements.txt
```

### 3. Настройка окружения

```bash
cp .env.example .env
# Отредактируйте .env при необходимости
```

### 4. Запуск

```bash
python main.py
```

API будет доступен на `http://localhost:8000`

## Использование

### Веб-интерфейс

Откройте в браузере: **http://localhost:8000**

Веб-интерфейс позволяет:
- Загружать документы через drag & drop или выбор файла
- Задавать вопросы в удобном чате
- Видеть статус системы в реальном времени
- Просматривать количество источников для каждого ответа

### API

#### Загрузка документа

```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@document.pdf"
```

#### Запрос к агенту

```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Ваш вопрос"}'
```

#### Статистика

```bash
curl http://localhost:8000/stats
```

#### Health check

```bash
curl http://localhost:8000/health
```

#### Очистка базы данных

```bash
curl -X DELETE http://localhost:8000/clear
```

## Оптимизации

### Реализованные улучшения

1. **Семантический чанкинг** - разбиение по предложениям вместо символов
2. **Multilingual эмбеддинги** - модель `paraphrase-multilingual-MiniLM-L12-v2` для русского языка
3. **Уникальные ID документов** - хеш контента + timestamp для избежания конфликтов
4. **Кэширование запросов** - TTL кэш для снижения нагрузки
5. **Логирование** - структурированные логи с ротацией
6. **Обработка ошибок** - валидация входных данных и graceful degradation
7. **Безопасность** - ограничение размера файлов, валидация типов
8. **Docker контейнеризация** - изолированное окружение с оптимизацией ресурсов

### Настройки для Raspberry Pi

В `.env` файле настройте параметры под ваше железо:

```bash
# Для 8GB RAM
OLLAMA_MODEL=llama3.2:3b
CHUNK_SIZE=1000
TOP_K_RESULTS=5

# Для 4GB RAM (более легкая конфигурация)
OLLAMA_MODEL=phi3:mini
CHUNK_SIZE=500
TOP_K_RESULTS=3
```

Дополнительные рекомендации:
- Используйте квантизованные модели (q4_0, q4_1)
- Включите swap-файл для больших документов
- Используйте SSD вместо SD-карты
- Настройте лимиты памяти в docker-compose.yml

## Дообучение

Создайте Modelfile с примерами:

```bash
python -c "from src.fine_tuning import FineTuner; ft = FineTuner(); ..."
ollama create custom-model -f Modelfile
```

## Структура проекта

```
rag-agent/
├── api/                    # FastAPI endpoints
│   └── server.py          # REST API
├── src/                   # Core modules
│   ├── rag_engine.py     # RAG движок
│   ├── vector_store.py   # ChromaDB интеграция
│   ├── embeddings.py     # Генерация эмбеддингов
│   ├── document_parser.py # Парсинг документов
│   ├── cache.py          # Кэширование
│   └── fine_tuning.py    # Дообучение моделей
├── data/                  # Данные
│   ├── documents/        # Загруженные документы
│   └── chroma_db/        # Векторная БД
├── logs/                  # Логи приложения
├── config.py             # Конфигурация
├── main.py               # Entry point
├── Dockerfile            # Docker образ
├── docker-compose.yml    # Оркестрация контейнеров
├── Makefile              # Команды для управления
└── requirements.txt      # Python зависимости
```

## Команды Makefile

```bash
make install      # Полная установка
make up           # Запуск контейнеров
make down         # Остановка контейнеров
make logs         # Просмотр логов
make restart      # Перезапуск
make clean        # Полная очистка
make pull-model   # Загрузка модели Ollama
make status       # Статус контейнеров
make test-web     # Открыть веб-интерфейс
```

## Документация

- **[QUICK_START.md](QUICK_START.md)** - Быстрый старт (начните отсюда!)
- **[INSTALL_RASPBERRY_PI.md](INSTALL_RASPBERRY_PI.md)** - Пошаговая установка на Raspberry Pi
- [README_DOCKER.md](README_DOCKER.md) - Подробная документация по Docker
- [README_WEB.md](README_WEB.md) - Документация веб-интерфейса

## Скрипты для Raspberry Pi

```bash
# Проверка системы перед установкой
./scripts/check_system.sh

# Быстрая установка одной командой
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/quick_install.sh | bash

# Перенос проекта с локального компьютера
./scripts/transfer_to_pi.sh pi@raspberrypi.local

# Тестирование API
./scripts/test_api.sh
```
