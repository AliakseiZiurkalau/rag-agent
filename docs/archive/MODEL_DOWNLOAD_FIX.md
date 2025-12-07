# Исправление ошибки загрузки моделей

## Проблема
При попытке скачать модель через веб-интерфейс пользователь получал ошибку "✗ Ошибка загрузки модели".

## Причина
Фронтенд использует `EventSource` (Server-Sent Events) для получения прогресса загрузки, который отправляет только **GET** запросы. Однако бэкенд эндпоинт был определен как **POST**, что приводило к ошибке "405 Method Not Allowed".

## Техническая деталь
`EventSource` - это стандартный браузерный API для Server-Sent Events (SSE), который:
- Поддерживает только GET запросы
- Используется для получения потоковых данных от сервера
- Идеально подходит для отображения прогресса длительных операций

## Исправление

### Backend (api/server.py)

Изменен HTTP метод эндпоинта с POST на GET и параметры передаются через query string:

```python
# Было:
@app.post("/models/download")
async def download_model(request: ModelDownloadRequest):
    logger.info(f"Starting download of model: {request.model_name}")
    # ...
    json={"name": request.model_name}

# Стало:
@app.get("/models/download")
async def download_model(model_name: str):
    logger.info(f"Starting download of model: {model_name}")
    # ...
    json={"name": model_name}
```

### Изменения:
1. `@app.post` → `@app.get`
2. `request: ModelDownloadRequest` → `model_name: str` (query parameter)
3. Все ссылки на `request.model_name` заменены на `model_name`

## Тестирование

Проверка работы эндпоинта:

```bash
curl -N "http://localhost:8000/models/download?model_name=llama3.2:1b"
```

Ожидаемый результат - поток SSE событий с прогрессом загрузки:
```
data: {"status": "pulling manifest"}
data: {"status": "pulling 74701a8c35f6", "digest": "...", "total": 1321082688, "completed": 1321082688}
data: {"status": "verifying sha256 digest"}
data: {"status": "writing manifest"}
data: {"status": "success"}
```

## Результат

✅ Загрузка моделей теперь работает корректно
✅ Прогресс загрузки отображается в реальном времени
✅ EventSource правильно получает потоковые данные
✅ Совместимость с браузерным API для SSE
