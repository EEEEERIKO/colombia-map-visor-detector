.PHONY: install dev backend-dev frontend-dev test lint format check
install:
	python3 -m pip install -r backend/requirements-dev.txt
	cd frontend && npm install
dev:
	docker compose up --build
backend-dev:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
frontend-dev:
	cd frontend && npm run dev -- --host 0.0.0.0
test:
	cd backend && python3 -m pytest
	cd frontend && npm test
lint:
	cd backend && ruff check .
	cd frontend && npm run lint
format:
	cd backend && ruff format .
	cd frontend && npm run format
check: lint test

