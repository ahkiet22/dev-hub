# Dev Hub

**All your projects. One developer workspace.**

Dev Hub is a personal developer control plane for managing software projects, monitoring backend health, embedding frontend applications via Dynamic Module Federation, tracking deployment platforms, and organizing AI provider accounts from a single unified workspace.

> **Status:** Phase 0 — Technical Design & Architecture Complete (Greenfield Repository).

## Core Capabilities

- **Project Management:** Organize personal software projects (`ACTIVE`, `INACTIVE`, `ARCHIVED`) with unique per-user codes, soft deletion, and aggregated backend/frontend summaries.
- **Backend & Health Monitoring:** Register backend services, configure `/health` endpoints, run manual checks, inspect response time history, and monitor service/dependency health via a bounded-concurrency worker or Vercel Cron.
- **Frontend & Dynamic Microfrontend Host:** Register frontend applications (`MODULE_FEDERATION`, `IFRAME`, `EXTERNAL`) and dynamically load compatible Vite/React remotes at runtime inside the Dev Hub shell without rebuilding the host.
- **Deployment Platforms:** Track where each backend or frontend is hosted (Vercel, Render, AWS, Railway, Fly.io, Cloudflare, On-premises, VPS, etc.) with quick links to deployment consoles.
- **AI Providers & Accounts:** Maintain a personal directory of AI providers and registered email accounts (strictly without storing passwords, API keys, or tokens).
- **Session-Based Authentication:** Secure opaque-token sessions (`256-bit` entropy, `SHA-256` hashed in PostgreSQL, `HttpOnly` cookie, `Argon2id` password hashing), single-user seeded onboarding without public registration.

## Technical Stack

| Category | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Strict mode, RSC-first |
| Architecture | Modular Monolith (Feature-based) | Presentation → Application → Data Access → Platform |
| Database | PostgreSQL (schema: `"dev-hub"`) | Raw parameterized SQL via `pg` (no ORM) |
| Migrations | SQL-first (`migrations/*.sql`) | Idempotent migration runner script |
| Auth | Custom Opaque Session Tokens | `Argon2id` (`@node-rs/argon2`) + `SHA-256` + `HttpOnly` cookie |
| Validation | Zod | Shared request, env, and health contract validation |
| UI & Styling | Tailwind CSS + shadcn/ui + Lucide React | Linear/Vercel-inspired developer dashboard |
| Forms & Tables | React Hook Form + TanStack Table + Recharts | Minimal client state |
| Microfrontend | `@module-federation/enhanced/runtime` (Host) + `@module-federation/vite` (Remote) | Client-side dynamic runtime registration |
| Deployment | Vercel (Web + Cron) & Optional Worker / Docker | External managed PostgreSQL |
| Testing | Vitest (Unit/Integration) + Playwright (E2E) | Added in Phase 1 / Phase 7 |

## Project Structure (Planned)

```text
dev-hub/
├── docs/                  # Architecture, DBML, Security, MFE, Health, Implementation Plan
├── scripts/               # Seed and up/down migration runner
├── src/
│   ├── app/               # Next.js App Router ((auth), (dashboard), api)
│   ├── modules/           # Feature modules (auth, project, backend, frontend, health, ...)
│   ├── platform/          # DB pool + migrations, crypto, SSRF-safe HTTP client, federation, logger
│   ├── shared/            # UI primitives, components, errors, types, utils
│   └── workers/           # Standalone health monitoring worker entrypoint
├── tests/                 # Unit, integration, and E2E tests
├── AGENTS.md              # Engineering & AI agent conventions
├── DESIGN.md              # UI/UX design system & layout specification
├── Makefile               # Common dev, migrate, test, and docker targets
└── vercel.json            # Vercel Cron & deployment configuration
```

## Documentation Index

- [Product Specification](file:///home/kiet/Projects/dev-hub/docs/PRODUCT_SPEC.md)
- [System Architecture](file:///home/kiet/Projects/dev-hub/docs/ARCHITECTURE.md)
- [Database Design](file:///home/kiet/Projects/dev-hub/docs/DATABASE.md) & [DBML Schema](file:///home/kiet/Projects/dev-hub/docs/schema.dbml)
- [Authentication & Authorization](file:///home/kiet/Projects/dev-hub/docs/AUTHENTICATION.md)
- [Health Check Contract & Worker](file:///home/kiet/Projects/dev-hub/docs/HEALTH_CHECK.md)
- [Dynamic Microfrontend Integration](file:///home/kiet/Projects/dev-hub/docs/MICROFRONTEND.md)
- [Implementation Plan](file:///home/kiet/Projects/dev-hub/docs/IMPLEMENTATION_PLAN.md)
- [UI/UX Design System](file:///home/kiet/Projects/dev-hub/DESIGN.md)
- [Agent & Engineering Guidelines](file:///home/kiet/Projects/dev-hub/AGENTS.md)

## Setup & Deployment

1. Copy `.env.example` to `.env` and configure `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_SSLMODE`, `DATABASE_SCHEMA`, `SEED_ADMIN_*`, and `CRON_SECRET`.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Apply SQL migrations (`up`/`down`/`status`) to schema `"dev-hub"` and seed catalogs + admin user:
   ```bash
   make migrate-up
   make migrate-status
   make seed
   # Rollback latest migration if needed:
   # make migrate-down STEPS=1
   ```
4. Run locally:
   ```bash
   make dev
   make worker   # optional standalone health monitoring worker
   ```

### Verification Commands
- `pnpm typecheck` — TypeScript strict check
- `pnpm lint` — ESLint
- `pnpm test` — Vitest unit tests
- `pnpm test:e2e` — Playwright E2E smoke tests
- `pnpm build` — Production Next.js build

### Deployment
- **Vercel:** Connect repository, set environment variables (`DATABASE_URL`, `CRON_SECRET`, `ALLOWED_REMOTE_ORIGINS`), and deploy. `vercel.json` configures `/api/internal/health-cron`.
- **Docker Compose:** Run `docker compose up -d --build` to start `postgres`, `dev-hub-web`, and `dev-hub-worker`.
