import type { DiagnosticSession } from "./types";

/**
 * Conversation memory for ElevenLabs Conversational AI agents.
 *
 * The interviews run on ElevenLabs (phone / widget / SDK). By default each call
 * starts cold — the agent has no recollection of prior conversations with the
 * same client. To give continuity, we inject a compact summary of the client's
 * previous diagnostics into the agent's system prompt at conversation start,
 * via the Conversation Initiation webhook (see
 * `/api/elevenlabs/conversation-init`). ElevenLabs substitutes it into the
 * `{{conversation_history}}` dynamic variable in the agent prompt template.
 *
 * We prefer the *analysed* result (executive summary + top risks) over raw
 * transcript text: it's far more information-dense per token, and it's what a
 * human consultant would actually remember going into the next conversation.
 */

const MAX_PRIOR_SESSIONS = 2;
const MAX_RISKS_PER_SESSION = 2;
const TRANSCRIPT_FALLBACK_TURNS = 6;
const MAX_SUMMARY_CHARS = 200; // exec summary truncation per session
const MAX_TOTAL_CHARS = 1800;  // hard cap so ElevenLabs variable limit isn't hit

function summariseSession(session: DiagnosticSession): string | null {
  const date = new Date(session.createdAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Preferred: use the scored result — dense and already distilled.
  if (session.result) {
    const r = session.result;
    const parts: string[] = [];
    parts.push(
      `Overall maturity: ${r.overallScore}/100 (${r.overallMaturityLevel}).`,
    );
    if (r.executiveSummary) {
      const summary = r.executiveSummary.trim();
      parts.push(
        summary.length > MAX_SUMMARY_CHARS
          ? summary.slice(0, MAX_SUMMARY_CHARS).trimEnd() + "…"
          : summary,
      );
    }
    if (r.risks?.length) {
      const risks = r.risks
        .slice(0, MAX_RISKS_PER_SESSION)
        .map((risk) => `- ${risk.title} (${risk.severity})`)
        .join("\n");
      parts.push(`Key risks raised:\n${risks}`);
    }
    return `### ${date}\n${parts.join("\n")}`;
  }

  // Fallback: a trimmed slice of the raw transcript.
  const turns = session.transcript ?? [];
  if (!turns.length) return null;
  const slice = turns
    .slice(0, TRANSCRIPT_FALLBACK_TURNS)
    .map((t) => `${t.speaker === "agent" ? "Agent" : "Client"}: ${t.text}`)
    .join("\n");
  const truncated =
    turns.length > TRANSCRIPT_FALLBACK_TURNS ? "\n… (transcript truncated)" : "";
  return `### ${date}\n${slice}${truncated}`;
}

/**
 * Build the conversation-history string injected into the agent prompt. Takes
 * the client's prior sessions (any function, or scoped to one — caller decides),
 * newest first, and returns an empty string when there's nothing to recall.
 */
export function buildConversationMemory(
  priorSessions: DiagnosticSession[],
): string {
  const summaries = [...priorSessions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, MAX_PRIOR_SESSIONS)
    .map(summariseSession)
    .filter((s): s is string => Boolean(s));

  if (!summaries.length) return "";

  const body = [
    "Prior conversations (newest first):",
    summaries.join("\n\n"),
    "Reference these naturally. Don't re-ask covered topics unless probing deeper.",
  ].join("\n");

  return body.length > MAX_TOTAL_CHARS
    ? body.slice(0, MAX_TOTAL_CHARS).trimEnd() + "…"
    : body;
}

/**
 * Concatenate the memory context onto a base system prompt (used when the
 * platform itself initiates a conversation via the browser SDK and controls the
 * prompt directly, rather than relying on the webhook + template variable).
 */
export function injectMemoryIntoPrompt(
  baseSystemPrompt: string,
  memoryContext: string,
): string {
  if (!memoryContext) return baseSystemPrompt;
  return `${baseSystemPrompt}\n\n${memoryContext}`;
}
