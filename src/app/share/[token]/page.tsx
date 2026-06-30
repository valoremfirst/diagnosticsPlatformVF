import { FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RadarScoreChart } from "@/components/RadarScoreChart";
import { Card } from "@/components/ui/Card";
import { readableInk, shade, withAlpha } from "@/lib/color";
import { FRAMEWORKS, FUNCTIONS, functionById } from "@/lib/frameworks";
import { getCompanyByShareToken, listSessionsByCompany } from "@/lib/store";
import {
  cn,
  formatDate,
  MATURITY_LABEL,
  maturityFromScore,
  scoreTone,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: { token: string };
}) {
  const company = await getCompanyByShareToken(params.token);
  if (!company) notFound();

  const sessions = await listSessionsByCompany(company.id);
  const completed = sessions.filter((s) => s.status === "complete" && s.result);

  const brand = company.brandColor;
  const ink = readableInk(brand);

  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((a, s) => a + (s.result?.overallScore ?? 0), 0) /
            completed.length,
        )
      : 0;

  const sections = FUNCTIONS.map((f) => {
    const own = completed.filter((s) => s.function === f.id);
    const avg =
      own.length > 0
        ? Math.round(
            own.reduce((a, s) => a + (s.result?.overallScore ?? 0), 0) /
              own.length,
          )
        : null;
    return { fn: f.id, label: f.label, avg, count: own.length };
  });

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
    <div className="mx-auto w-full max-w-[980px] px-6 py-10">
      {/* Branded header */}
      <header
        className="flex flex-wrap items-center justify-between gap-6 rounded-2xl px-8 py-7"
        style={{
          background: `linear-gradient(135deg, ${shade(brand, -0.25)} 0%, ${brand} 60%, ${shade(brand, 0.12)} 100%)`,
          color: ink,
        }}
      >
        <div className="flex items-center gap-4">
          {company.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.profilePicture}
              alt={company.name}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl font-display text-xl"
              style={{ background: withAlpha(ink === "#FFFFFF" ? "#FFFFFF" : "#1A1A1A", 0.16) }}
            >
              {company.shortName}
            </div>
          )}
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: withAlpha(ink, 0.7) }}>
              Diagnostic report
            </div>
            <h1 className="mt-1 font-display text-3xl leading-tight">
              {company.name}
            </h1>
            {company.tagline && (
              <p className="mt-1 text-sm" style={{ color: withAlpha(ink, 0.8) }}>
                {company.tagline}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-5xl leading-none">
            {avgScore}
            <span className="text-2xl" style={{ color: withAlpha(ink, 0.6) }}>
              /100
            </span>
          </div>
          <div className="mt-1 text-sm font-medium" style={{ color: withAlpha(ink, 0.8) }}>
            {completed.length > 0
              ? `${MATURITY_LABEL[maturityFromScore(avgScore)]} maturity`
              : "No reports yet"}
          </div>
        </div>
      </header>

      {completed.length === 0 ? (
        <Card className="mt-8 px-6 py-12 text-center text-sm text-ink-muted">
          This report has no analysed diagnostics yet.
        </Card>
      ) : (
        <>
          {/* Per-agent averages */}
          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl text-ink">
              Maturity by function
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((s) => {
                const tone = s.avg != null ? scoreTone(s.avg) : null;
                return (
                  <div
                    key={s.fn}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5"
                  >
                    <span
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg",
                        tone ? tone.bg : "bg-surface-muted",
                        tone ? tone.text : "text-ink-faint",
                      )}
                    >
                      {s.avg != null ? s.avg : "—"}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">
                        {s.label}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {s.avg != null
                          ? `${MATURITY_LABEL[maturityFromScore(s.avg)]} · ${s.count} report${s.count === 1 ? "" : "s"}`
                          : "Not analysed"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Radar */}
          <section className="mt-8">
            <Card>
              <div className="px-6 pt-5">
                <h2 className="font-display text-xl text-ink">
                  Framework maturity
                </h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Average across all analysed diagnostics
                </p>
              </div>
              <div className="px-4 pb-5 pt-2">
                <RadarScoreChart data={radarData} accent={brand} />
              </div>
            </Card>
          </section>

          {/* Individual reports */}
          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl text-ink">Reports</h2>
            <div className="grid gap-2">
              {completed.map((s) => {
                const fn = functionById(s.function);
                const score = s.result!.overallScore;
                const tone = scoreTone(score);
                return (
                  <Link
                    key={s.id}
                    href={`/diagnostics/${s.id}/print`}
                    target="_blank"
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5 transition-shadow hover:shadow-card"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display",
                        tone.bg,
                        tone.text,
                      )}
                    >
                      {score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {s.title ?? `${fn.label} diagnostic`}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {fn.label} · {formatDate(s.completedAt ?? s.createdAt)}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal">
                      <FileText className="h-3.5 w-3.5" />
                      View PDF
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      <footer className="mt-10 border-t border-line pt-4 text-center text-[11px] text-ink-faint">
        Shared via Agentic Diagnostics Platform · {formatDate(new Date().toISOString())}
      </footer>
    </div>
  );
}
