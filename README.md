# Agentic Diagnostics Platform

A React/Next.js **agentic diagnostics platform** that runs a voice-led discovery
interview (ElevenLabs Conversational AI), captures the transcript, scores the
organisation against five business-maturity frameworks (Gemini), and presents an
enterprise consulting dashboard with evidence, risks, recommendations and a roadmap.

The visual direction follows the **Oracle wireframe mock** in `Mocks/` — a warm
cream canvas, deep-teal primary, serif display headings and a restrained,
analytical data-visualisation palette.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — the app runs fully on mock data without keys
npm run dev
```

Open http://localhost:3000.

> **Runs without any API keys.** The store is seeded with three completed
> diagnostics (Finance, HR, IT). New sessions use a built-in voice simulator and
> a deterministic, evidence-linked analysis synthesiser until you configure keys.

## Going live

Set values in `.env.local` (see `.env.example`):

- `GEMINI_API_KEY` — switches analysis from the mock synthesiser to real Gemini
  scoring (strict JSON, validated in `src/lib/validation.ts`).
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID_*` — per-function agent ids. When present, the
  live-session page is ready to be wired to `@elevenlabs/react` (integration point
  marked in `src/app/session/[id]/page.tsx`).
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — for persistence; the in-memory
  store in `src/lib/store.ts` is the single swap point.

## Architecture

```
src/
  app/
    page.tsx                     Overview dashboard
    new/                         New diagnostic (function + frameworks + context)
    session/[id]/                Live voice session + processing stages
    diagnostics/[id]/            Results dashboard
    diagnostics/[id]/evidence/   Evidence review (clickable transcript linking)
    history/                     Filterable diagnostic history
    frameworks/  reports/        Framework + report views
    api/diagnostics/...          start · transcript · analyse · get · list · export
  components/                    AppShell, charts, scorecards, panels, UI primitives
  lib/
    types.ts                     Domain model
    frameworks.ts                Frameworks, functions, agent prompts
    gemini.ts                    Gemini wrapper + mock synthesiser
    validation.ts                Defensive Gemini JSON parsing
    store.ts                     In-memory store (Supabase-ready)
    mock-data.ts / sim-scripts.ts  Seed data + live-session scripts
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm start` — production build & serve
- `npm run typecheck` — TypeScript check
- `npm run lint` — Next.js lint
