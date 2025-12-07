# Исправление ошибки удаления сайтов

## Проблема
При удалении сайта через веб-интерфейс пользователь получал ошибку "✗ Not Found".

## Причины
1. **FastAPI не обрабатывал URL с слэшами в параметре пути** - когда имя сайта содержало URL (например, `https://www.example.com`), FastAPI не мог правильно распарсить путь `/websites/{site_name}`.

2. **Фронтенд не обновлял список после удаления** - после успешного удаления список сайтов не обновлялся автоматически.

3. **Неправильный подсчет страниц** - в API использовался `hasattr()` на словаре вместо проверки ключа, что приводило к неправильному подсчету `pages_count`.

## Исправления

### 1. Backend (api/server.py)

#### Изменение маршрута для поддержки URL в параметре
```python
# Было:
@app.delete("/websites/{site_name}")
async def delete_website(site_name: str):

# Стало:
@app.delete("/websites/{site_name:path}")
async def delete_website(site_name: str):
    from urllib.parse import unquote
    site_name = unquote(site_name)
    logger.info(f"Attempting to delete website: {site_name}")
```

Использование `:path` позволяет FastAPI принимать параметры с слэшами.

#### Исправление подсчета страниц
```python
# Было:
if not hasattr(websites_dict[web_site], '_pages'):
    websites_dict[web_site]['_pages'] = set()

# Стало:
if web_site not in websites_dict:
    websites_dict[web_site] = {
        'site_name': web_site,
        'file_hash': file_hash,
        'pages_count': 0,
        'chunks_count': 0,
        'uploaded_at': uploaded_at,
        '_pages': set()
    }
```

### 2. Frontend (frontend/src/components/tabs/WebTab.tsx)

#### Добавление обновления списка после удаления
```typescript
import { useQueryClient } from '@tanstack/react-query'

export default function WebTab() {
  const queryClient = useQueryClient()
  
  const handleDeleteSite = async (siteName: string) => {
    // ...
    try {
      await webApi.delete(siteName)
      // Обновляем список документов и статистику
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      // ...
    }
  }
}
```

## Тестирование

Создан тестовый скрипт `test_website_delete.sh` для проверки функциональности:

```bash
./test_website_delete.sh
```

Скрипт проверяет:
1. Импорт сайта
2. Отображение в списке с правильным `pages_count`
3. Удаление сайта
4. Очистку списка после удаления

## Результат

✅ Удаление сайтов теперь работает корректно
✅ Список сайтов обновляется автоматически после удаления
✅ Правильный подсчет количества страниц
✅ Поддержка имен сайтов с URL и специальными символами
