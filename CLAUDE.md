# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
pnpm dev        # Start dev server (increases Node heap to 4096MB)
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # Run ESLint (Next.js core-web-vitals + typescript configs)
```

## Architecture

Coog Gaming website — Next.js 15 App Router + Supabase SSR starter. Cookie-based auth, shadcn/ui components, Tailwind CSS with CSS variable theming.

### Auth Layer (`lib/supabase/`)

Three client factories, all from `@supabase/ssr`:

| File | Context | Use |
|------|---------|-----|
| `lib/supabase/client.ts` | Browser (Client Components) | `createBrowserClient` |
| `lib/supabase/server.ts` | Server Components, Route Handlers, Server Actions | `createServerClient` with `next/headers` cookies |
| `lib/supabase/proxy.ts` | Middleware (request interceptor) | `createServerClient` with request cookies, session refresh via `getClaims()` |

**Critical rules from upstream comments in the code:**
- Never reuse a Supabase client instance across requests (Fluid compute). Always call `createClient()` inside each function.
- In proxy: never run code between `createServerClient` and `supabase.auth.getClaims()` — causes random logout bugs.
- In proxy: must return the `supabaseResponse` object as-is. If creating a new `NextResponse`, copy cookies from `supabaseResponse.cookies.getAll()` — otherwise session desyncs.
- Proxy matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and all image extensions.

### Route Structure

```
/                       # Public — landing page
/teams                  # Public — team info
/about                  # Public — about page
/auth/login             # Login form (LoginForm component)
/auth/sign-up           # Sign-up form (SignUpForm component)
/auth/forgot-password   # Password reset request
/auth/update-password   # New password after reset
/auth/confirm           # OTP verification route (email confirmation)
/auth/error             # Auth error display
/auth/sign-up-success   # Post-signup confirmation
/protected/*            # Auth-gated — proxy redirects to /auth/login if no session
```

Proxy (`proxy.ts`) guards non-public routes. `publicPaths` in proxy.ts: `["/", "/teams", "/about"]`. Any path not public, not under `/auth`, and without a user session gets redirected to `/auth/login`.

### Layout Hierarchy

- **Root layout** (`app/layout.tsx`): Navbar + Footer from `components/site-components/`. Used by public pages.
- **Protected layout** (`app/protected/layout.tsx`): Separate nav with AuthButton (sign in/out), DeployButton, ThemeSwitcher, EnvVarWarning. Shows user email when logged in.

### Component Organization

```
components/
├── ui/              # shadcn/ui primitives (button, card, input, label, checkbox, dropdown-menu, badge)
├── site-components/ # Navbar, Footer — used by root layout
├── tutorial/        # Tutorial step components (part of starter template, can be removed)
├── auth-button.tsx, login-form.tsx, sign-up-form.tsx, etc.  # Auth UI
├── deploy-button.tsx, env-var-warning.tsx, theme-switcher.tsx  # Utility widgets
└── hero.tsx         # Landing page hero
```

### Styling

- **shadcn/ui** config: new-york style, neutral base, CSS variables enabled, lucide icons
- **Tailwind**: dark mode via `class` strategy (`next-themes`), colors defined as HSL CSS vars in `app/globals.css` (light + dark variants)
- `cn()` utility (`lib/utils.ts`): `clsx` + `tailwind-merge` wrapper — use for all conditional class merging
- `components.json`: aliases `@/components` → `./components`, `@/lib/utils` → `./lib/utils`, `@/components/ui` → `./components/ui`

### Env Vars

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`hasEnvVars` in `lib/utils.ts` checks both are set — used to show `EnvVarWarning` when absent.

### Package Manager

Uses `pnpm` with workspace config (`pnpm-workspace.yaml`). Lockfile: `pnpm-lock.yaml`.

### Next.js Config

- Turbopack root set to the project path (hardcoded — may need updating on different machines)
- TypeScript strict mode, bundler module resolution, `@/*` path alias → `./*`
