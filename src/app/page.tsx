import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { AddCompanyButton } from "@/components/company/AddCompanyButton";
import { Card } from "@/components/ui/Card";
import { Orb } from "@/components/ui/Orb";
import { requireAdmin } from "@/lib/auth";
import { FUNCTIONS } from "@/lib/frameworks";
import { shade, withAlpha } from "@/lib/color";
import { listCompanies, listSessionsLean } from "@/lib/store";
import { cn, MATURITY_LABEL, maturityFromScore, scoreTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  // Portfolio view is admin-only; clients are redirected to their own company.
  await requireAdmin();
  // Fetch companies and all lean sessions once, then group in memory — avoids an
  // N+1 full-collection scan (one per company) that made this page slow.
  const [companies, allSessions] = await Promise.all([
    listCompanies(),
    listSessionsLean(),
  ]);
  const sessionsByCompany = new Map<string, typeof allSessions>();
  for (const s of allSessions) {
    if (!s.companyId) continue;
    const list = sessionsByCompany.get(s.companyId);
    if (list) list.push(s);
    else sessionsByCompany.set(s.companyId, [s]);
  }

  const companyStats = companies.map((c) => {
    const sessions = sessionsByCompany.get(c.id) ?? [];
    const completed = sessions.filter((s) => s.status === "complete" && s.result);
    const avgScore =
      completed.length > 0
        ? Math.round(
            completed.reduce((a, s) => a + (s.result?.overallScore ?? 0), 0) /
              completed.length,
          )
        : 0;
    const risks = completed.reduce((a, s) => a + (s.result?.risks.length ?? 0), 0);
    const sectionsScored = new Set(completed.map((s) => s.function)).size;
    return {
      company: c,
      avgScore,
      completedCount: completed.length,
      sectionsScored,
      sectionsTotal: FUNCTIONS.length,
      risks,
    };
  });

  const portfolioCompleted = companyStats.reduce(
    (a, s) => a + s.completedCount,
    0,
  );
  const scoredCompanies = companyStats.filter((s) => s.completedCount > 0);
  const portfolioAvg =
    scoredCompanies.length > 0
      ? Math.round(
          scoredCompanies.reduce((a, s) => a + s.avgScore, 0) /
            scoredCompanies.length,
        )
      : 0;
  const portfolioRisks = companyStats.reduce((a, s) => a + s.risks, 0);

  const period = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="animate-fade-in">

      {/* Editorial masthead */}
      <section className="mb-12 flex items-start justify-between gap-8">
        <div className="animate-fade-in-up">
          <div className="eyebrow eyebrow-teal">Portfolio · {period}</div>
          <h1 className="mt-4 max-w-xl font-display text-4xl font-normal leading-[1.08] text-ink sm:text-[2.75rem]">
            Where the portfolio stands
          </h1>
          <hr className="divider-teal mt-6" />
          <p className="font-text mt-6 max-w-lg text-[17px] leading-relaxed text-ink-soft">
            {companies.length} {companies.length === 1 ? "company" : "companies"}{" "}
            under diagnosis across the practice — maturity, sections scored and
            open risks, at a glance.
          </p>
        </div>
        <div className="hidden shrink-0 pt-2 lg:block">
          <Orb agent="george" size={104} />
        </div>
      </section>

      {/* Portfolio KPI strip */}
      <section className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        <Kpi label="Portfolio maturity" value={portfolioAvg} suffix="/100" hint="avg across companies" />
        <Kpi label="Companies" value={companies.length} hint="on the platform" />
        <Kpi label="Diagnostics scored" value={portfolioCompleted} hint="completed sections" />
        <Kpi label="Open risks" value={portfolioRisks} hint="across portfolio" />
      </section>

      {/* Company cards */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="eyebrow">All companies</div>
          <AddCompanyButton />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {companyStats.map(({ company, avgScore, sectionsScored, sectionsTotal, risks }) => {
            const tone = avgScore > 0 ? scoreTone(avgScore) : null;
            return (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div
                  className="flex items-center gap-3 p-5"
                  style={{
                    background: `linear-gradient(135deg, ${shade(company.brandColor, -0.2)}, ${company.brandColor})`,
                  }}
                >
                  {company.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.profilePicture}
                      alt={company.name}
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ background: withAlpha("#FFFFFF", 0.2) }}
                    >
                      {company.shortName}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-display text-lg leading-tight text-white">
                      {company.name}
                    </div>
                    <div className="truncate text-xs text-white/75">
                      {company.sector}
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-5 w-5 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div className="grid grid-cols-3 divide-x divide-line">
                  <Stat
                    label="Maturity"
                    value={avgScore > 0 ? `${avgScore}` : "—"}
                    sub={
                      avgScore > 0
                        ? MATURITY_LABEL[maturityFromScore(avgScore)]
                        : "Not scored"
                    }
                    valueClass={tone?.text}
                  />
                  <Stat
                    label="Sections"
                    value={`${sectionsScored}/${sectionsTotal}`}
                    sub="scored"
                  />
                  <Stat label="Risks" value={`${risks}`} sub="open" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Maturity legend */}
      <section>
        <Card className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
            <span className="label-eyebrow">Maturity bands</span>
            {Object.entries(MATURITY_LABEL).map(([key, label], i) => {
              const tone = scoreTone([20, 40, 60, 78, 92][i]);
              return (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <span
                    className={cn("h-2.5 w-2.5 rounded-full")}
                    style={{ background: tone.hex }}
                  />
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

/** Editorial KPI cell — sits in the hairline-divided portfolio strip. */
function Kpi({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
}) {
  return (
    <div className="bg-surface px-5 py-6">
      <div className="label-eyebrow">{label}</div>
      <div className="mt-2 font-display text-3xl leading-none text-ink">
        {value}
        {suffix && (
          <span className="text-lg text-ink-faint">{suffix}</span>
        )}
      </div>
      <div className="mt-1.5 text-xs text-ink-muted">{hint}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
        {label}
      </div>
      <div className={cn("mt-1 font-display text-2xl text-ink", valueClass)}>
        {value}
      </div>
      <div className="text-xs text-ink-muted">{sub}</div>
    </div>
  );
}
