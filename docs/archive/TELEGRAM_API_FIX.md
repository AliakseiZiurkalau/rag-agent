# 🔧 Исправление: Telegram Bot API совместимость

## Проблема

При запуске Telegram бота возникала ошибка:
```
'Updater' object has no attribute '_Updater__polling_cleanup_cb' 
and no __dict__ for setting new attributes
```

## Причина

В версии 20.x библиотеки `python-telegram-bot` изменился API:
- Метод `start_polling()` теперь вызывается через `asyncio.create_task()`
- Изменился способ запуска и остановки polling
- Метод `get_status()` должен быть async для получения информации о боте

## Решение

### 1. Обновлён метод `start()` в `src/telegram_bot.py`

**Было:**
```python
await self.application.updater.start_polling()
```

**Стало:**
```python
# Запускаем polling в фоновом режиме
asyncio.create_task(self.application.updater.start_polling(drop_pending_updates=True))

# Получаем информацию о боте
bot_info = await self.application.bot.get_me()
logger.info(f"Telegram bot started successfully: @{bot_info.username}")
```

### 2. Обновлён метод `stop()` в `src/telegram_bot.py`

**Было:**
```python
await self.application.updater.stop()
await self.application.stop()
await self.application.shutdown()
```

**Стало:**
```python
# Останавливаем polling
if self.application.updater and self.application.updater.running:
    await self.application.updater.stop()

# Останавливаем приложение
await self.application.stop()
await self.application.shutdown()
```

### 3. Обновлён метод `get_status()` в `src/telegram_bot.py`

**Было:**
```python
def get_status(self) -> dict:
    return {
        "is_running": self.is_running,
        "token_configured": bool(self.token)
    }
```

**Стало:**
```python
async def get_status(self) -> dict:
    status = {
        "is_running": self.is_running,
        "token_configured": bool(self.token)
    }
    
    # Добавляем username если бот запущен
    if self.is_running and self.application:
        try:
            bot_info = await self.application.bot.get_me()
            status["bot_username"] = bot_info.username
        except Exception as e:
            logger.error(f"Error getting bot info: {e}")
    
    return status
```

### 4. Обновлены API endpoints в `api/server.py`

**Endpoint `/telegram/status`:**
```python
@app.get("/telegram/status")
async def get_telegram_bot_status():
    bot = get_bot_instance()
    if bot:
        return await bot.get_status()  # Теперь async
    else:
        return {
            "is_running": False,
            "token_configured": False
        }
```

**Endpoint `/telegram/start`:**
```python
@app.post("/telegram/start")
async def start_telegram_bot_endpoint(config: TelegramBotConfig):
    bot = await start_telegram_bot(config.bot_token, settings_manager)
    
    # Получаем статус с username
    status = await bot.get_status()
    
    return {
        "status": "success",
        "message": "Telegram бот успешно запущен",
        **status  # Включает bot_username
    }
```

## Изменения в API

### Новый формат ответа `/telegram/status`

**Было:**
```json
{
    "is_running": false,
    "token_configured": false
}
```

**Стало (когда бот запущен):**
```json
{
    "is_running": true,
    "token_configured": true,
    "bot_username": "your_bot_name"
}
```

### Новый формат ответа `/telegram/start`

**Было:**
```json
{
    "status": "success",
    "message": "Telegram бот успешно запущен",
    "is_running": true
}
```

**Стало:**
```json
{
    "status": "success",
    "message": "Telegram бот успешно запущен",
    "is_running": true,
    "token_configured": true,
    "bot_username": "your_bot_name"
}
```

## Проверка

### 1. Перезапустить backend

```bash
# Остановить
./stop.sh

# Запустить
./start.sh
```

### 2. Проверить статус

```bash
curl http://localhost:8000/telegram/status
```

**Ожидаемый ответ:**
```json
{
    "is_running": false,
    "token_configured": false
}
```

### 3. Запустить бота (с реальным токеном)

```bash
curl -X POST "http://localhost:8000/telegram/start" \
  -H "Content-Type: application/json" \
  -d '{"bot_token": "YOUR_BOT_TOKEN"}'
```

