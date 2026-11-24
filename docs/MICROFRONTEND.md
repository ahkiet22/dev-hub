# Dynamic Microfrontend Integration — Dev Hub

## 1. Architecture Overview

Dev Hub acts as a **Next.js App Router Host** that dynamically loads independently deployed **Remote Applications** (primarily Vite + React via `@module-federation/vite`) at runtime without rebuilding or redeploying the Host.

- **Host Route:** `/apps/[projectId]/[slug]`
- **Integration Modes:**
  1. `MODULE_FEDERATION` (Primary): Runtime-registered via `@module-federation/enhanced/runtime`.
  2. `IFRAME` (Fallback): Sandboxed `<iframe>` with explicit origin validation.
  3. `EXTERNAL` (Fallback): Opens standalone `application_url` in a new tab (`rel="noopener noreferrer"`).

## 2. Host Runtime Design (`@module-federation/enhanced/runtime`)

Because Next.js App Router uses React Server Components by default, Module Federation runtime APIs (`init`, `registerRemotes`, `loadRemote`) **must** be isolated to a Client Component loaded with `next/dynamic(..., { ssr: false })`:

1. Server Component `/apps/[projectId]/[slug]/page.tsx` fetches the `project_frontends` record (enforcing project ownership via `user_id`), verifies `is_active = true`, and passes non-sensitive metadata (`name`, `integrationType`, `entryUrl`, `remoteName`, `exposedModule`, `applicationUrl`) to the Client Shell.
2. Client Shell (`RemoteAppShell.tsx`):
   - Validates `entryUrl` against trusted origin rules before invoking the runtime.
   - Calls `registerRemotes([{ name: remoteName, entry: entryUrl }])` and `loadRemote(`${remoteName}/${exposedModule}`)`.
   - Applies a configurable loading timeout (e.g., `10000ms`) using `Promise.race`.
   - Wraps the mounted remote in a React `ErrorBoundary` with a **Retry** button and fallback to **Open Standalone**.
   - Preserves Dev Hub Sidebar & Header (with optional Fullscreen toggle).

## 3. Remote Application Contract (`@module-federation/vite`)

Compatible remotes must:
- Expose `./App` (or configured `exposed_module`) as a default-exported React component accepting optional `{ basePath?: string }` props.
- Generate `mf-manifest.json` (or `remoteEntry.js`) with CORS headers allowing the Dev Hub Vercel origin (`Access-Control-Allow-Origin`).
- Share `react` and `react-dom` as singletons (`singleton: true`).
- Scope their CSS (e.g., Tailwind prefix or CSS Modules / Shadow/root class scoping) to avoid colliding with Dev Hub's host styles.

## 4. Compatibility Risks & Phase 0/4 PoC Plan

### Identified Risks
1. **React Version Mismatch (High Risk):** Next.js 15/16 uses React 19, while many Vite remotes use React 18 or 19. Pure runtime `loadRemote` can hit invalid hook call errors if two React copies load or if `react` major versions differ.
2. **Shared Scope in Next.js App Router:** Next.js bundles React internally for RSC/Client; `@module-federation/enhanced/runtime` must explicitly share the Host's `react` and `react-dom` instances via `init({ name: 'devhub_host', remotes: [], shared: { react: { lib: () => React, shareConfig: { singleton: true } }, 'react-dom': { lib: () => ReactDOM, shareConfig: { singleton: true } } } })`.
3. **Client Routing Isolation:** Remotes using React Router must either use `MemoryRouter` or accept `basename={`/apps/${projectId}/${slug}`}` so navigating inside the remote does not break Next.js App Router.
4. **CSS Collisions:** Unscoped Tailwind base/preflight styles from a Vite remote can override Host styles.

### Mandatory Proof of Concept (PoC) Plan
Before building Phase 4 UI, execute a minimal PoC:
1. Create a minimal Vite + React + `@module-federation/vite` remote exposing `./App` (`mf-manifest.json`).
2. Load it inside a Next.js App Router `'use client'` page via `@module-federation/enhanced/runtime` (`ssr: false`).
3. Verify both `next dev` and `next build` + `next start` (Vercel-equivalent production build).
4. Verify React hooks (`useState`, `useEffect`), CSS scoping, unmount cleanup when navigating away, and Error Boundary recovery when the remote is offline.
5. **Fallback Trigger:** If `@module-federation/enhanced/runtime` exhibits an unresolvable bundler/React-19 incompatibility in Next.js production builds, document the exact blocker and promote `IFRAME` (with postMessage resize/title sync) as the primary fallback until resolved.

## 5. Security Controls

- **Module Federation is NOT a sandbox:** Remote JS executes in the Host's origin context and can make same-origin requests.
- **Strict Origin Allowlist:** Only load `entry_url` over `https:` (or `http://localhost` in dev) from origins explicitly allowlisted in `ALLOWED_REMOTE_ORIGINS` (or user-confirmed trusted origins).
- **No Token Forwarding:** Never pass `devhub_session` or internal auth tokens to remotes.
- **Iframe Hardening:** Render `IFRAME` mode with `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` and `referrerPolicy="no-referrer"`.
