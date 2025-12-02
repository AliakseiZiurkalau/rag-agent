# Создание GitHub Personal Access Token

Если при push GitHub просит пароль, нужно использовать Personal Access Token.

## Создание токена

1. Откройте: https://github.com/settings/tokens

2. Нажмите "Generate new token" → "Generate new token (classic)"

3. Заполните форму:
   - Note: `rag-agent-push`
   - Expiration: `90 days` (или другой срок)
   - Выберите scopes:
     - ✅ `repo` (полный доступ к репозиториям)

4. Нажмите "Generate token"

5. **ВАЖНО:** Скопируйте токен сразу! Он больше не будет показан.

## Использование токена

### Вариант 1: При каждом push

```bash
git push -u origin main
# Username: ваш_username
# Password: вставьте_токен
```

### Вариант 2: Сохранить в credential helper

```bash
# Для macOS
git config --global credential.helper osxkeychain

# Для Linux
git config --global credential.helper store

# Теперь при первом push введите токен - он сохранится
git push -u origin main
```

### Вариант 3: Использовать SSH (рекомендуется)

```bash
# 1. Создайте SSH ключ (если нет)
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. Скопируйте публичный ключ
cat ~/.ssh/id_ed25519.pub

# 3. Добавьте на GitHub:
#    https://github.com/settings/keys
#    Нажмите "New SSH key"
#    Вставьте содержимое id_ed25519.pub

# 4. Измените remote на SSH
git remote set-url origin git@github.com:YOUR_USERNAME/rag-agent.git

# 5. Теперь push без пароля
git push -u origin main
```

## Troubleshooting

### Ошибка: "Support for password authentication was removed"

Это значит, что GitHub больше не принимает пароли. Используйте токен или SSH.

### Ошибка: "Permission denied (publickey)"

При использовании SSH:

```bash
# Проверьте SSH агент
ssh-add -l

# Добавьте ключ
ssh-add ~/.ssh/id_ed25519

# Проверьте подключение
ssh -T git@github.com
```

### Забыли токен?

Создайте новый токен на https://github.com/settings/tokens
