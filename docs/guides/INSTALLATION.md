# 🚀 Установка RAG Agent

## Системные требования

- **Python**: 3.9+
- **Node.js**: 18+
- **RAM**: 4GB минимум (8GB рекомендуется)
- **Диск**: 10GB свободного места
- **ОС**: macOS, Linux, Windows (WSL2)

## Шаг 1: Установка Ollama

### macOS
```bash
brew install ollama
ollama serve &
ollama pull llama3.2:1b
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull llama3.2:1b
```

### Windows
1. Скачайте [Ollama для Windows](https://ollama.com/download)
2. Установите и запустите
3. Откройте PowerShell:
```powershell
ollama pull llama3.2:1b
```

## Шаг 2: Клонирование проекта

```bash
git clone <YOUR_REPO_URL>
cd rag-agent
```

## Шаг 3: Backend (Python)

### Создание виртуального окружения
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Установка зависимостей
```bash
pip install -r requirements.txt
```

### Настройка
```bash
cp .env.example .env
# Отредактируйте .env при необходимости
```

## Шаг 4: Frontend (React)

```bash
cd frontend
npm install
cd ..
```

## Шаг 5: Запуск

### Вариант 1: Автоматический запуск (рекомендуется)
```bash
./start.sh
```

### Вариант 2: Ручной запуск

**Terminal 1 - Backend:**
```bash
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Проверка установки

1. Откройте браузер: **http://localhost:3000**
2. Проверьте статус системы (зелёная точка в header)
3. Перейдите в **Настройки → Система**
4. Убедитесь, что модель `llama3.2:1b` доступна

## Остановка

```bash
./stop.sh
```

Или вручную: `Ctrl+C` в обоих терминалах

## Следующие шаги

- [Первые шаги](./GETTING_STARTED.md) - Начало работы
- [Управление моделями](./MODELS.md) - Настройка AI моделей
- [Troubleshooting](./TROUBLESHOOTING.md) - Решение проблем

## Частые проблемы при установке

### Ollama не запускается
```bash
# Проверьте статус
ollama list

# Перезапустите
killall ollama
ollama serve &
```

### Ошибка установки Python зависимостей
```bash
# Обновите pip
pip install --upgrade pip

# Установите заново
pip install -r requirements.txt --no-cache-dir
```

### Frontend не собирается
```bash
# Очистите кэш
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Порт 8000 занят
Измените порт в `.env`:
```bash
API_PORT=8001
```
