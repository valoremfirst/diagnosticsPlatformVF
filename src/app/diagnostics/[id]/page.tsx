import { FileSearch } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CriteriaExplorer } from "@/components/CriteriaExplorer";
import { ExportButton } from "@/components/ExportButton";
import { FrameworkScoreCard } from "@/components/FrameworkScoreCard";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { RadarScoreChart } from "@/components/RadarScoreChart";
import { RecommendationList } from "@/components/RecommendationList";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { RoadmapTimeline } from "@/components/RoadmapTimeline";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { functionById } from "@/lib/frameworks";
import { getSession } from "@/lib/store";
import { cn, formatDate, MATURITY_LABEL, maturityFromScore, scoreTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();

  const fn = functionById(session.function);

  if (session.status === "processing" || session.status === "in_progress") {
    return (
      <div className="animate-fade-in">
        <PageHeader
          crumbs={[{ label: "Diagnostic Sessions", href: "/history" }, { label: session.companyName }]}
          title={`${session.companyName} diagnostic`}
        />
        <EmptyState
          title="Analysis in progress"
          description="This diagnostic is still being processed. Resume the live session to complete it."
          action={
            <Link href={`/session/${session.id}`}>
              <Button>Resume session</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const result = session.result;
  if (!result) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          crumbs={[{ label: "Diagnostic Sessions", href: "/history" }, { label: session.companyName }]}
          title={`${session.companyName} diagnostic`}
        />
        <EmptyState
          title="No results yet"
          description="Run a voice session to generate this diagnostic's analysis."
          action={
            <Link href={`/session/${session.id}`}>
              <Button>Start session</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const tone = scoreTone(result.overallScore);
  const radarData = result.frameworks.map((f) => ({
    label: f.framework.replace(" / ", " /\n"),
    current: f.score,
    benchmark: 58,
  }));

  const criticalCount = result.risks.filter((r) => r.severity === "critical").length;
  const highCount = result.risks.filter((r) => r.severity === "high").length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Diagnostic Sessions", href: "/history" },
          { label: session.companyName },
        ]}
        title={`${fn.label} maturity analysis`}
        description={`A structured evaluation of ${session.companyName} based on a consultant-led voice interview, scored across ${result.frameworks.length} frameworks.`}
        actions={
          <>
            <Link href={`/diagnostics/${session.id}/evidence`}>
              <Button variant="outline">
                <FileSearch className="h-4 w-4" />
                Evidence review
              </Button>
            </Link>
            <ExportButton id={session.id} />
          </>
        }
      />

      {/* Score banner */}
      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[auto,1fr]">
          <div className={cn("flex flex-col justify-center gap-1 px-8 py-6", tone.bg)}>
            <div className="label-eyebrow">Overall maturity</div>
            <div className="flex items-baseline gap-1">
              <span className={cn("font-display text-6xl leading-none", tone.text)}>
                {result.overallScore}
              </span>
              <span className="text-xl text-ink-faint">/100</span>
            </div>
            <div className={cn("text-sm font-semibold capitalize", tone.text)}>
              {MATURITY_LABEL[result.overallMaturityLevel] ??
                MATURITY_LABEL[maturityFromScore(result.overallScore)]}
            </div>
          </div>
          <div className="px-8 py-6">
            <h2 className="font-display text-lg text-ink">Executive summary</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              {result.executiveSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
              <span>Completed {formatDate(session.completedAt ?? session.createdAt)}</span>
              {session.sector && <span>· {session.sector}</span>}
              {session.clientContact && <span>· {session.clientContact}</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Frameworks scored" value={result.frameworks.length} accent="ink" />
        <MetricCard label="Critical risks" value={criticalCount} accent="danger" />
        <MetricCard label="High risks" value={highCount} accent="gold" />
        <MetricCard label="Recommendations" value={result.recommendations.length} accent="teal" />
      </div>

      {/* Radar + criteria */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Maturity benchmarking</CardTitle>
              <p className="mt-0.5 text-sm text-ink-muted">Framework scores vs benchmark</p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <RadarScoreChart data={radarData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Criteria breakdown</CardTitle>
              <p className="mt-0.5 text-sm text-ink-muted">Per-criterion scores by framework</p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <CriteriaExplorer frameworks={result.frameworks} />
          </CardContent>
        </Card>
      </div>

      {/* Framework scorecards */}
      <section className="mb-6">
        <h2 className="mb-3 font-display text-2xl text-ink">Evidence-backed scorecards</h2>
        <div className="grid gap-3">
          {result.frameworks.map((f, i) => (
            <FrameworkScoreCard key={f.framework} assessment={f} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      {/* Risks + recommendations */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-2xl text-ink">Risk heatmap</h2>
          <RiskHeatmap risks={result.risks} />
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl text-ink">Recommendations</h2>
          <RecommendationList items={result.recommendations} />
        </div>
      </div>

      {/* Roadmap */}
      <section>
        <h2 className="mb-3 font-display text-2xl text-ink">Prioritised roadmap</h2>
        <Card className="px-6 py-6">
          <RoadmapTimeline items={result.roadmap} />
        </Card>
      </section>
    </div>
  );
}
