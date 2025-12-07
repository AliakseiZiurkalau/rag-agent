# Установка

```bash
cd frontend && npm install
python main.py              # Terminal 1: port 8000
cd frontend && npm run dev  # Terminal 2: port 3000
```

Откройте http://localhost:3000

## Проблемы

```bash
curl http://localhost:8000/health           # Проверка backend
# Порт занят → vite.config.ts: port: 3001
rm -rf node_modules && npm install          # Переустановка
```

## Сборка

```bash
npm run build  # → ../static-react/
```

Для использования обновите `api/server.py`:
```python
static_dir = Path(__file__).parent.parent / "static-react"
```
