# Studaro Backend

NestJS 11 backend application built with TypeScript, TypeORM, and PostgreSQL.

## Project setup

```bash
npm install
```

## Running the app

```bash
# Development (watch mode)
npm run start:dev

# Debug mode
npm run start:debug

# Production
npm run build
npm run start:prod
```

## Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Single test file
npx jest src/users/service/users.service.spec.ts
```

## Code quality

```bash
npm run lint      # ESLint with auto-fix
npm run format    # Prettier format
```

---

## Architectural decisions

### Layered architecture (Controller → Service → Repository)

Each feature (`users`, `skills`) is split into three distinct layers following NestJS module conventions:

- **Controller** — handles HTTP concerns (routing, request parsing, response shaping)
- **Service** — contains business logic, orchestrates operations
- **Repository** — encapsulates all database queries

This keeps HTTP logic out of business logic and DB queries out of services. Each layer can be tested in isolation, and the structure aligns with NestJS's modular design.

**Trade-off:** More files and boilerplate per feature compared to a flat structure.

---

### Unit tests in CI/CD

Unit tests cover the service and controller layers and are intended to run on every push to prevent regressions. Tests are colocated with their source files (e.g. `users.service.spec.ts`).

**Trade-off:** Longer build times, but essential for catching breakage early and maintaining confidence when making changes.

---

### Middleware for logging and extensibility

A `LoggerMiddleware` is applied globally to log incoming requests. The middleware layer is also the right place to add authorization, exception handling, and CORS policy in the future without touching business logic. Timing logs are added specifically for skill-matching operations to track performance.

**Trade-off:** Middleware adds a small overhead to every request. Poorly implemented middleware can become a bottleneck.

---

### QueryRunner for transactional writes

Write operations that involve multiple steps use TypeORM's `QueryRunner` to wrap them in a single database transaction. If the server crashes mid-operation, the transaction is rolled back, preventing partial writes and data inconsistency.

**Trade-off:** More verbose code to manage the runner lifecycle (`connect`, `startTransaction`, `commitTransaction`, `rollbackTransaction`, `release`).

---

### `synchronize: true` in TypeORM config (development only)

TypeORM's `synchronize: true` auto-applies entity schema changes to the database on startup — no migration files needed during development.

**This must be disabled before going to production.** With `synchronize: true`, a schema change in an entity (e.g. renaming a column) will silently alter or drop data in the live database on the next boot. The correct production approach is to switch to TypeORM migrations (`synchronize: false`, `migrations: [...]`).
