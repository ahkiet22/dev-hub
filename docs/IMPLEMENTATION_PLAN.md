# Implementation Plan — Dev Hub

## 1. Phase Overview & Dependencies

| Phase | Scope | Key Deliverables |
|---|---|---|
| **Phase 0** *(Current)* | Repository analysis, architecture, DBML, security, MFE & health design | `README.md`, `AGENTS.md`, `DESIGN.md`, `docs/*` |
| **Phase 1** | Foundation: Next.js App Router, Tailwind + shadcn/ui, `pg` pool + SQL migrations (`"dev-hub"`), Seed script, Auth (`Argon2id` + opaque sessions), Dashboard shell | `package.json`, `migrations/0001_init.sql`, `src/platform/*`, `src/modules/auth/*`, `(auth)/login`, `(dashboard)/layout.tsx` |
| **Phase 2** | Project Management, Deployment Platforms, Backends CRUD, Frontends CRUD | `src/modules/project/*`, `deployment-platform/*`, `backend/*`, `frontend/*`, UI pages |
| **Phase 3** | Health Monitoring: `/health` Zod contract, SSRF-safe HTTP client, Manual check action, Response time chart (Recharts), Vercel Cron + Standalone Worker, 30-day retention | `src/modules/health/*`, `src/platform/http/*`, `src/workers/health.worker.ts`, `/api/internal/health-cron` |
| **Phase 4** | Dynamic Microfrontend PoC & Integration: MF runtime loader, Error Boundary, timeout/retry, `/apps/[projectId]/[slug]`, Iframe & External modes, Example Vite remote | `src/platform/federation/*`, `RemoteAppShell.tsx`, `examples/vite-remote` |
| **Phase 5** | AI Providers & AI Accounts: Catalog CRUD + seed, Account CRUD, search/filter, group by provider, copy email | `src/modules/ai-provider/*`, `src/modules/ai-account/*`, `/ai/*` |
| **Phase 6** | Dashboard & Settings: Real DB metrics on `/overview`, Profile & Password settings, Session management, Theme preferences | `src/modules/dashboard/*`, `/overview`, `/settings/*` |
| **Phase 7** | Production Readiness: Vitest unit/integration tests, Playwright E2E, SSRF & auth security tests, Vercel build & `vercel.json` verification | `tests/*`, `vercel.json`, `.env.example`, final docs sync |

## 2. Identified Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Vercel Serverless vs. Background Worker** | Hobby plan limits crons to 1/day; serverless functions have execution timeouts | Dual-trigger `HealthService`: Vercel Cron (`/api/internal/health-cron`) with bounded batching + standalone `health.worker.ts` for 60s polling |
| **No ORM (`pg` raw SQL) Type Drift** | SQL column changes could diverge from TS types | Explicit row mapper functions + integration tests against real PostgreSQL `"dev-hub"` schema |
| **Hyphenated Schema `"dev-hub"`** | Unquoted `dev-hub.users` causes PostgreSQL syntax error | Enforce `"dev-hub".<table>` quoting in all migrations and repositories |
| **MF Runtime + Next.js App Router / React 19** | Shared React singleton or SSR `self is not defined` errors | Isolate to `'use client'` + `ssr: false`; run Phase 4 PoC early before building full MFE UI |

## 3. Testing Strategy

- **Unit Tests (Vitest):** Zod schemas, `/health` status classification, SSRF IP/CIDR validator, password/token crypto helpers, email normalization.
- **Integration Tests (Vitest + PostgreSQL):** Repository & Service tests verifying ownership isolation, soft-delete partial unique indexes, transaction rollback, and session revocation.
- **E2E Tests (Playwright):** Login/logout, create project + backend + frontend, trigger manual health check, AI account management, embedded microfrontend/iframe rendering.

## 4. Definition of Done (Per Phase)

- `pnpm typecheck` passes with zero errors.
- `pnpm lint` passes with zero warnings/errors.
- All new/affected Vitest (and Playwright in Phase 7) tests pass.
- `pnpm build` succeeds cleanly.
- Documentation in `docs/` matches implemented behavior.
