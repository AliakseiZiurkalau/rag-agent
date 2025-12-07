# 🤖 RAG Agent

Локальный AI-агент с RAG (Retrieval-Augmented Generation) для работы с документами, веб-сайтами и корпоративными wiki.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Возможности

### 📚 Источники данных
- **Документы** - PDF, DOCX, Excel (до 50MB)
- **Веб-сайты** - Парсинг до 100 страниц
- **XWiki** - Импорт из корпоративной wiki
- **Telegram** - Бот для ответов в мессенджере

### 🤖 AI Модели
- **Ollama** - Локальные модели (llama, mistral, gemma)
- **OpenAI** - GPT-4o, GPT-4o-mini
- **Anthropic** - Claude 3.5 Sonnet, Haiku
- **Google Gemini** - 2.0 Flash, 1.5 Pro
- **Custom API** - Любой OpenAI-совместимый API

### 💡 Интерфейс
- **Современный UI** - React 18 + TypeScript + Tailwind CSS
- **Мультиязычность** - 🇬🇧 English, 🇷🇺 Русский, 🇵🇱 Polski
- **Адаптивный дизайн** - Desktop и Mobile
- **Real-time** - Streaming ответов, прогресс загрузки

## 🚀 Быстрый старт

### 1. Установка Ollama

```bash
# macOS
brew install ollama
ollama serve &
ollama pull llama3.2:1b

# Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull llama3.2:1b
```

### 2. Установка проекта

```bash
# Клонирование
git clone <YOUR_REPO_URL>
cd rag-agent

# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend && npm install && cd ..

# Настройка
cp .env.example .env
```

### 3. Запуск

```bash
./start.sh
```

Откройте **http://localhost:3000** в браузере.

## 📖 Документация

### Для пользователей
- **[Установка](docs/guides/INSTALLATION.md)** - Подробная инструкция
- **[Первые шаги](docs/guides/GETTING_STARTED.md)** - Начало работы
- **[Управление моделями](docs/guides/MODELS.md)** - Ollama и API
- **[Telegram бот](docs/guides/TELEGRAM.md)** - Настройка бота
- **[Troubleshooting](docs/guides/TROUBLESHOOTING.md)** - Решение проблем

### Для разработчиков
- **[Архитектура](docs/dev/PROJECT_STRUCTURE.md)** - Структура проекта
- **[API документация](docs/dev/API.md)** - REST API endpoints
- **[Contributing](docs/dev/CONTRIBUTING.md)** - Как внести вклад

### Полная документация
📚 **[docs/README.md](docs/README.md)** - Индекс всей документации

## 💡 Основные функции

### Загрузка документов
```bash
# Через веб-интерфейс
Settings → Documents → Выбрать файлы

# Через API
curl -X POST "http://localhost:8000/upload" -F "file=@document.pdf"
```

### Импорт веб-сайта
```bash
# Через веб-интерфейс
Settings → Web → Ввести URL → Импортировать

# Через API
curl -X POST "http://localhost:8000/web/import" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "max_pages": 10}'
```

### Вопросы к AI
```bash
# Через веб-интерфейс
Chat → Ввести вопрос → Enter

# Через API
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Ваш вопрос"}'
```

## 🎯 Рекомендуемые модели

### Для начала
**llama3.2:1b** (1.3 GB) - быстрая, работает на любом железе

### Для разработки
**llama3.2:3b** (2.0 GB) - оптимальный баланс качества и скорости

### Для продакшена
**mistral:7b** (4.1 GB) - высокое качество, требует 8GB+ RAM

### Для максимального качества
**GPT-4o** или **Claude 3.5 Sonnet** - облачные API

## 📁 Структура проекта

```
rag-agent/
├── api/                    # FastAPI сервер
│   └── server.py          # 30+ REST endpoints
├── src/                   # Backend логика
│   ├── rag_engine.py     # RAG движок
│   ├── vector_store.py   # ChromaDB
│   ├── document_parser.py # Парсинг документов
│   ├── web_scraper.py    # Парсинг веб-сайтов
│   ├── xwiki_connector.py # XWiki интеграция
│   ├── telegram_bot.py   # Telegram бот
│   └── api_model_connector.py # API модели
├── frontend/              # React приложение
│   ├── src/
│   │   ├── components/   # UI компоненты
│   │   ├── hooks/        # Custom hooks
│   │   ├── i18n/         # Мультиязычность
│   │   └── api/          # API client
│   └── package.json
├── data/                  # Данные
│   ├── documents/        # Загруженные файлы
│   ├── chroma_db/        # Векторная БД
│   └── settings.json     # Настройки
├── docs/                  # Документация
│   ├── guides/           # Руководства пользователя
│   └── dev/              # Документация для разработчиков
├── main.py               # Точка входа
├── config.py             # Конфигурация
└── requirements.txt      # Python зависимости
```

## ⚙️ Конфигурация

### Основные настройки (.env)

```bash
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
OLLAMA_TIMEOUT=600

# Эмбеддинги
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=1

# API
API_HOST=0.0.0.0
API_PORT=8000
MAX_UPLOAD_SIZE=52428800  # 50MB

# Кэш
ENABLE_CACHE=true
CACHE_TTL=3600
```

## 🔧 Разработка

### Запуск в режиме разработки

```bash
# Backend с hot reload
source venv/bin/activate
uvicorn api.server:app --reload

# Frontend с hot reload
cd frontend
npm run dev
```

### Тестирование

```bash
# Проверка всех endpoints
./test_all_endpoints.sh

# Проверка конкретной функции
./test_website_delete.sh
./test_model_management.sh
```

### Проверка кода

```bash
# Python
python -m py_compile api/server.py src/*.py

# TypeScript
cd frontend && npm run build
```

## 🐛 Частые проблемы

### Ollama не запускается
```bash
ollama serve &
ollama pull llama3.2:1b
```

### Медленная работа
- Используйте `llama3.2:1b`
- Уменьшите `TOP_K_RESULTS=1`
- Рассмотрите API модели

### Gemini пустой ответ
- Используйте `gemini-2.0-flash-exp`
- Система автоматически выделяет 2000 токенов

Подробнее: [TROUBLESHOOTING.md](docs/guides/TROUBLESHOOTING.md)

## 📊 Статистика проекта

- **Backend:** Python 3.9+, FastAPI, ChromaDB
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **AI:** Ollama, OpenAI, Anthropic, Gemini
- **Языки:** English, Русский, Polski
- **Endpoints:** 30+ REST API
- **Компоненты:** 15+ React компонентов

## 🤝 Вклад в проект

Приветствуются pull requests! См. [CONTRIBUTING.md](docs/dev/CONTRIBUTING.md)

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Changelog

См. [CHANGELOG.md](CHANGELOG.md) для истории изменений.

## 📄 Лицензия

Распространяется под лицензией MIT. См. [LICENSE](LICENSE) для подробностей.

## 🙏 Благодарности

- [Ollama](https://ollama.com/) - локальные LLM модели
- [ChromaDB](https://www.trychroma.com/) - векторная база данных
- [Sentence Transformers](https://www.sbert.net/) - эмбеддинги
- [FastAPI](https://fastapi.tiangolo.com/) - веб-фреймворк
- [React](https://reactjs.org/) - UI библиотека

## 📞 Контакты

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/rag-agent/issues)
- **Документация:** [docs/README.md](docs/README.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

**Сделано с ❤️ для сообщества**
