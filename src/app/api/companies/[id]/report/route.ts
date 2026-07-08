import { NextResponse } from "next/server";

import { apiRequireAdmin } from "@/lib/auth";
import { generateCompanyReport } from "@/lib/company-report";
import { getCompany, listSessionsByCompany, updateCompany } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/companies/:id/report
 *
 * Generates (or regenerates) the company-wide AI executive report by
 * synthesising every analysed diagnostic for the company, then caches it on the
 * company record. Admin-only: it's a consultant deliverable and costs a Gemini
 * call. Clients read the cached report from the dashboard.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const sessions = await listSessionsByCompany(company.id);
  const completed = sessions.filter((s) => s.status === "complete" && s.result);
  if (completed.length === 0) {
    return NextResponse.json(
      {
        error:
          "No analysed diagnostics yet. Import and analyse at least one transcript before generating a report.",
      },
      { status: 409 },
    );
  }

  try {
    const report = await generateCompanyReport(company, completed);
    await updateCompany(company.id, { report });
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { error: "Report generation failed. Please retry." },
      { status: 502 },
    );
  }
}
