import { FUNCTIONS } from "./frameworks";
import type { DiagnosticFunction, DiagnosticSession } from "./types";

/**
 * Conversation memory for ElevenLabs Conversational AI agents.
 *
 * Agents are shared — one per business function, used across every client — so
 * an agent has no built-in notion of who it's talking to. To give continuity we
 * inject a compact brief of the client's history into the agent's prompt at
 * conversation start, via the `{{conversation_history}}` dynamic variable:
 *   - Phone / SIP calls: the conversation-init webhook resolves the client from
 *     the caller's registered phone number.
 *   - In-browser portal calls: the route already knows the company (from the
 *     URL + authenticated user), so it builds the brief directly.
 *
 * The brief is deliberately two-zone and tightly budgeted so it fits inside the
 * dynamic-variable limit:
 *   Zone 1 — the function under review: the last couple of interviews in detail
 *            (score, summary, top risks + recommendations).
 *   Zone 2 — every other function: a single latest-maturity line each, so the
 *            agent has cross-functional context without the token cost.
 *
 * We prefer the *analysed* result over raw transcript text — it's far denser per
 * token and it's what a human consultant would actually carry into the next call.
 */

const MAX_DETAIL_SESSIONS = 2; // zone-1 interviews shown in full
const MAX_RISKS_PER_SESSION = 2;
const MAX_RECS_PER_SESSION = 2;
const MAX_SUMMARY_CHARS = 240;
const TRANSCRIPT_FALLBACK_TURNS = 6;
const MAX_TOTAL_CHARS = 1600; // hard cap so ElevenLabs variable limit isn't hit

const FUNCTION_LABELS: Record<DiagnosticFunction, string> = FUNCTIONS.reduce(
  (acc, f) => {
    acc[f.id] = f.label;
    return acc;
  },
  {} as Record<DiagnosticFunction, string>,
);

function labelFor(fn: DiagnosticFunction): string {
  return FUNCTION_LABELS[fn] ?? fn;
}

function newestFirst(sessions: DiagnosticSession[]): DiagnosticSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// Mirror store.normalisePhone: keep a leading "+", strip other non-digits. Kept
// local so this pure brief-builder doesn't pull in the store module.
function normalisePhone(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** One detailed zone-1 entry for a single prior interview. */
function detailSession(
  session: DiagnosticSession,
  currentCallerPhone?: string,
): string | null {
  const date = formatDate(session.createdAt);

  // Label this session if it's from a different caller than the current one.
  const isFromOtherCaller =
    currentCallerPhone &&
    session.sourceCallerPhone &&
    normalisePhone(currentCallerPhone) !==
      normalisePhone(session.sourceCallerPhone);
  const callerLabel = isFromOtherCaller
    ? ` [from colleague: ${session.sourceCallerPhone}]`
    : "";

  if (session.result) {
    const r = session.result;
    const parts: string[] = [
      `${date}${callerLabel} — maturity ${r.overallScore}/100 (${r.overallMaturityLevel}).`,
    ];
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
        .map((risk) => `- Risk: ${risk.title} (${risk.severity})`)
        .join("\n");
      parts.push(risks);
    }
    if (r.recommendations?.length) {
      const recs = r.recommendations
        .slice(0, MAX_RECS_PER_SESSION)
        .map((rec) => `- Rec: ${rec.title}`)
        .join("\n");
      parts.push(recs);
    }
    return parts.join("\n");
  }

  // Fallback: a trimmed slice of the raw transcript when not yet analysed.
  const turns = session.transcript ?? [];
  if (!turns.length) return null;
  const slice = turns
    .slice(0, TRANSCRIPT_FALLBACK_TURNS)
    .map((t) => `${t.speaker === "agent" ? "Agent" : "Client"}: ${t.text}`)
    .join("\n");
  const truncated =
    turns.length > TRANSCRIPT_FALLBACK_TURNS ? "\n… (transcript truncated)" : "";
  return `${date}${callerLabel} — (not yet analysed)\n${slice}${truncated}`;
}

/** One zone-2 line: latest analysed maturity for another function. */
function otherFunctionLines(
  currentFn: DiagnosticFunction,
  allSessions: DiagnosticSession[],
): string[] {
  const latestByFn = new Map<DiagnosticFunction, DiagnosticSession>();
  for (const s of newestFirst(allSessions)) {
    if (s.function === currentFn) continue;
    if (!s.result) continue;
    if (!latestByFn.has(s.function)) latestByFn.set(s.function, s);
  }
  return [...latestByFn.entries()].map(
    ([fn, s]) => `${labelFor(fn)} ${s.result!.overallScore}/100`,
  );
}

/**
 * Build the `conversation_history` brief injected into a shared agent's prompt.
 *
 * @param companyName      Client display name.
 * @param fn               The function this agent is interviewing for (zone 1).
 * @param functionSessions Prior sessions for this function to detail in zone 1.
 *                         (Callers scope this — e.g. per-caller for phone calls.)
 * @param allSessions      Company-wide sessions used to derive zone-2 maturity
 *                         lines for the other functions.
 * @param currentCallerPhone Optional: the phone number of the caller on this call.
 *                          If provided, sessions from other callers are labeled
 *                          as "[from colleague: +44...]" so the agent knows to
 *                          reference them as external input.
 *
 * Returns "" when there's nothing worth recalling.
 */
export function buildCompanyBrief({
  companyName,
  fn,
  functionSessions,
  allSessions,
  currentCallerPhone,
}: {
  companyName: string;
  fn: DiagnosticFunction;
  functionSessions: DiagnosticSession[];
  allSessions: DiagnosticSession[];
  currentCallerPhone?: string;
}): string {
  const detailed = newestFirst(functionSessions)
    .slice(0, MAX_DETAIL_SESSIONS)
    .map((s) => detailSession(s, currentCallerPhone))
    .filter((s): s is string => Boolean(s));

  const others = otherFunctionLines(fn, allSessions);

  if (!detailed.length && !others.length) return "";

  const label = labelFor(fn);
  const parts: string[] = [
    `Client: ${companyName || "this client"}. Function under review: ${label}.`,
  ];

  if (detailed.length) {
    parts.push(
      `Prior ${label} interviews (newest first):\n${detailed.join("\n\n")}`,
    );
  } else {
    parts.push(`No prior ${label} interviews on record — this is the first.`);
  }

  if (others.length) {
    parts.push(`Other functions assessed: ${others.join(" · ")}.`);
  }

  parts.push(
    "Reference prior findings naturally. Probe progress on open risks rather " +
      "than re-asking covered ground.",
  );

  const body = parts.join("\n\n");
  return body.length > MAX_TOTAL_CHARS
    ? body.slice(0, MAX_TOTAL_CHARS).trimEnd() + "…"
    : body;
}
