# Order Management

Baseline codebase for **Claude Code 101**: a deliberately small, working Order application that later serves as the target for codebase-maintenance exercises (bug fixing, refactoring, feature work, tests, docs) done with Claude Code.

## Portfolio purpose

This repository shows maintenance work on an existing codebase with Claude Code: a bug fix, a refactor and a small cross-stack feature, each as one focused PR with tests. See [docs/learning-map.md](docs/learning-map.md) for what each exercise demonstrates and what was deliberately left out.

## Maintenance exercises

| PR | Type | Summary |
| --- | --- | --- |
| [#2](https://github.com/Seldir193/claude-code-order-management/pull/2) | Bug fix | Order form rejects whitespace-only customer names (regression test added) |
| [#4](https://github.com/Seldir193/claude-code-order-management/pull/4) | Refactor | Duplicated request-state resets replaced with RxJS `finalize()`, behavior unchanged |
| [#6](https://github.com/Seldir193/claude-code-order-management/pull/6) | Feature | Optional `?status=` filter in the API and a status filter in the UI, with tests |

## Architecture

```
backend/    Java 21, Spring Boot, Spring Data JPA, Bean Validation, Flyway, PostgreSQL
frontend/   Angular 21 (standalone components, signals, SCSS), Vitest
docker-compose.yml   PostgreSQL + backend
.github/workflows/   CI (backend tests, frontend tests + build)
```

- **Backend** — single aggregate `Order` (`id`, `customerName`, `customerEmail`, `totalAmount` as `BigDecimal`, `status`, `createdAt` in UTC). Package `com.example.orders`: `order` (entity, repository, service, controller, DTOs, domain exceptions), `api` (centralized JSON error handling), `config`. Schema is managed by Flyway (`V1__create_orders.sql`); Hibernate only validates it.
- **Frontend** — single-screen UI: `app.ts` (page container, order state), `orders/order-api.service.ts` (typed `HttpClient` wrapper), `orders/order-form.*` (create form), `orders/order-list.*` (table with status actions). The dev server proxies `/api` to `localhost:8080`.

## API

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/orders` | Create an order (`customerName`, `customerEmail`, `totalAmount`); starts as `NEW` |
| GET | `/api/orders` | List orders, newest first. Optional `?status=NEW`, `PROCESSING`, `SHIPPED` or `CANCELLED` returns only that status (still newest first); an unknown value returns 400 |
| GET | `/api/orders/{id}` | Get one order |
| PATCH | `/api/orders/{id}/status` | Change status, e.g. `{"status": "PROCESSING"}` |

Errors return JSON: `{timestamp, status, error, message, violations[]}`.

### Status transitions

| From | Allowed next status |
| --- | --- |
| `NEW` | `PROCESSING`, `CANCELLED` |
| `PROCESSING` | `SHIPPED`, `CANCELLED` |
| `SHIPPED` | none (final) |
| `CANCELLED` | none (final) |

The backend enforces these rules; the frontend mirrors them in `NEXT_STATUSES` (`order.model.ts`) only to decide which buttons to show.

## Run locally

Requires Docker.

```bash
docker compose up --build     # backend on http://localhost:8080
curl http://localhost:8080/api/orders
docker compose down           # add -v to also delete the database volume
```

PostgreSQL is not published to the host (no clash with a local instance on port 5432). The compose credentials (`orders`/`orders`) are for local development only.

Frontend dev server (needs Node 24, backend running on port 8080):

```bash
cd frontend
npm ci
npm start                     # http://localhost:4200
```

## Test and build

Backend — no Java or Maven needed on the host:

```bash
# Docker (Bash / Git Bash)
docker run --rm -v "$PWD/backend:/app" -v m2-cache:/root/.m2 -w /app maven:3.9-eclipse-temurin-21 mvn -B verify
# Docker (PowerShell)
docker run --rm -v "${PWD}/backend:/app" -v m2-cache:/root/.m2 -w /app maven:3.9-eclipse-temurin-21 mvn -B verify
# With a local JDK 21 instead
cd backend && ./mvnw -B verify
```

Backend tests use in-memory H2 (PostgreSQL mode) with the real Flyway migration.

Frontend:

```bash
cd frontend
npm ci
npm test -- --watch=false     # Vitest
npm run build                 # output in frontend/dist/frontend/browser
```

Images:

```bash
docker build -t order-management-backend ./backend
docker build -t order-management-frontend ./frontend   # nginx; proxies /api/ to host "backend:8080"
```

## Scope and non-goals

In scope: create, list (optionally filtered by status), get and change status of orders, with validation, structured errors, tests and CI.

Out of scope: authentication, payments, inventory, users, search, pagination, messaging, microservices, Kubernetes.
