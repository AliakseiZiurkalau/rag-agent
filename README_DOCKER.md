# RAG Agent - Docker Deployment

## Быстрый старт

### 1. Запуск с Docker Compose

```bash
# Сборка и запуск всех сервисов
make install

# Или вручную:
docker-compose up -d
docker-compose exec ollama ollama pull llama3.2:3b
```

### 2. Проверка работы

```bash
# Проверка статуса
make status

# Просмотр логов
make logs

# Тест API
curl http://localhost:8000/
curl http://localhost:8000/stats
```

## Архитектура

Проект состоит из двух контейнеров:

- **rag-agent** - FastAPI приложение с RAG движком
- **ollama** - LLM сервер для генерации ответов

Контейнеры связаны через Docker network и используют volume для персистентности данных.

## Конфигурация

### Переменные окружения

Создайте `.env` файл на основе `.env.example`:

```bash
cp .env.example .env
```

Основные параметры:
- `OLLAMA_MODEL` - модель для генерации (по умолчанию llama3.2:3b)
- `EMBEDDING_MODEL` - модель для эмбеддингов (multilingual для русского)
- `CHUNK_SIZE` - размер чанков (увеличен до 1000)
- `MAX_UPLOAD_SIZE` - максимальный размер файла (10MB)
- `ENABLE_CACHE` - кэширование запросов

### Ресурсы

В `docker-compose.yml` настроены лимиты памяти:
- RAG Agent: 1-2GB
- Ollama: 4-6GB

Для Raspberry Pi 4B (8GB) эти настройки оптимальны.

## Использование

### Загрузка документа

```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@document.pdf"
```

### Запрос к системе

```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Ваш вопрос"}'
```

### Статистика

```bash
curl http://localhost:8000/stats
```

### Очистка базы данных

```bash
curl -X DELETE http://localhost:8000/clear
```

## Команды Makefile

```bash
make build          # Сборка образов
make up             # Запуск контейнеров
make down           # Остановка контейнеров
make logs           # Просмотр всех логов
make logs-rag       # Логи RAG агента
make logs-ollama    # Логи Ollama
make restart        # Перезапуск всех сервисов
make clean          # Полная очистка (включая volumes)
make pull-model     # Загрузка модели Ollama
make status         # Статус контейнеров
make install        # Полная установка
```

## Оптимизации

### 1. Улучшенный чанкинг
- Разбиение по предложениям вместо символов
- Семантически связанные чанки
- Настраиваемый overlap

### 2. Multilingual эмбеддинги
- Модель `paraphrase-multilingual-MiniLM-L12-v2`
- Лучшая поддержка русского языка
- Оптимальный баланс качества и скорости

### 3. Уникальные ID документов
- Хеш контента + timestamp
- Избежание конфликтов при повторной загрузке

### 4. Кэширование запросов
- TTL кэш для частых запросов
- Снижение нагрузки на Ollama

### 5. Логирование
- Структурированные логи
- Ротация файлов
- Разные уровни детализации

### 6. Обработка ошибок
- Валидация входных данных
- Timeout для Ollama
- Graceful degradation

### 7. Безопасность
- Ограничение размера файлов
- Валидация типов файлов
- Настраиваемый CORS

## Мониторинг

### Healthcheck

Docker автоматически проверяет здоровье контейнеров:

```bash
docker-compose ps
```

### Логи

Логи сохраняются в `./logs/rag_agent.log` и доступны через Docker:

```bash
make logs
tail -f logs/rag_agent.log
```

## Troubleshooting

### Ollama не отвечает

```bash
# Проверка статуса
docker-compose exec ollama ollama list

# Перезапуск
make restart-ollama
```

### Нехватка памяти

Уменьшите лимиты в `docker-compose.yml` или используйте более легкую модель:

```bash
docker-compose exec ollama ollama pull phi3:mini
```

### Медленная работа

- Используйте квантизованные модели (q4_0)
- Уменьшите `TOP_K_RESULTS`
- Включите кэширование

## Production рекомендации

1. Используйте `.env` файл для секретов
2. Настройте CORS для конкретных доменов
3. Добавьте аутентификацию API
4. Настройте reverse proxy (nginx)
5. Используйте Docker secrets для чувствительных данных
6. Настройте мониторинг (Prometheus + Grafana)
7. Регулярно обновляйте образы
