import { notFound } from "next/navigation";

import {
  ClientAnalyticsView,
  type ClientRec,
  type ClientRisk,
} from "@/components/company/ClientAnalyticsView";
import {
  InterviewsClient,
  type InterviewItem,
  type InterviewStatus,
} from "@/components/company/InterviewsClient";
import { assertCompanyAccess } from "@/lib/auth";
import { FUNCTIONS, functionById } from "@/lib/frameworks";
import { getCompany, listSessionsByCompany } from "@/lib/store";
import { MATURITY_LABEL, maturityFromScore, SEVERITY_RANK } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default async function InterviewsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await assertCompanyAccess(params.id);

  const company = await getCompany(params.id);
  if (!company) notFound();

  const sessions = await listSessionsByCompany(company.id);

  // ── Interview items ──────────────────────────────────────────────────────────
  const interviews: InterviewItem[] = FUNCTIONS.map((f) => {
    const own = sessions.filter((s) => s.function === f.id);
    const completedCount = own.filter(
      (s) => s.status === "complete" && s.result,
    ).length;
    let status: InterviewStatus = "not-started";
    if (completedCount > 0) status = "done";
    else if (own.length > 0) status = "in-review";
    return {
      fn: f.id,
      label: f.label,
      agentName: f.agentName,
      agentTitle: f.agentTitle,
      blurb: f.blurb,
      probesFor: f.probesFor,
      status,
      completedCount,
    };
  });

  // ── Analytics data (only computed when there are scored sessions) ────────────
  const scored = sessions.filter((s) => s.status === "complete" && s.result);
  const hasResults = scored.length > 0;

  let analyticsSection: React.ReactNode = null;

  if (hasResults) {
    const allScores = scored.map((s) => s.result!.overallScore);
    const overallScore = avg(allScores);
    const allRisks = scored.flatMap((s) => s.result!.risks);
    const criticalRisks = allRisks.filter(
      (r) => r.severity === "critical" || r.severity === "high",
    ).length;
    const totalRecs = scored.reduce(
      (a, s) => a + s.result!.recommendations.length,
      0,
    );

    const byFunction = new Map<string, number[]>();
    for (const s of scored) {
      const arr = byFunction.get(s.function) ?? [];
      arr.push(s.result!.overallScore);
      byFunction.set(s.function, arr);
    }
    const functionScores = [...byFunction.entries()]
      .map(([fn, scores]) => ({
        label: functionById(fn as never).label,
        score: avg(scores),
      }))
      .sort((a, b) => b.score - a.score);

    const topRisks: ClientRisk[] = scored
      .flatMap((s) =>
        s.result!.risks.map((r) => ({
          title: r.title,
          severity: r.severity,
          description: r.description,
          fn: functionById(s.function as never).label,
        })),
      )
      .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
      .slice(0, 6);

    const topRecs: ClientRec[] = scored
      .flatMap((s) =>
        s.result!.recommendations.map((r) => ({
          title: r.title,
          priority: r.priority,
          impact: r.impact,
          effort: r.effort,
          description: r.description,
          fn: functionById(s.function as never).label,
        })),
      )
      .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])
      .slice(0, 6);

    analyticsSection = (
      <div id="results" className="bg-canvas">
        {/* Full-width fade-in separator — keeps the canvas consistent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-line to-transparent" />
        <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-14 lg:px-8">
          <ClientAnalyticsView
            company={company}
            overallScore={overallScore}
            maturityLabel={MATURITY_LABEL[maturityFromScore(overallScore)]}
            scoredCount={scored.length}
            functionScores={functionScores}
            totalRisks={allRisks.length}
            criticalRisks={criticalRisks}
            totalRecs={totalRecs}
            topRisks={topRisks}
            topRecs={topRecs}
            backHref="#interview"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <InterviewsClient
        companyId={company.id}
        companyName={company.name}
        brand={company.brandColor}
        interviews={interviews}
        isAdmin={user.role === "admin"}
        userEmail={user.email}
        hasResults={hasResults}
      />
      {analyticsSection}
    </>
  );
}
