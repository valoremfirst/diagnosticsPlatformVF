import { NextResponse } from "next/server";

import { getSession } from "@/lib/store";

// POST /api/diagnostics/:id/export — return the full diagnostic as a JSON
// report download. (PDF/branded export can be layered on later.)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    company: session.companyName,
    function: session.function,
    status: session.status,
    summary: session.result?.executiveSummary ?? null,
    overallScore: session.result?.overallScore ?? null,
    result: session.result ?? null,
    transcript: session.transcript,
  };

  const filename = `diagnostic-${session.id}.json`;
  return new NextResponse(JSON.stringify(report, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
