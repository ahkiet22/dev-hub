# Authentication & Authorization Design — Dev Hub

## 1. Authentication Model

Dev Hub uses **Session-based Authentication with Opaque Tokens**.
- **Explicitly Excluded:** JWT, Access/Refresh Tokens, OAuth/SSO, and Public Registration.
- **Bootstrap:** The initial user is created via an idempotent CLI/seed script (`scripts/create-admin.ts` or `scripts/seed.ts` reading from env/CLI prompt, never hardcoded credentials).

## 2. Cryptography & Session Configuration

| Parameter | Value / Implementation |
|---|---|
| Password Hashing | `Argon2id` via `@node-rs/argon2` (Vercel Serverless compatible N-API binary) |
| Session Token | `32` cryptographically random bytes (`crypto.randomBytes(32).toString('base64url')`, 256-bit entropy) |
| Token Storage | `SHA-256` hex digest (`64` chars) stored in `"dev-hub".user_sessions.token_hash` |
| Cookie Name | `devhub_session` |
| Cookie Flags | `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` (enabled when `NODE_ENV === 'production'`) |
| Session Lifetime | `7 days` fixed expiration (`expires_at = created_at + 7 days`) |

## 3. Login & Request Verification Flow

### Login Flow
1. User submits `identifier` (email or username) + `password`.
2. **Rate Limit Check:** Enforce IP + identifier sliding-window rate limit (e.g., max 10 attempts / 15 min) before password verification.
3. Lookup user in `"dev-hub".users` where `deleted_at IS NULL`.
4. Verify `user.is_active === true` and verify `password` against `password_hash` with Argon2id.
   - Always return a generic error (`"Invalid credentials"`) on failure to prevent account enumeration.
5. Generate 32-byte opaque token → compute `SHA-256(token)` → insert row into `"dev-hub".user_sessions` with `ip_address`, `user_agent`, `expires_at` → update `users.last_login_at`.
6. Set `devhub_session` `HttpOnly` cookie with the raw opaque token.

### Request Verification Flow
1. Read `devhub_session` cookie.
2. Compute `SHA-256(cookieValue)`.
3. Query `"dev-hub".user_sessions` joined with `"dev-hub".users`:
   - `token_hash = $1`
   - `revoked_at IS NULL`
   - `expires_at > now()`
   - `users.is_active = true AND users.deleted_at IS NULL`
4. Update `last_used_at` (throttled, e.g., if older than 5 minutes, to avoid unnecessary DB writes on every RSC render).

### Session Revocation Rules
- **Logout:** Set `revoked_at = now()` on the current session.
- **Revoke Individual Session:** Set `revoked_at = now()` where `id = $sessionId AND user_id = $currentUserId`.
- **Logout All / Password Change / Disable Account:** Set `revoked_at = now()` for all active sessions of `user_id` inside the same database transaction.

## 4. CSRF & Origin Protection

- `SameSite=Lax` protects standard cross-site POST forms.
- Next.js Server Actions include built-in `Origin` / `Host` verification.
- All state-changing Route Handlers (`POST`, `PATCH`, `PUT`, `DELETE`) additionally verify that `Origin` (or `Referer` fallback) matches the expected application host.

## 5. Authorization (Resource Ownership)

Dev Hub enforces **Resource Ownership Authorization** (no RBAC/ABAC):
- Every query/mutation for `projects`, `project_backends`, `project_frontends`, `backend_health_checks`, `user_sessions`, and `ai_accounts` filters by `user_id = currentUser.id` (directly or via `JOIN "dev-hub".projects p ON p.id = ... WHERE p.user_id = $userId AND p.deleted_at IS NULL`).
- Client-supplied `user_id` is **never** accepted.
- Shared catalogs (`deployment_platforms`, `ai_providers`) are readable and manageable by authenticated users in single-user mode.
