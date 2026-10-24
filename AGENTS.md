# AGENTS.md — Frontend Codebase Guide

> **Purpose:** Living reference for AI agents and developers working on this codebase.  
> **Scope:** Investigation-only findings — no files were modified.  
> **Generated:** 2026-10-24

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Map](#2-directory-map)
3. [Component Architecture](#3-component-architecture)
4. [Design System](#4-design-system)
5. [Routing & Feature Map](#5-routing--feature-map)
6. [Data Flow](#6-data-flow)
7. [Coding Conventions](#7-coding-conventions)
8. [Technical Debt & Risks](#8-technical-debt--risks)
9. [Development Guidelines](#9-development-guidelines)

---

## 1. Project Overview

### Tech Stack

| Concern | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.6 |
| Language | TypeScript (strict) | ^5 |
| Runtime | React | 19.2.8 |
| Styling | Tailwind CSS v4 (CSS-first, no config file) | ^4 |
| Component Library | shadcn/ui (`base-vega` style) | ^4.21.0 |
| UI Primitives | `@base-ui/react` (headless) | ^1.8.0 |
| Server State | TanStack React Query v5 | ^5.104.1 |
| Client State | React Context (auth only) | — |
| Icons | lucide-react | ^1.48.0 |
| Charts | recharts | ^3.8.0 |
| Theming | next-themes | ^0.4.6 |
| Class utilities | `cn` (npm), `clsx`, `tailwind-merge` | various |
| Package Manager | npm | — |
| Build | Next.js built-in (Turbopack/webpack) | — |

### Architecture Summary

- **Next.js App Router** with React Server Components (RSC) enabled.
- **No `src/` directory.** All code lives at the project root: `app/`, `components/`, `hooks/`, `lib/`.
- **Cookie-based auth** with a Next.js API proxy that forwards requests to a Railway-hosted backend.
- **Client-side RBAC** via `useAuth()` hook + `lib/rbac.ts`. No server-side middleware guard.
- Each page is a large, self-contained client component (`"use client"`) that owns its own data fetching, UI state, and CRUD logic.

---

## 2. Directory Map

```
/home/ray/Projects/next-template/
├── app/                        # Next.js App Router (pages, layouts, API routes)
│   ├── api/
│   │   └── backend/[...path]/
│   │       └── route.ts        # ★ Reverse-proxy to backend API (catch-all)
│   ├── audit-logs/
│   │   └── page.tsx            # Audit log viewer (read-only, 723 lines)
│   ├── components/
│   │   └── auth-screen.tsx     # Login/register form (collocated with /login)
│   ├── dashboard/
│   │   ├── charts.tsx          # Recharts chart components (defined, not yet wired)
│   │   └── page.tsx            # Dashboard page (partially implemented)
│   ├── login/
│   │   └── page.tsx            # Thin wrapper → <AuthScreen mode="login" />
│   ├── roles/
│   │   └── page.tsx            # Role & permission management (929 lines)
│   ├── users/
│   │   └── page.tsx            # User management CRUD (937 lines)
│   ├── globals.css             # ★ Tailwind v4 entry + all CSS custom properties
│   ├── layout.tsx              # Root layout: fonts, providers, sidebar, header
│   ├── not-found.tsx           # Custom 404 page
│   ├── page.tsx                # Root "/" → redirect("/login")
│   └── providers.tsx           # QueryClient + ThemeProvider + AuthProvider + Toaster
│
├── components/                 # Shared layout & feature components
│   ├── access-denied.tsx       # 403 page component
│   ├── app-sidebar.tsx         # Collapsible navigation sidebar (RBAC-gated nav items)
│   ├── brand-logo.tsx          # Logo for auth pages
│   ├── header.tsx              # Top header: breadcrumbs, theme toggler, user menu
│   ├── sidebar-logo.tsx        # Logo + app name in sidebar header
│   ├── utils.ts                # Local cn() — duplicates lib/utils.ts (see §8)
│   └── ui/                     # ★ UI primitive components (shadcn/base-ui wrappers)
│       ├── index.ts            # Barrel re-export of all primitives
│       ├── animated-theme-toggler.tsx
│       ├── button.tsx          # CVA variants (default/outline/ghost/destructive/link…)
│       ├── card.tsx
│       ├── chart.tsx           # Recharts ChartContainer / ChartTooltip wrappers
│       ├── dialog.tsx          # @base-ui/react/dialog wrapper
│       ├── dropdown-menu.tsx
│       ├── input.tsx           # @base-ui/react/input wrapper
│       ├── label.tsx
│       ├── pagination.tsx      # Pagination with getPaginationRange() utility
│       ├── select-menu.tsx     # Dropdown-based <select> abstraction
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx         # Sidebar primitive (22 KB, complex)
│       ├── skeleton.tsx
│       ├── spinner.tsx
│       ├── switch.tsx
│       ├── table.tsx           # Plain HTML table wrappers
│       ├── textarea.tsx
│       ├── toast.tsx           # @base-ui/react/toast; toast.add() singleton
│       └── tooltip.tsx
│
├── hooks/
│   ├── use-auth.tsx            # ★ AuthContext + AuthProvider + useAuth()
│   └── use-mobile.ts           # Viewport width breakpoint hook
│
├── lib/
│   ├── api.ts                  # ★ Fetch wrapper, api.{get,post,put,patch,delete}, types
│   ├── color.ts                # tintStyle() — WCAG 4.5:1 contrast color calculator
│   ├── rbac.ts                 # PERMISSIONS list, canPermission(), getPermissions()
│   ├── toast.ts                # Toast helper (likely wraps components/ui/toast)
│   └── utils.ts                # Re-exports cn from the "cn" npm package
│
├── public/                     # Static assets
├── docs/                       # Documentation (not explored)
├── .env                        # NEXT_PUBLIC_ env vars only
├── components.json             # shadcn/ui configuration
├── next.config.ts
├── tsconfig.json               # strict: true, @/* alias → ./*
├── postcss.config.mjs
└── package.json
```

---

## 3. Component Architecture

### shadcn/ui Configuration (`components.json`)

```json
{
  "style": "base-vega",
  "rsc": true,
  "tsx": true,
  "tailwind": { "css": "app/globals.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

The `base-vega` style means UI primitives are **not** standard Radix-based shadcn components — they wrap **`@base-ui/react`** (a newer headless library by the MUI team). Do not assume Radix UI APIs apply.

### `components/ui/` — UI Primitive Layer

All primitives follow this pattern:
- Import the headless primitive from `@base-ui/react/<component>`
- Apply Tailwind classes via `cn()` (imported from the `cn` npm package)
- Expose variant props via **Class Variance Authority (CVA)**
- Re-export from `components/ui/index.ts` as a barrel

**Button variants** (defined in `components/ui/button.tsx`):

| Variant | Usage |
|---|---|
| `default` | Primary action (uses `--button-primary` blue `#1976D2`) |
| `outline` | Secondary bordered action |
| `ghost` | Low-emphasis, no border |
| `secondary` | Muted background action |
| `destructive` | Danger / delete actions |
| `link` | Inline text link style |
| `csv` | Export/download actions |

**Button sizes:** `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`

### `components/` — Layout / Feature Layer

These are application-level shared components, not primitives:

| Component | Role |
|---|---|
| `AppSidebar` | Main navigation, RBAC-gated items, collapsible |
| `Header` | Breadcrumbs, theme toggle, user menu, logout |
| `BrandLogo` | Auth page logo |
| `SidebarLogo` | Sidebar header logo + app name |
| `AccessDenied` | 403 content shown when `can(permission)` is false |

### `app/components/` — Collocated App Components

| Component | Role |
|---|---|
| `AuthScreen` | Login and (stub) register form — uses native `FormData`, no form library |

### UI Library Dependency Map

```
@base-ui/react         → button, dialog, input, toast (and more)
recharts               → chart.tsx (BarChart, PieChart wrappers)
lucide-react           → all icons throughout the app
class-variance-authority → button variants
next-themes            → ThemeProvider, useTheme
@tanstack/react-query  → useQuery, useMutation, QueryClient
@radix-ui/react-dialog → listed in package.json but NOT used (leftover dep)
```

---

## 4. Design System

### Tailwind CSS v4 Setup

- **No `tailwind.config.*` file.** Tailwind v4 uses CSS-first configuration.
- Config entry: `app/globals.css` (`@import "tailwindcss"`)
- Additional imports: `tw-animate-css` (animations), `shadcn/tailwind.css` (base shadcn styles)
- Dark mode: `@custom-variant dark (&:where(.dark, .dark *))` — driven by `next-themes` class on `<html>`

### CSS Variables (Design Tokens)

All tokens are `oklch()` values defined in `:root` (light) and `.dark`. Mapped to Tailwind via `@theme inline {}`.

**Color Tokens:**

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` (white) | `oklch(0.145 0 0)` (near-black) | Page background |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Body text |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | shadcn primary |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Secondary text |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Borders |
| `--destructive` | `oklch(0.577 0.245 27.325)` (red) | `oklch(0.704 0.191 22.216)` | Danger |
| `--button-primary` | `#1976D2` | `#1976D2` (fixed) | Primary button blue |
| `--button-text` | `#ffffff` | `#ffffff` (fixed) | Button label |
| `--bubble` | `#ffffff` | `#27272a` | Card/bubble surfaces |

**Chart Tokens** (`--chart-1` to `--chart-5`): Grayscale range `oklch(0.87)` → `oklch(0.269)` (same in both themes).

**Border Radius Scale** (base `--radius: 0.625rem`):

| Token | Value |
|---|---|
| `--radius-sm` | `calc(var(--radius) * 0.6)` ≈ 0.375rem |
| `--radius-md` | `calc(var(--radius) * 0.8)` ≈ 0.5rem |
| `--radius-lg` | `var(--radius)` = 0.625rem |
| `--radius-xl` | `calc(var(--radius) * 1.4)` ≈ 0.875rem |
| `--radius-2xl` through `--radius-4xl` | up to 2.6× base |

**Sidebar Tokens:** `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` — scoped to the sidebar component.

### Typography

- **Fonts loaded:** `Geist` (sans) + `Geist_Mono` (monospace) via `next/font/google` in `app/layout.tsx`.
- Assigned to CSS vars: `--font-sans` and `--font-geist-mono`.
- `html` element gets `font-sans` via `@apply font-sans` in `@layer base`.
- ⚠️ `body` in `globals.css` references `var(--font-plus-jakarta-sans)` which is **undefined** — falls back to generic `sans-serif`. The `html` rule wins via the `@layer base` block, so Geist is effectively used, but the body declaration is incorrect.

### Special Utilities

**`.tint` class** — Used for colored chips/badges with data-driven colors:
```css
.tint { color: var(--tint-fg); background-color: var(--tint-bg); }
.dark .tint { color: var(--tint-fg-dark); background-color: var(--tint-bg-dark); }
```
CSS variables are set inline via `lib/color.ts`'s `tintStyle(hex)` function, which computes WCAG 4.5:1 contrast-safe foreground/background pairs for both themes.

**Usage pattern:**
```tsx
import { tintStyle } from "@/lib/color";
<span className="tint rounded-full px-2 py-0.5 text-xs" style={tintStyle("#FF5733")}>
  Label
</span>
```

### Responsive Design

- Uses Tailwind's standard breakpoints (sm, md, lg, xl, 2xl).
- `hooks/use-mobile.ts` — `useIsMobile()` hook for `< 768px` detection.
- Sidebar collapses to icon-only on mobile using the `SidebarProvider` + `Sheet` pattern.

### Animations

- `tw-animate-css` provides animation utilities.
- View Transition API animations are **disabled** (`animation: none` on `::view-transition-*`).

---

## 5. Routing & Feature Map

### Route Table

| Route | File | Auth Guard | Feature |
|---|---|---|---|
| `/` | `app/page.tsx` | — | Redirect → `/login` |
| `/login` | `app/login/page.tsx` | Redirect if authed | Login form |
| `/dashboard` | `app/dashboard/page.tsx` | `dashboard.read` | Stats overview (partially implemented) |
| `/users` | `app/users/page.tsx` | `user.read` | User management CRUD |
| `/roles` | `app/roles/page.tsx` | `role.read` | Role & permission management |
| `/audit-logs` | `app/audit-logs/page.tsx` | `audit_log.read` | Read-only audit log viewer |
| `/api/backend/[...path]` | `app/api/backend/[...path]/route.ts` | — | Next.js reverse proxy |
| `*` | `app/not-found.tsx` | — | Custom 404 |

> **Note:** No `/register` route exists. The `register` mode in `AuthScreen` is stub code.

### Auth Flow

```
App loads
  └─ AuthProvider mounts → GET /api/backend/auth/get-me
       ├─ 200 OK → store AuthUser {id, email, role, permissions[]}
       │     └─ user navigates normally
       └─ 401 → user = null → all pages show loading/redirect to /login

Login page:
  └─ POST /api/backend/auth/login → sets session cookie
       └─ refreshAuth() → GET /api/backend/auth/get-me → router.replace("/dashboard")

Per-page guard pattern:
  if (authLoading) return null;
  if (!can("permission.name")) return <AccessDenied />;
  // render page

Global 401 in api.ts:
  window.location.assign("/login")  // hard redirect on expired session
```

### Page Feature Details

#### `/users` (User Management)
- Full CRUD: create, view details, edit, delete, toggle active/inactive status.
- Filters: search (email), role filter, status filter.
- Sort: ASC/DESC by email.
- Pagination: 10 items/page.
- Optimistic update on status toggle via `queryClient.setQueryData`.
- Permission gates: `user.create`, `user.update`, `user.delete` (checked per action).

#### `/roles` (Role & Permission Management)
- Full CRUD for roles.
- Permission assignment modal (`role.permission.assign`).
- ADMIN role is protected — cannot be edited or deleted.
- Permissions displayed grouped by `resource`.

#### `/audit-logs` (Audit Log Viewer)
- Read-only table + detail dialog.
- Filters: search, action (CREATE/UPDATE/DELETE), entity, user ID, date range, sort field, direction.
- Export to CSV (`audit_log.export` permission).
- Pagination: 5 items/page.

#### `/dashboard` (Partially Implemented)
- Fetches `getDashboard()` data — types fully defined in `lib/api.ts`.
- `dashboard/charts.tsx` exports 5 chart components — **not yet rendered** in the page JSX.
- Currently only shows a "Welcome Back" heading. All chart/stat card wiring is pending.

### Sidebar Navigation

Three sections, all RBAC-gated:

| Section | Item | Permission |
|---|---|---|
| Overview | Dashboard | `dashboard.read` |
| Management | Users | `user.read` |
| Management | Roles | `role.read` |
| System | Audit Logs | `audit_log.read` |

---

## 6. Data Flow

### API Architecture

```
Browser
  └─ lib/api.ts (fetch wrapper, credentials: "include")
       └─ /api/backend/* (Next.js catch-all API route)
            └─ app/api/backend/[...path]/route.ts (proxy)
                 └─ NEXT_PUBLIC_API_URL (Railway backend)
                      https://ems-be-production-a18c.up.railway.app/api/v1
```

The proxy:
- Forwards `GET/POST/PUT/PATCH/DELETE` methods.
- Passes `cookie`, `authorization`, `content-type`, `accept`, `origin` headers.
- **Rewrites `Set-Cookie`** headers: strips `Domain`, `SameSite`, `Path`; re-adds `Path=/; SameSite=Lax`.

### `lib/api.ts` — API Client

```typescript
// Typed HTTP helpers
api.get<T>(path)
api.post<T>(path, body)
api.put<T>(path, body)
api.patch<T>(path, body)
api.delete<T>(path)

// Custom error class
class ApiError extends Error { status: number; details: unknown }

// Standard response envelope
type ApiResponse<T> = { success: boolean; message: string; metadata: Record<string, unknown>; data: T }

// Pagination helper
getPaginationTotal(metadata, fallback) → number  // reads metadata.total_row
```

On `401` response: `window.location.assign("/login")` (client-side only).

### State Management

| Concern | Solution |
|---|---|
| Server state (API data) | TanStack React Query v5 (`useQuery`, `useMutation`) |
| Auth state | React Context (`AuthContext` via `hooks/use-auth.tsx`) |
| UI state (dialogs, filters, selections) | `useState` in each page component |
| No global client state | No Redux, Zustand, Jotai, or MobX |

**QueryClient config:**
```typescript
{ staleTime: 30_000, refetchOnWindowFocus: false }
```

### `useAuth()` Hook

```typescript
const { user, permissions, loading, can, refresh, logout } = useAuth();

// can() checks user.permissions[] against the PERMISSIONS list
// Falls back to lib/rbac.ts rolePermissions if permissions[] is empty
can("user.create") // → boolean
```

### Error Handling

- API errors throw `ApiError` with `status` and `details`.
- Pages use React Query's `isError` / `error` from `useQuery`.
- Toast notifications via `toast.add({ type: "success"|"error", message })` (singleton from `lib/toast.ts`).
- 401 → hard redirect to `/login`.
- No React Error Boundaries found in the codebase.

---

## 7. Coding Conventions

### File Naming

| Type | Convention | Example |
|---|---|---|
| Component files | `kebab-case.tsx` | `app-sidebar.tsx`, `auth-screen.tsx` |
| Hook files | `use-kebab-case.tsx/.ts` | `use-auth.tsx`, `use-mobile.ts` |
| Utility/lib files | `camelCase.ts` | `api.ts`, `utils.ts`, `rbac.ts` |
| Page files | `page.tsx` | Next.js App Router convention |
| Layout files | `layout.tsx` | Next.js App Router convention |

### Component Exports

| Context | Pattern | Example |
|---|---|---|
| Shared components | Named export (function declaration) | `export function AppSidebar() {}` |
| UI primitives | Named export (function declaration) | `export function Button() {}` |
| Next.js pages | Default export | `export default function DashboardPage() {}` |
| Next.js layouts | Default export | `export default function RootLayout() {}` |

### TypeScript Conventions

- `strict: true` — all strict checks enabled.
- Generic typed API calls: `api.get<ApiResponse<User[]>>("/users")`.
- `satisfies` operator used for narrowing constant objects.
- Domain types (User, Role, AuditLog) are defined **inline** at the top of each page file — no shared `types/` directory exists.
- Import alias: `@/*` maps to the project root (`./*`).

### Import Path Conventions

```typescript
// UI primitives
import { Button, Input, Dialog } from "@/components/ui";

// Shared components
import { AppSidebar } from "@/components/app-sidebar";

// Hooks
import { useAuth } from "@/hooks/use-auth";

// API & utilities
import { api, type ApiResponse } from "@/lib/api";
import { canPermission } from "@/lib/rbac";
import { tintStyle } from "@/lib/color";

// cn() — use ONE source (see §8 for the current inconsistency)
// Correct source per components.json: @/lib/utils
import { cn } from "@/lib/utils";
```

### `cn()` — Authoritative Source

Per `components.json` (`"utils": "@/lib/utils"`), the canonical `cn()` is:
```typescript
// lib/utils.ts
export { cn } from "cn";
```

### Form Handling

- **No form library.** Native HTML forms with `onSubmit={handleSubmit}` and `FormData`.
- Field validation: HTML5 attributes (`required`, `minLength`, `type="email"`) + manual checks.
- No schema validation (no Zod, Yup, or Valibot).

### Async / Error Handling Pattern

```typescript
// In mutations (without React Query useMutation):
const [loading, setLoading] = useState(false);
async function handleSubmit() {
  setLoading(true);
  try {
    await api.post("/resource", payload);
    toast.add({ type: "success", message: "Done!" });
    queryClient.invalidateQueries({ queryKey: ["resource"] });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Something went wrong";
    toast.add({ type: "error", message });
  } finally {
    setLoading(false);
  }
}
```

### RBAC Pattern

```typescript
// At the top of every protected page:
const { user, loading: authLoading, can } = useAuth();
if (authLoading) return null;                          // Wait for auth
if (!can("resource.action")) return <AccessDenied />; // Permission gate
```

---

## 8. Technical Debt & Risks

### 🔴 Critical

_(None found — no data-loss or immediate security vulnerabilities in the frontend layer itself.)_

### 🟠 High

#### H1 — No Server-Side Auth Guard (`middleware.ts` missing)
**File:** Not present (should be `/home/ray/Projects/next-template/middleware.ts`)

Authentication is enforced **client-side only**. There is no `middleware.ts` to protect routes at the edge/server. An unauthenticated user:
- Can request SSR-rendered HTML of protected pages before the client redirect fires.
- Will see a flash of content (or blank) during `authLoading`.

**Risk:** Information exposure, brief flash of protected UI, poor UX on direct navigation.

#### H2 — Triple `cn()` Implementation
**Files:** `lib/utils.ts`, `components/utils.ts`, direct `"cn"` package imports in UI primitives

Three separate sources for the same class-merging utility:

| Source | Used by |
|---|---|
| `import { cn } from "cn"` (npm pkg) | `button.tsx`, `dialog.tsx`, `input.tsx`, `table.tsx`, `pagination.tsx`, etc. |
| `import { cn } from "@/components/utils"` | `sidebar-logo.tsx`, `brand-logo.tsx` |
| `import { cn } from "@/lib/utils"` | `app-sidebar.tsx`, `layout.tsx` |

`components/utils.ts` is a duplicate implementation using `clsx` + `tailwind-merge` directly. This creates unnecessary surface area.

### 🟡 Medium

#### M1 — Monolithic Page Files
**Files:** `app/users/page.tsx` (937 lines), `app/roles/page.tsx` (929 lines), `app/audit-logs/page.tsx` (723 lines)

All CRUD logic, types, helper functions, and sub-components (e.g., `StatusBadge`) are defined inline. Difficult to test, reuse, or maintain as the app grows.

#### M2 — Undefined Font CSS Variable
**File:** `app/globals.css` (line ~133)

```css
body { font-family: var(--font-plus-jakarta-sans), sans-serif; }
```

`--font-plus-jakarta-sans` is never defined. Geist is loaded and assigned to `--font-sans`, and the `@layer base { html { @apply font-sans; } }` rule applies it to `<html>`. The `body` declaration is functionally overridden, but it is incorrect and misleading.

#### M3 — Dashboard Page — Dead Imports & Unimplemented UI
**File:** `app/dashboard/page.tsx`

Imports `dynamic`, multiple icon components, and `ChartFallback` — none of which are used in the returned JSX. The page only renders a "Welcome Back" heading. `dashboard/charts.tsx` is fully implemented but not wired up.

#### M4 — Dead "Register" Mode
**File:** `app/components/auth-screen.tsx`

`AuthScreen` accepts `mode="register"` but no `/register` route exists. The register UI just shows a placeholder message. If a user somehow reaches this state, they see a dead-end stub.

#### M5 — No Shared `types/` Directory
All domain types (`User`, `Role`, `AuditLog`) are declared inline per page. Any type used across multiple files must be re-declared or duplicated.

### 🟢 Low

#### L1 — Unused Dependency: `@radix-ui/react-dialog`
**File:** `package.json`

`@radix-ui/react-dialog` is listed as a dependency but the dialog implementation uses `@base-ui/react/dialog`. This is likely a leftover from initial scaffolding.

#### L2 — Non-existent Route in Header Logic
**File:** `components/header.tsx` (line ~31)

```typescript
pathname === "/api-documentation"
```

No `app/api-documentation/` page exists. The header's `showSidebar` check will match this path incorrectly if the route is ever created differently.

#### L3 — Typo in Auth UI
**File:** `app/components/auth-screen.tsx` (line ~246)

```
"Forgot Passwrord?"
```

Double 'r' in "Password".

#### L4 — No React Error Boundaries
The app has no `ErrorBoundary` components. An unhandled render error in any component will crash the entire page.

---

## 9. Development Guidelines

These rules maintain consistency with the established architecture.

### Component Rules

1. **Use `components/ui/` primitives** for all base UI — `Button`, `Input`, `Dialog`, `Table`, `Pagination`, `Card`, `Skeleton`, `Spinner`, `Toast`, etc. Do not create parallel implementations.
2. **Do not use Radix UI APIs** — this project uses `@base-ui/react`, which has different prop/event names. Always verify the actual primitive source before assuming API shape.
3. **Place shared layout/feature components** in `components/`. Place page-specific logic inside `app/<route>/`.
4. **Prefer named exports** for all shared components. Use default exports only for `page.tsx` and `layout.tsx` files.
5. **Collocate** page-specific sub-components in the same directory as the page (`app/<route>/`) — do not put page-only components into `components/`.

### Styling Rules

6. **Use Tailwind CSS classes exclusively.** No inline styles except for dynamic, data-driven values (e.g., `style={tintStyle(color)}`).
7. **Always use `cn()` from `@/lib/utils`** — this is the canonical source per `components.json`. Do not import from `@/components/utils` or directly from `"cn"`.
8. **Reference design tokens** via Tailwind semantic classes (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`) — not raw color values.
9. **Match the existing button variant** to the action context. Use `default` for primary CTA, `outline` for secondary, `destructive` for irreversible deletions, `ghost` for icon-only actions.
10. **Use `tintStyle()` from `lib/color.ts`** with the `.tint` CSS class for any color-coded chip/badge derived from API data.

### Data Fetching Rules

11. **Use TanStack React Query** (`useQuery`, `useMutation`) for all server state — not `useEffect` + `useState` fetch patterns.
12. **Invalidate queries** after mutations: `queryClient.invalidateQueries({ queryKey: ["resource"] })`.
13. **Use `getPaginationTotal()`** from `lib/api.ts` to extract `total_row` from API metadata.
14. **Use `api.*` helpers** from `@/lib/api` — never call `fetch()` directly.
15. **Wrap all API calls in try/catch**, check for `ApiError`, and show `toast.add({ type: "error", message })` on failure.

### Auth & RBAC Rules

16. **Every protected page must start with:**
    ```typescript
    const { loading: authLoading, can } = useAuth();
    if (authLoading) return null;
    if (!can("resource.action")) return <AccessDenied />;
    ```
17. **Permission-gate action buttons** in addition to page-level guards:
    ```tsx
    {can("user.create") && <Button onClick={openCreateDialog}>Create User</Button>}
    ```
18. **Do not hardcode role names** in component logic. Use `can(permission)` from `useAuth()` exclusively.

### TypeScript Rules

19. **Define domain types at the top of the consuming file** (current convention) until a `types/` directory is established.
20. **Type all `api.*` calls** with the response shape: `api.get<ApiResponse<User[]>>("/users")`.
21. **Do not use `any`.** Prefer `unknown` + type narrowing.

### Quality Rules

22. **Handle all four states** for async data: loading (use `<Skeleton />`), error (show toast + fallback), empty (show empty state message), and success.
23. **Show `<Spinner />`** inside buttons during async operations (`disabled={loading}` on the button).
24. **Do not add new npm dependencies** for functionality already available in the stack (shadcn, base-ui, lucide, recharts, TanStack Query).
25. **Fix `--font-plus-jakarta-sans` reference** in `globals.css` — change it to `var(--font-sans)` before it causes cross-browser fallback issues.

### Future Architecture Recommendations

26. **Add `middleware.ts`** with cookie-based session validation to enforce auth at the server/edge level and eliminate client-side flash.
27. **Extract types to `types/index.ts`** or co-located `types.ts` files once types are shared across more than one file.
28. **Break up monolithic pages** into sub-components as features grow — e.g., `app/users/components/user-table.tsx`, `app/users/components/create-user-dialog.tsx`.
29. **Adopt `useMutation`** from React Query for all CRUD mutations to standardize loading/error state management.
30. **Wire up dashboard charts** — `dashboard/charts.tsx` is ready; the page just needs the data passed into the chart components.
