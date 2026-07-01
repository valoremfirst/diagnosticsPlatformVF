# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agentic Diagnostics Platform** — a voice-led consulting diagnostics tool that:
1. Runs ElevenLabs Conversational AI interviews (browser SDK)
2. Auto-imports completed transcripts (>15 min) from ElevenLabs
3. Scores transcripts against business-maturity frameworks using Gemini
4. Surfaces risks, recommendations, and framework maturity on an interactive dashboard
5. Shares read-only client reports via tokenized public links
6. Protects agent-ID configuration behind password-protected admin console

## Commands

```bash
npm run dev              # Start dev server on port 3000
npm run build            # Production build to .next/
npm start                # Run production build locally
npm run typecheck        # TypeScript check
npm run lint             # Next.js lint
```

If `npm` is not on PATH, prepend: `$env:Path += ";C:\node-v24.18.0-win-x64"`

## Architecture

### Data Layer (`src/lib/store.ts`)
- Single entry point for all persistence
- Routes to **Cloud Firestore** (when `FIREBASE_*` env vars set) or **in-memory fallback** (mock data)
- Both backends are abstracted; swapping data stores requires only changing `store.ts` usage
- Key entities: `Company`, `DiagnosticSession`, `DiagnosticResult`

### API Routes
- **`/api/companies/[id]/`** — CRUD on company metadata (brand colour, logo, description, agent IDs)
  - `agentIds` mutations are **admin-only** (checked via `isAdminAuthed()` in route)
- **`/api/companies/[id]/sections/[fn]/`** — create diagnostic sessions from transcripts
  - Accepts raw text, array of turns, or `conversationId` (pulls from ElevenLabs)
  - Session IDs are **deterministic** when importing (format: `imp-{companyId}-{conversationId}`) to prevent duplicates on concurrent imports
  - `analyse?: false` saves as draft (manual analysis via UI)
- **`/api/elevenlabs/transcripts`** — lists completed conversations >15 min per company+function
  - Looks up company's per-function agent IDs (`Company.agentIds[fn]`), falls back to `.env` defaults
- **`/api/companies/[id]/ask`** — grounded AI Q&A (builds context from analysed diagnostics, asks Gemini)
- **`/api/companies/[id]/share`** — generates/revokes tokenized public share links

### UI Patterns
- **Server components** for data fetching (pages, API routes)
- **Client components** for interactivity (`"use client"`)
- **AppShell** detects `/share/*` pathname (via middleware header) and strips nav chrome
- **Tab-based sections** — each business function (Finance, HR, etc.) is a tab; key by `fn` to force remounts and reset local state
- **Auto-import** — `useEffect` with `autoRan` ref guard pulls ElevenLabs conversations on section mount, deduped via stored `sourceConversationId`

### Auth
Admin access to agent-ID configuration is protected by:
1. **`src/lib/admin-auth.ts`** — password verification (constant-time compare), httpOnly cookie session
2. **`src/app/api/admin/login/route.ts`** — POST to authenticate, DELETE to sign out
3. **`src/components/admin/AdminAuth.tsx`** — login form, sign-out button
4. **Gate in `/api/companies/[id]/`** — `agentIds` mutations return 403 unless `isAdminAuthed()`

**Setup**: Set `ADMIN_PASSWORD` in `.env` locally, and in Vercel project Environment Variables.

### Key Integrations

**ElevenLabs Conversational AI:**
- `src/lib/elevenlabs-transcripts.ts` — lists conversations, fetches transcripts
- Per-company agent IDs (`Company.agentIds[fn]`) override `.env` defaults
- Conversations must have `status: "done"` to be imported
- Each session stores `sourceConversationId` to enable idempotent dedup

**Google Gemini:**
- `src/lib/gemini.ts` — wrapper for analysis and Q&A
- Model: `gemini-2.5-flash` (configured in `.env`)
- Analysis produces strict JSON (validated in `src/lib/validation.ts`)
- Output shape: `DiagnosticResult` with frameworks, risks, recommendations

