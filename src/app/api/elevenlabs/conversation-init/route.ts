import { createHmac, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { buildConversationMemory } from "@/lib/conversation-memory";
import { functionForAgentId } from "@/lib/elevenlabs-transcripts";
import {
  findCompanyByAgentId,
  getCompany,
  getPhoneMapping,
  listSectionSessions,
  listSessionsByCompany,
} from "@/lib/store";
import type { DiagnosticFunction } from "@/lib/types";

/**
 * ElevenLabs Conversation Initiation webhook.
 *
 * ElevenLabs calls this endpoint the moment a conversation starts (phone call,
 * widget, or SDK). We identify the client from the `agent_id` (each company runs
 * its own per-function agents), compile a summary of their prior diagnostics,
 * and return it as the `conversation_history` dynamic variable. The agent's
 * system-prompt template references `{{conversation_history}}`, so the model
 * begins the call already knowing the client's history.
 *
 * Configure in ElevenLabs → Agent → Security/Advanced → "Fetch conversation
 * initiation data" webhook, pointing at:
 *   https://<your-domain>/api/elevenlabs/conversation-init
 * Set the shared secret as ELEVENLABS_CONVAI_WEBHOOK_SECRET so we can verify the
 * HMAC signature on every request.
 *
 * See docs/ELEVENLABS_MEMORY.md.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_FUNCTIONS: DiagnosticFunction[] = [
  "legal",
  "it",
  "operational-delivery",
  "sales",
  "leadership",
  "culture",
  "presales",
];

interface InitRequestBody {
  agent_id?: string;
  caller_id?: string;
  called_number?: string;
  call_sid?: string;
  // When the platform initiates via SDK it can pass client data through, which
  // ElevenLabs forwards here. We honour an explicit company_id/function if present.
  company_id?: string;
  function?: string;
  dynamic_variables?: Record<string, unknown>;
}

/**
 * Verify the ElevenLabs HMAC signature. Header format:
 *   ElevenLabs-Signature: t=<unix_seconds>,v0=<hex_hmac_sha256>
 * The signed payload is `${t}.${rawBody}`. Returns true when the signature is
 * valid, or when no secret is configured (dev convenience — logged as a warning).
 */
function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.ELEVENLABS_CONVAI_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[convai-init] ELEVENLABS_CONVAI_WEBHOOK_SECRET is not set — skipping " +
        "signature verification. Set it in production to secure this webhook.",
    );
    return true;
  }
  // ElevenLabs does not sign conversation-initiation requests — only post-call
  // webhooks carry a signature. Allow through when no header is present.
  if (!header) return true;

  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as { t?: string; v0?: string };

  if (!parts.t || !parts.v0) return false;

  // Reject stale timestamps (>30 min) to blunt replay attacks.
  const ts = Number(parts.t);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 1800) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${parts.t}.${rawBody}`)
    .digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(parts.v0, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Always-succeeds response shape ElevenLabs expects, with an empty history. */
function emptyResponse(extra?: Record<string, string>) {
  return NextResponse.json({
    type: "conversation_initiation_client_data",
    dynamic_variables: {
      conversation_history: "",
      client_company: "",
      ...extra,
    },
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sigHeader = req.headers.get("ElevenLabs-Signature");
  console.info("[convai-init] Incoming request. sig-header:", sigHeader, "body:", rawBody);

  if (!verifySignature(rawBody, sigHeader)) {
    console.warn("[convai-init] Signature verification FAILED.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: InitRequestBody;
  try {
    body = rawBody ? (JSON.parse(rawBody) as InitRequestBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  console.info("[convai-init] Raw body:", rawBody);

  // Identify the function and company independently.
  //
  // Function comes from the agent id: each per-function agent maps to exactly
  // one function, whether it's a company-specific agent (Company.agentIds) or a
  // shared/env agent (ELEVENLABS_AGENT_ID_*).
  //
  // Company is resolved by priority, most authoritative first:
  //   1. Explicit company_id passed as client data (SDK-initiated calls).
  //   2. The caller's phone number, looked up in the registry (real calls).
  //   3. A company-specific agent id (only unique when NOT a shared agent).
  //
  // Crucially, a *shared* agent + an *unregistered* phone resolves to NO
  // company, so a brand-new caller gets an empty history rather than inheriting
  // another client's — the whole point of the phone registry.
  let fn: DiagnosticFunction | undefined;
  let agentCompanyId: string | undefined;

  if (body.agent_id) {
    const match = await findCompanyByAgentId(body.agent_id);
    if (match) {
      fn = match.function;
      agentCompanyId = match.company.id; // company-specific agent
    } else {
      fn = functionForAgentId(body.agent_id); // shared/env agent → function only
    }
  }

  const passedFn =
    body.function ?? (body.dynamic_variables?.function as string | undefined);
  if (!fn && passedFn && VALID_FUNCTIONS.includes(passedFn as DiagnosticFunction)) {
    fn = passedFn as DiagnosticFunction;
  }

  // 1. Explicit company_id (SDK client data).
  let companyId: string | undefined;
  const passedCompany =
    body.company_id ?? (body.dynamic_variables?.company_id as string | undefined);
  if (passedCompany) {
    const company = await getCompany(passedCompany);
    if (company) companyId = company.id;
  }

  // 2. Caller phone number → registered company.
  let callerName: string | undefined;
  if (!companyId && body.caller_id) {
    const mapping = await getPhoneMapping(body.caller_id);
    if (mapping) {
      companyId = mapping.companyId;
      callerName = mapping.label;
    }
  }

  // 3. Company-specific agent id.
  if (!companyId) companyId = agentCompanyId;

  // Unknown caller — respond gracefully so the conversation still starts, but
  // with NO history (avoids leaking another client's context).
  if (!companyId) {
    console.warn(
      `[convai-init] Unresolved caller — agent_id="${body.agent_id ?? ""}", ` +
        `caller_id="${body.caller_id ?? ""}". Returning empty history.`,
    );
    return emptyResponse();
  }

  const company = await getCompany(companyId);
  const companyName = company?.name ?? "";

  try {
    // Scope memory to this agent's function when known; otherwise fall back to
    // the whole company so cross-function history is still available.
    const priorSessions = fn
      ? await listSectionSessions(companyId, fn)
      : await listSessionsByCompany(companyId);

    const memory = buildConversationMemory(priorSessions);

    return NextResponse.json({
      type: "conversation_initiation_client_data",
      dynamic_variables: {
        conversation_history: memory,
        client_company: companyName,
        caller_phone: body.caller_id ?? "",
        caller_name: callerName ?? "",
      },
    });
  } catch (err) {
    console.error("[convai-init] Failed to build memory:", err);
    return emptyResponse({ client_company: companyName });
  }
}
