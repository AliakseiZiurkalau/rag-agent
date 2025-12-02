# Настройка Git репозитория

## Текущий статус

✅ Git репозиторий инициализирован
✅ Все файлы добавлены в первый коммит
✅ Создан initial commit

## Следующие шаги

### Вариант 1: GitHub

1. **Создайте новый репозиторий на GitHub:**
   - Перейдите на https://github.com/new
   - Название: `rag-agent` (или любое другое)
   - Описание: "Local RAG Agent for Raspberry Pi with Ollama, ChromaDB and web interface"
   - Выберите Public или Private
   - **НЕ** инициализируйте с README, .gitignore или license (они уже есть)
   - Нажмите "Create repository"

2. **Подключите удаленный репозиторий:**

```bash
# Замените YOUR_USERNAME на ваше имя пользователя GitHub
git remote add origin https://github.com/YOUR_USERNAME/rag-agent.git

# Или используйте SSH (если настроен)
git remote add origin git@github.com:YOUR_USERNAME/rag-agent.git
```

3. **Отправьте код:**

```bash
# Переименуйте ветку в main (если нужно)
git branch -M main

# Отправьте код
git push -u origin main
```

### Вариант 2: GitLab

1. **Создайте новый проект на GitLab:**
   - Перейдите на https://gitlab.com/projects/new
   - Название: `rag-agent`
   - Visibility: Public или Private
   - **НЕ** инициализируйте с README
   - Нажмите "Create project"

2. **Подключите удаленный репозиторий:**

```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/rag-agent.git

# Или SSH
git remote add origin git@gitlab.com:YOUR_USERNAME/rag-agent.git
```

3. **Отправьте код:**

```bash
git branch -M main
git push -u origin main
```

### Вариант 3: Другой Git сервис

```bash
# Добавьте URL вашего Git сервера
git remote add origin <YOUR_GIT_URL>

# Отправьте код
git branch -M main
git push -u origin main
```

## Проверка

После отправки проверьте:

```bash
# Просмотр удаленных репозиториев
git remote -v

# Просмотр веток
git branch -a

# Статус
git status
```

## Обновление URL в документации

После создания репозитория обновите URL в следующих файлах:

1. **README.md** - замените `YOUR_REPO` на реальный URL
2. **QUICK_START.md** - обновите команды клонирования
3. **scripts/quick_install.sh** - обновите URL для curl

Например:

```bash
# Найти все упоминания YOUR_REPO
grep -r "YOUR_REPO" .

# Заменить (на Mac/Linux)
find . -type f -name "*.md" -exec sed -i '' 's|YOUR_REPO|github.com/username/rag-agent|g' {} +

# Или вручную отредактируйте файлы
```

## Дальнейшая работа

### Создание новой ветки для разработки

```bash
git checkout -b develop
git push -u origin develop
```

### Добавление изменений

```bash
# Добавить файлы
git add .

# Коммит
git commit -m "Описание изменений"

# Отправить
git push
```

### Создание тегов для релизов

```bash
# Создать тег
git tag -a v1.0.0 -m "Release version 1.0.0"

# Отправить теги
git push --tags
```

## GitHub Actions (опционально)

Создайте `.github/workflows/docker-build.yml` для автоматической сборки:

```yaml
name: Docker Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker image
      run: docker-compose build
```

## Полезные команды

```bash
# Просмотр истории
git log --oneline --graph --all

# Откат изменений
git reset --hard HEAD

# Просмотр изменений
git diff

# Создание .gitignore для Python
curl https://raw.githubusercontent.com/github/gitignore/main/Python.gitignore >> .gitignore
```

## Troubleshooting

### Ошибка аутентификации

Если используете HTTPS и получаете ошибку аутентификации:

1. Используйте Personal Access Token вместо пароля
2. Или настройте SSH ключи

### Конфликты при push

```bash
# Получить изменения
git pull --rebase origin main

# Разрешить конфликты
# Затем продолжить
git rebase --continue

# Отправить
git push
```

### Изменение remote URL

```bash
# Просмотр текущего URL
git remote get-url origin

# Изменение URL
git remote set-url origin <NEW_URL>
```

## Следующие шаги

1. ✅ Создайте репозиторий на GitHub/GitLab
2. ✅ Подключите remote
3. ✅ Отправьте код
4. ✅ Обновите URL в документации
5. ✅ Добавьте описание и теги на GitHub
6. ✅ Настройте GitHub Pages (опционально)
7. ✅ Добавьте badges в README (опционально)

## Badges для README (опционально)

После создания репозитория добавьте в README.md:

```markdown
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi-red.svg)
```
