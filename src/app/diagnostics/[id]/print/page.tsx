import { notFound } from "next/navigation";

import { AutoPrint } from "@/components/AutoPrint";
import { assertCompanyAccess, requireAdmin } from "@/lib/auth";
import { functionById } from "@/lib/frameworks";
import { getCompany, getSession } from "@/lib/store";
import {
  cn,
  formatDate,
  MATURITY_LABEL,
  maturityFromScore,
  priorityTone,
  scoreTone,
  severityTone,
  SEVERITY_RANK,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PrintReportPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session || !session.result) notFound();

  // Clients may only view diagnostics belonging to their own company.
  if (session.companyId) await assertCompanyAccess(session.companyId);
  else await requireAdmin();

  const result = session.result;
  const fn = functionById(session.function);
  const company = session.companyId
    ? await getCompany(session.companyId)
    : undefined;
  const brand = company?.brandColor ?? "#1E4D5A";
  const tone = scoreTone(result.overallScore);

  const sortedRisks = [...result.risks].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
  );
  const sortedRecs = [...result.recommendations].sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 } as const;
    return rank[b.priority] - rank[a.priority];
  });

  return (
    <div className="mx-auto max-w-[800px] bg-white text-ink">
      {/* Toolbar (screen only) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-ink-muted">
          Use your browser&apos;s “Save as PDF” destination to export this report.
        </p>
        <AutoPrint />
      </div>

      {/* Branded header */}
      <header
        className="flex items-center justify-between gap-6 rounded-2xl px-8 py-7 text-white"
        style={{ background: brand }}
      >
        <div className="flex items-center gap-4">
          {company?.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.profilePicture}
              alt={session.companyName}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 font-display text-xl">
              {company?.shortName ?? session.companyName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              {fn.label} maturity diagnostic
            </div>
            <h1 className="mt-1 font-display text-3xl leading-tight">
              {session.companyName}
            </h1>
            <div className="mt-1 text-sm text-white/75">
              Completed {formatDate(session.completedAt ?? session.createdAt)}
              {session.sector ? ` · ${session.sector}` : ""}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-5xl leading-none">
            {result.overallScore}
            <span className="text-2xl text-white/60">/100</span>
          </div>
          <div className="mt-1 text-sm font-medium capitalize text-white/80">
            {MATURITY_LABEL[result.overallMaturityLevel] ??
              MATURITY_LABEL[maturityFromScore(result.overallScore)]}
          </div>
        </div>
      </header>

      {/* Executive summary */}
      <section className="print-break-inside-avoid mt-8">
        <h2 className="font-display text-xl text-ink">Executive summary</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          {result.executiveSummary}
        </p>
      </section>

      {/* Framework scores */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl text-ink">Framework maturity</h2>
        <div className="space-y-4">
          {result.frameworks.map((f) => {
            const ft = scoreTone(f.score);
            return (
              <div
                key={f.framework}
                className="print-break-inside-avoid rounded-xl border border-line p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg text-ink">
                      {f.framework}
                    </h3>
                    <p className="text-xs capitalize text-ink-muted">
                      {f.maturityLevel} maturity · {f.criteria.length} criteria
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex h-12 w-14 items-center justify-center rounded-xl font-display text-xl",
                      ft.bg,
                      ft.text,
                    )}
                  >
                    {f.score}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${f.score}%`, background: ft.hex }}
                  />
                </div>
                <div className="mt-4 grid gap-2">
                  {f.criteria.map((c) => {
                    const ct = scoreTone(c.score);
                    return (
                      <div
                        key={c.name}
                        className="flex items-start justify-between gap-3 border-t border-line pt-2 text-[13px]"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-ink">{c.name}</div>
                          <p className="text-ink-muted">{c.rationale}</p>
                          {c.evidence.length > 0 && (
                            <p className="mt-1 border-l-2 border-teal-400 pl-2 italic text-ink-soft">
                              “{c.evidence[0].quote}”
                            </p>
                          )}
                        </div>
                        <span className={cn("shrink-0 font-semibold", ct.text)}>
                          {c.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Risks */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl text-ink">Risk register</h2>
        <div className="space-y-2">
          {sortedRisks.map((risk, i) => {
            const rt = severityTone(risk.severity);
            return (
              <div
                key={i}
                className="print-break-inside-avoid flex overflow-hidden rounded-xl border border-line"
              >
                <span className={cn("w-1 shrink-0", rt.dot)} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-ink">
                      {risk.title}
                    </h4>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase",
                        rt.bg,
                        rt.text,
                      )}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                    {risk.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recommendations */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl text-ink">Recommendations</h2>
        <div className="space-y-2">
          {sortedRecs.map((rec, i) => {
            const pt = priorityTone(rec.priority);
            return (
              <div
                key={i}
                className="print-break-inside-avoid rounded-xl border border-line p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-ink">{rec.title}</h4>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase",
                      pt.bg,
                      pt.text,
                    )}
                  >
                    {rec.priority} priority
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                  {rec.description}
                </p>
                <div className="mt-2 text-[11px] capitalize text-ink-muted">
                  Impact: {rec.impact} · Effort: {rec.effort}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Roadmap */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl text-ink">Prioritised roadmap</h2>
        <div className="space-y-2">
          {result.roadmap.map((item, i) => (
            <div
              key={i}
              className="print-break-inside-avoid rounded-xl border border-line p-4"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-teal">
                {item.phase}
              </div>
              <div className="mt-1 text-sm font-medium text-ink">
                {item.action}
              </div>
              <div className="mt-1 text-[12px] text-ink-muted">
                Owner: {item.ownerRole} · Outcome: {item.expectedOutcome}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 border-t border-line pt-4 text-center text-[11px] text-ink-faint">
        Agentic Diagnostics Platform · Generated {formatDate(new Date().toISOString())}
      </footer>
    </div>
  );
}
