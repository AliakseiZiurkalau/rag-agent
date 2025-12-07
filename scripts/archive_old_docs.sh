#!/bin/bash

# Скрипт для архивации устаревших документов
# Создаёт папку docs/archive и перемещает туда старые файлы

echo "🗂️  Архивация устаревших документов..."

# Создать папку для архива
mkdir -p docs/archive

# Список файлов для архивации (устаревшие или дублирующиеся)
OLD_DOCS=(
    "API_ENDPOINTS_REPORT.md"
    "API_FIXES_SUMMARY.md"
    "COLLAPSIBLE_MODELS_LIST.md"
    "COMPACT_HEADER_DESIGN.md"
    "COMPLETE_CHANGES_SUMMARY.md"
    "DYNAMIC_MODEL_PARAMETERS.md"
    "FINAL_SUMMARY.md"
    "FIXES_SUMMARY.md"
    "MODEL_DOWNLOAD_FIX.md"
    "MODELS_UI_IMPROVEMENT.md"
    "OPTIMIZATION_APPLIED.md"
    "OPTIMIZATION_RECOMMENDATIONS.md"
    "PROJECT_CHECK_REPORT.md"
    "QUICK_OPTIMIZATIONS.md"
    "QUICK_START.md"
    "START_HERE.md"
    "TELEGRAM_BOT_INTEGRATION.md"
    "TELEGRAM_TAB_MIGRATION_COMPLETE.md"
    "USER_GUIDE_MODELS.md"
    "WEBSITE_DELETE_FIX.md"
)

# Переместить файлы
for doc in "${OLD_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  📦 Архивирую: $doc"
        mv "$doc" "docs/archive/"
    fi
done

# Переместить старые гайды в архив (если они есть)
if [ -f "MODEL_MANAGEMENT_GUIDE.md" ]; then
    echo "  📦 Архивирую: MODEL_MANAGEMENT_GUIDE.md (заменён на docs/guides/MODELS.md)"
    mv "MODEL_MANAGEMENT_GUIDE.md" "docs/archive/"
fi

if [ -f "TROUBLESHOOTING.md" ]; then
    echo "  📦 Архивирую: TROUBLESHOOTING.md (заменён на docs/guides/TROUBLESHOOTING.md)"
    mv "TROUBLESHOOTING.md" "docs/archive/"
fi

if [ -f "WEB_IMPORT_GUIDE.md" ]; then
    echo "  📦 Архивирую: WEB_IMPORT_GUIDE.md (будет создан docs/guides/WEB_IMPORT.md)"
    mv "WEB_IMPORT_GUIDE.md" "docs/archive/"
fi

# Создать README в архиве
cat > docs/archive/README.md << 'EOF'
# 📦 Архив документации

Эта папка содержит устаревшие или дублирующиеся документы, которые были заменены новой структурой документации.

## Новая структура

Вся актуальная документация находится в:
- **[docs/README.md](../README.md)** - Главная страница документации
- **[docs/guides/](../guides/)** - Руководства пользователя
- **[docs/dev/](../dev/)** - Документация для разработчиков

## Архивированные документы

Эти файлы сохранены для истории, но больше не поддерживаются:

### Технические отчёты
- API_ENDPOINTS_REPORT.md
- API_FIXES_SUMMARY.md
- FIXES_SUMMARY.md
- PROJECT_CHECK_REPORT.md

### Описания изменений
- COMPLETE_CHANGES_SUMMARY.md
- FINAL_SUMMARY.md
- OPTIMIZATION_APPLIED.md
- TELEGRAM_TAB_MIGRATION_COMPLETE.md

### UI улучшения
- COLLAPSIBLE_MODELS_LIST.md
- COMPACT_HEADER_DESIGN.md
- DYNAMIC_MODEL_PARAMETERS.md
- MODELS_UI_IMPROVEMENT.md

### Исправления
- MODEL_DOWNLOAD_FIX.md
- WEBSITE_DELETE_FIX.md

### Старые гайды (заменены)
- MODEL_MANAGEMENT_GUIDE.md → [docs/guides/MODELS.md](../guides/MODELS.md)
- TROUBLESHOOTING.md → [docs/guides/TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md)
- WEB_IMPORT_GUIDE.md → [docs/guides/WEB_IMPORT.md](../guides/WEB_IMPORT.md)
- USER_GUIDE_MODELS.md → [docs/guides/MODELS.md](../guides/MODELS.md)
- QUICK_START.md → [docs/guides/GETTING_STARTED.md](../guides/GETTING_STARTED.md)
- START_HERE.md → [docs/guides/INSTALLATION.md](../guides/INSTALLATION.md)

### Оптимизация
- OPTIMIZATION_RECOMMENDATIONS.md
- QUICK_OPTIMIZATIONS.md

## Зачем архивировать?

1. **Чистота проекта** - корневая папка не захламлена
2. **История** - документы сохранены для справки
3. **Новая структура** - логичная организация в docs/
4. **Актуальность** - только актуальные документы в основной документации

## Если нужен старый документ

Все архивированные файлы доступны в этой папке. Однако рекомендуется использовать новую документацию, так как она:
- Актуальнее
- Лучше структурирована
- Легче в навигации
- Регулярно обновляется

---

**Дата архивации:** Декабрь 2024
EOF

echo ""
echo "✅ Архивация завершена!"
echo ""
echo "📚 Новая структура документации:"
echo "   docs/"
echo "   ├── README.md              # Главная страница"
echo "   ├── guides/                # Руководства пользователя"
echo "   │   ├── INSTALLATION.md"
echo "   │   ├── GETTING_STARTED.md"
echo "   │   ├── MODELS.md"
echo "   │   ├── TELEGRAM.md"
echo "   │   └── TROUBLESHOOTING.md"
echo "   ├── dev/                   # Для разработчиков"
echo "   └── archive/               # Старые документы"
echo ""
echo "📖 Начните с: docs/README.md"
