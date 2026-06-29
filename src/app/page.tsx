import { ArrowRight, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import { DiagnosticStatusBadge } from "@/components/DiagnosticStatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { RadarScoreChart } from "@/components/RadarScoreChart";
import { Card } from "@/components/ui/Card";
import { FRAMEWORKS, functionById } from "@/lib/frameworks";
import { listSessions } from "@/lib/store";
import { cn, formatDate, MATURITY_LABEL, scoreTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const sessions = listSessions();
  const completed = sessions.filter((s) => s.status === "complete" && s.result);

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
      a + (s.result?.risks.filter((r) => r.severity === "critical").length ?? 0),
    0,
  );

  // Average framework scores across all completed diagnostics for the radar.
  const radarData = FRAMEWORKS.map((f) => {
    const scores = completed
      .map((s) => s.result?.frameworks.find((x) => x.framework === f.name)?.score)
      .filter((n): n is number => typeof n === "number");
    const current = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    return { label: f.short, current, benchmark: 58 };
  });

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-teal-deep via-teal to-teal-500 p-8 text-white">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Agentic diagnostics
            </div>
            <h1 className="mt-4 font-display text-4xl leading-tight">
              Consulting-grade diagnostics, run by an AI interviewer.
            </h1>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/80">
              Voice-led discovery scored against five business maturity
              frameworks — with every finding traced back to the transcript.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/new"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-teal-deep transition-colors hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                Start a new diagnostic
              </Link>
              <Link
                href="/history"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/30 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                View history
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Portfolio maturity
            </div>
            <div className="mt-1 font-display text-5xl">
              {avgScore}
              <span className="text-2xl text-white/60">/100</span>
            </div>
            <div className="mt-1 text-sm text-white/70">
              across {completed.length} completed diagnostics
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Avg maturity score"
          value={avgScore}
          suffix="/100"
          delta={4.2}
          hint="vs previous quarter"
        />
        <MetricCard
          label="Diagnostics run"
          value={sessions.length}
          hint={`${completed.length} complete`}
          accent="ink"
        />
        <MetricCard
          label="Open risks"
          value={totalRisks}
          hint="across portfolio"
          accent="gold"
        />
        <MetricCard
          label="Critical risks"
          value={criticalRisks}
          hint="need immediate action"
          accent="danger"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        {/* Framework summary radar */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between px-6 pt-5">
            <div>
              <h2 className="font-display text-xl text-ink">Framework maturity</h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Portfolio average vs industry benchmark
              </p>
            </div>
          </div>
          <div className="px-4 pb-5 pt-2">
            <RadarScoreChart data={radarData} />
          </div>
        </Card>

        {/* Recent diagnostics */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="font-display text-xl text-ink">Recent diagnostics</h2>
            <Link href="/history" className="text-sm font-medium text-teal hover:underline">
              View all
            </Link>
          </div>
          <div className="px-3 pb-3 pt-3">
            <div className="divide-y divide-line">
              {sessions.slice(0, 5).map((s) => {
                const fn = functionById(s.function);
                const score = s.result?.overallScore;
                const tone = score != null ? scoreTone(score) : null;
                const href =
                  s.status === "complete"
                    ? `/diagnostics/${s.id}`
                    : s.status === "processing" || s.status === "in_progress"
                      ? `/session/${s.id}`
                      : `/diagnostics/${s.id}`;
                return (
                  <Link
                    key={s.id}
                    href={href}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface-muted"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">
                        {s.companyName}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                        <span>{fn.label}</span>
                        <span className="text-ink-faint">·</span>
                        <span>{formatDate(s.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {score != null ? (
                        <span
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg font-display text-base",
                            tone?.bg,
                            tone?.text,
                          )}
                        >
                          {score}
                        </span>
                      ) : (
                        <DiagnosticStatusBadge status={s.status} />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* Maturity legend */}
      <section className="mt-6">
        <Card className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
            <span className="label-eyebrow">Maturity bands</span>
            {Object.entries(MATURITY_LABEL).map(([key, label], i) => {
              const tone = scoreTone([20, 40, 60, 78, 92][i]);
              return (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 rounded-full")} style={{ background: tone.hex }} />
                  {label}
                </span>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
