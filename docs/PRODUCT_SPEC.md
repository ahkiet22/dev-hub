# Product Specification — Dev Hub

**Tagline:** All your projects. One developer workspace.  
**Category:** Personal Developer Hub  

## 1. Product Vision & Scope

Dev Hub is a centralized personal control plane for a software developer to catalog projects, monitor backend service health, launch or embed frontend applications, track deployment platforms, and organize AI provider accounts.

Dev Hub **does not replace** the registered systems. Each project maintains its own source code, database, authentication, business logic, and independent deployment.

## 2. Confirmed Requirements vs. Assumptions

### Confirmed Requirements
- **Single-user / Private Access:** No public registration; initial user created via secure seed/CLI script.
- **No ORM:** Raw parameterized SQL with PostgreSQL (`pg`).
- **PostgreSQL Schema:** All tables reside in schema `"dev-hub"`.
- **Deployment Target:** Vercel (Next.js App Router).
- **Session Authentication:** Opaque 256-bit tokens hashed with SHA-256 in DB, stored in `HttpOnly` cookies, passwords hashed with `Argon2id`.
- **9 Core Domain Entities:** Users, User Sessions, Projects, Deployment Platforms, Project Backends, Backend Health Checks, Project Frontends, AI Providers, AI Accounts.

### Assumptions
- An external managed PostgreSQL database (e.g., Neon, Supabase, or Railway Postgres) is provisioned for Vercel production deployments.
- Initial catalog mutations (`deployment_platforms`, `ai_providers`) are restricted to authenticated users in single-user mode (no separate admin role table needed).

## 3. Functional Requirements

| Module | Core Capabilities |
|---|---|
| **Auth** | Login (email/username + password), Logout, Logout all sessions, List/Revoke active sessions, Change password, Update profile, Disable account. |
| **Projects** | Create, Update, View detail, List, Search, Archive (`ARCHIVED`), Soft delete, Manage icon, Aggregated Backend/Frontend counts & Backend health summary. Statuses: `ACTIVE`, `INACTIVE`, `ARCHIVED`. |
| **Backends** | Register/Update/Delete/Toggle active, Configure `health_url`, `check_interval_seconds`, `timeout_ms`, Deployment platform, Repo & Console URLs, Manual health check, View latest status, history, response time, and dependency checks. |
| **Health Monitoring** | Periodic GET `/health` checks, Zod contract validation (`healthy` / `degraded` / `unhealthy` vs HTTP `200`/`503`), classification (`UNKNOWN`, `HEALTHY`, `DEGRADED`, `UNHEALTHY`, `UNREACHABLE`, `INVALID_RESPONSE`), 30-day retention cleanup. |
| **Frontends** | Register/Update/Delete/Toggle active, Integration types: `MODULE_FEDERATION` (primary), `IFRAME`, `EXTERNAL` (fallbacks), Sidebar quick access, Embedded view at `/apps/[projectId]/[slug]`. |
| **Deployment Platforms** | Shared catalog CRUD + enable/disable. Seeded with AWS, GCP, Azure, Render, Vercel, Railway, Netlify, Cloudflare, DigitalOcean, Fly.io, On-premises, VPS, Local Machine, Other. |
| **AI Providers** | Shared catalog CRUD + search + enable/disable. Seeded with OpenAI/ChatGPT, Anthropic/Claude, Google/Gemini, DeepSeek, Perplexity, xAI/Grok, Microsoft/Copilot. |
| **AI Accounts** | Register/Update/Delete/Toggle active email accounts per provider, Search by email, Filter/Group by provider, Copy email, Open provider website, Notes. |
| **Dashboard** | Real-time DB metrics: total/active projects, backend health breakdown, frontend count, AI provider/account counts, recently checked backends, recently updated projects, quick-access apps, response time summary, platform distribution. |

## 4. Non-Functional Requirements

- **Security:** Session cookie hardening (`HttpOnly`, `SameSite=Lax`, `Secure` in prod), login rate limiting, Origin/CSRF validation, strict resource ownership checks, SSRF protection for health checks, trusted-origin allowlist for microfrontends, zero secrets in logs or AI accounts.
- **Performance:** Server Components for data-heavy reads, lazy-loaded microfrontends, pagination on health history, bounded concurrency on health checks, no N+1 queries.
- **Reliability:** Remote app Error Boundary + timeout isolation, independent per-backend error handling in health worker, transactional state updates.

## 5. Out of Scope (Strictly Excluded)

- Environment Management, Deployment/CI-CD execution, Infrastructure/Kubernetes/Docker management.
- API Gateway, API Testing, API Collection Management, Database Management Tools, Git Server.
- Task Management, Kanban, Milestone/Sprint Management.
- Multi-tenant Workspaces, RBAC, ABAC, Public Registration, OAuth/SSO, JWT Auth.
- AI Chatbot, AI Model Management, AI Agents, RAG, Prompt Management, Vector DBs.
- Secrets Management, Password Manager (no passwords/API keys/tokens in AI Accounts).
- Microservices Backend, Redis, RabbitMQ, Elasticsearch.

## 6. Acceptance Criteria

1. Authenticated user can log in, view/revoke sessions, change password, and update profile.
2. User can CRUD projects, backends, frontends, and AI accounts with strict server-side ownership enforcement.
3. Health checks validate the `/health` contract, classify failures accurately, record history, and enforce SSRF protections.
4. Compatible Vite/React remotes load dynamically at `/apps/[projectId]/[slug]` inside the Dev Hub shell; failures are isolated by Error Boundaries; `IFRAME` and `EXTERNAL` fallbacks work.
5. Dashboard displays 100% real aggregated data from PostgreSQL schema `"dev-hub"`.
6. Typecheck, lint, unit/integration/E2E tests, and Vercel production build pass.
