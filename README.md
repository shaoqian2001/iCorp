# Solo Studio (iCorp)

A local-first productivity and goal-tracking workspace for solo operators —
freelancers, solopreneurs, and researchers. Goals, projects (Personal /
Business / Research), tasks, a roadmap, weekly reviews, and an optional Claude
assistant. **All your data lives in your own browser** (IndexedDB) — there is
no backend database; nothing is uploaded anywhere.

## Run locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts: `pnpm build && pnpm start` (production), `pnpm lint`,
`pnpm typecheck`, `pnpm test`.

The AI assistant is optional and **bring-your-own-key**: paste a pay-as-you-go
Anthropic API key (from console.anthropic.com — not a Claude.ai subscription)
in the Assistant screen. The key is stored only in your browser and is never
part of the JSON export. A single route, `/api/chat`, proxies to Anthropic; it
never reads your local data.

## Deploy (Vercel — free Hobby tier)

This is a Next.js app, so Vercel deploys it with no code changes; `/api/chat`
runs as a serverless function.

1. Push the code to GitHub and merge to `main` (Vercel deploys `main` by
   default; other branches get preview URLs). To deploy a different branch,
   set it as the Production Branch in the Vercel project settings.
2. On vercel.com → **Add New… → Project** → import the GitHub repo. Vercel
   auto-detects Next.js and pnpm.
3. **Do not set `ANTHROPIC_API_KEY`** as an environment variable on a public
   deployment. The app is bring-your-own-key, so leaving it unset means each
   visitor uses (and pays for) their own key. Setting a server key would let
   anyone who finds the URL spend it.
4. Deploy. You get an `https://<project>.vercel.app` URL; every push
   redeploys.

Notes:

- **Data is per-browser by default.** Without an account, each visitor gets
  their own private, seeded copy — there is no shared data. Sign-in (below)
  adds optional per-user cloud backup.
- The assistant defaults to a capable model; on Vercel's Hobby tier, functions
  cap at 60s, so prefer the faster Claude Haiku/Sonnet options for snappy
  replies (the AI route already sets `maxDuration = 60`).

## Accounts & cloud sync (optional)

Sign-in is optional — the app runs fully offline without it. When you add the
env vars below, users can sign in with GitHub and back up / restore their whole
workspace to Postgres (see `.env.example`).

1. **Auth secret** — `AUTH_SECRET` (run `npx auth secret`, or `openssl rand -base64 32`).
2. **GitHub OAuth app** — github.com/settings/developers → New OAuth App.
   Callback URL `https://YOUR_DOMAIN/api/auth/callback/github` (and a separate
   dev app for `http://localhost:3000/...`). Set `AUTH_GITHUB_ID` /
   `AUTH_GITHUB_SECRET`.
3. **Database** — create a Neon project (or add Vercel Postgres, which is Neon)
   and set `DATABASE_URL` to its connection string. The `workspaces` table is
   created automatically on first use.
4. Add all of these in Vercel → Settings → Environment Variables and redeploy.

The `/api/workspace` route stores only an opaque per-user JSON snapshot (the
same one the JSON export produces); it never reads your local IndexedDB.
