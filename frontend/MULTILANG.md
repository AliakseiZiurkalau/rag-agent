# 🌍 Мультиязычность

## Поддерживаемые языки

- 🇬🇧 **English** (по умолчанию)
- 🇷🇺 **Русский**
- 🇵🇱 **Polski**

## Использование

### Переключение языка

Кликните на флаг в правом верхнем углу и выберите язык.

### Добавление нового языка

1. Откройте `src/i18n/translations.ts`
2. Добавьте код языка в тип `Language`:
```typescript
export type Language = 'en' | 'ru' | 'pl' | 'de' // Добавить новый
```

3. Добавьте переводы:
```typescript
export const translations: Record<Language, Translations> = {
  // ... существующие
  de: {
    appTitle: 'RAG Agent',
    appSubtitle: 'KI-Assistent...',
    // ... все остальные ключи
  }
}
```

4. Добавьте в список языков в `components/Header.tsx`:
```typescript
const languages = [
  // ... существующие
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
]
```

## Использование в компонентах

```typescript
import { useLanguage } from '../i18n/LanguageContext'

export default function MyComponent() {
  const { t } = useLanguage()
  
  return <h1>{t.appTitle}</h1>
}
```

## Структура

```
src/i18n/
├── translations.ts        # Все переводы
└── LanguageContext.tsx    # React Context
```

Выбор языка сохраняется в `localStorage`.
