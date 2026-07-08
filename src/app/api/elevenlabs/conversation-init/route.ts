import { createHmac, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { buildCompanyBrief } from "@/lib/conversation-memory";
import { functionForAgentId } from "@/lib/elevenlabs-transcripts";
import {
  getCompany,
  getPhoneMapping,
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
  "finance",
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
      caller_phone: "",
      caller_name: "",
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

  // Resolve function from the shared agent_id so we can scope memory to the
  // right section (agents are global, one per function).
  let fn: DiagnosticFunction | undefined;
  if (body.agent_id) {
    fn = await functionForAgentId(body.agent_id);
  }
  const passedFn =
    body.function ?? (body.dynamic_variables?.function as string | undefined);
  if (!fn && passedFn && VALID_FUNCTIONS.includes(passedFn as DiagnosticFunction)) {
    fn = passedFn as DiagnosticFunction;
  }

  // Company is resolved by phone number only — memory is tied to the caller's
  // registered number, not the agent. An unregistered number always gets a clean
  // slate so callers never see each other's history.
  let companyId: string | undefined;
  let callerName: string | undefined;

  if (body.caller_id) {
    const mapping = await getPhoneMapping(body.caller_id);
    if (mapping) {
      companyId = mapping.companyId;
      callerName = mapping.label;
    }
  }

  // No registered phone — start fresh. Call still connects, just no history.
  if (!companyId) {
    console.info(
      `[convai-init] Unregistered caller — phone="${body.caller_id ?? ""}", ` +
        `agent_id="${body.agent_id ?? ""}". Returning empty history.`,
    );
    return emptyResponse();
  }

  const company = await getCompany(companyId);
  const companyName = company?.name ?? "";

  try {
    const allSessions = await listSessionsByCompany(companyId);

    // Zone 1 is company-wide for the current function: recall every interview in
    // this function for the company, so a caller also hears what colleagues (and
    // text-imported transcripts) covered. Sessions from a *different* caller are
    // labeled "[from colleague: +44…]" inside the brief so the agent references
    // them as someone else's input rather than the current caller's own history.
    // (Zone 2 — other-function maturity — is a company-wide aggregate too.)
    const functionSessions = fn
      ? allSessions.filter((s) => s.function === fn)
      : [];

    const memory = fn
      ? buildCompanyBrief({
          companyName,
          fn,
          functionSessions,
          allSessions,
          currentCallerPhone: body.caller_id,
        })
      : "";

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