**Ожидаемый ответ:**
```json
{
    "status": "success",
    "message": "Telegram бот успешно запущен",
    "is_running": true,
    "token_configured": true,
    "bot_username": "your_bot_name"
}
```

### 4. Проверить логи

```bash
tail -f logs/rag_agent.log | grep -i telegram
```

**Ожидаемые логи:**
```
2025-12-08 10:00:00 - src.telegram_bot - INFO - Starting Telegram bot...
2025-12-08 10:00:01 - src.telegram_bot - INFO - Telegram bot started successfully: @your_bot_name
```

## Совместимость

### python-telegram-bot версии

- ✅ **20.7** - Текущая версия (рекомендуется)
- ✅ **20.x** - Все версии 20.x
- ❌ **13.x** - Старый API (несовместим)

### Изменения в API 20.x

1. **Application вместо Updater**
   - Используется `Application.builder()`
   - Polling запускается через `create_task()`

2. **Async методы**
   - Все методы теперь async
   - Используется `await` для всех операций

3. **Новые параметры**
   - `drop_pending_updates=True` - игнорировать старые сообщения
   - `allowed_updates` - фильтр типов обновлений

## Дополнительные улучшения

### 1. Graceful shutdown

Бот корректно останавливается при завершении приложения:
```python
if self.application.updater and self.application.updater.running:
    await self.application.updater.stop()
```

### 2. Информация о боте

Теперь возвращается username бота:
```python
bot_info = await self.application.bot.get_me()
status["bot_username"] = bot_info.username
```

### 3. Логирование

Улучшено логирование запуска:
```python
logger.info(f"Telegram bot started successfully: @{bot_info.username}")
```

## Возможные проблемы

### Ошибка: "This event loop is already running"

**Причина:** Конфликт event loops

**Решение:**
```python
# Используем create_task вместо прямого await
asyncio.create_task(self.application.updater.start_polling())
```

### Ошибка: "Bot is already running"

**Причина:** Попытка запустить уже запущенного бота

**Решение:**
```python
existing_bot = get_bot_instance()
if existing_bot and existing_bot.is_running:
    return {"status": "already_running"}
```

### Ошибка: "Cannot get bot info"

**Причина:** Бот не успел инициализироваться

**Решение:**
```python
try:
    bot_info = await self.application.bot.get_me()
    status["bot_username"] = bot_info.username
except Exception as e:
    logger.error(f"Error getting bot info: {e}")
```

## Тестирование

### Unit тесты

```python
import pytest
from src.telegram_bot import TelegramBot

@pytest.mark.asyncio
async def test_bot_start():
    bot = TelegramBot("test_token", settings_manager)
    await bot.start()
    assert bot.is_running == True

@pytest.mark.asyncio
async def test_bot_status():
    bot = TelegramBot("test_token", settings_manager)
    status = await bot.get_status()
    assert "is_running" in status
    assert "token_configured" in status
```

### Integration тесты

```bash
# Запустить бота
curl -X POST "http://localhost:8000/telegram/start" \
  -H "Content-Type: application/json" \
  -d '{"bot_token": "YOUR_TOKEN"}'

# Проверить статус
curl http://localhost:8000/telegram/status

# Остановить бота
curl -X POST "http://localhost:8000/telegram/stop"
```

## Документация

- [python-telegram-bot 20.x docs](https://docs.python-telegram-bot.org/en/v20.7/)
- [Migration Guide 13.x → 20.x](https://docs.python-telegram-bot.org/en/stable/wiki/Version-20.0-Migration-Guide.html)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## Статус

✅ **Исправлено**
- Обновлён метод `start()` для API 20.x
- Обновлён метод `stop()` с проверкой состояния
- Метод `get_status()` теперь async с username
- API endpoints обновлены
- Backend перезапущен
- Готово к использованию

## Следующие шаги

1. Получите токен у [@BotFather](https://t.me/BotFather)
2. Откройте веб-интерфейс: http://localhost:3000
3. Перейдите: **Settings** → **🤖 Telegram Bot**
4. Введите токен и запустите бота
5. Проверьте работу командами: `/start`, `/help`, `/stats`

---

**Дата исправления:** Декабрь 2024  
**Версия:** python-telegram-bot 20.7  
**Статус:** ✅ Решено
