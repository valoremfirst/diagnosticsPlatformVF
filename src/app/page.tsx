import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { AddCompanyButton } from "@/components/company/AddCompanyButton";
import { MetricCard } from "@/components/MetricCard";
import { Card } from "@/components/ui/Card";
import { FUNCTIONS } from "@/lib/frameworks";
import { shade, withAlpha } from "@/lib/color";
import { listCompanies, listSessionsByCompany } from "@/lib/store";
import { cn, MATURITY_LABEL, maturityFromScore, scoreTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const companies = await listCompanies();

  const companyStats = await Promise.all(
    companies.map(async (c) => {
    const sessions = await listSessionsByCompany(c.id);
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
  }),
  );

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

  return (
    <div className="animate-fade-in">

      {/* Company cards */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Companies</h2>
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

      {/* Portfolio KPIs */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Portfolio maturity"
          value={portfolioAvg}
          suffix="/100"
          hint="avg across companies"
        />
        <MetricCard
          label="Companies"
          value={companies.length}
          hint="on the platform"
          accent="ink"
        />
        <MetricCard
          label="Diagnostics scored"
          value={portfolioCompleted}
          hint="completed sections"
          accent="positive"
        />
        <MetricCard
          label="Open risks"
          value={portfolioRisks}
          hint="across portfolio"
          accent="gold"
        />
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
