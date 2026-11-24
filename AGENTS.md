# AGENTS.md — Engineering & AI Agent Guidelines

This file defines the mandatory conventions, architectural boundaries, and verification rules for **Dev Hub**.

## 1. Core Architectural Constraints (Confirmed)

1. **No ORM:** Do NOT install or use Drizzle ORM, Prisma, TypeORM, or any query builder/ORM. Use raw parameterized SQL via `pg` (`node-postgres`) through `src/platform/database/`.
2. **PostgreSQL Schema Name:** All tables live in the `"dev-hub"` schema. Always double-quote `"dev-hub"` in SQL DDL and queries (e.g., `"dev-hub".users`, `"dev-hub".projects`) because of the hyphen.
3. **Vercel Deployment Target:** The Next.js App Router app deploys to **Vercel**.
   - Avoid long-lived in-process background loops inside Next.js request handlers.
   - Use `serverExternalPackages` for native/CJS server dependencies (`@node-rs/argon2`, `pg`).
   - Support both Vercel Cron (`/api/internal/health-cron`) and a standalone Node worker (`src/workers/health.worker.ts`) for health monitoring.
4. **No Scope Creep:** Strictly respect the Out-of-Scope list in `docs/PRODUCT_SPEC.md` (no RBAC, no public registration, no JWT auth, no secret manager, no AI chat/LLM calls, no CI/CD/K8s/Docker management).

## 2. Architecture & Layering Rules

Use a **Modular Monolith** with **Feature-based Modules**:

- **Presentation Layer (`src/app/**`, `src/modules/*/components/**`, `*.actions.ts`):**
  - Server Components call Service Layer directly (never fetch internal HTTP APIs from RSC).
  - Server Actions and Route Handlers MUST authenticate the session, validate input with Zod, and delegate to the Service Layer.
  - Zero business logic or raw SQL in `page.tsx`, React components, or route handlers.
- **Application / Service Layer (`src/modules/*/*.service.ts`):**
  - Owns business rules, authorization (resource ownership checks), and transaction boundaries.
  - Never imports Next.js UI primitives or React.
- **Data Access / Repository Layer (`src/modules/*/*.repository.ts`):**
  - Owns raw parameterized SQL queries (`$1, $2, ...`) against `"dev-hub".*` tables.
  - Accepts an optional `QueryClient` (`Pool` or `PoolClient`) so services can compose multi-step transactions cleanly.
  - Do NOT create unnecessary repository interfaces or abstract factories.
- **Platform Layer (`src/platform/**`):**
  - Database pool & transaction helper, cryptography (`Argon2id`, `SHA-256`, random bytes), SSRF-safe HTTP client, Module Federation runtime loader, structured logger.
  - Marked `import 'server-only'` where appropriate (everything except client-side federation runtime).

## 3. Database & SQL Conventions

- **Naming:** `snake_case` in PostgreSQL (`"dev-hub".project_backends`), `camelCase` in TypeScript DTOs/domain types.
- **Primary Keys:** `UUID` (`gen_random_uuid()`).
- **Timestamps:** `TIMESTAMPTZ` everywhere.
- **Soft Deletes:** Use `deleted_at TIMESTAMPTZ` on `users`, `projects`, `project_backends`, `project_frontends`. Always filter `deleted_at IS NULL` in queries and use partial unique indexes (`WHERE deleted_at IS NULL`).
- **SQL Safety:** Always use `$1, $2` parameterized queries. Never interpolate user input into SQL strings.

## 4. Security Rules

- **Session Auth:** Opaque 256-bit random tokens; store only `SHA-256(token)` in `"dev-hub".user_sessions`; set `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` (in production).
- **Passwords:** Hash with `Argon2id` (`@node-rs/argon2`). Never log or return `password_hash`.
- **Ownership:** Every project, backend, frontend, health check, session, and AI account query/mutation MUST scope by `user_id` derived from the verified server session—never trust client-supplied `userId`.
- **SSRF Protection:** Backend health check requests MUST validate protocol (`http:` / `https:` only), resolve DNS and block private/loopback/link-local/metadata IPs unless explicitly allowlisted via `TRUSTED_PRIVATE_NETWORKS`, disable or re-validate redirects, and cap response body size (e.g. 64 KB).
- **AI Accounts:** Never add columns or UI fields for passwords, API keys, tokens, or recovery codes.

## 5. Microfrontend Rules

- Host uses `@module-federation/enhanced/runtime` strictly inside `'use client'` components loaded with `ssr: false`.
- Validate remote `entry_url` against an explicit allowlist of trusted origins (`ALLOWED_REMOTE_ORIGINS` or HTTPS-only validated origins).
- Wrap every remote in an Error Boundary + loading timeout + retry control so a remote crash never crashes the Dev Hub shell.

## 6. Verification & Definition of Done

Before considering any phase or task complete:
1. Run `pnpm typecheck` (`tsc --noEmit`) — zero errors.
2. Run `pnpm lint` — zero errors, no disabled lint rules to hide bugs.
3. Run `pnpm test` — all relevant unit/integration tests pass.
4. Run `pnpm build` — Next.js production build succeeds cleanly.
5. Update affected documentation in `docs/` if behavior or schema changed.
