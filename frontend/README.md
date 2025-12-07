# RAG Agent Frontend

React 18 + TypeScript + Vite + Мультиязычность (EN, RU, PL)

## Быстрый старт

```bash
npm install && npm run dev  # http://localhost:3000
```

## Возможности

- 🌍 Мультиязычность (English, Русский, Polski)
- 🌐 XWiki импорт
- 📄 Документы (PDF, DOCX, Excel)
- 💬 Чат с источниками
- 🤖 Ollama + API модели (OpenAI, Anthropic, Gemini)
- ⚙️ Настройки параметров

## Структура

```
src/
├── i18n/              # Переводы (en, ru, pl)
├── api/               # API клиент
├── components/        # React компоненты
│   ├── tabs/         # XWiki, Documents, Chat, Settings
│   ├── Header.tsx    # Меню + переключатель языка
│   └── SourceModal.tsx
├── hooks/            # useDocuments, useHealthCheck, useStats
├── store/            # chatStore, modalStore
└── types/            # TypeScript типы
```

## Технологии

React 18 • TypeScript • Vite • TailwindCSS • React Query • Zustand

## Команды

```bash
npm run dev      # Разработка
npm run build    # Сборка → ../static-react/
npm run preview  # Предпросмотр
npm run lint     # Линтинг
```

## Документация

- **[MULTILANG.md](MULTILANG.md)** - Мультиязычность
- **[INSTALLATION.md](INSTALLATION.md)** - Установка
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Архитектура
