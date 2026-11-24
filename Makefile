.PHONY: help install dev build start typecheck lint test test-e2e verify migrate-up migrate-down migrate-status seed worker docker-up docker-down

STEPS ?= 1

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

dev: ## Start Next.js development server
	pnpm dev

build: ## Build production Next.js bundle
	pnpm build

start: ## Start production Next.js server
	pnpm start

typecheck: ## Run TypeScript typecheck
	pnpm typecheck

lint: ## Run ESLint
	pnpm lint

test: ## Run Vitest unit tests
	pnpm test

test-e2e: ## Run Playwright E2E tests
	pnpm test:e2e

verify: typecheck lint test build ## Run full verification suite

migrate-up: ## Apply all pending SQL migrations
	pnpm db:migrate:up

migrate-down: ## Roll back latest $(STEPS) migration(s)
	pnpm db:migrate:down $(STEPS)

migrate-status: ## Show migration status
	pnpm db:migrate:status

seed: ## Seed initial admin user
	pnpm db:seed

worker: ## Run standalone health monitoring worker
	pnpm worker:health

docker-up: ## Start Postgres, Web, and Worker with Docker Compose
	docker compose up -d --build

docker-down: ## Stop Docker Compose services
	docker compose down
