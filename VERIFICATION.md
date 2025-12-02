# Проверка развертывания RAG Agent

Руководство по проверке корректности развертывания проекта на Raspberry Pi.

## Быстрая проверка

```bash
# Автоматическая проверка всех компонентов
./scripts/verify_deployment.sh
```

Этот скрипт проверит:
- ✅ Docker и Docker Compose
- ✅ Структуру проекта
- ✅ Конфигурацию
- ✅ Запущенные контейнеры
- ✅ Сеть и порты
- ✅ API endpoints
- ✅ Ollama и модели
- ✅ Ресурсы системы
- ✅ Логи

## Ручная проверка

### 1. Проверка Docker контейнеров

```bash
# Список запущенных контейнеров
docker ps

# Должны быть запущены:
# - rag-agent
# - ollama

# Статус контейнеров
make status

# Логи контейнеров
make logs
```

**Ожидаемый результат:**
```
CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
xxxxx          rag-agent          Up 5 minutes   0.0.0.0:8000->8000/tcp   rag-agent
xxxxx          ollama/ollama      Up 5 minutes   11434/tcp                ollama
```

### 2. Проверка API

```bash
# Health check
curl http://localhost:8000/health

# Ожидаемый ответ:
# {
#   "status": "healthy",
#   "ollama": "healthy",
#   "vector_store": "healthy",
#   "documents_count": 0
# }

# Статистика
curl http://localhost:8000/stats

# Веб-интерфейс
curl -I http://localhost:8000/
```

### 3. Проверка Ollama

```bash
# Список моделей
docker exec ollama ollama list

# Должна быть установлена модель из .env (например, llama3.2:3b)

# Тест модели
docker exec ollama ollama run llama3.2:3b "Привет"
```

### 4. Проверка сети

```bash
# Проверка открытых портов
sudo netstat -tulpn | grep -E "8000|11434"

# Или
ss -tulpn | grep -E "8000|11434"

# Должны быть открыты:
# - 8000 (API)
# - 11434 (Ollama, может быть только в Docker сети)
```

### 5. Проверка веб-интерфейса

**На Raspberry Pi:**
```bash
# Откройте в браузере
http://localhost:8000
```

**С другого компьютера в сети:**
```bash
# Узнайте IP адрес Raspberry Pi
hostname -I

# Откройте в браузере
http://192.168.X.X:8000
```

### 6. Проверка ресурсов

```bash
# Использование памяти
free -h

# Использование диска
df -h

# Температура CPU (Raspberry Pi)
vcgencmd measure_temp

# Статистика Docker контейнеров
docker stats --no-stream
```

### 7. Проверка логов

```bash
# Логи RAG Agent
make logs-rag

# Логи Ollama
make logs-ollama

# Файл лога приложения
tail -f logs/rag_agent.log

# Поиск ошибок
grep -i error logs/rag_agent.log
```

## Тестирование функциональности

### Тест 1: Загрузка документа

```bash
# Создайте тестовый файл
echo "Это тестовый документ для RAG Agent." > test.txt

# Загрузите через API
curl -X POST "http://localhost:8000/upload" \
  -F "file=@test.txt"

# Ожидаемый ответ:
# {
#   "filename": "test.txt",
#   "file_hash": "xxxxx",
#   "chunks_created": 1,
#   "text_length": 40,
#   "status": "processed"
# }
```

### Тест 2: Запрос к ассистенту

```bash
# Задайте вопрос
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Что содержится в документе?"}'

# Ожидаемый ответ:
# {
#   "question": "Что содержится в документе?",
#   "answer": "...",
#   "context": [...],
#   "sources_count": 1
# }
```

### Тест 3: Веб-интерфейс

1. Откройте http://localhost:8000
2. Проверьте статус системы (должен быть зеленый)
3. Загрузите PDF или DOCX файл
4. Задайте вопрос в чате
5. Проверьте, что получен ответ

## Диагностика проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверка логов
docker-compose logs

# Проверка Docker
sudo systemctl status docker

# Перезапуск
make restart
```

### Проблема: API недоступен

```bash
# Проверка порта
sudo netstat -tulpn | grep 8000

# Проверка логов RAG Agent
make logs-rag

# Проверка конфигурации
cat .env | grep API_PORT
```

### Проблема: Ollama не отвечает

```bash
# Проверка контейнера
docker ps | grep ollama

# Проверка логов
make logs-ollama

# Проверка моделей
docker exec ollama ollama list

# Загрузка модели
make pull-model
```

### Проблема: Высокое использование памяти

```bash
# Проверка памяти
free -h

# Статистика контейнеров
docker stats

# Уменьшите лимиты в docker-compose.yml
# Или используйте более легкую модель (phi3:mini)
```

### Проблема: Медленная работа

```bash
# Проверка температуры
vcgencmd measure_temp

# Проверка swap
free -h | grep Swap

# Проверка диска
df -h

# Оптимизация:
# 1. Уменьшите TOP_K_RESULTS в .env
# 2. Используйте более легкую модель
# 3. Включите кэширование
```

## Мониторинг в реальном времени

```bash
# Логи в реальном времени
make logs

# Статистика ресурсов
watch -n 2 'docker stats --no-stream'

# Температура CPU
watch -n 2 'vcgencmd measure_temp'

# Использование памяти
watch -n 2 'free -h'
```

## Автоматическая проверка при запуске

Добавьте в crontab для регулярной проверки:

```bash
# Редактировать crontab
crontab -e

# Добавить строку (проверка каждый час)
0 * * * * /home/pi/rag-agent/scripts/verify_deployment.sh >> /home/pi/rag-agent/logs/verification.log 2>&1
```

## Чек-лист успешного развертывания

- [ ] Docker и Docker Compose установлены
- [ ] Контейнеры rag-agent и ollama запущены
- [ ] Порт 8000 открыт
- [ ] Health endpoint возвращает "healthy"
- [ ] Ollama модель установлена
- [ ] Веб-интерфейс доступен
- [ ] Можно загрузить документ
- [ ] Можно задать вопрос и получить ответ
- [ ] Использование памяти < 80%
- [ ] Температура CPU < 70°C
- [ ] Нет ошибок в логах

## Полезные команды

```bash
# Полная проверка
./scripts/verify_deployment.sh

# Быстрая проверка API
curl http://localhost:8000/health | jq

# Статус всех сервисов
make status

# Перезапуск всех сервисов
make restart

# Просмотр логов
make logs

# Очистка и перезапуск
make clean && make install
```

## Получение помощи

Если проблемы не решаются:

1. Соберите информацию:
   ```bash
   ./scripts/verify_deployment.sh > verification_report.txt
   make logs > logs_report.txt
   ```

2. Проверьте документацию:
   - INSTALL_RASPBERRY_PI.md
   - README_DOCKER.md
   - TROUBLESHOOTING.md

3. Создайте issue на GitHub с отчетами
