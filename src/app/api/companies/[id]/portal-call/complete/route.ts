import { NextResponse } from "next/server";

import { apiRequireCompanyAccess } from "@/lib/auth";
import {
  ElevenLabsError,
  fetchConversationTranscript,
} from "@/lib/elevenlabs-transcripts";
import { FRAMEWORKS } from "@/lib/frameworks";
import { createSectionSession, getCompany, listSectionSessions } from "@/lib/store";
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/companies/:id/portal-call/complete
 *
 * Called when an in-browser voice interview ends. Pulls the just-finished
 * conversation's transcript from ElevenLabs and imports it into the section as
 * a draft (same shape as phone-call auto-imports), ready for the consultant to
 * analyse. Unlike the admin-only bulk import route, this is company-scoped so a
 * client can finalise their own interview.
 *
 * ElevenLabs needs a moment to finalise the transcript after a call ends, so we
 * retry briefly. If it's still not ready, we report `pending` and the periodic
 * section auto-sync will eventually catch it.
 *
 * Body: { fn: DiagnosticFunction, conversationId: string }
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const gate = await apiRequireCompanyAccess(params.id);
  if ("response" in gate) return gate.response;

  let body: { fn?: unknown; conversationId?: unknown };
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

  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId.trim() : "";
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required." },
      { status: 400 },
    );
  }

  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  // Idempotency: this conversation may already have been imported (double
  // submit, or a prior sync). Return the existing draft instead of duplicating.
  const existing = await listSectionSessions(params.id, fn);
  const already = existing.find((s) => s.sourceConversationId === conversationId);
  if (already) {
    return NextResponse.json({ session: already, deduped: true });
  }

  // Poll briefly for the finalised transcript.
  let turns: Awaited<ReturnType<typeof fetchConversationTranscript>>["turns"] =
    [];
  let callerPhone: string | undefined;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const pulled = await fetchConversationTranscript(conversationId);
      if (pulled.turns.length) {
        turns = pulled.turns;
        callerPhone = pulled.callerPhone;
        break;
      }
    } catch (err) {
      // 404 / not-ready yet — keep waiting. Surface other errors after retries.
      if (attempt === 5 && err instanceof ElevenLabsError) {
        return NextResponse.json(
          { pending: true, conversationId, note: err.message },
          { status: 202 },
        );
      }
    }
    await sleep(1500);
  }

  if (!turns.length) {
    // Still processing — let the caller know it will import shortly.
    return NextResponse.json({ pending: true, conversationId }, { status: 202 });
  }

  const session = await createSectionSession(params.id, fn, {
    id: `imp-${params.id}-${conversationId}`,
    title: `Voice interview ${new Date().toLocaleDateString("en-GB")}`,
    transcript: turns,
    sourceConversationId: conversationId,
    sourceCallerPhone: callerPhone,
    status: "draft",
    selectedFrameworks: FRAMEWORKS.map((f) => f.name),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Could not save the interview transcript." },
      { status: 500 },
    );
  }

  return NextResponse.json({ session });
}
