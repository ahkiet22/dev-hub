# DESIGN.md — UI/UX & Design System Specification

## 1. Design Philosophy

Dev Hub follows a **modern, minimal, high-signal Developer Console** aesthetic inspired by Linear, Vercel Dashboard, GitHub, and Raycast.

- **Clarity over decoration:** Avoid excessive gradients, heavy drop shadows, or ornamental illustrations.
- **Compact information density:** Surface key operational metrics (status, latency, URLs, platform badges) without clutter.
- **Keyboard-friendly & accessible:** Full keyboard navigation, visible focus rings, semantic HTML, ARIA attributes via shadcn/ui (Radix primitives).
- **Theme parity:** First-class **Dark Mode** (default for developer ergonomics) and **Light Mode** via CSS variables and `next-themes`.

## 2. Color System (Semantic Tokens)

Implemented with Tailwind CSS + shadcn/ui CSS variables (`hsl(...)` / `oklch(...)` tokens):

| Token | Role | Light Mode Intent | Dark Mode Intent |
|---|---|---|---|
| `--background` | App canvas | `#FAFAFA` | `#09090B` |
| `--surface` / `--card` | Cards, panels, tables | `#FFFFFF` | `#111114` |
| `--border` | Hairline 1px dividers | `#E4E4E7` | `#27272A` |
| `--foreground` | Primary text | `#09090B` | `#FAFAFA` |
| `--muted-foreground` | Secondary labels, timestamps | `#71717A` | `#A1A1AA` |
| `--primary` | Primary actions, active nav | `#18181B` | `#FAFAFA` |
| `--accent` | Hover surfaces | `#F4F4F5` | `#18181B` |

### Status Indicator Palette

Consistent across badges, health dots, and charts:

| Status | Color | Visual Indicator |
|---|---|---|
| `HEALTHY` / `ACTIVE` | Emerald (`#10B981`) | Solid dot + subtle emerald tint badge |
| `DEGRADED` | Amber (`#F59E0B`) | Solid dot + amber tint badge |
| `UNHEALTHY` / `UNREACHABLE` | Rose/Red (`#EF4444`) | Solid dot + red tint badge |
| `INVALID_RESPONSE` | Orange (`#F97316`) | Alert icon + orange badge |
| `UNKNOWN` / `INACTIVE` | Zinc (`#71717A`) | Neutral muted dot |
| `ARCHIVED` | Slate (`#64748B`) | Dashed/muted outline badge |

## 3. Typography & Spacing

- **UI Font:** `Inter` or `Geist Sans` (`--font-sans`), crisp tabular numerals (`tabular-nums`) for response times, counts, and timestamps.
- **Monospace Font:** `JetBrains Mono` or `Geist Mono` (`--font-mono`) for project codes, slugs, URLs, emails, health JSON payloads, and version strings.
- **Spacing Scale:** 4px base grid (`4, 8, 12, 16, 24, 32px`). Standard card padding `16px–20px`, section gaps `24px`, compact table row height `44px`.

## 4. Application Shell & Navigation

```text
┌──────────────────────────────────────────────────────────────────┐
│ [Sidebar Toggle] Breadcrumb: Projects / Concert App / Backends   │  [Theme] [User]
├────────────────┬─────────────────────────────────────────────────┤
│ Dev Hub        │                                                 │
│                │                                                 │
│ • Overview     │   Main Content Area                             │
│ • Projects     │   (Responsive container, max-w-7xl or full      │
│ • Backends     │    width when viewing embedded Microfrontend)   │
│ • Applications │                                                 │
│ • AI           │                                                 │
│   - Providers  │                                                 │
│   - Accounts   │                                                 │
│ • Settings     │                                                 │
│   - Profile    │                                                 │
│   - Sessions   │                                                 │
│   - Platforms  │                                                 │
└────────────────┴─────────────────────────────────────────────────┘
```

- **Collapsible Sidebar (`240px` expanded / `64px` collapsed):** Mobile drawer on `< 768px`. Includes a quick-access list of active Frontend Applications (`/apps/[projectId]/[slug]`).
- **Top Header (`56px`):** Sidebar collapse trigger, dynamic Breadcrumb, Theme Switcher (Light/Dark/System), and User Profile dropdown (Profile, Sessions, Logout).

## 5. Key Page Patterns

1. **Overview (`/overview`):**
   - 4–5 KPI summary cards (Projects, Backends Health breakdown, Frontends, AI Accounts) using real DB aggregates.
   - Quick Access Applications grid.
   - Recently Checked Backends table + Backend Response Time summary chart (Recharts) + Deployment Platform distribution.
2. **Project Detail (`/projects/[id]`):**
   - Header with project icon, code (`font-mono`), status badge, Edit/Archive/Delete actions.
   - Sub-navigation tabs: `Overview`, `Backends`, `Frontends`, `Settings`.
3. **Backend Detail (`/backends/[id]`):**
   - Metadata card (Repo URL, Base URL, Health URL, Platform badge, Interval/Timeout).
   - "Run Health Check Now" primary button + Enable/Disable monitoring toggle.
   - Recharts Area/Line chart of response times (`response_time_ms`).
   - Dependency checks breakdown (`database`, `redis`, etc. from latest JSON) + paginated `backend_health_checks` history table.
4. **Embedded Frontend View (`/apps/[projectId]/[slug]`):**
   - Preserves Dev Hub Sidebar & Header (with a Fullscreen toggle that hides chrome if desired).
   - Toolbar: App name, integration type badge (`MF` / `IFRAME`), Retry button, Fullscreen toggle, Open Standalone (`↗`) button.
   - Isolated container with Skeleton loader and Error Boundary fallback.
5. **AI Accounts (`/ai/accounts`):**
   - Search by email, filter by provider, toggle grouped-by-provider view.
   - Each row/card shows provider logo, provider name, `font-mono` email, one-click Copy Email button (with toast feedback), Open Provider Website link, and notes.

## 6. Standard UI States

Every data-driven view MUST implement:
- **Loading State:** Structural Skeleton matching the layout (cards, table rows) — no jarring spinners.
- **Empty State:** Clear icon, concise explanation, and primary CTA (e.g., "Register your first backend").
- **Error State:** Non-destructive inline alert with retry action.
- **Destructive Actions:** Confirmation AlertDialog before deleting projects, backends, frontends, AI accounts, or revoking sessions.
- **Feedback:** Non-blocking Toast notifications for mutations (created, updated, copied email, health check completed).
