import { NextResponse } from "next/server";

import { apiRequireCompanyAccess } from "@/lib/auth";
import { buildCompanyBrief } from "@/lib/conversation-memory";
import {
  elevenLabsApiConfigured,
  ElevenLabsError,
  getSignedUrl,
  resolveAgentByKey,
  resolveAgentId,
} from "@/lib/elevenlabs-transcripts";
import { getCompany, listSessionsByCompany } from "@/lib/store";
import type { DiagnosticFunction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_FUNCTIONS: DiagnosticFunction[] = [
  "finance",
  "legal",
  "it",
  "operational-delivery",
  "sales",
  "leadership",
  "culture",
  "presales",
];

/**
 * POST /api/companies/:id/portal-call
 *
 * Starts an in-browser voice interview: resolves the company's agent for the
 * given function, mints a short-lived signed URL, and returns the dynamic
 * variables the agent prompt expects. Both admins (consultants) and the owning
 * client can start a call. Memory is deliberately company-name-only — no prior
 * history is injected — to preserve the per-caller isolation used for phone
 * calls (a browser session has no caller phone number).
 *
 * Body: { fn: DiagnosticFunction }
 * Returns: { signedUrl, agentId, dynamicVariables }
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const gate = await apiRequireCompanyAccess(params.id);
  if ("response" in gate) return gate.response;

  if (!elevenLabsApiConfigured()) {
    return NextResponse.json(
      { error: "ElevenLabs is not configured on the server." },
      { status: 503 },
    );
  }

  let body: { fn?: unknown; agentKey?: unknown; priorTurns?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // `agentKey` (e.g. "george") takes precedence over `fn` for resolving the
  // ElevenLabs agent — it lets the general agent use its own dedicated agent ID
  // without needing to be a DiagnosticFunction. The transcript still imports
  // under `fn` (the function that best fits the conversation).
  const agentKey = typeof body.agentKey === "string" ? body.agentKey.trim() : null;

  const fn = body.fn as DiagnosticFunction;
  if (!VALID_FUNCTIONS.includes(fn)) {
    return NextResponse.json(
      { error: `fn must be one of: ${VALID_FUNCTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const agentId = agentKey
    ? await resolveAgentByKey(agentKey)
    : await resolveAgentId(fn);
  if (!agentId) {
    const label = agentKey ?? fn;
    return NextResponse.json(
      {
        error: `No ElevenLabs agent is configured for "${label}". Set one in Admin → Agent configuration.`,
      },
      { status: 400 },
    );
  }

  // Build the client's history brief. A browser session has no caller phone, so
  // zone 1 covers all of this company's interviews in the function (not
  // per-caller) — the company is already established by the authenticated route.
  let conversationHistory = "";
  try {
    const allSessions = await listSessionsByCompany(params.id);
    const functionSessions = allSessions.filter((s) => s.function === fn);
    conversationHistory = buildCompanyBrief({
      companyName: company.name,
      fn,
      functionSessions,
      allSessions,
    });
  } catch {
    // Never block the call on memory — start cold if the brief can't be built.
    conversationHistory = "";
  }

  // Live handoff context: when a general agent (George) transfers the caller
  // mid-call, the browser forwards the tail of that conversation so the
  // specialist can pick up naturally instead of starting cold.
  const handoffContext = buildHandoffContext(body.priorTurns);
  if (handoffContext) {
    conversationHistory = conversationHistory
      ? `${handoffContext}\n\n${conversationHistory}`
      : handoffContext;
  }

  try {
    const signedUrl = await getSignedUrl(agentId);
    return NextResponse.json({
      signedUrl,
      agentId,
      // The agent prompt references these; every one must be supplied or the
      // conversation fails to start.
      dynamicVariables: {
        client_company: company.name,
        caller_name: gate.user.email ?? "",
        caller_phone: "",
        conversation_history: conversationHistory,
      },
    });
  } catch (err) {
    const message =
      err instanceof ElevenLabsError
        ? err.message
        : "Could not start the voice session.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * Turn the tail of a handed-over conversation into a short context block for the
 * specialist's prompt. Tolerant of malformed input — returns "" for anything
 * that isn't a usable list of turns.
 */
function buildHandoffContext(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "";
  const lines = raw
    .filter(
      (t): t is { speaker?: unknown; text?: unknown } =>
        typeof t === "object" && t !== null,
    )
    .map((t) => ({
      speaker: t.speaker === "user" ? "Client" : "General consultant",
      text: typeof t.text === "string" ? t.text.trim() : "",
    }))
    .filter((t) => t.text.length > 0)
    .slice(-10)
    .map((t) => `${t.speaker}: ${t.text}`);

  if (lines.length === 0) return "";

  return [
    "HANDOFF: The client was just speaking with the general consultant (George), who has transferred them to you. Pick up warmly where they left off — do not restart or repeat questions already covered. Here is the tail of that conversation:",
    ...lines,
  ].join("\n");
}
