"use client";

import {
  AlertTriangle,
  ChevronDown,
  FileText,
  Layers,
  Loader2,
  Map,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/Card";
import type { CompanyReport } from "@/lib/types";
import {
  cn,
  formatDateTime,
  MATURITY_LABEL,
  maturityFromScore,
  priorityTone,
  scoreTone,
  severityTone,
} from "@/lib/utils";

interface FunctionScore {
  label: string;
  score: number;
}

export function ExecutiveReport({
  companyId,
  brand,
  initialReport,
  canGenerate,
  overallScore,
  functionScores,
}: {
  companyId: string;
  brand: string;
  initialReport?: CompanyReport;
  /** Admins can (re)generate; clients only read the cached report. */
  canGenerate: boolean;
  /** Company overall score (matches the dashboard maturity metric). */
  overallScore: number;
  functionScores: FunctionScore[];
}) {
  const [report, setReport] = useState<CompanyReport | undefined>(initialReport);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/report`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Report generation failed.");
      setReport(data.report as CompanyReport);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const tone = scoreTone(overallScore);
  const detailCount = report
    ? report.crossCuttingThemes.length +
      report.priorityRisks.length +
      report.strategicRecommendations.length
    : 0;

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
            style={{ background: brand }}
          >
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-xl text-ink">Executive report</h2>
            <p className="text-sm text-ink-muted">
              AI summary across every analysed function
            </p>
          </div>
        </div>
        {canGenerate && (
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: brand }}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : report ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {busy ? "Generating…" : report ? "Regenerate" : "Generate"}
          </button>
        )}
      </div>

      {error && (
        <p className="mx-6 mt-4 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="p-6">
        {!report ? (
          <EmptyState canGenerate={canGenerate} busy={busy} />
        ) : (
          <>
            {/* ---- Brief (always visible) ---- */}
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Left: headline + score + summary */}
              <div className="lg:col-span-3">
                <div className="flex items-start gap-4">
                  <div className="text-center">
                    <div
                      className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-2xl font-display text-3xl",
                        tone.bg,
                        tone.text,
                      )}
                    >
                      {overallScore}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-ink-muted">
                      {MATURITY_LABEL[maturityFromScore(overallScore)]}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl leading-snug text-ink">
                      {report.headline}
                    </h3>
                    <p className="mt-1 text-[11px] text-ink-faint">
                      Generated {formatDateTime(report.generatedAt)}
                      {report.source === "mock" && " · deterministic (no Gemini key)"}
                    </p>
                  </div>
                </div>

                {report.executiveSummary && (
                  <p
                    className="mt-4 whitespace-pre-wrap border-l-2 pl-4 text-sm leading-relaxed text-ink-soft"
                    style={{ borderColor: brand }}
                  >
                    {report.executiveSummary}
                  </p>
                )}
              </div>

              {/* Right: per-function bar chart */}
              <div className="lg:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  Maturity by function
                </div>
                <FunctionScoreChart data={functionScores} />
              </div>
            </div>

            {/* Count chips + expand toggle */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="flex flex-wrap gap-2 text-[11px] font-medium text-ink-soft">
                <Chip>{report.strengths.length} strengths</Chip>
                <Chip>{report.crossCuttingThemes.length} themes</Chip>
                <Chip>{report.priorityRisks.length} priority risks</Chip>
                <Chip>
                  {report.strategicRecommendations.length} recommendations
                </Chip>
              </div>
              {detailCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
                >
                  {expanded ? "Hide full analysis" : "Show full analysis"}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>

            {/* ---- Full detail (expandable) ---- */}
            {expanded && (
              <div className="mt-6 space-y-7 border-t border-line pt-6">
                <ReportDetail report={report} brand={brand} />
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-ink-soft">
      {children}
    </span>
  );
}

function FunctionScoreChart({ data }: { data: FunctionScore[] }) {
  if (data.length === 0) {
    return (
      <p className="mt-2 text-xs text-ink-faint">
        No scored functions to chart yet.
      </p>
    );
  }
  const height = Math.max(120, data.length * 34 + 16);
  return (
    <div className="mt-2" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 34, bottom: 0, left: 0 }}
          barCategoryGap={8}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#4A4A4A", fontSize: 11 }}
          />
          <Bar dataKey="score" radius={[0, 5, 5, 0]} maxBarSize={16}>
            {data.map((d, i) => (
              <Cell key={i} fill={scoreTone(d.score).hex} />
            ))}
            <LabelList
              dataKey="score"
              position="right"
              style={{ fill: "#4A4A4A", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReportDetail({
  report,
  brand,
}: {
  report: CompanyReport;
  brand: string;
}) {
  return (
    <>
      {/* Strengths */}
      {report.strengths.length > 0 && (
        <Block icon={TrendingUp} title="Strengths" brand={brand}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {report.strengths.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-surface-muted/50 px-3 py-2 text-sm text-ink-soft"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                {s}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Cross-cutting themes */}
      {report.crossCuttingThemes.length > 0 && (
        <Block icon={Layers} title="Cross-cutting themes" brand={brand}>
          <div className="space-y-3">
            {report.crossCuttingThemes.map((t, i) => (
              <div key={i} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-ink">{t.theme}</h4>
                  {t.functions.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {t.detail}
                </p>
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* Priority risks */}
      {report.priorityRisks.length > 0 && (
        <Block icon={AlertTriangle} title="Priority risks" brand={brand}>
          <div className="space-y-2.5">
            {report.priorityRisks.map((r, i) => {
              const st = severityTone(r.severity);
              return (
                <div key={i} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                        st.bg,
                        st.text,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                      {r.severity}
                    </span>
                    <h4 className="text-sm font-semibold text-ink">{r.title}</h4>
                    {r.functions.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Block>
      )}

      {/* Strategic recommendations */}
      {report.strategicRecommendations.length > 0 && (
        <Block icon={Target} title="Strategic recommendations" brand={brand}>
          <div className="space-y-2.5">
            {report.strategicRecommendations.map((r, i) => {
              const pt = priorityTone(r.priority);
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-line p-4"
                >
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                      pt.bg,
                      pt.text,
                    )}
                  >
                    {r.priority}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">{r.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {r.rationale}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Block>
      )}

      {/* Roadmap */}
      {report.roadmap.length > 0 && (
        <Block icon={Map} title="Roadmap" brand={brand}>
          <div className="grid gap-3 md:grid-cols-3">
            {report.roadmap.map((r, i) => (
              <div key={i} className="rounded-xl border border-line p-4">
                <div
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: brand }}
                >
                  {r.phase}
                </div>
                <h4 className="mt-1 text-sm font-semibold text-ink">
                  {r.focus}
                </h4>
                <ul className="mt-2 space-y-1.5">
                  {r.actions.map((a, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-[13px] text-ink-soft"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Block>
      )}
    </>
  );
}

function EmptyState({
  canGenerate,
  busy,
}: {
  canGenerate: boolean;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface-muted/40 px-6 py-12 text-center">
      <FileText className="h-8 w-8 text-ink-faint" />
      <h3 className="mt-3 font-display text-lg text-ink">
        No executive report yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        {busy
          ? "Synthesising the report across every analysed function…"
          : canGenerate
            ? "Generate an AI report that reads across every function’s diagnostic — themes, priority risks and a strategic roadmap for the whole business."
            : "Once your consultant generates the company-wide report, it will appear here."}
      </p>
    </div>
  );
}

function Block({
  icon: Icon,
  title,
  brand,
  children,
}: {
  icon: typeof Target;
  title: string;
  brand: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: brand }} />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
