# Claude Code 101 – Order Management Portfolio Project

## Goal
Build a small but real portfolio project that demonstrates maintenance work on an existing codebase with Claude Code: bug fixing, refactoring, feature implementation, tests, and documentation.

## Scope
Monorepo:
- backend: Java 21 + Spring Boot
- frontend: Angular + TypeScript + SCSS
- PostgreSQL
- Spring Data JPA
- Bean Validation
- Flyway
- JUnit + Mockito
- Docker / Docker Compose
- GitHub Actions

Do not add authentication, payments, inventory, microservices, messaging, Kubernetes, or unrelated enterprise complexity.

## Domain
Single aggregate: Order.

Suggested fields:
- id
- customerName
- customerEmail
- totalAmount
- status: NEW, PROCESSING, SHIPPED, CANCELLED
- createdAt

Core API:
- create order
- list orders
- get order by id
- change order status

Keep the API intentionally small.

## Working method
Implement in phases. Do not jump ahead.

### Phase 1 — Backend baseline only
Create the Spring Boot backend with:
- clean package structure
- PostgreSQL configuration
- Flyway initial migration
- Order entity/repository/service/controller
- request/response DTOs
- validation
- centralized API error handling
- focused unit/integration tests
- Maven Wrapper
- backend Dockerfile

The host machine does not have Java or Maven in PATH. Verification must therefore be possible with Docker using Java 21 / Maven tooling.

Do NOT create the Angular frontend in Phase 1.
Do NOT create maintenance bugs/tasks yet.
Do NOT create GitHub Actions yet.

## Quality bar
- Prefer simple code over abstractions.
- No premature generic layers.
- No Lombok unless there is a strong reason.
- Monetary values use BigDecimal.
- Timestamps use UTC-friendly Java time types.
- Validation errors return structured JSON.
- Tests should validate behavior, not implementation details.
- Project must build from a clean environment.

## Completion criteria for Phase 1
1. Backend source exists and is coherent.
2. Flyway migration exists.
3. Automated tests pass using Docker-based verification.
4. Docker image for backend builds.
5. Brief README section explains how to run/verify Phase 1.
6. Show the exact commands used and results.
7. Stop after Phase 1 and report what changed, why, tests, and any risks.

Do not commit unless explicitly instructed by the orchestrator.
