.PHONY: help lint lint-fix format format-check check check-fix all test migrate

# Ruff automatically discovers pyproject.toml in the current directory
# All ruff commands use configuration from pyproject.toml

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

lint: ## Run ruff linter (check only, no fixes) - uses pyproject.toml config
	uv run --with ruff ruff check .

lint-fix: ## Run ruff linter and auto-fix issues - uses pyproject.toml config
	uv run --with ruff ruff check --fix .

format: ## Format code with ruff and fix import sorting - uses pyproject.toml config
	uv run --with ruff ruff format .
	uv run --with ruff ruff check --fix --select I .

format-check: ## Check if code is formatted and imports are sorted (for CI) - uses pyproject.toml config
	uv run --with ruff ruff format --check .
	uv run --with ruff ruff check --select I .

check: lint format-check ## Run all checks (lint + format check)

check-fix: lint-fix format ## Run all checks and auto-fix issues

all: check ## Alias for check

test: ## Run tests with coverage
	uv run --extra dev pytest --cov-report=markdown:coverage/coverage.md --cov-report=term-missing

migrate: ## Run database migrations (alembic upgrade head)
	uv run alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create NAME=description)
	uv run alembic revision --autogenerate -m "$(NAME)"

migrate-downgrade: ## Downgrade one migration
	uv run alembic downgrade -1

migrate-history: ## Show migration history
	uv run alembic history

migrate-current: ## Show current migration version
	uv run alembic current

migrate-head: ## Upgrade to latest migration
	uv run alembic upgrade head

install: ## Install dependencies
	uv sync --extra dev

dev:
	uv run uvicorn main:app --reload --port 8000

build: ## Build API
	uv run python main.py

up:
	uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
