# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
pnpm dev          # Start dev server (increases Node heap to 4096MB)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint (Next.js core-web-vitals + typescript configs)

pnpm db:generate  # Generate drizzle migrations from db/schema changes
pnpm db:migrate   # Apply pending drizzle migrations
pnpm db:push      # Push schema directly to DB (no migration files)
pnpm db:studio    # Open drizzle-kit studio
pnpm db:seed      # Seed idempotent Auth + app fixtures (requires SEED_TEST_PASSWORD)
```

No test framework is configured — there is no `test` script.

## Architecture

Coog Gaming website — **Next.js 16** App Router + Supabase SSR starter, heavily extended. Two data layers: Supabase for auth, Drizzle ORM over direct Postgres for all app data. shadcn/ui, Tailwind CSS with CSS variable theming, zustand for calendar UI state, dayjs for dates.

### Data Layers

**Supabase (auth only).** Cookie-based session management. `users` in Supabase Auth is mirrored into the `users` table in Postgres (same id) so app tables can reference them.

**Drizzle ORM + Postgres (all app data).** `db/index.ts` creates a singleton `postgres-js` client from `DATABASE_URL` (global-cached in dev) and exports `db` with drizzle relations. Schemas live in `db/schema/` and are barrel-exported from `db/schema/index.ts`. `drizzle.config.ts` points at `./db/schema/index.ts` for migrations. The two systems are separate: `DATABASE_URL` is a direct Postgres connection, not the Supabase pooler.

Schema tables (with relations defined in `db/schema/relations.ts`):
- `users` — 1-1 with `members` (via userId), 1-many `checkIns`
- `members` — user info for org members; has many `addresses`; joins `teams` through `teamMembers`
- `admins` — references `members` (unique); `role` is a smallint 0–10 with labels in `adminRoles` (President, VP, Treasurer, … Officer) in `db/schema/admins.ts`
- `games`, `teams`, `team-members` — game/team hierarchy
- `events` — calendar events; `createdBy` references admins
- `check-ins` — event check-in records (schema exists; no server actions yet)

### Server Data-Access Layer (`server/`)

One file per domain (`events.ts`, `users.ts`, `members.ts`, `admins.ts`, `games.ts`, `teams.ts`, `team-members.ts`, `storage.ts`), all marked `"use server"` and callable directly from Server Components (see `app/page.tsx` calling `getEvents()`).

- Every exported function is wrapped in `safeAction()` (`server/safe-action.ts`) which returns `ActionResult<T> = { data: T | null; error: string | null }` — never throws. Callers check `result.error`.
- Inputs are validated inside the action with zod schemas (validation is duplicated in the server file because server actions are callable from anywhere).
- `server/users.ts` also creates/deletes Supabase Auth users via `lib/supabase/admin.ts` (service-role client) — creating a user means both inserting into the `users` table and calling Supabase Admin API.
- Managed image uploads live in `lib/supabase/image-storage.ts`; domain actions attach them to users/games, while `server/storage-cleanup.ts` durably queues failed or superseded objects.

### Calendar State (`lib/store.ts`)

Three zustand stores shared by admin and visitor calendars:
- `useViewStore` — selected view (month/week/day); persisted to localStorage
- `useDateStore` — selected date + month matrix; persisted
- `useEventDialogStore` — create/edit dialog state (`openCreate(date)` / `openEdit(event)` / `closeDialog`)

Persisted stores use `skipHydration: true` — components rehydrate on mount; don't read persisted state during SSR.

### Auth Layer (`lib/supabase/`)

| File | Context | Use |
|------|---------|-----|
| `client.ts` | Browser (Client Components) | `createBrowserClient` |
| `server.ts` | Server Components, Route Handlers, Server Actions | `createServerClient` with `next/headers` cookies |
| `proxy.ts` | Request interceptor | `createServerClient` with request cookies, session refresh via `getClaims()` |
| `admin.ts` | Server-side admin operations | Supabase client with `SUPABASE_SERVICE_ROLE_KEY` (user creation/deletion) |

**Critical rules from upstream comments in the code:**
- Never reuse a Supabase client instance across requests (Fluid compute). Always call `createClient()` inside each function.
- In proxy: never run code between `createServerClient` and `supabase.auth.getClaims()` — causes random logout bugs.
- In proxy: must return the `supabaseResponse` object as-is. If creating a new `NextResponse`, copy cookies from `supabaseResponse.cookies.getAll()` — otherwise session desyncs.

### Route Guarding (`proxy.ts` at repo root)

Next 16 convention — `proxy.ts` replaced `middleware.ts`. It forwards to `updateSession()` in `lib/supabase/proxy.ts`.

- `publicPaths = ["/", "/teams", "/about"]`. Any other path not starting with `/auth`, without a session, redirects to `/auth/login`.
- `/admin/*` is gated only by this session check — there is currently **no admin-role check** on admin pages; any logged-in user can reach them.
- `SKIP_AUTH=true` in `.env.local` disables the check entirely for local dev.
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and image extensions.

### Route Structure

```
/                       # Public — landing: hero, VisitorCalendar, Twitch/Twitter embeds
/teams                  # Public — team info
/about                  # Public — about page
/auth/*                 # login, sign-up, forgot-password, update-password, confirm, error, sign-up-success
/admin/admins           # Admin roster management (role assignment, create/delete admins)
/admin/events           # Admin calendar (month/week/day views + event CRUD dialog)
/admin/members          # Member management
/admin/teams            # Games/teams/team-members manager
/admin/users            # User management (creates/deletes Supabase Auth users)
/protected/*            # Auth-gated — proxy redirects to /auth/login if no session
```

Admin pages use a server-component pattern: page awaits `searchParams` (e.g. `?search=`) and passes it down to client table components.

### Layout Hierarchy

- **Root layout** (`app/layout.tsx`): Navbar + Footer from `components/site-components/`. Used by public pages.
- **Protected layout** (`app/protected/layout.tsx`): Separate nav with AuthButton, DeployButton, ThemeSwitcher, EnvVarWarning.
- Admin pages have no layout of their own.

### Calendars

Two parallel implementations fed by the same `server/events.ts`:
- **Admin**: `components/site-components/admin-components/events-calendar/` — header (view switcher, month nav) + body (month/week/day views, event card/dialog/form). Used by `/admin/events`.
- **Visitor**: `components/site-components/visitor-calendar/` — read-only month view + event sidebar. Used on the landing page.

### Component Organization

```
components/
├── ui/                     # shadcn/ui primitives (button, card, dialog, table, form, select, tabs, accordion, …)
├── site-components/
│   ├── navbar.tsx, footer.tsx     # Root layout chrome
│   ├── homepage-components/       # TwitchEmbed, TwitterEmbed
│   ├── visitor-calendar/          # Public read-only calendar
│   └── admin-components/          # Admin tables, forms, and the events calendar
└── hero.tsx                # Landing page hero
```

### Styling

- **shadcn/ui** config: new-york style, neutral base, CSS variables enabled, lucide icons
- **Tailwind**: dark mode via `class` strategy (`next-themes`), colors defined as HSL CSS vars in `app/globals.css` (light + dark variants)
- `cn()` utility (`lib/utils.ts`): `clsx` + `tailwind-merge` wrapper — use for all conditional class merging
- `components.json`: aliases `@/components` → `./components`, `@/lib/utils` → `./lib/utils`, `@/components/ui` → `./components/ui`
- The site uses a dark red/gray glassmorphism theme (`bg-[url('/uh-site-background.png')]`, red-500/red-950 accents)

### Env Vars

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DATABASE_URL=postgres://...                  # direct Postgres connection for drizzle
SUPABASE_SERVICE_ROLE_KEY=...                # only used server-side (lib/supabase/admin.ts)
```

Optional: `SKIP_AUTH=true` (bypass proxy auth checks in dev).
`hasEnvVars` in `lib/utils.ts` checks the two `NEXT_PUBLIC_SUPABASE_*` vars — used to show `EnvVarWarning` when absent.

### Package Manager

Uses `pnpm` with workspace config (`pnpm-workspace.yaml`). Lockfile: `pnpm-lock.yaml`.

### Next.js Config

- `turbopack.root` hardcoded to this machine's project path — may need updating on different machines
- `images.remotePatterns` allows the Supabase project's storage bucket host for avatars
- TypeScript strict mode, bundler module resolution, `@/*` path alias → `./*`
