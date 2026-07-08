import { notFound } from "next/navigation";

import { CompanyDashboardClient } from "@/components/company/CompanyDashboardClient";
import { assertCompanyAccess } from "@/lib/auth";
import { FRAMEWORKS, FUNCTIONS, frameworksForFunction } from "@/lib/frameworks";
import { getCompany, listSessionsByCompany } from "@/lib/store";
import { maturityFromScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompanyPage({
  params,
}: {
  params: { id: string };
}) {
  // Admins see any company; clients only their own (foreign IDs → notFound).
  const user = await assertCompanyAccess(params.id);
  const isAdmin = user.role === "admin";

  const company = await getCompany(params.id);
  if (!company) notFound();

  const sessions = await listSessionsByCompany(company.id);
  const completed = sessions.filter((s) => s.status === "complete" && s.result);

  // One card per business function — each can hold many uploaded transcripts.
  const sections = FUNCTIONS.map((f) => {
    const own = sessions.filter((s) => s.function === f.id);
    const ownCompleted = own.filter((s) => s.status === "complete" && s.result);
    const avg =
      ownCompleted.length > 0
        ? Math.round(
            ownCompleted.reduce((a, s) => a + (s.result?.overallScore ?? 0), 0) /
              ownCompleted.length,
          )
        : null;
    // Per-section framework averages — only the frameworks relevant to THIS
    // function, so an IT section isn't padded with Legal/Finance rows.
    const frameworks = frameworksForFunction(f.id).map((fw) => {
      const scores = ownCompleted
        .map(
          (s) =>
            s.result?.frameworks.find((x) => x.framework === fw.name)?.score,
        )
        .filter((n): n is number => typeof n === "number");
      const score = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      return { name: fw.name, short: fw.short, score };
    });

    return {
      fn: f.id,
      label: f.label,
      agentName: f.agentName,
      agentTitle: f.agentTitle,
      blurb: f.blurb,
      probesFor: f.probesFor,
      avgScore: avg,
      maturity: avg != null ? maturityFromScore(avg) : null,
      frameworks,
      importedConversationIds: [
        ...own
          .map((s) => s.sourceConversationId)
          .filter((id): id is string => typeof id === "string"),
        ...(company.dismissedConversationIds ?? []),
      ],
      transcripts: own.map((s) => ({
        sessionId: s.id,
        title: s.title ?? "Untitled transcript",
        status: s.status,
        score: s.result?.overallScore ?? null,
        turns: s.transcript.length,
        createdAt: s.createdAt,
      })),
    };
  });

  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((a, s) => a + (s.result?.overallScore ?? 0), 0) /
            completed.length,
        )
      : 0;

  const totalRisks = completed.reduce(
    (a, s) => a + (s.result?.risks.length ?? 0),
    0,
  );
  const criticalRisks = completed.reduce(
    (a, s) =>
      a +
      (s.result?.risks.filter((r) => r.severity === "critical").length ?? 0),
    0,
  );
  const sectionsScored = sections.filter((s) => s.avgScore != null).length;

  // Company radar: only frameworks that have at least one score across the
  // company's completed diagnostics (functions score different frameworks now,
  // so showing the whole catalogue would leave most axes empty).
  const radarData = FRAMEWORKS.map((f) => {
    const scores = completed
      .map(
        (s) => s.result?.frameworks.find((x) => x.framework === f.name)?.score,
      )
      .filter((n): n is number => typeof n === "number");
    if (!scores.length) return null;
    const current = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { label: f.short, current, benchmark: 58 };
  }).filter((d): d is { label: string; current: number; benchmark: number } =>
    d !== null,
  );

  return (
    <CompanyDashboardClient
      company={company}
      sections={sections}
      radarData={radarData}
      readOnly={!isAdmin}
      aggregates={{
        avgScore,
        completedCount: completed.length,
        sectionsScored,
        sectionsTotal: sections.length,
        totalRisks,
        criticalRisks,
      }}
    />
  );
}
