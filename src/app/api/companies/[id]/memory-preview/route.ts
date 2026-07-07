import { NextResponse } from "next/server";

import { apiRequireAdmin } from "@/lib/auth";
import { buildCompanyBrief } from "@/lib/conversation-memory";
import { getCompany, listSessionsByCompany } from "@/lib/store";
import type { DiagnosticFunction } from "@/lib/types";

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

/**
 * GET /api/companies/:id/memory-preview?fn=finance
 *
 * Returns the exact `{{conversation_history}}` brief a shared agent would
 * receive for this (company, function) — the same `buildCompanyBrief` output
 * used by the portal-call route. Admin-only: it aggregates every caller's
 * sessions, so it's a consultant verification tool, not a client-facing view.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const fn = searchParams.get("fn") as DiagnosticFunction | null;
  if (!fn || !VALID_FUNCTIONS.includes(fn)) {
    return NextResponse.json(
      { error: `fn must be one of: ${VALID_FUNCTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const allSessions = await listSessionsByCompany(params.id);
  const functionSessions = allSessions.filter((s) => s.function === fn);
  const brief = buildCompanyBrief({
    companyName: company.name,
    fn,
    functionSessions,
    allSessions,
  });

  return NextResponse.json({ brief });
}
