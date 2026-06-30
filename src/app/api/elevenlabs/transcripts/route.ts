import { NextResponse } from "next/server";

import {
  ElevenLabsError,
  elevenLabsApiConfigured,
  listLongConversations,
} from "@/lib/elevenlabs-transcripts";
import type { DiagnosticFunction } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_FUNCTIONS: DiagnosticFunction[] = [
  "finance",
  "hr",
  "sales",
  "operations",
  "it",
  "leadership",
];

// GET /api/elevenlabs/transcripts?fn=finance&minMinutes=15
// Lists the agent's conversations over the minimum duration, ready to import.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fn = searchParams.get("fn") as DiagnosticFunction | null;
  const minMinutes = Number(searchParams.get("minMinutes") ?? "15");

  if (!fn || !VALID_FUNCTIONS.includes(fn)) {
    return NextResponse.json(
      { error: `fn must be one of: ${VALID_FUNCTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  if (!elevenLabsApiConfigured()) {
    return NextResponse.json(
      {
        error:
          "ElevenLabs is not configured. Add ELEVENLABS_API_KEY and the agent ids to .env.local (see docs/ELEVENLABS_TRANSCRIPTS.md).",
      },
      { status: 503 },
    );
  }

  try {
    const conversations = await listLongConversations(
      fn,
      Number.isFinite(minMinutes) ? minMinutes : 15,
    );
    return NextResponse.json({ conversations });
  } catch (err) {
    const message =
      err instanceof ElevenLabsError
        ? err.message
        : "Failed to fetch conversations from ElevenLabs.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
