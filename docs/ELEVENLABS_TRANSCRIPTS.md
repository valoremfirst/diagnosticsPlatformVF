# ElevenLabs Transcript Auto-Pull

Foundation for pulling completed voice diagnostics out of ElevenLabs and into
the platform. The browser SDK runs the live interview; afterwards ElevenLabs
stores the conversation and exposes it over its REST API. This feature lists an
agent's conversations, keeps only those **longer than 15 minutes**, and imports
a chosen conversation as a transcript that Gemini then scores.

## What's already wired

| Piece | File |
| ----- | ---- |
| Server client (list + fetch + map to turns) | `src/lib/elevenlabs-transcripts.ts` |
| List endpoint | `GET /api/elevenlabs/transcripts?fn=<function>&minMinutes=15` |
| Import path | `POST /api/companies/:id/sections/:fn` with `{ conversationId }` |
| UI control | "ElevenLabs" button in each section tab (`SectionDetail.tsx`) |

## 1. Configuration

Add to `.env.local` (server-only — the API key is **never** sent to the
browser):

```env
ELEVENLABS_API_KEY=sk_xxx

ELEVENLABS_AGENT_ID_FINANCE=agent_xxx
ELEVENLABS_AGENT_ID_HR=agent_xxx
ELEVENLABS_AGENT_ID_SALES=
ELEVENLABS_AGENT_ID_OPERATIONS=agent_xxx
ELEVENLABS_AGENT_ID_IT=agent_xxx
ELEVENLABS_AGENT_ID_LEADERSHIP=agent_xxx
```

- **API key:** ElevenLabs dashboard → profile → **API Keys**.
- **Agent ids:** Conversational AI → your agent → copy the agent id from the URL
  or the agent settings. Each business function maps to one agent.

The `NEXT_PUBLIC_ELEVENLABS_AGENT_ID_*` vars (already present) are separate —
they're for the in-browser live interview SDK and are safe to expose.

## 2. How the pull works

`listLongConversations(fn, minMinutes)`:

1. Resolves the agent id for the function from `ELEVENLABS_AGENT_ID_<FN>`.
2. Calls `GET /v1/convai/conversations?agent_id=…&page_size=100`, paging via
   `next_cursor` until `has_more` is false (capped at 20 pages).
3. Drops any conversation whose `call_duration_secs` is below
   `minMinutes * 60` (default **15 min**).
4. Returns `{ conversationId, title, durationSeconds, startedAt, turns }[]`
   sorted newest-first.

`fetchConversationTranscript(conversationId)`:

1. Calls `GET /v1/convai/conversations/{conversation_id}`.
2. Maps each transcript entry — `role: "agent" | "user"` → `speaker`,
   `message` → `text`, `time_in_call_secs` → an `hh:mm:ss` `timestamp`.
3. Returns `TranscriptTurn[]` matching `src/lib/types.ts`.

## 3. Using it in the app

In any company → section tab, click **ElevenLabs**. The dropdown calls the list
endpoint, shows every conversation over 15 minutes for that section's agent, and
**Import** runs the conversation through `fetchConversationTranscript` →
`analyseTranscript` (Gemini) → saved as a scored diagnostic.

Direct API examples:

```bash
# List finance conversations over 15 minutes
curl "http://localhost:3000/api/elevenlabs/transcripts?fn=finance&minMinutes=15"

# Import one into Acme's finance section (scores it with Gemini)
curl -X POST http://localhost:3000/api/companies/acme/sections/finance \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"conv_abc123","title":"CFO discovery"}'
```

## 4. Automating the pull (batch import)

To auto-import **all** qualifying conversations for an agent (e.g. on a
schedule), loop the list endpoint and POST each id. Sketch for a route or cron
job:

```ts
import { listLongConversations } from "@/lib/elevenlabs-transcripts";

const convos = await listLongConversations("finance", 15);
for (const c of convos) {
  await fetch(`${base}/api/companies/${companyId}/sections/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId: c.conversationId, title: c.title }),
  });
}
```

To avoid re-importing, track imported `conversationId`s (add a field to
`DiagnosticSession`, e.g. `sourceConversationId`, and skip ids already stored).

## 5. API field reference

`GET /v1/convai/conversations` item:

| Field | Used as |
| ----- | ------- |
| `conversation_id` | `conversationId` |
| `call_duration_secs` | duration filter |
| `start_time_unix_secs` | `startedAt` |
| `message_count` | `turns` |
| `agent_name` | `title` |

`GET /v1/convai/conversations/{id}`:

| Field | Used as |
| ----- | ------- |
| `transcript[].role` | `speaker` (`agent`/`user`) |
| `transcript[].message` | `text` |
| `transcript[].time_in_call_secs` | `timestamp` |
| `metadata.call_duration_secs` | duration |

> If ElevenLabs changes these field names, adjust the `Raw*` interfaces in
> `src/lib/elevenlabs-transcripts.ts` — that's the only place they're read.

## 6. Errors you might see

| Message | Cause / fix |
| ------- | ----------- |
| `ElevenLabs is not configured…` (503) | `ELEVENLABS_API_KEY` missing |
| `No ElevenLabs agent id configured for "finance"` | set `ELEVENLABS_AGENT_ID_FINANCE` |
| `ElevenLabs API 401` | bad/expired API key |
| `ElevenLabs API 404` | wrong agent id or conversation id |
