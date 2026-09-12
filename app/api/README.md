# Restorio API

The Restorio API constitutes the backend service layer of the Restorio Platform. It is implemented using the FastAPI framework and provides a RESTful interface for multi-tenant restaurant management operations, including authentication, order processing, payment handling, and tenant configuration.

## System Requirements

- Python >= 3.12
- [uv](https://github.com/astral-sh/uv) — a high-performance Python dependency management tool

## Installation and Configuration

### Installing the uv package manager

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Installing project dependencies

```bash
# Install all dependencies, including development extras
uv sync --extra dev
```

### Running the service locally

```bash
# Start the development server with automatic reloading
make dev
# Alternatively, invoke Uvicorn directly:
uv run uvicorn main:app --reload --port 8000
```

### Containerised deployment

```bash
# Start the API together with its dependent infrastructure services
docker compose -f docker-compose.dev.yml up -d

# Production deployment
docker compose up api
```

## API Documentation

When the application is running in debug mode, interactive documentation is available at the following endpoints:

- **Swagger UI** — http://localhost:8000/docs
- **ReDoc** — http://localhost:8000/redoc

## Project Structure

The backend codebase is organised according to a layered architecture pattern, separating concerns across routing, business logic, data access, and cross-cutting infrastructure:

```
app/api/
├── main.py              # Application factory, middleware registration, and route mounting
├── routes/v1/           # Versioned API endpoint definitions
│   ├── auth.py          # Authentication and authorisation endpoints
│   ├── orders.py        # Order lifecycle management
│   ├── users.py         # User account operations
│   ├── tenants/         # Multi-tenant management endpoints
│   ├── payments/        # Payment processing (Przelewy24 integration)
│   ├── public/          # Publicly accessible endpoints (no authentication required)
│   ├── kitchen_config.py # Kitchen display configuration
│   ├── health.py        # Health check and readiness probes
│   └── ws.py            # WebSocket connection handlers
├── core/
│   ├── models/          # SQLAlchemy ORM model definitions (17 entities)
│   ├── middleware/       # HTTP middleware (rate limiting, CSRF protection, timing, auth)
│   ├── dto/             # Data Transfer Object schemas (Pydantic models)
│   ├── exceptions/      # Custom exception classes and global error handlers
│   └── foundation/      # Database connections, application settings, base classes
├── services/            # Business logic layer (20+ service modules)
├── alembic/             # Database migration scripts and configuration
├── tests/               # Automated test suite (pytest)
└── docs/                # Supplementary API documentation and usage examples
```

## Development Commands

The following Makefile targets are provided to streamline common development tasks:

| Command | Description |
|---|---|
| `make dev` | Start the development server with automatic reloading |
| `make install` | Install all project dependencies |
| `make test` | Execute the test suite with coverage measurement |
| `make lint` | Run the Ruff static analyser in check-only mode |
| `make lint-fix` | Run the Ruff static analyser and apply automatic fixes |
| `make format` | Format the source code using Ruff |
| `make check` | Perform all quality checks (linting and formatting verification) |
| `make migrate` | Apply all pending database migrations |
| `make migrate-create NAME=...` | Generate a new migration script from model changes |
| `make migrate-history` | Display the complete migration history |
| `make migrate-current` | Display the currently applied migration revision |
| `make migrate-downgrade` | Revert the most recently applied migration |

## Principal Technologies

The backend service is built upon the following key technologies and libraries:

- **FastAPI** — asynchronous web framework for building RESTful APIs
- **SQLAlchemy 2.0** (asynchronous mode) with **Alembic** — object-relational mapping and schema migration management for PostgreSQL
- **Motor** — asynchronous driver for MongoDB document storage
- **MinIO** — S3-compatible object storage for media assets
- **Redis** — in-memory data store used for caching and session management
- **Pydantic v2** — data validation and serialisation
- **PyJWT** with **passlib** — JSON Web Token authentication and password hashing
- **Resend** — transactional email delivery service
- **Ruff** — static analysis and code formatting tool for Python
