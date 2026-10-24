# Next.js Modern Starter Boilerplate

A production-ready, batteries-included Next.js boilerplate built with Next.js 16 (App Router), React 19, Tailwind CSS v4, Base UI (shadcn), TanStack React Query v5, and TypeScript.

Designed for rapid SaaS, internal tools, and administrative dashboard development with zero-config standalone prototyping and seamless backend connectivity.

---

## ⚡ Tech Stack

| Layer | Technology | Version | Description |
|---|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router + Turbopack) | `16.3.6` | Modern React framework with SSR and streaming |
| **UI Library** | [React](https://react.dev/) | `19.2.8` | Latest React concurrent runtime |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^5` | Strict type-safety across all components and queries |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | `^4` | CSS-first configuration (`globals.css`) with OKLCH tokens |
| **Primitives** | [@base-ui/react](https://base-ui.com/) | `^1.8.0` | Accessible, headless UI primitives by the MUI team |
| **Server State** | [TanStack React Query](https://tanstack.com/query) | `^5.104.1` | Asynchronous data fetching, caching, and mutation state |
| **Icons** | [Lucide React](https://lucide.dev/) | `^1.48.0` | Clean, customizable iconography |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) | `^0.4.6` | Light & dark mode with animated theme toggler |
| **Charts** | [Recharts](https://recharts.org/) | `^3.8.0` | Responsive, composable SVG charts |

---

## ✨ Features

- 🚀 **Next.js 16 App Router & Turbopack**: High-performance development build and server rendering.
- 🎨 **Tailwind CSS v4 Design System**: Tokenized OKLCH colors, fluid dark mode switching, and custom tint contrast calculators (`tintStyle`).
- 🧩 **20+ shadcn / Base UI Primitives**: Accessible headless buttons, dialogs, sheets, tables, inputs, pagination, tooltips, select menus, and toasts.
- 📱 **Responsive App Shell**: Collapsible sidebar, mobile sheet drawer, dynamic breadcrumbs, and profile controls.
- 🧪 **Offline & Prototyping Ready**: Pre-seeded with graceful fallback dummy data for `/users`, `/roles`, and `/audit-logs`. Run and test immediately without spinning up a backend API.
- 🛡️ **Role-Based Access Control (RBAC)**: Modular permission evaluation (`canPermission`), dynamic sidebar item gating, and guest admin fallback.
- 🔄 **BFF API Proxy**: Built-in reverse-proxy route (`/api/backend/[...path]`) forwarding to upstream microservices with automatic session cookie handling.
- 🔔 **Toast Notification System**: Lightweight, singleton-driven notification helper (`showSuccess`, `showError`).

---

## 📁 Project Structure

```text
├── app/
│   ├── api/
│   │   └── backend/[...path]/     # Reverse proxy route to backend API
│   ├── audit-logs/                # Audit log activity monitor with CSV export
│   ├── dashboard/                 # Overview dashboard
│   ├── login/                     # Authentication entrypoint
│   ├── roles/                     # Role management & permission catalog modal
│   ├── users/                     # User management with CRUD modals
│   ├── globals.css                # Tailwind v4 configuration & design tokens
│   ├── layout.tsx                 # Root layout with SidebarProvider & Header
│   ├── providers.tsx              # React Query, ThemeProvider & AuthProvider
│   └── page.tsx                   # Index route (redirects to /users)
│
├── components/
│   ├── ui/                        # Reusable Base UI / shadcn primitives
│   │   ├── animated-theme-toggler.tsx
│   │   ├── button.tsx             # CVA button variants (default, outline, ghost, csv...)
│   │   ├── dialog.tsx             # Accessible dialog modals
│   │   ├── input.tsx              # Form input
│   │   ├── pagination.tsx         # Responsive pagination bar
│   │   ├── select-menu.tsx        # Custom dropdown select
│   │   ├── sidebar.tsx            # Collapsible sidebar primitive
│   │   ├── table.tsx              # Data table wrappers
│   │   └── toast.tsx              # Toast viewport and notifications
│   ├── app-sidebar.tsx            # Main sidebar navigation
│   ├── header.tsx                 # Breadcrumbs, theme switch, user profile
│   └── access-denied.tsx          # 403 fallback screen
│
├── hooks/
│   ├── use-auth.tsx               # AuthContext with guest admin fallback
│   └── use-mobile.ts              # Breakpoint detection hook (< 768px)
│
├── lib/
│   ├── api.ts                     # Generic HTTP client (fetch wrapper with ApiError)
│   ├── color.ts                   # WCAG contrast-compliant color tint calculator
│   ├── rbac.ts                    # Permission list and RBAC evaluator
│   ├── toast.ts                   # showError & showSuccess helpers
│   └── utils.ts                   # Canonical cn() class merger (clsx + tailwind-merge)
│
├── public/                        # Static assets (logos, icons, svg)
├── next.config.ts                 # Next.js configuration
├── components.json                # shadcn configuration (base-vega style)
├── tsconfig.json                  # TypeScript compiler settings
└── package.json                   # Dependencies and npm scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: `v20.x` or later (LTS recommended)
- **Package manager**: `npm` (or `pnpm` / `yarn` / `bun`)

### 2. Installation

Clone this repository and install dependencies:

```bash
git clone <repository-url>
cd <project-folder>
npm install
```

### 3. Environment Setup

Create an environment file `.env.local` (optional if prototyping with dummy data):

```bash
cp .env.example .env.local
```

Example `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/api-docs/openapi.json
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base upstream API URL for proxying requests |
| `NEXT_PUBLIC_API_DOCS_URL` | Optional OpenAPI specification URL |

> **Note:** If no backend is supplied, the boilerplate gracefully falls back to mock data on all core pages so you can prototype without any external dependencies.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will direct you to `/users` with pre-populated dummy data ready for inspection.

---

## 🛠️ Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Compiles an optimized production build |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs ESLint checks across the codebase |

---

## 🎨 Design System & Theming

- **Tokens**: Declared with CSS variables in OKLCH color space in `app/globals.css`.
- **Dark Mode**: Managed by `next-themes` via the `dark` class on the root `<html>` element.
- **Theme Toggler**: Smooth circular clip-path transition provided by `components/ui/animated-theme-toggler.tsx`.
- **Accessible Colors**: Use `tintStyle(hex)` from `@/lib/color` to generate badge colors that automatically maintain WCAG AA 4.5:1 contrast ratios in both light and dark modes.

---

## 🔒 Authentication & RBAC

The boilerplate includes a client-side RBAC foundation:

- **`useAuth()`**: Hook providing `user`, `permissions`, `can(permission)`, `refresh()`, and `logout()`.
- **Guest Admin Mode**: Unauthenticated sessions default to full access permissions (`*`), allowing seamless previewing and development of protected pages before integrating an identity provider.
- **Permission Guarding**: Use `can("resource.action")` to conditionally display UI actions or render `<AccessDenied />`.

---

## 📄 License

This boilerplate is open-source and free to use for personal and commercial projects.
