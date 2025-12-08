# 🚀 Деплой RAG Agent на локальный сервер

## Информация о сервере

- **Адрес:** 192.168.100.25
- **Имя хоста:** localpiserver
- **Пользователь:** admin
- **Директория:** /home/admin/rag-agent

## Быстрый старт

### 1. Настройка SSH доступа

Убедитесь, что у вас есть SSH доступ к серверу:

```bash
# Проверка подключения
ssh admin@192.168.100.25

# Если нужно настроить SSH ключ
ssh-copy-id admin@192.168.100.25
```

### 2. Первоначальная настройка сервера

Запустите скрипт настройки (только один раз):

```bash
chmod +x deploy/*.sh
./deploy/setup_server.sh
```

Этот скрипт установит:
- Python 3 и pip
- Node.js и npm
- Ollama
- Базовую модель llama3.2:1b
- Необходимые системные пакеты

### 3. Деплой приложения

```bash
./deploy/deploy.sh
```

Этот скрипт:
- Скопирует файлы на сервер
- Установит зависимости
- Создаст systemd сервисы
- Запустит приложение

## Доступ к приложению

После деплоя приложение будет доступно по адресам:

- **Frontend:** http://192.168.100.25:3000
- **Backend API:** http://192.168.100.25:8000
- **API Docs:** http://192.168.100.25:8000/docs

## Управление сервисами

### Просмотр статуса

```bash
# Статус всех сервисов
ssh admin@192.168.100.25 'sudo systemctl status rag-agent-*'

# Статус backend
ssh admin@192.168.100.25 'sudo systemctl status rag-agent-backend'

# Статус frontend
ssh admin@192.168.100.25 'sudo systemctl status rag-agent-frontend'
```

### Просмотр логов

```bash
# Логи backend (real-time)
ssh admin@192.168.100.25 'sudo journalctl -u rag-agent-backend -f'

# Логи frontend (real-time)
ssh admin@192.168.100.25 'sudo journalctl -u rag-agent-frontend -f'

# Последние 100 строк backend
ssh admin@192.168.100.25 'sudo journalctl -u rag-agent-backend -n 100'
```

### Управление сервисами

```bash
# Перезапуск всех сервисов
ssh admin@192.168.100.25 'sudo systemctl restart rag-agent-*'

# Перезапуск backend
ssh admin@192.168.100.25 'sudo systemctl restart rag-agent-backend'

# Перезапуск frontend
ssh admin@192.168.100.25 'sudo systemctl restart rag-agent-frontend'

# Остановка
ssh admin@192.168.100.25 'sudo systemctl stop rag-agent-*'

# Запуск
ssh admin@192.168.100.25 'sudo systemctl start rag-agent-*'
```

## Обновление приложения

Для обновления приложения после изменений:

```bash
# 1. Закоммитьте изменения локально
git add .
git commit -m "Update"
git push

# 2. Запустите деплой
./deploy/deploy.sh
```

Скрипт автоматически:
- Скопирует новые файлы
- Обновит зависимости (если изменились)
- Перезапустит сервисы

## Конфигурация

### Изменение портов

Отредактируйте файл на сервере:

```bash
ssh admin@192.168.100.25
cd /home/admin/rag-agent
nano .env
```

Измените:
```bash
API_PORT=8000
# Frontend порт настраивается в vite.config.ts
```

После изменений перезапустите сервисы.

### Настройка Ollama

```bash
# Подключиться к серверу
ssh admin@192.168.100.25

# Скачать модель
ollama pull llama3.2:3b

# Список моделей
ollama list

# Удалить модель
ollama rm model_name
```

## Мониторинг

### Проверка здоровья

```bash
# Backend health check
curl http://192.168.100.25:8000/health

# Статистика
curl http://192.168.100.25:8000/stats
```

### Использование ресурсов

```bash
# Подключиться к серверу
ssh admin@192.168.100.25

# CPU и память
htop

# Диск
df -h

# Процессы Python
ps aux | grep python

# Процессы Node
ps aux | grep node
```

## Резервное копирование

### Бэкап данных

```bash
# Создать бэкап
ssh admin@192.168.100.25 'cd /home/admin/rag-agent && tar -czf backup-$(date +%Y%m%d).tar.gz data/'

# Скачать бэкап
scp admin@192.168.100.25:/home/admin/rag-agent/backup-*.tar.gz ./backups/
```

