.PHONY: build up down logs restart clean pull-model

# Сборка и запуск контейнеров
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

# Логи
logs:
	docker-compose logs -f

logs-rag:
	docker-compose logs -f rag-agent

logs-ollama:
	docker-compose logs -f ollama

# Перезапуск
restart:
	docker-compose restart

restart-rag:
	docker-compose restart rag-agent

# Очистка
clean:
	docker-compose down -v
	rm -rf data/chroma_db/*
	rm -rf logs/*

# Загрузка модели Ollama
pull-model:
	docker-compose exec ollama ollama pull llama3.2:3b

# Статус
status:
	docker-compose ps

# Тесты API
test-health:
	curl http://localhost:8000/health

test-stats:
	curl http://localhost:8000/stats

test-web:
	@echo "Opening web interface..."
	@command -v open >/dev/null 2>&1 && open http://localhost:8000 || \
	command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:8000 || \
	echo "Please open http://localhost:8000 in your browser"

# Полная установка
install: build up pull-model
	@echo "Waiting for services to start..."
	@sleep 10
	@make test-health
	@echo ""
	@echo "✓ Installation complete!"
	@echo "Web interface: http://localhost:8000"
	@echo "API docs: http://localhost:8000/docs"
