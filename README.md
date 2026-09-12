# Restorio Platform

Restorio is a full-stack, multi-tenant restaurant management platform designed and implemented as a monorepo. The system comprises a RESTful backend built with the FastAPI framework, six specialised front-end applications developed in React and Next.js, a set of shared library packages, and an infrastructure layer orchestrated through Docker Compose and Cloudflare Workers. The project follows the monorepo pattern managed by Turborepo and Bun workspaces, which ensures consistent dependency resolution and unified build pipelines across all sub-projects.

## System Architecture

The repository is organised into the following top-level directories, each fulfilling a distinct role within the overall system architecture:

```
restorio-fullstack/
├── app/
│   ├── api/                 # RESTful backend service (Python 3.12+, FastAPI)
│   ├── apps/
│   │   ├── admin-panel/     # Administration dashboard        (React 18, Vite – port 3001)
│   │   ├── kitchen-panel/   # Kitchen order management panel  (React 19, Vite – port 3002)
│   │   ├── mobile-app/      # Customer-facing mobile client   (React 18, Vite – port 3003)
│   │   ├── public-web/      # Public website and ordering     (Next.js 19    – port 3000)
│   │   ├── ui-demo/         # Component library showcase      (React 18, Vite – port 6767)
│   │   └── waiter-panel/    # Waiter management interface     (React 18, Vite – port 3004)
│   └── packages/
│       ├── api-client/      # HTTP client abstraction layer (Axios)
│       ├── auth/            # Authentication logic and context providers
│       ├── types/           # Shared TypeScript type definitions
│       ├── ui/              # Reusable component library with Tailwind CSS theming
│       └── utils/           # Common utility functions
├── e2e/                     # End-to-end test suite (Playwright)
├── nginx/                   # Reverse proxy configuration and TLS termination
├── worker/                  # Edge computing module (Cloudflare Workers)
└── scripts/                 # Build automation and coverage reporting scripts
```

## Technology Stack

The following table summarises the principal technologies and frameworks employed at each layer of the system:

| Layer | Technologies |
|---|---|
| **Backend** | FastAPI, SQLAlchemy 2.0 (asynchronous), Alembic, Motor (MongoDB), Redis, MinIO |
| **Frontend** | React 18/19, Next.js 19, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| **Infrastructure** | Docker Compose, Nginx, Cloudflare Workers, PostgreSQL 16, MongoDB 7, MinIO |
| **Quality Assurance** | Vitest, Playwright, pytest, React Testing Library |
| **Development Tooling** | Turborepo, Bun, uv, Ruff, ESLint, Prettier, Husky |

## Prerequisites

The following software must be installed prior to running the platform:

- [Bun](https://bun.sh/) >= 1.3.5 — JavaScript runtime and package manager
- [Python](https://www.python.org/) >= 3.12 — required for the backend service
- [uv](https://github.com/astral-sh/uv) — Python dependency management tool
- [Docker](https://www.docker.com/) and Docker Compose — container orchestration

## Environment Setup

The setup procedure consists of the following steps:

### Step 1 — Install front-end dependencies

```bash
bun install
```

### Step 2 — Start infrastructure services

```bash
# Development configuration (with automatic reloading)
docker compose -f docker-compose.dev.yml up -d

# Production configuration
docker compose up -d
```

This command initialises the PostgreSQL database server, MongoDB instance, MinIO object storage, and the API service.

### Step 3 — Install backend dependencies

```bash
cd app/api
uv sync --extra dev
```

### Step 4 — Apply database migrations

```bash
cd app/api
make migrate
```

### Step 5 — Launch development servers

```bash
# Start all applications concurrently
bun run dev

# Alternatively, start a specific application
bun run dev:kitchen-panel
```

## Available Scripts

The root `package.json` exposes the following commands for build orchestration, testing, and code quality enforcement:

| Command | Description |
|---|---|
| `bun run dev` | Launch all applications in development mode with hot reloading |
| `bun run build` | Execute production builds for all applications and packages |
| `bun run test:unit` | Run the unit test suite via Vitest |
| `bun run test:e2e` | Run the end-to-end test suite via Playwright |
| `bun run check` | Perform static analysis and formatting verification |
| `bun run format` | Apply automatic code formatting across the codebase |
| `bun run clean` | Remove all build artefacts and cached outputs |
| `bun run coverage:report` | Generate a consolidated test coverage report |

## Service Endpoints

During local development, the individual services are accessible at the following addresses:

| Service | URL | Description |
|---|---|---|
| Public Web | http://localhost:3000 | Public-facing website with menu browsing and ordering |
| Admin Panel | http://localhost:3001 | Tenant administration and configuration dashboard |
| Kitchen Panel | http://localhost:3002 | Real-time order visualisation for kitchen personnel |
| Mobile App | http://localhost:3003 | Mobile-optimised customer interface |
| Waiter Panel | http://localhost:3004 | Order and table management for waiting staff |
| UI Demo | http://localhost:6767 | Interactive component library documentation |
| API | http://localhost:8000 | RESTful backend API |
| API Documentation | http://localhost:8000/docs | Interactive API documentation (Swagger UI) |
| MinIO Console | http://localhost:9001 | Object storage administration interface |

## Licence

Refer to the [LICENSE](LICENSE) file for licensing information.
