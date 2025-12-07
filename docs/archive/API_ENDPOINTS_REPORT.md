# Отчет о проверке API эндпоинтов

## Статус проверки

Дата: 2025-12-06
Всего эндпоинтов проверено: 19

### ✅ Работают корректно (15)

#### Health & Stats
- ✅ `GET /health` - Проверка здоровья системы
- ✅ `GET /stats` - Статистика системы

#### Documents
- ✅ `GET /documents` - Список документов и сайтов
- ✅ `POST /upload` - Загрузка документа (требует multipart/form-data)
- ✅ `DELETE /clear` - Очистка всех документов
- ✅ `DELETE /documents/{hash}` - Удаление документа по хешу

#### Query
- ✅ `POST /query` - Запрос к RAG системе

#### Settings
- ✅ `GET /settings` - Получение настроек
- ✅ `POST /settings` - Обновление настроек

#### Models
- ✅ `GET /models/list` - Список моделей Ollama
- ✅ `GET /models/download?model_name={name}` - Загрузка модели (SSE)
- ✅ `DELETE /models/api/configure` - Отключение API модели

#### Web Scraping
- ✅ `POST /web/test` - Тест доступности URL
- ✅ `POST /web/import` - Импорт страниц с сайта
- ✅ `DELETE /websites/{name}` - Удаление сайта

---

### ⚠️ Требуют внимания (4)

#### 1. `DELETE /models/{name}` - Удаление модели
**Проблема:** Возвращает 500 вместо 400 при попытке удалить несуществующую модель

**Текущее поведение:**
```json
{
  "detail": "Error deleting model: (400, 'Ошибка удаления модели: ...')"
}
```

**Рекомендация:** Обрабатывать 400 ошибку от Ollama и возвращать 404 или 400 вместо 500

**Код:**
```python
# api/server.py, строка ~495
@app.delete("/models/{model_name}")
async def delete_model(model_name: str):
    try:
        response = requests.delete(...)
        if response.status_code == 200:
            return {"status": "success", ...}
        else:
            raise HTTPException(400, f"Ошибка удаления модели: {response.text}")
    except Exception as e:
        # Здесь перехватывается HTTPException и оборачивается в 500
        raise HTTPException(500, f"Error deleting model: {str(e)}")
```

**Исправление:**
```python
@app.delete("/models/{model_name}")
async def delete_model(model_name: str):
    try:
        response = requests.delete(...)
        if response.status_code == 200:
            return {"status": "success", ...}
        elif response.status_code == 404:
            raise HTTPException(404, f"Модель {model_name} не найдена")
        else:
            raise HTTPException(400, f"Ошибка удаления модели: {response.text}")
    except HTTPException:
        raise  # Пробрасываем HTTPException без изменений
    except Exception as e:
        raise HTTPException(500, f"Error deleting model: {str(e)}")
```

---

#### 2. `POST /models/api/test` - Тест API подключения
**Проблема:** Возвращает успех даже с неверным API ключом

**Текущее поведение:**
```bash
curl -X POST "/models/api/test" -d '{"api_type": "openai", "api_key": "test", "model_name": "gpt-4"}'
# Возвращает: {"status": "success", "message": "Подключение к openai успешно!"}
```

**Причина:** Метод `APIModelConnector.generate()` перехватывает все исключения и возвращает строку с ошибкой вместо того, чтобы пробросить исключение. Метод `test_connection()` проверяет только наличие результата, не проверяя, является ли он ошибкой.

**Код проблемы:**
```python
# src/api_model_connector.py
def generate(self, prompt: str, ...) -> str:
    try:
        # ... API вызов
    except Exception as e:
        return f"Ошибка генерации через {self.api_type}: {str(e)}"  # ❌ Возвращает строку

def test_connection(self) -> bool:
    try:
        result = self.generate("Hello", ...)
        return bool(result)  # ❌ Любая строка = True
    except Exception as e:
        return False
```

**Исправление:**
```python
def generate(self, prompt: str, ...) -> str:
    try:
        # ... API вызов
    except Exception as e:
        logger.error(f"Error generating with {self.api_type}: {e}")
        raise  # ✅ Пробрасываем исключение

def test_connection(self) -> bool:
    try:
        result = self.generate("Hello", temperature=0.1, max_tokens=10)
        return bool(result) and not result.startswith("Ошибка")
    except Exception as e:
        logger.error(f"API connection test failed: {e}")
        return False
```

---

#### 3. `POST /models/api/configure` - Настройка API модели
**Проблема:** Та же проблема, что и с `/models/api/test` - принимает неверные ключи

**Связано с:** Проблема #2

---

#### 4. `POST /xwiki/test` - Тест XWiki подключения
**Проблема:** Возвращает 200 вместо ошибки при неверных данных

**Текущее поведение:**
```bash
curl -X POST "/xwiki/test" -d '{"base_url": "http://test.com", "wiki": "xwiki"}'
# Возвращает: {"status": "error", "message": "Не удалось подключиться к XWiki"}
```

**Рекомендация:** Возвращать HTTP 400 или 503 при ошибке подключения вместо 200 с `"status": "error"`

**Исправление:**
```python
@app.post("/xwiki/test")
async def test_xwiki_connection(config: XWikiConfig):
    try:
        connector = XWikiConnector(...)
        is_connected = connector.test_connection()
        
        if is_connected:
            spaces = connector.get_spaces(config.wiki)
            return {"status": "success", "message": "Подключение успешно", "spaces": spaces}
        else:
            raise HTTPException(503, "Не удалось подключиться к XWiki")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error testing connection: {str(e)}")
```

---

## Приоритеты исправлений

### Высокий приоритет (безопасность)
1. **Проблема #2 и #3** - API ключи не проверяются должным образом
   - Может привести к ложному ощущению безопасности
   - Пользователь думает, что подключение работает, но на самом деле нет

### Средний приоритет (UX)
2. **Проблема #1** - Неправильные HTTP коды
   - Затрудняет отладку на фронтенде
   - Нарушает REST conventions

3. **Проблема #4** - Неконсистентная обработка ошибок
   - Смешивание статусов в теле ответа и HTTP кодов

---

## Рекомендации

1. **Унифицировать обработку ошибок:**
   - Использовать HTTP коды для индикации статуса
   - Не смешивать `"status": "error"` в теле с HTTP 200

2. **Улучшить валидацию API ключей:**
   - Реально проверять подключение к внешним API
   - Не перехватывать все исключения в `generate()`

3. **Добавить интеграционные тесты:**
   - Автоматическая проверка всех эндпоинтов
   - Проверка корректности HTTP кодов

4. **Документировать API:**
   - OpenAPI/Swagger спецификация
   - Примеры запросов и ответов
