# Solo Studio — local-first workspace for solo operators (Demo v1)

## What this is

A personal productivity and goal-tracking app for freelancers, solopreneurs, researchers, and people preparing to become one. This repo currently builds **Demo v1: the private Workspace only** — a fully client-side, local-first app that runs on localhost with no backend, no auth, and no network dependency for any data operation.

Bigger picture (context for decisions, NOT current scope): later phases add a public community ("the Commons"), paid expert consultations, an AI copilot, and cloud sync via a sync engine (PowerSync/SQLite ↔ Postgres). Today's architecture must not block that — which is why the data layer is abstracted and sync-ready (see Architecture rules).

## Demo v1 scope

In scope (this list is exhaustive — do not build features outside it):

- Goal hierarchy as a tree: north star → long-term (1–3 yr) → quarterly objectives
- Projects linked to goals; milestones with target dates
- Tasks (todo / doing / done) linked to a project or a goal
- Roadmap view: milestones on a horizontal timeline, grouped by project
- Weekly review: guided flow (wins / blockers / lessons / next week's focus) saved as entries, with browsable history
- Dashboard: today's tasks + active quarter goals + next upcoming milestone
- Seed data on first run; JSON export/import; "reset & reseed" in settings
- All data persists in the browser (IndexedDB) across reloads

Out of scope (do NOT build, even if it seems easy or tempting):

- Backend of any kind: no API routes for data, no database servers, no ORMs (no Prisma, no Drizzle)
- Auth, accounts, multi-user anything
- Community/social features, payments, AI features, habits tracking
- Service worker / PWA install flow (deferred — adds friction with the dev server and isn't needed for a localhost demo)
- Real sync. Dexie is the only persistence layer in this phase.

## Tech stack (do not substitute without a stated reason)

- Next.js (App Router) + TypeScript strict — Next.js is kept for continuity with later phases even though all data is client-side
- MUI (Material UI) with a Material 3-style theme; light + dark mode
- Dexie.js (IndexedDB) + `dexie-react-hooks` `useLiveQuery` for reactive local queries
- Zod for schemas and validation — TS types derive from Zod via `z.infer`
- Zustand only for ephemeral UI state (open dialogs, filters, view options); anything persistent lives in Dexie
- date-fns for date math; `crypto.randomUUID()` for ids (no uuid package)
- pnpm as the package manager

## Architecture rules

1. **The repository pattern is law.** All persistence goes through interfaces in `src/lib/data/repositories/` (e.g. `GoalRepository`, `TaskRepository`). UI components and hooks never import Dexie directly. The Dexie implementation lives in `src/lib/data/dexie/`. Reason: a later phase swaps Dexie for a PowerSync/SQLite client — that swap must only touch `src/lib/data/`.
2. **Every record is sync-ready.** All tables share these fields: `id` (UUID string), `userId` (the constant `"local"` for now), `createdAt` + `updatedAt` (ISO strings), `deletedAt` (ISO string or null). Deletes are soft: set `deletedAt`, never remove rows. All queries filter out soft-deleted rows.
3. **Client-side data, server-rendered shell.** Pages are thin RSC shells; everything that touches data is a client component. Never fetch or read app data on the server.
4. One Zod schema per entity in `src/lib/data/schemas.ts` is the single source of truth. Mutations validate with Zod before writing and always bump `updatedAt`.
5. Import/export must round-trip losslessly: export the full database to a single versioned JSON file; import validates with Zod and replaces local state.

## Data model

All entities also carry the standard fields from Architecture rule 2.

- `Goal`: `parentId` (null = north-star root), `title`, `description?`, `horizon: "north_star" | "long_term" | "quarter"`, `status: "active" | "achieved" | "paused" | "dropped"`, `targetMetric?`, `dueDate?`, `sortOrder`
- `Project`: `goalId?`, `title`, `description?`, `status: "active" | "done" | "paused"`
- `Milestone`: `projectId`, `title`, `date` (ISO), `status: "planned" | "hit" | "missed"`
- `Task`: `goalId?`, `projectId?`, `title`, `notes?`, `status: "todo" | "doing" | "done"`, `dueDate?`, `sortOrder`
- `ReviewEntry`: `weekStart` (ISO date of Monday), `wins`, `blockers`, `lessons`, `nextFocus` (all strings)

Tree depth for goals is exactly three levels (north_star → long_term → quarter); enforce in validation.

## App structure

Routes (App Router):

- `/` — Dashboard: today's tasks, active quarter goals, next milestone
- `/goals` — tree view with inline add/edit, expand/collapse, status chips
- `/tasks` — three-column kanban (todo / doing / done)
- `/roadmap` — milestone timeline grouped by project, quarter and half-year zoom
- `/review` — start or continue this week's review; list of past entries
- `/settings` — export JSON, import JSON, reset & reseed

Layout: MUI app shell — permanent nav drawer on desktop, bottom navigation on mobile widths.

`src/` layout: `app/` (routes) · `components/<feature>/` (`goals/`, `tasks/`, `roadmap/`, `review/`, `shared/`) · `lib/data/` (schemas, repositories, dexie impl, seed, export-import) · `lib/theme.ts` · `lib/stores/` (zustand).

## Conventions

- TypeScript strict; no `any`; named exports
- Use MUI components and the theme; styling via the `sx` prop; no Tailwind, minimal custom CSS
- Every list view has a designed empty state, never a blank screen
- Conventional commits (`feat:`, `fix:`, `chore:`); commit after each working milestone

## Commands

- `pnpm dev` — run on localhost:3000
- `pnpm build && pnpm start` — production sanity check
- `pnpm lint` and `pnpm typecheck` — both must pass before any task is declared done
- `pnpm test` — Vitest, focused on the data layer (repositories, seed, export/import round-trip)

## Definition of done (Demo v1)

- Create/edit/archive goals in the 3-level tree; create projects, milestones, tasks against them
- Tasks move across kanban columns; dashboard reflects today's state
- Roadmap renders milestones on a timeline
- Weekly review saves entries and lists history
- Reload the page: everything persists. Kill the internet connection: every feature still works
- Export-then-import restores state exactly (covered by a round-trip test)
- A fresh browser profile gets seed data that demonstrates every feature
- `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass

## Working style

- Before any large change, present a short plan with the files you'll touch; wait for approval on the initial scaffold plan
- Build order: data layer + seed → app shell + theme → goals → tasks → dashboard → roadmap → review → settings/export
- Prefer the dependencies listed above; if you must add one, state why in the commit message
- Update this file whenever an architecture decision changes