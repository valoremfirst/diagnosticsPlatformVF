import { getGlobalAgentConfig } from "./store";
import type { DiagnosticFunction, Speaker, TranscriptTurn } from "./types";

/**
 * ElevenLabs Conversational AI — server-side transcript retrieval.
 *
 * This is the foundation for auto-pulling completed voice diagnostics from
 * ElevenLabs into the platform. The browser SDK runs the live interview; once
 * a call ends, ElevenLabs stores the conversation and exposes it via the REST
 * API. These helpers list an agent's conversations, keep only those over a
 * minimum duration (default 15 minutes), and convert a conversation's
 * transcript into the platform's TranscriptTurn[] shape.
 *
 * Auth: ELEVENLABS_API_KEY (server-only — never exposed to the browser).
 * Agent ids per function: ELEVENLABS_AGENT_ID_<FUNCTION>.
 *
 * See docs/ELEVENLABS_TRANSCRIPTS.md for the full guide.
 */

const API_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_MIN_MINUTES = 15;

const SERVER_AGENT_ENV: Record<DiagnosticFunction, string | undefined> = {
  finance: process.env.ELEVENLABS_AGENT_ID_FINANCE,
  legal: process.env.ELEVENLABS_AGENT_ID_LEGAL,
  it: process.env.ELEVENLABS_AGENT_ID_IT,
  "operational-delivery": process.env.ELEVENLABS_AGENT_ID_OPERATIONAL_DELIVERY,
  sales: process.env.ELEVENLABS_AGENT_ID_SALES,
  leadership: process.env.ELEVENLABS_AGENT_ID_LEADERSHIP,
  culture: process.env.ELEVENLABS_AGENT_ID_CULTURE,
  presales: process.env.ELEVENLABS_AGENT_ID_PRESALES,
};

export function getServerAgentId(fn: DiagnosticFunction): string | undefined {
  return SERVER_AGENT_ENV[fn];
}

/**
 * Reverse-lookup: which function does this shared agent id belong to? Agents are
 * global (one per function), configured either in Admin → Agent configuration
 * (Firestore) or via the ELEVENLABS_AGENT_ID_* env vars. Used by the
 * conversation-init webhook to scope a caller's memory to the right section.
 * Firestore config takes precedence, then env defaults. Undefined if no match.
 */
export async function functionForAgentId(
  agentId: string,
): Promise<DiagnosticFunction | undefined> {
  const target = agentId.trim();
  if (!target) return undefined;

  const global = await getGlobalAgentConfig();
  for (const [fn, id] of Object.entries(global.agentIds ?? {}) as [
    DiagnosticFunction,
    string | undefined,
  ][]) {
    if (id?.trim() === target) return fn;
  }
  for (const [fn, id] of Object.entries(SERVER_AGENT_ENV) as [
    DiagnosticFunction,
    string | undefined,
  ][]) {
    if (id?.trim() === target) return fn;
  }
  return undefined;
}

/**
 * Resolve the shared agent id for a function. Priority:
 *   1. Global Firestore config (set in Admin → Agent configuration)
 *   2. Env var fallback (ELEVENLABS_AGENT_ID_*)
 */
export async function resolveAgentId(
  fn: DiagnosticFunction,
): Promise<string | undefined> {
  const global = await getGlobalAgentConfig();
  const fromFirestore = global.agentIds?.[fn];
  if (fromFirestore?.trim()) return fromFirestore.trim();
  return getServerAgentId(fn);
}

export function elevenLabsApiConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

/**
 * Mint a short-lived signed WebSocket URL for a browser voice session with the
 * given agent. This keeps the agent private — the ELEVENLABS_API_KEY never
 * leaves the server; the browser only ever sees the time-limited signed URL.
 */
