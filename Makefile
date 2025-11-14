.PHONY: help install dev build start stop clean test lint docker-dev docker-prod logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "Installing Python dependencies..."
	cd python-backend && pip install -r requirements.txt
	@echo "Installation complete!"

dev: ## Start development servers
	@echo "Starting development environment..."
	@echo "Starting Redis..."
	docker run -d -p 6379:6379 --name chandra-redis redis:7-alpine || docker start chandra-redis
	@echo "Starting Python backend..."
	cd python-backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
	@echo "Starting Next.js frontend..."
	npm run dev

build: ## Build for production
	@echo "Building Next.js..."
	npm run build
	@echo "Build complete!"

start: ## Start production servers
	@echo "Starting production servers..."
	docker-compose up -d
	@echo "Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8001"

stop: ## Stop all services
	@echo "Stopping services..."
	docker-compose down
	docker stop chandra-redis || true
	@echo "Services stopped!"

clean: ## Clean build artifacts and dependencies
	@echo "Cleaning..."
	rm -rf node_modules .next build dist
	rm -rf python-backend/__pycache__ python-backend/**/__pycache__
	rm -rf uploads outputs temp logs
	@echo "Clean complete!"

test: ## Run tests
	@echo "Running tests..."
	npm run type-check
	npm run lint
	@echo "Tests complete!"

lint: ## Run linters
	@echo "Running linters..."
	npm run lint
	@echo "Linting complete!"

docker-dev: ## Start Docker development environment
	@echo "Starting Docker development environment..."
	docker-compose -f docker-compose.dev.yml up --build

docker-prod: ## Start Docker production environment
	@echo "Starting Docker production environment..."
	docker-compose up --build -d

logs: ## View logs
	docker-compose logs -f

logs-python: ## View Python backend logs
	docker-compose logs -f python-api

logs-nextjs: ## View Next.js frontend logs
	docker-compose logs -f nextjs

shell-python: ## Open shell in Python container
	docker-compose exec python-api /bin/bash

shell-nextjs: ## Open shell in Next.js container
	docker-compose exec nextjs /bin/sh

health: ## Check service health
	@echo "Checking service health..."
	@curl -s http://localhost:3000/api/health | jq '.' || echo "Next.js health check failed"
	@curl -s http://localhost:8001/health | jq '.' || echo "Python API health check failed"

setup: ## Initial setup (env files, directories)
	@echo "Setting up project..."
	cp -n .env.example .env || true
	cp -n python-backend/.env.example python-backend/.env || true
	mkdir -p logs uploads outputs temp
	mkdir -p python-backend/logs python-backend/uploads python-backend/outputs python-backend/temp
	@echo "Setup complete! Please edit .env files with your configuration."

format: ## Format code
	@echo "Formatting code..."
	npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
	cd python-backend && black app/
	@echo "Formatting complete!"