**Firebase:**
- `src/lib/firebase.ts` — initializes Admin SDK
- `src/lib/firebase-repo.ts` — Firestore schema (collections: `companies`, `sessions`)
- Fallback to in-memory store if Firestore unavailable (logs warning, never retries)

## Development Notes

### Auto-Import Dedup
- Client: `Set(importedConversationIds)` skips known conversations before fetching
- Server: Deterministic session ID (`imp-{companyId}-{conversationId}`) collapses concurrent writes to the same document
- Persistence: `sourceConversationId` field survives across page reloads

### React Strict Mode
- Dev mode runs effects twice. Early guards (`autoRan` ref) prevent double-imports
- No cleanup functions needed — React 18 guarantees `setState` on unmounted components is safe

### Middleware
`src/middleware.ts` injects `x-pathname` header for AppShell to detect public share routes. Update matcher if adding new route prefixes that need chrome-stripping.

### Types
`src/lib/types.ts` is the source of truth for domain models:
- `Company` — holds brand config, agent IDs, share token
- `DiagnosticSession` — one transcript analysis (status: draft | processing | complete | failed)
- `DiagnosticResult` — scored frameworks, risks, recommendations
- `DiagnosticFunction` — union of "legal" | "it" | "operational-delivery" | "sales" | "leadership" | "culture" | "presales"

### Frameworks & Agents
`src/lib/frameworks.ts` defines the five assessment frameworks, six business functions, and their agent prompts. Editing here cascades to the UI, Gemini scoring, and API validation.

## Environment Variables

**Required for production:**
- `ELEVENLABS_API_KEY` — enables transcript import
- `ELEVENLABS_AGENT_ID_FINANCE`, etc. — agent IDs per function (can be overridden per-company)
- `GEMINI_API_KEY` — switches from mock to real Gemini analysis
- `ADMIN_PASSWORD` — unlocks `/admin` console
- `FIREBASE_*` — Cloud Firestore credentials (optional; in-memory fallback works)

**Optional:**
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID_*` — exposed to browser for live-session page
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`

## Deployment

**Vercel** (recommended for Next.js):
- Auto-builds on push to main
- Set all secrets in project Environment Variables (not `.env` in repo)
- Middleware and dynamic routes work out of the box

**Environment Variables in Vercel:**
Copy all non-public vars from `.env` to Vercel project settings, including `FIREBASE_PRIVATE_KEY` (Vercel handles `\n` escaping correctly).

## Testing During Development

- **Mock mode** (default): runs on seed data in `src/lib/mock-data.ts`
- **With ElevenLabs/Gemini**: set `ELEVENLABS_API_KEY` and `GEMINI_API_KEY` to enable real integrations
- **Admin console**: set `ADMIN_PASSWORD` to test password gate at `/admin`
- **Restart required** for `.env` changes to take effect; Fast Refresh handles `.tsx` changes

## Common Workflows

**Add a new business function:**
1. Add entry to `DiagnosticFunction` union in `src/lib/types.ts`
2. Add function definition to `FUNCTIONS` array in `src/lib/frameworks.ts` (includes agent name, blurb, probes, etc.)
3. Add agent ID env vars: `ELEVENLABS_AGENT_ID_*` and `NEXT_PUBLIC_ELEVENLABS_AGENT_ID_*`
4. UI auto-populates tabs; API routes validate against `VALID_FUNCTIONS` — update those lists

**Add a new framework:**
1. Add to `FRAMEWORKS` array in `src/lib/frameworks.ts`
2. Update Gemini prompts to assess it
3. `DiagnosticResult.frameworks` will include it automatically once analysed

**Gate a new API route behind admin:**
1. Import `isAdminAuthed` from `src/lib/admin-auth.ts`
2. Early return `403` if mutation touches admin-only fields
3. Document in CLAUDE.md if it affects user workflows