### Восстановление

```bash
# Загрузить бэкап
scp ./backups/backup-20241208.tar.gz admin@192.168.100.25:/home/admin/rag-agent/

# Восстановить
ssh admin@192.168.100.25 'cd /home/admin/rag-agent && tar -xzf backup-20241208.tar.gz'
```

## Безопасность

### Firewall

```bash
ssh admin@192.168.100.25 'sudo bash -s' << 'EOF'
# Установка ufw
sudo apt-get install -y ufw

# Разрешить SSH
sudo ufw allow 22/tcp

# Разрешить порты приложения
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# Включить firewall
sudo ufw enable

# Статус
sudo ufw status
EOF
```

### SSL/TLS (опционально)

Для production рекомендуется использовать nginx с SSL:

```bash
ssh admin@192.168.100.25 'sudo bash -s' << 'EOF'
# Установка nginx
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Настройка nginx (создайте конфиг)
sudo nano /etc/nginx/sites-available/rag-agent

# Включить сайт
sudo ln -s /etc/nginx/sites-available/rag-agent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
EOF
```

## Troubleshooting

### Сервис не запускается

```bash
# Проверить логи
ssh admin@192.168.100.25 'sudo journalctl -u rag-agent-backend -n 50'

# Проверить конфигурацию
ssh admin@192.168.100.25 'cat /etc/systemd/system/rag-agent-backend.service'

# Перезагрузить systemd
ssh admin@192.168.100.25 'sudo systemctl daemon-reload'
```

### Порт занят

```bash
# Проверить что использует порт
ssh admin@192.168.100.25 'sudo lsof -i :8000'

# Убить процесс
ssh admin@192.168.100.25 'sudo kill -9 <PID>'
```

### Ollama не работает

```bash
# Проверить статус
ssh admin@192.168.100.25 'sudo systemctl status ollama'

# Перезапустить
ssh admin@192.168.100.25 'sudo systemctl restart ollama'

# Проверить подключение
ssh admin@192.168.100.25 'curl http://localhost:11434'
```

### Нет места на диске

```bash
# Проверить использование
ssh admin@192.168.100.25 'df -h'

# Очистить логи
ssh admin@192.168.100.25 'sudo journalctl --vacuum-time=7d'

# Удалить старые модели Ollama
ssh admin@192.168.100.25 'ollama list'
ssh admin@192.168.100.25 'ollama rm <model_name>'
```

## Полезные команды

### Быстрый доступ

Добавьте в `~/.ssh/config`:

```
Host localpiserver
    HostName 192.168.100.25
    User admin
    ForwardAgent yes
```

Теперь можно использовать:
```bash
ssh localpiserver
```

### Алиасы

Добавьте в `~/.bashrc` или `~/.zshrc`:

```bash
alias rag-deploy='./deploy/deploy.sh'
alias rag-logs-backend='ssh admin@192.168.100.25 "sudo journalctl -u rag-agent-backend -f"'
alias rag-logs-frontend='ssh admin@192.168.100.25 "sudo journalctl -u rag-agent-frontend -f"'
alias rag-status='ssh admin@192.168.100.25 "sudo systemctl status rag-agent-*"'
alias rag-restart='ssh admin@192.168.100.25 "sudo systemctl restart rag-agent-*"'
```

## Структура на сервере

```
/home/admin/rag-agent/
├── api/                    # Backend API
├── src/                    # Backend логика
├── frontend/               # React приложение
├── data/                   # Данные
│   ├── documents/         # Загруженные файлы
│   ├── chroma_db/         # Векторная БД
│   └── settings.json      # Настройки
├── logs/                   # Логи приложения
├── venv/                   # Python окружение
├── .env                    # Конфигурация
└── main.py                 # Точка входа

/etc/systemd/system/
├── rag-agent-backend.service   # Backend сервис
└── rag-agent-frontend.service  # Frontend сервис
```

## Поддержка

Если возникли проблемы:

1. Проверьте логи сервисов
2. Проверьте статус Ollama
3. Проверьте доступность портов
4. Проверьте .env конфигурацию
5. Обратитесь к [TROUBLESHOOTING.md](../docs/guides/TROUBLESHOOTING.md)

---

**Версия:** 2.4.0  
**Дата:** Декабрь 2024
