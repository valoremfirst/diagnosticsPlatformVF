import { NextResponse } from "next/server";

import { apiRequireAdmin } from "@/lib/auth";
import { createSession, listSessions } from "@/lib/store";
import type { DiagnosticFunction } from "@/lib/types";

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

// GET /api/diagnostics — list all diagnostic sessions (admin only).
export async function GET() {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;
  return NextResponse.json({ sessions: await listSessions() });
}

// POST /api/diagnostics — start a new diagnostic (admin only).
export async function POST(req: Request) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const companyName = String(body.companyName ?? "").trim();
  const fn = String(body.function ?? "") as DiagnosticFunction;

  if (!companyName) {
    return NextResponse.json(
      { error: "companyName is required." },
      { status: 400 },
    );
  }
  if (!VALID_FUNCTIONS.includes(fn)) {
    return NextResponse.json(
      { error: `function must be one of: ${VALID_FUNCTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const session = await createSession({
    companyName,
    function: fn,
    status: "draft",
    clientContact: body.clientContact ? String(body.clientContact) : undefined,
    sector: body.sector ? String(body.sector) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
    selectedFrameworks: Array.isArray(body.selectedFrameworks)
      ? (body.selectedFrameworks as string[])
      : [],
  });

  return NextResponse.json({ session }, { status: 201 });
}
