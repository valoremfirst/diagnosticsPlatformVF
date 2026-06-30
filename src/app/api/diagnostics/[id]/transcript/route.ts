import { NextResponse } from "next/server";

import { getSession, setTranscript, updateSession } from "@/lib/store";
import type { TranscriptTurn } from "@/lib/types";

// POST /api/diagnostics/:id/transcript — store the captured transcript.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: { transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.transcript)) {
    return NextResponse.json(
      { error: "transcript must be an array of turns." },
      { status: 400 },
    );
  }

  const transcript = (body.transcript as TranscriptTurn[]).filter(
    (t) => t && typeof t.text === "string",
  );

  await setTranscript(params.id, transcript);
  await updateSession(params.id, { status: "processing" });

  return NextResponse.json({ ok: true, turns: transcript.length });
}
