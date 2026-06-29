import { NextResponse } from "next/server";

import { analyseTranscript } from "@/lib/gemini";
import { getSession, setResult, updateSession } from "@/lib/store";
import { ResultValidationError } from "@/lib/validation";

// POST /api/diagnostics/:id/analyse — run framework scoring over the transcript.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!session.transcript || session.transcript.length === 0) {
    return NextResponse.json(
      { error: "No transcript available to analyse." },
      { status: 409 },
    );
  }

  try {
    const { result, source } = await analyseTranscript(
      session.transcript,
      session.function,
    );
    const updated = setResult(params.id, result);
    return NextResponse.json({ session: updated, source });
  } catch (err) {
    updateSession(params.id, { status: "failed" });
    const message =
      err instanceof ResultValidationError
        ? `The analysis response was invalid: ${err.message}`
        : "Analysis failed. Please retry.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
