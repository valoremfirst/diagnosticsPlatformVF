# Agent Conversation Memory (ElevenLabs)

By default every ElevenLabs Conversational AI call starts cold — the agent has
no recollection of prior conversations with the same client. This feature gives
the agent **continuity**: at the moment a conversation begins, ElevenLabs fetches
a compact summary of the client's previous diagnostics from this platform and
injects it into the agent's system prompt.

The mechanism is ElevenLabs' **Conversation Initiation webhook** + **dynamic
variables** — no ElevenLabs agent is mutated, and the memory is computed fresh
per call from the transcripts already flowing into the platform.

```
Client starts a call ──▶ ElevenLabs ──POST──▶ /api/elevenlabs/conversation-init
                                                     │
                          identify company (by phone)│
                          function (by shared agent_id)
                          compile prior diagnostics   ▼
        agent prompt  ◀── { conversation_history } ── platform
        now includes history
```

## What's wired

| Piece | File |
| ----- | ---- |
| Two-zone brief builder (`buildCompanyBrief`) | `src/lib/conversation-memory.ts` |
| Shared agent-id → function resolver | `functionForAgentId` in `src/lib/elevenlabs-transcripts.ts` |
| Initiation webhook | `POST /api/elevenlabs/conversation-init` |
| In-portal browser call (builds brief directly) | `POST /api/companies/[id]/portal-call` |

## 1. Add the variables to your agent prompt

In ElevenLabs → your agent → **System prompt**, reference the dynamic variables
where you want the history to land. For example, at the end of the prompt:

```
{{conversation_history}}
```

You can also use `{{client_company}}` (the client's company name) elsewhere in
the prompt, e.g. "You are interviewing a leader at {{client_company}}."

> ElevenLabs requires every `{{variable}}` referenced in the prompt to be
> provided at runtime. The webhook always returns both `conversation_history`
> and `client_company` (empty strings when there's nothing to inject), so the
> prompt renders cleanly even for brand-new clients.

## 2. Point the agent at the webhook

ElevenLabs → your agent → **Security** (a.k.a. "Fetch conversation initiation
data" / client-data webhook) → set the URL to:

```
https://<your-domain>/api/elevenlabs/conversation-init
```

Copy the **webhook secret** ElevenLabs generates and set it on the platform:

```env
ELEVENLABS_CONVAI_WEBHOOK_SECRET=whsec_xxx
```

The route verifies the `ElevenLabs-Signature` HMAC on every request (and rejects
timestamps older than 30 minutes to blunt replay attacks). If the secret is
**unset**, verification is skipped and a warning is logged — fine for local dev,
but always set it in production.

## 3. How the client is identified

Agents are **shared** — one per business function, used by every client. So the
`agent_id` on an inbound call identifies only the **function** (resolved via
`functionForAgentId`, which checks the global Firestore agent config then the
`ELEVENLABS_AGENT_ID_*` env defaults).

The **company** is resolved from the caller's **phone number** (`caller_id`),
looked up in the phone registry (Admin → Caller identification). You **must**
register each caller's number so the webhook can attribute the call.

If no company resolves (an unregistered number), the webhook returns an
**empty** history so the call still starts normally — a brand-new caller never
inherits another client's context.

> **The phone registry directly solves caller collisions:** an unregistered
> number resolves to *no company* → empty history, instead of leaking whichever
> client called the shared agent last.

### Phone number normalisation

Numbers are normalised to a stable key before lookup/storage: a leading `+` is
kept, everything else non-digit is stripped. So `+44 (0)20 1234 5678` and
`+442012345678` collapse to the same key. Register numbers in the format
ElevenLabs sends as `caller_id` (E.164, e.g. `+442012345678`).

## 4. What the agent remembers

Memory is scoped **per caller**, not per company. When someone calls, the webhook
recalls only the sessions where they were the caller — matched on their phone
number (`caller_id` ↔ the session's `sourceCallerPhone`, both normalised). So two
people at the same company each get their own continuous thread and never hear
each other's conversations back.

> The platform **dashboards still show every session** for a company — the full
> multi-person picture is intact for consultants. Per-caller scoping applies only
> to what the live agent recalls mid-call.
>
> `sourceCallerPhone` is captured automatically on import from the ElevenLabs
> conversation's phone metadata. Sessions imported before this existed (or pasted
> in manually with no caller number) simply won't surface in any caller's agent
> memory — they remain visible in the dashboard.

`buildCompanyBrief()` produces a **two-zone** brief. **Zone 1** details the last
~2 interviews in the agent's function (per-caller scoped) — per session it
prefers the **analysed result** (overall maturity score, executive summary, top
risks and recommendations) over raw transcript text, because that's denser per
token and closer to what a human consultant would recall; an unscored session
falls back to a trimmed transcript slice. **Zone 2** adds a single
latest-maturity line for each *other* function (company-wide), giving the agent
cross-functional context cheaply. The whole brief is hard-capped (~1,600 chars)
to stay within ElevenLabs' dynamic-variable limits.

> **Browser (in-portal) calls** don't hit this webhook — they have no caller
> phone. The `POST /api/companies/[id]/portal-call` route builds the same brief
> directly (the company is known from the authenticated URL), with zone 1
> covering all of the company's interviews in the function.

Tunables live at the top of `src/lib/conversation-memory.ts`:

| Constant | Default | Meaning |
| -------- | ------- | ------- |
| `MAX_PRIOR_SESSIONS` | 3 | How many past conversations to include |
| `MAX_RISKS_PER_SESSION` | 3 | Risks quoted per past session |
| `TRANSCRIPT_FALLBACK_TURNS` | 12 | Turns kept when no scored result exists |

## 5. Testing

Simulate ElevenLabs calling the webhook (omit the signature header locally — with
no secret set, verification is skipped):

```bash
curl -X POST http://localhost:3000/api/elevenlabs/conversation-init \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"agent_abc123"}'
```

Expected response:

```json
{
  "type": "conversation_initiation_client_data",
  "dynamic_variables": {
    "conversation_history": "You have spoken with this client before...",
    "client_company": "Acme Ltd"
  }
}
```

Force a specific client without a matching agent id:

```bash
curl -X POST http://localhost:3000/api/elevenlabs/conversation-init \
  -H "Content-Type: application/json" \
  -d '{"company_id":"acme","function":"leadership"}'
```

Simulate a real inbound call on a shared agent, identified by phone number
(register the number in Admin → Caller identification first):

```bash
curl -X POST http://localhost:3000/api/elevenlabs/conversation-init \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"agent_shared_leadership","caller_id":"+442012345678"}'
```

An **unregistered** number on that same shared agent returns an empty history —
verifying a new caller is not mistaken for an existing client:

```bash
curl -X POST http://localhost:3000/api/elevenlabs/conversation-init \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"agent_shared_leadership","caller_id":"+449999999999"}'
```

## 6. Errors you might see

| Response | Cause / fix |
| -------- | ----------- |
| `401 Invalid signature` | Secret set but HMAC/timestamp mismatch — check the URL matches the one registered, and clock skew < 30 min |
| Empty `conversation_history` | No prior sessions for the client, or `agent_id` not mapped to any company (see §3) |
| `400 Invalid JSON body` | Malformed request body |
