# Структура проекта RAG Agent

## Основные компоненты

### API Layer (`api/`)
- **server.py** - FastAPI сервер с REST API endpoints

### Core Modules (`src/`)
- **rag_engine.py** - Основной движок RAG (Retrieval-Augmented Generation)
- **vector_store.py** - Управление векторной базой данных (ChromaDB)
- **embeddings.py** - Генерация эмбеддингов для текстов
- **document_parser.py** - Парсинг PDF и DOCX документов
- **settings_manager.py** - Управление настройками приложения
- **cache_manager.py** - Кеширование запросов с TTL
- **file_utils.py** - Утилиты для работы с файлами

### Web Interface (`static/`)
- **index.html** - HTML структура веб-интерфейса
- **app.js** - JavaScript логика (вкладки, загрузка, чат, настройки)
- **style.css** - Стили интерфейса

### Configuration
- **config.py** - Конфигурация приложения
- **.env** - Переменные окружения
- **main.py** - Точка входа приложения

### Data (`data/`)
- **documents/** - Загруженные документы
- **chroma_db/** - Векторная база данных
- **settings.json** - Сохраненные настройки

### Scripts (`scripts/`)
- **start.sh** - Скрипт запуска
- **stop.sh** - Скрипт остановки

## Архитектура

```
┌─────────────────┐
│  Web Interface  │
│   (Browser)     │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   FastAPI       │
│   Server        │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────┐
│   RAG   │ │ Settings │
│ Engine  │ │ Manager  │
└────┬────┘ └──────────┘
     │
┌────┴────┬──────────┬──────────┐
▼         ▼          ▼          ▼
┌────┐ ┌────┐ ┌────────┐ ┌──────┐
│Vec │ │Emb │ │Document│ │Cache │
│Stor│ │Gen │ │ Parser │ │ Mgr  │
└────┘ └────┘ └────────┘ └──────┘
  │      │
  ▼      ▼
┌──────────────┐
│   ChromaDB   │
│   + Ollama   │
└──────────────┘
```

## Основные функции

### 1. Загрузка документов
- Поддержка PDF и DOCX
- Автоматический парсинг и чанкинг
- Генерация эмбеддингов
- Сохранение в векторную БД

### 2. RAG Query
- Поиск релевантных документов
- Генерация ответа через Ollama
- Кеширование результатов
- Отображение источников

### 3. Настройки
- Выбор модели (llama3.2:1b, llama3.2:3b)
- Параметры генерации (temperature, tokens, context)
- Сохранение в JSON файл

### 4. Веб-интерфейс
- Вкладка "Документы" - загрузка и просмотр
- Вкладка "Чат" - общение с ассистентом
- Вкладка "Настройки" - конфигурация системы

## Технологии

- **Backend**: Python, FastAPI, ChromaDB, Ollama
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **ML**: sentence-transformers, LLaMA models
- **Storage**: ChromaDB (векторная БД), JSON (настройки)
