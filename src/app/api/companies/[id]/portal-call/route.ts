import { NextResponse } from "next/server";

import { apiRequireCompanyAccess } from "@/lib/auth";
import {
  elevenLabsApiConfigured,
  ElevenLabsError,
  getSignedUrl,
  resolveAgentId,
} from "@/lib/elevenlabs-transcripts";
import { getCompany } from "@/lib/store";
import type { DiagnosticFunction } from "@/lib/types";

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

  let body: { fn?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

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

  const agentId = await resolveAgentId(fn, company.agentIds?.[fn]);
  if (!agentId) {
    return NextResponse.json(
      {
        error: `No ElevenLabs agent is configured for "${fn}". Set one in Admin → Agent configuration.`,
      },
      { status: 400 },
    );
  }

  try {
    const signedUrl = await getSignedUrl(agentId);
    return NextResponse.json({
      signedUrl,
      agentId,
      // The agent prompt references these; every one must be supplied or the
      // conversation fails to start. History stays empty by design.
      dynamicVariables: {
        client_company: company.name,
        caller_name: gate.user.email ?? "",
        caller_phone: "",
        conversation_history: "",
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
