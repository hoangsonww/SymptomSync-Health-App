.PHONY: help install dev test lint format clean docker-build docker-up docker-down deploy-aws deploy-azure

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pip install -r requirements.txt

dev: ## Install development dependencies
	pip install -r requirements.txt
	pip install -e .

test: ## Run tests
	pytest tests/ -v --cov=. --cov-report=html

test-unit: ## Run unit tests only
	pytest tests/ -v -m "not integration"

test-integration: ## Run integration tests only
	pytest tests/ -v -m integration

lint: ## Run linters
	ruff check .
	mypy .

format: ## Format code
	black .
	ruff check --fix .

clean: ## Clean up generated files
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

docker-build: ## Build Docker image
	docker build -t symptomsync-agentic-ai:latest .

docker-up: ## Start Docker Compose services
	docker-compose up -d

docker-down: ## Stop Docker Compose services
	docker-compose down

docker-logs: ## View Docker Compose logs
	docker-compose logs -f

run: ## Run the MCP server locally
	python main.py

run-dev: ## Run in development mode
	uvicorn mcp_server.server:app --reload --host 0.0.0.0 --port 8000

deploy-aws: ## Deploy to AWS
	cd config/aws && bash deploy.sh

deploy-azure: ## Deploy to Azure
	cd config/azure && bash deploy.sh

migrate: ## Run database migrations
	alembic upgrade head

migrate-create: ## Create new migration
	alembic revision --autogenerate -m "$(msg)"

seed-db: ## Seed the database with sample data
	python scripts/seed_database.py

monitor: ## Open Grafana dashboard
	open http://localhost:3001

metrics: ## View Prometheus metrics
	open http://localhost:9090

docs: ## Open API documentation
	open http://localhost:8000/docs
