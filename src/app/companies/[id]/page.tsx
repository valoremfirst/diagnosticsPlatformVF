import { notFound } from "next/navigation";

import { CompanyDashboardClient } from "@/components/company/CompanyDashboardClient";
import { FRAMEWORKS, FUNCTIONS } from "@/lib/frameworks";
import { getCompany, listSessionsByCompany } from "@/lib/store";
import { maturityFromScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function CompanyPage({ params }: { params: { id: string } }) {
  const company = getCompany(params.id);
  if (!company) notFound();

  const sessions = listSessionsByCompany(company.id);
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
    return {
      fn: f.id,
      label: f.label,
      agentName: f.agentName,
      agentTitle: f.agentTitle,
      blurb: f.blurb,
      avgScore: avg,
      maturity: avg != null ? maturityFromScore(avg) : null,
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

  const radarData = FRAMEWORKS.map((f) => {
    const scores = completed
      .map(
        (s) => s.result?.frameworks.find((x) => x.framework === f.name)?.score,
      )
      .filter((n): n is number => typeof n === "number");
    const current = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    return { label: f.short, current, benchmark: 58 };
  });

  return (
    <CompanyDashboardClient
      company={company}
      sections={sections}
      radarData={radarData}
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
