# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agentic Diagnostics Platform** — a voice-led consulting diagnostics tool that:
1. Runs ElevenLabs Conversational AI interviews (browser SDK)
2. Auto-imports completed transcripts (>15 min) from ElevenLabs
3. Scores transcripts against business-maturity frameworks using Gemini
4. Surfaces risks, recommendations, and framework maturity on an interactive dashboard
5. Gives each client a read-only view of only their own company (Firebase Auth, role-based)
6. Lets admins (consultants) manage the full portfolio, run interviews, and provision client accounts

## Commands\

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
- Key entities: `Company`, `DiagnosticSession`, `DiagnosticResult`, `AppUser`

### API Routes
Access control lives in `src/lib/auth.ts` (`apiRequire*` helpers). Reads are gated by company access (admin or owning client); writes/config are admin-only.
- **`/api/companies/[id]/`** — GET (company access); PATCH company metadata incl. `agentIds` (**admin-only**)
- **`/api/companies/[id]/sections/[fn]/`** — create diagnostic sessions from transcripts
  - Accepts raw text, array of turns, or `conversationId` (pulls from ElevenLabs)
  - Session IDs are **deterministic** when importing (format: `imp-{companyId}-{conversationId}`) to prevent duplicates on concurrent imports
  - `analyse?: false` saves as draft (manual analysis via UI)
- **`/api/elevenlabs/transcripts`** — lists completed conversations >15 min per company+function
  - Looks up company's per-function agent IDs (`Company.agentIds[fn]`), falls back to `.env` defaults
- **`/api/companies/[id]/ask`** — grounded AI Q&A (builds context from analysed diagnostics, asks Gemini)
- **`/api/auth/session`** — POST exchanges a Firebase ID token for a `__session` cookie; DELETE signs out
- **`/api/admin/users` + `/[uid]`** — admin-only user provisioning (create/list, update role/company, delete)

### UI Patterns
- **Server components** for data fetching (pages, API routes)
- **Client components** for interactivity (`"use client"`)
- **AppShell** loads the current user and renders role-aware chrome (admins: full portfolio + sidebar; clients: their one company only). Renders bare on `/login`.
- **Tab-based sections** — each business function (Finance, HR, etc.) is a tab; key by `fn` to force remounts and reset local state
- **Auto-import** — `useEffect` with `autoRan` ref guard pulls ElevenLabs conversations on section mount, deduped via stored `sourceConversationId` (admin/read-write view only)

### Auth & Roles
Identity is owned by **Firebase Authentication** (email/password). Two roles: `admin` (consultants, full portfolio) and `client` (sees only their assigned company, read-only).

1. **`src/lib/firebase-client.ts`** — browser SDK; login form signs in and gets an ID token
2. **`src/app/api/auth/session/route.ts`** — verifies the ID token (Admin SDK) and mints a `__session` cookie
3. **`src/lib/auth.ts`** — server helpers: `getCurrentUser`, `requireUser`, `requireAdmin`, `assertCompanyAccess`, plus `apiRequire*` variants for route handlers. Role + `companyId` come from Firebase **custom claims**.
4. **`src/middleware.ts`** — lightweight gate: redirects to `/login` when the `__session` cookie is absent (deep verification happens server-side, since Admin SDK can't run on Edge)
5. **Provisioning** — admins create users via the admin console (`/api/admin/users`), which calls `createUser` + `setCustomUserClaims` and mirrors the record in the `users` Firestore collection

**Cookie note**: the session cookie MUST be named `__session` — Firebase Hosting only forwards that one cookie to the SSR backend.

**Setup**: Enable Email/Password in Firebase Auth; set `NEXT_PUBLIC_FIREBASE_*` (browser) config; seed the first admin by creating a user and setting `{role:"admin"}` claims once.

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
`src/middleware.ts` injects the `x-pathname` header (for AppShell chrome) and redirects unauthenticated requests to `/login` based on `__session` cookie presence. Public prefixes (`/login`, `/api/auth`) bypass the gate. Update `PUBLIC_PREFIXES` / matcher when adding routes that must be reachable without a session.

### Types
`src/lib/types.ts` is the source of truth for domain models:
- `AppUser` — `{ uid, email, role, companyId?, ... }`; identity mirrors Firebase Auth + custom claims
- `UserRole` — "admin" | "client"
- `Company` — holds brand config and agent IDs
- `DiagnosticSession` — one transcript analysis (status: draft | processing | complete | failed)
- `DiagnosticResult` — scored frameworks, risks, recommendations
- `DiagnosticFunction` — union of "legal" | "it" | "operational-delivery" | "sales" | "leadership" | "culture" | "presales"

### Frameworks & Agents
`src/lib/frameworks.ts` defines the five assessment frameworks, six business functions, and their agent prompts. Editing here cascades to the UI, Gemini scoring, and API validation.

## Environment Variables

**Required for production:**
- `ELEVENLABS_API_KEY` — enables transcript import
- `ELEVENLABS_AGENT_ID_*` — agent IDs per function (can be overridden per-company)
- `GEMINI_API_KEY` — switches from mock to real Gemini analysis
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` — browser Firebase config for Auth
- `FIREBASE_PROJECT_ID` — server project id (Firestore + Auth). On Cloud Run / Cloud Functions, ADC supplies credentials automatically; locally, also set `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`

**Optional:**
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID_*` — exposed to browser for live-session page
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`

## Deployment

**Firebase Hosting + Cloud Functions** (Next.js web-frameworks):
- `firebase.json` uses `hosting.source: "."` with `frameworksBackend.region` — Firebase detects Next.js and deploys SSR to a Cloud Function.
- One-time: `firebase experiments:enable webframeworks`.
- Deploy: `firebase deploy` (builds locally, uploads static assets + SSR function). No GitHub rollout pipeline.
- Secrets → Cloud Secret Manager: `firebase functions:secrets:set ELEVENLABS_API_KEY` (and `GEMINI_API_KEY`). Non-secret `NEXT_PUBLIC_*` go in `.env.production`.
- Firestore/Auth use ADC via the function's service account. **`createSessionCookie` needs the runtime SA to have the "Service Account Token Creator" role**, or provide `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` secrets.

## Testing During Development

- **Mock mode** (default): platform data runs on seed data in `src/lib/mock-data.ts`. Note: **auth requires Firebase** (there is no mock login) — configure `NEXT_PUBLIC_FIREBASE_*` and enable Email/Password.
- **With ElevenLabs/Gemini**: set `ELEVENLABS_API_KEY` and `GEMINI_API_KEY` to enable real integrations
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

**Gate a new API route:**
1. Import the helpers from `src/lib/auth.ts`
2. `apiRequireAdmin()` for admin-only routes, or `apiRequireCompanyAccess(companyId)` for company-scoped routes; early-return `gate.response` when present
3. For pages use `requireAdmin()` / `assertCompanyAccess()` (they redirect / notFound)
4. Document in CLAUDE.md if it affects user workflows