export async function getSignedUrl(agentId: string): Promise<string> {
  const data = await apiGet<{ signed_url?: string }>(
    `/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
  );
  if (!data.signed_url) {
    throw new ElevenLabsError(
      "ElevenLabs did not return a signed URL for this agent.",
    );
  }
  return data.signed_url;
}

export class ElevenLabsError extends Error {}

export interface ConversationSummary {
  conversationId: string;
  title: string;
  durationSeconds: number;
  startedAt: string | null;
  turns: number;
}

interface RawConversationListItem {
  conversation_id: string;
  agent_id?: string;
  agent_name?: string;
  start_time_unix_secs?: number;
  call_duration_secs?: number;
  message_count?: number;
  status?: string;
}

interface RawTranscriptEntry {
  role?: string;
  message?: string | null;
  time_in_call_secs?: number;
}

async function apiGet<T>(path: string): Promise<T> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new ElevenLabsError(
      "ELEVENLABS_API_KEY is not set. Add it to .env.local to pull transcripts.",
    );
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "xi-api-key": key },
    // Conversations change as new calls land — never cache.
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ElevenLabsError(
      `ElevenLabs API ${res.status}: ${detail || res.statusText}`,
    );
  }
  return (await res.json()) as T;
}

function stamp(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * List an agent's conversations that ran for at least `minMinutes`, newest
 * first. Pages through the API until exhausted (capped to avoid runaway loops).
 */
export async function listLongConversations(
  fn: DiagnosticFunction,
  minMinutes: number = DEFAULT_MIN_MINUTES,
): Promise<ConversationSummary[]> {
  // Firestore global config → env var.
  const agentId = await resolveAgentId(fn);
  if (!agentId) {
    throw new ElevenLabsError(
      `No ElevenLabs agent id configured for "${fn}". Set it in Admin → Agent configuration, or set ELEVENLABS_AGENT_ID_${fn.toUpperCase()}.`,
    );
  }

  const minSeconds = minMinutes * 60;
  const collected: ConversationSummary[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const params = new URLSearchParams({
      agent_id: agentId,
      page_size: "100",
    });
    if (cursor) params.set("cursor", cursor);

    const data = await apiGet<{
      conversations: RawConversationListItem[];
      next_cursor?: string | null;
      has_more?: boolean;
    }>(`/convai/conversations?${params.toString()}`);

    for (const c of data.conversations ?? []) {
      // Only import completed conversations.
      if (c.status && c.status !== "done") continue;
      const duration = c.call_duration_secs ?? 0;
      if (minSeconds > 0 && duration < minSeconds) continue;
      const date = c.start_time_unix_secs
        ? new Date(c.start_time_unix_secs * 1000)
        : null;
      const dateStr = date
        ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;
      collected.push({
        conversationId: c.conversation_id,
        title: dateStr
          ? `${c.agent_name?.trim() || fn} · ${dateStr}`
          : c.agent_name?.trim() || `Conversation ${c.conversation_id.slice(0, 8)}`,
        durationSeconds: duration,
        startedAt: date ? date.toISOString() : null,
        turns: c.message_count ?? 0,
      });
    }

    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
    pages += 1;
  } while (cursor && pages < 20);

  return collected.sort((a, b) => {
    const at = a.startedAt ? Date.parse(a.startedAt) : 0;
    const bt = b.startedAt ? Date.parse(b.startedAt) : 0;
    return bt - at;
  });
}

function mapRole(role?: string): Speaker {
  return role === "user" ? "user" : "agent";
}

/** Fetch one conversation and convert its transcript to TranscriptTurn[]. */
export async function fetchConversationTranscript(
  conversationId: string,
): Promise<{
  turns: TranscriptTurn[];
  durationSeconds: number;
  callerPhone?: string;
}> {
  const data = await apiGet<{
    transcript?: RawTranscriptEntry[];
    metadata?: {
      call_duration_secs?: number;
      start_time_unix_secs?: number;
      phone_call?: { external_number?: string };
    };
    user_id?: string;
  }>(`/convai/conversations/${conversationId}`);

  const turns: TranscriptTurn[] = (data.transcript ?? [])
    .filter((t) => typeof t.message === "string" && t.message.trim())
    .map((t) => ({
      speaker: mapRole(t.role),
      text: (t.message ?? "").trim(),
      timestamp: stamp(t.time_in_call_secs ?? 0),
    }));

  // The inbound caller's number lives on the phone-call metadata (Twilio/SIP).
  // Fall back to user_id, which ElevenLabs also sets to the caller number.
  const callerPhone =
    data.metadata?.phone_call?.external_number?.trim() ||
    data.user_id?.trim() ||
    undefined;

  return {
    turns,
    durationSeconds: data.metadata?.call_duration_secs ?? 0,
    callerPhone,
  };
}
