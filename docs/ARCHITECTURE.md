# System Architecture — Dev Hub

## 1. Architectural Style

Dev Hub uses a **Fullstack Modular Monolith** with **Feature-based Modules** inside Next.js App Router, deployed to **Vercel** with an external **PostgreSQL** database (schema `"dev-hub"`).

### Why Modular Monolith + Raw SQL (No ORM)?
- **Clear boundaries without network overhead:** Server Components and Route Handlers call module services directly in-process.
- **Zero ORM overhead:** Direct parameterized SQL via `pg` gives full control over PostgreSQL `"dev-hub"` schema quoting, partial unique indexes, `JSONB` queries, `TIMESTAMPTZ` arithmetic, and connection pooling on Vercel serverless.

## 2. Layering & Dependency Direction

```text
┌─────────────────────────────────────────────────────────────┐
│ Presentation Layer                                          │
│  src/app/** (Pages, Layouts, Route Handlers)                │
│  src/modules/*/components/**, *.actions.ts                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ calls (never skips to Repository)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Application / Service Layer                                 │
│  src/modules/*/*.service.ts                                 │
│  (Business logic, Ownership checks, Transactions, Zod)      │
└──────────────────────────┬──────────────────────────────────┘
                           │ calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Data Access / Repository Layer                              │
│  src/modules/*/*.repository.ts                              │
│  (Parameterized SQL queries against "dev-hub".* tables)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ uses
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Platform / Infrastructure Layer                             │
│  src/platform/database  (pg Pool, transaction helper)       │
│  src/platform/security  (Argon2id, SHA-256, SSRF, RateLimit)│
│  src/platform/http      (SSRF-safe fetch client)            │
│  src/platform/federation (Client-side MF runtime loader)    │
│  src/platform/logger    (Structured JSON logger)            │
└─────────────────────────────────────────────────────────────┘
```

### Strict Boundaries
1. **Server/Client Isolation:** `src/platform/database`, `src/platform/security`, `src/platform/http`, and all `*.repository.ts` / `*.service.ts` files are server-only (`import 'server-only'` where applicable in Next.js).
2. **Client-Only Boundary:** `src/platform/federation` and interactive UI components use `'use client'` and never import server modules.
3. **No Internal HTTP Hop from RSC:** Server Components call `*.service.ts` directly.

## 3. Module Boundaries

| Module | Owns | Dependencies |
|---|---|---|
| `auth` | Users, sessions, login/logout, profile, password | `platform/database`, `platform/security` |
| `project` | Projects CRUD, status, archive, soft delete | `platform/database`, `auth` (session user) |
| `deployment-platform` | Shared platform catalog | `platform/database` |
| `backend` | Project backends CRUD, platform link | `platform/database`, `project` (ownership) |
| `health` | `/health` contract validation, check execution, history, retention | `platform/http`, `backend` |
| `frontend` | Project frontends CRUD, integration config | `platform/database`, `project` (ownership), `platform/federation` |
| `ai-provider` | Shared AI provider catalog | `platform/database` |
| `ai-account` | User's AI email accounts | `platform/database`, `ai-provider` |
| `dashboard` | Aggregated metrics & recent activity queries | `platform/database` (read-only) |

## 4. Vercel Deployment & Health Worker Architecture

### Architectural Constraint on Vercel
Vercel Serverless Functions are request-driven and ephemeral; they **cannot** run an infinite `while (true)` background daemon (`health.worker.ts`) inside the Next.js web deployment.

### Proposed Dual-Trigger Architecture
Both triggers invoke the **exact same** `HealthMonitorService.runDueChecks()` method:

1. **Vercel Cron Endpoint (`GET /api/internal/health-cron`):**
   - Configured in `vercel.json` and authenticated via `Authorization: Bearer ${CRON_SECRET}`.
   - Runs a single bounded batch (e.g., concurrency `5`, max `20` due backends per invocation) so it completes well within Vercel's serverless timeout.
   - **Trade-off / Blocker Note:** Vercel Hobby plans restrict Cron Jobs to **once per day**, whereas Vercel Pro supports **1-minute (`* * * * *`)** crons.
2. **Standalone Node.js Worker (`src/workers/health.worker.ts`):**
   - Shares the same `src/modules/health/` and `src/platform/` code.
   - Can be run on any always-on Node host (Railway, Fly.io, VPS, or Docker Compose) against the same PostgreSQL `"dev-hub"` database when sub-minute/60-second polling is needed on a Vercel Hobby plan.

## 5. Request Lifecycle

1. **Page Request (RSC):** Middleware/Layout checks session cookie presence → Server Component calls `authService.getCurrentUser()` → calls module service (e.g. `projectService.listByUser(user.id)`) → renders HTML.
2. **Mutation (Server Action / Route Handler):** Validates `Origin` header → authenticates session → validates payload with Zod → calls Service Layer (which verifies resource ownership and executes transaction) → `revalidatePath()` → returns typed result.
