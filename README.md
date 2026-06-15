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

- **Data is per-browser.** Deploying publishes the UI only — each visitor gets
  their own private, seeded copy. There is no shared/cloud data.
- The assistant defaults to a capable model; on Vercel's Hobby tier, functions
  cap at 60s, so prefer the faster Claude Haiku/Sonnet options for snappy
  replies (the AI route already sets `maxDuration = 60`).
