# 🚀 Быстрый старт RAG Agent

## Установка и запуск (5 минут)

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
# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### 3. Запуск
```bash
# Вариант 1: Скрипт
./start.sh

# Вариант 2: Вручную
python main.py              # Terminal 1: Backend (port 8000)
cd frontend && npm run dev  # Terminal 2: Frontend (port 3000)
```

Откройте **http://localhost:3000**

---

## 🎯 Основные возможности

- 📄 **Документы** - PDF, DOCX, Excel (до 50MB)
- 🌍 **Web Import** - Парсинг веб-сайтов
- 🌐 **XWiki** - Импорт из корпоративной wiki
- 💬 **Чат** - AI ассистент с источниками
- 🤖 **Модели** - Ollama + API (OpenAI, Anthropic, Gemini)
- 🌍 **Мультиязычность** - English, Русский, Polski

---

## 📖 Дальнейшие шаги

| Задача | Документ |
|--------|----------|
| Управление моделями | [MODEL_MANAGEMENT_GUIDE.md](MODEL_MANAGEMENT_GUIDE.md) |
| Импорт с веб-сайтов | [WEB_IMPORT_GUIDE.md](WEB_IMPORT_GUIDE.md) |
| Решение проблем | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Оптимизация | [QUICK_OPTIMIZATIONS.md](QUICK_OPTIMIZATIONS.md) |
| Полная документация | [DOCS.md](DOCS.md) |
