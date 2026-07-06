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
                          identify company           │  (by agent_id)
                          compile prior diagnostics   ▼
        agent prompt  ◀── { conversation_history } ── platform
        now includes history
```

## What's wired

| Piece | File |
| ----- | ---- |
| Memory builder (summarises prior sessions) | `src/lib/conversation-memory.ts` |
| Agent-id → company/function resolver | `findCompanyByAgentId` in `src/lib/store.ts` |
| Initiation webhook | `POST /api/elevenlabs/conversation-init` |

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

The **function** comes from the `agent_id` (each per-function agent maps to one
function — whether it's a company-specific agent in `Company.agentIds` or a
shared `ELEVENLABS_AGENT_ID_*` env agent).

The **company** is resolved by priority, most authoritative first:

1. **Explicit `company_id`** passed as client data — used when the platform
   initiates a call via the SDK and forwards client data.
2. **The caller's phone number** (`caller_id`) — looked up in the phone registry
   (Admin → Caller identification). This is the mechanism for real inbound calls.
3. **A company-specific agent id** — only unique when the agent is *not* shared.

If no company resolves, the webhook returns an **empty** history so the call
still starts normally — a brand-new caller never inherits another client's
context.

### Two valid setups

**A. One agent per company, per function.** Give each company its own agent ids
(Admin → Agent configuration). `agent_id` alone identifies the client; no phone
registry needed.

**B. One shared agent per function, many companies.** All clients call the same
`leadership` agent, etc. Here `agent_id` gives only the function — you **must**
register each caller's phone number (Admin → Caller identification) so the
webhook can attribute the call. This is the setup that prevents a new caller
from being mistaken for a previous one.

> **The phone registry (setup B) directly solves caller collisions:** an
> unregistered number on a shared agent resolves to *no company* → empty
> history, instead of leaking whichever client happened to be matched by the
> agent id.

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

`buildConversationMemory()` takes that caller's prior sessions (scoped to the
agent's function when known, else the whole company), newest first, and produces
a compact brief. Per session it prefers the **analysed result** — overall
maturity score, executive summary, and top risks — over raw transcript text,
because that's denser per token and closer to what a human consultant would
recall. When a session hasn't been scored yet, it falls back to a trimmed slice
of the transcript. The whole brief is hard-capped (~1,800 chars) to stay within
ElevenLabs' dynamic-variable limits.

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
