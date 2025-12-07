# Сводка исправлений

## 1. Исправление удаления сайтов

### Проблема
При удалении сайта через веб-интерфейс: **✗ Not Found**

### Причины
- FastAPI не обрабатывал URL с слэшами в параметре пути
- Фронтенд не обновлял список после удаления
- Неправильный подсчет страниц в API

### Исправления
**Backend (api/server.py):**
- Добавлен `:path` к маршруту: `@app.delete("/websites/{site_name:path}")`
- Добавлено декодирование URL: `site_name = unquote(site_name)`
- Исправлена логика подсчета страниц (использование словаря вместо `hasattr`)

**Frontend (frontend/src/components/tabs/WebTab.tsx):**
- Добавлен `useQueryClient` для инвалидации кэша
- После удаления вызывается `queryClient.invalidateQueries()`

### Результат
✅ Удаление сайтов работает корректно
✅ Список обновляется автоматически
✅ Поддержка имен с URL и спецсимволами

---

## 2. Исправление загрузки моделей

### Проблема
При попытке скачать модель: **✗ Ошибка загрузки модели**

### Причина
- Фронтенд использует `EventSource` (GET запросы)
- Бэкенд ожидал POST запрос
- Ошибка: **405 Method Not Allowed**

### Исправление
**Backend (api/server.py):**
```python
# Было:
@app.post("/models/download")
async def download_model(request: ModelDownloadRequest):

# Стало:
@app.get("/models/download")
async def download_model(model_name: str):
```

### Результат
✅ Загрузка моделей работает
✅ Прогресс отображается в реальном времени
✅ Совместимость с EventSource API

---

## Файлы изменены

1. `api/server.py` - исправления в бэкенде
2. `frontend/src/components/tabs/WebTab.tsx` - обновление списка после удаления

## Тестирование

### Удаление сайтов
```bash
./test_website_delete.sh
```

### Загрузка моделей
```bash
curl -N "http://localhost:8000/models/download?model_name=llama3.2:1b"
```

## Документация
- `WEBSITE_DELETE_FIX.md` - детали исправления удаления сайтов
- `MODEL_DOWNLOAD_FIX.md` - детали исправления загрузки моделей
