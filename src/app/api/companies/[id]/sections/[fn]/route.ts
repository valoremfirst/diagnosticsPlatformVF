import { NextResponse } from "next/server";

import {
  ElevenLabsError,
  fetchConversationTranscript,
} from "@/lib/elevenlabs-transcripts";
import { FRAMEWORKS } from "@/lib/frameworks";
import { analyseTranscript } from "@/lib/gemini";
import {
  createSectionSession,
  getCompany,
  listSectionSessions,
  setResult,
  updateSession,
} from "@/lib/store";
import { parseTranscriptText } from "@/lib/transcript";
import type { DiagnosticFunction, TranscriptTurn } from "@/lib/types";
import { ResultValidationError } from "@/lib/validation";

const VALID_FUNCTIONS: DiagnosticFunction[] = [
  "finance",
  "hr",
  "sales",
  "operations",
  "it",
  "leadership",
];

// GET /api/companies/:id/sections/:fn — list every transcript in the section.
export async function GET(
  _req: Request,
  { params }: { params: { id: string; fn: string } },
) {
  const fn = params.fn as DiagnosticFunction;
  if (!VALID_FUNCTIONS.includes(fn)) {
    return NextResponse.json({ error: "Unknown function." }, { status: 400 });
  }
  return NextResponse.json({
    sessions: await listSectionSessions(params.id, fn),
  });
}

// POST /api/companies/:id/sections/:fn — upload a transcript and analyse it
// with Gemini. Each upload creates a new diagnostic within the section.
// Body: { transcript: string | TranscriptTurn[], title?: string }
export async function POST(
  req: Request,
  { params }: { params: { id: string; fn: string } },
) {
  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const fn = params.fn as DiagnosticFunction;
  if (!VALID_FUNCTIONS.includes(fn)) {
    return NextResponse.json(
      { error: `function must be one of: ${VALID_FUNCTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  let body: {
    transcript?: unknown;
    title?: unknown;
    conversationId?: unknown;
    analyse?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Three input modes:
  //  - conversationId: auto-pull the transcript from ElevenLabs
  //  - transcript (string): raw pasted/uploaded text
  //  - transcript (array): pre-structured turns
  let transcript: TranscriptTurn[];
  if (typeof body.conversationId === "string" && body.conversationId.trim()) {
    try {
      const pulled = await fetchConversationTranscript(
        body.conversationId.trim(),
      );
      transcript = pulled.turns;
    } catch (err) {
      const message =
        err instanceof ElevenLabsError
          ? err.message
          : "Could not fetch the ElevenLabs conversation.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } else if (typeof body.transcript === "string") {
    transcript = parseTranscriptText(body.transcript);
  } else if (Array.isArray(body.transcript)) {
    transcript = (body.transcript as TranscriptTurn[]).filter(
      (t) => t && typeof t.text === "string",
    );
  } else {
    return NextResponse.json(
      {
        error:
          "Provide a conversationId, pasted transcript text, or an array of turns.",
      },
      { status: 400 },
    );
  }

  if (transcript.length === 0) {
    return NextResponse.json(
      { error: "Transcript is empty — paste or upload at least one exchange." },
      { status: 400 },
    );
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : `Transcript ${new Date().toLocaleDateString("en-GB")}`;

  // When `analyse` is explicitly false (e.g. bulk ElevenLabs imports), the
  // transcript is saved as a draft and scoring is deferred until the user
  // presses Analyse (POST /api/diagnostics/:id/analyse).
  const shouldAnalyse = body.analyse !== false;

  const session = await createSectionSession(params.id, fn, {
    title,
    transcript,
    status: shouldAnalyse ? "processing" : "draft",
    selectedFrameworks: FRAMEWORKS.map((f) => f.name),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Could not create the diagnostic." },
      { status: 500 },
    );
  }

  if (!shouldAnalyse) {
    return NextResponse.json({ session, source: null });
  }

  try {
    const { result, source } = await analyseTranscript(transcript, fn);
    const updated = await setResult(session.id, result);
    return NextResponse.json({ session: updated, source });
  } catch (err) {
    await updateSession(session.id, { status: "failed" });
    const message =
      err instanceof ResultValidationError
        ? `The analysis response was invalid: ${err.message}`
        : "Analysis failed. Please retry.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
