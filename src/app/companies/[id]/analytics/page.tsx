import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnalyticsCharts, type AnalyticsData } from "@/components/AnalyticsCharts";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/Button";
import { assertCompanyAccess } from "@/lib/auth";
import { frameworkById, functionById } from "@/lib/frameworks";
import { getCompany, listSessionsByCompany } from "@/lib/store";
import { MATURITY_LABEL, maturityFromScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default async function CompanyAnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  // Admins see any company; clients only their own (foreign IDs → notFound).
  await assertCompanyAccess(params.id);

  const company = await getCompany(params.id);
  if (!company) notFound();

  const sessions = await listSessionsByCompany(company.id);
  const scored = sessions.filter((s) => s.status === "complete" && s.result);

  if (scored.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          crumbs={[
            { label: "Dashboard", href: "/" },
            { label: company.name, href: `/companies/${company.id}` },
            { label: "Analytics" },
          ]}
          title={`${company.name} analytics`}
          description="Trends, benchmarks and risk signals across this company's diagnostics."
        />
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Analyse at least one transcript and the charts will populate here automatically."
          action={
            <Link href={`/companies/${company.id}`}>
              <Button>Back to company</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // --- Company-wide metrics ---------------------------------------------------
  const allScores = scored.map((s) => s.result!.overallScore);
  const portfolioScore = avg(allScores);
  const allRisks = scored.flatMap((s) => s.result!.risks);
  const criticalRisks = allRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ).length;
  const totalRecs = scored.reduce(
    (a, s) => a + s.result!.recommendations.length,
    0,
  );

  // --- Maturity by function ---------------------------------------------------
  const byFunction = new Map<string, number[]>();
  for (const s of scored) {
    const arr = byFunction.get(s.function) ?? [];
    arr.push(s.result!.overallScore);
    byFunction.set(s.function, arr);
  }
  const maturityByFunction = [...byFunction.entries()]
    .map(([fn, scores]) => ({
      label: functionById(fn as never).label,
      score: avg(scores),
      count: scores.length,
    }))
    .sort((a, b) => b.score - a.score);

  // --- Maturity band distribution ---------------------------------------------
  const bandOrder = ["low", "developing", "established", "advanced", "leading"];
  const bandCounts = new Map<string, number>();
  for (const score of allScores) {
    const band = maturityFromScore(score);
    bandCounts.set(band, (bandCounts.get(band) ?? 0) + 1);
  }
  const bandDistribution = bandOrder
    .map((band) => ({
      band,
      label: MATURITY_LABEL[band as never],
      count: bandCounts.get(band) ?? 0,
    }))
    .filter((d) => d.count > 0);

  // --- Risk by severity -------------------------------------------------------
  const sevOrder = ["critical", "high", "medium", "low"];
  const sevCounts = new Map<string, number>();
  for (const r of allRisks) {
    sevCounts.set(r.severity, (sevCounts.get(r.severity) ?? 0) + 1);
  }
  const riskBySeverity = sevOrder
    .map((severity) => ({
      severity,
      label: SEVERITY_LABEL[severity],
      count: sevCounts.get(severity) ?? 0,
    }))
    .filter((d) => d.count > 0);

  // --- Diagnostics over time (by month) --------------------------------------
  const monthCounts = new Map<string, number>();
  for (const s of scored) {
    const iso = s.completedAt ?? s.createdAt;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  let running = 0;
  const overTime = [...monthCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      running += count;
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        "en-GB",
        { month: "short", year: "2-digit" },
      );
      return { month: label, count, cumulative: running };
    });

  // --- Framework performance --------------------------------------------------
  const fwScores = new Map<string, number[]>();
  for (const s of scored) {
    for (const f of s.result!.frameworks) {
      const arr = fwScores.get(f.framework) ?? [];
      arr.push(f.score);
      fwScores.set(f.framework, arr);
    }
  }
  const frameworkScores = [...fwScores.entries()]
    .map(([id, scores]) => ({
      name: frameworkById(id)?.short ?? frameworkById(id)?.name ?? id,
      score: avg(scores),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // --- Recommendations by priority --------------------------------------------
  const priOrder = ["high", "medium", "low"];
  const priCounts = new Map<string, number>();
  for (const s of scored) {
    for (const r of s.result!.recommendations) {
      priCounts.set(r.priority, (priCounts.get(r.priority) ?? 0) + 1);
    }
  }
  const recByPriority = priOrder.map((priority) => ({
    priority,
    label: PRIORITY_LABEL[priority],
    count: priCounts.get(priority) ?? 0,
  }));

  // Single-company view: omit the leaderboard (a ranking of one is meaningless).
  const data: AnalyticsData = {
    maturityByFunction,
    bandDistribution,
    riskBySeverity,
    overTime,
    frameworkScores,
    recByPriority,
    portfolioScore,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: company.name, href: `/companies/${company.id}` },
          { label: "Analytics" },
        ]}
        title={`${company.name} analytics`}
        description="Trends, benchmarks and risk signals across this company's diagnostics."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Overall maturity"
          value={portfolioScore}
          suffix="/ 100"
          hint={MATURITY_LABEL[maturityFromScore(portfolioScore) as never]}
          accent="teal"
        />
        <MetricCard
          label="Diagnostics scored"
          value={scored.length}
          hint={`across ${byFunction.size} functions`}
          accent="ink"
        />
        <MetricCard
          label="Critical & high risks"
          value={criticalRisks}
          hint={`of ${allRisks.length} total risks`}
          accent="danger"
        />
        <MetricCard
          label="Recommendations"
          value={totalRecs}
          hint="actions surfaced"
          accent="gold"
        />
      </div>

      <AnalyticsCharts data={data} />
    </div>
  );
}
