import { AlertTriangle, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { AddCompanyButton } from "@/components/company/AddCompanyButton";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import {
  PortfolioDistribution,
  type DistributionBand,
} from "@/components/PortfolioDistribution";
import { Card } from "@/components/ui/Card";
import { Orb } from "@/components/ui/Orb";
import { PortfolioOrb } from "@/components/ui/PortfolioOrb";
import { requireAdmin } from "@/lib/auth";
import { shade, withAlpha } from "@/lib/color";
import { FUNCTIONS, functionById } from "@/lib/frameworks";
import {
  getGlobalAgentConfig,
  listCompanies,
  listPhoneMappings,
  listSessionsLean,
  listUsers,
} from "@/lib/store";
import type { MaturityLevel } from "@/lib/types";
import {
  cn,
  formatDate,
  MATURITY_LABEL,
  maturityFromScore,
  scoreTone,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

// Order maturity bands from strongest → weakest for the distribution + legend.
const MATURITY_ORDER: MaturityLevel[] = [
  "leading",
  "advanced",
  "established",
  "developing",
  "low",
];
// Representative score per band, used only to pull the band's tone colour.
const BAND_SAMPLE: Record<MaturityLevel, number> = {
  leading: 92,
  advanced: 78,
  established: 60,
  developing: 40,
  low: 20,
};

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
    const criticalRisks = completed.reduce(
      (a, s) =>
        a + (s.result?.risks.filter((r) => r.severity === "critical").length ?? 0),
      0,
    );
    const sectionsScored = new Set(completed.map((s) => s.function)).size;
    return {
      company: c,
      avgScore,
      completedCount: completed.length,
      sectionsScored,
      sectionsTotal: FUNCTIONS.length,
      risks,
      criticalRisks,
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

  // ── Portfolio storytelling ────────────────────────────────────────────────
  // Maturity distribution across scored companies (drives the stacked bar).
  const bandCounts = new Map<MaturityLevel, number>();
  for (const s of scoredCompanies) {
    const level = maturityFromScore(s.avgScore);
    bandCounts.set(level, (bandCounts.get(level) ?? 0) + 1);
  }
  const distribution: DistributionBand[] = MATURITY_ORDER.map((level) => ({
    level,
    count: bandCounts.get(level) ?? 0,
    hex: scoreTone(BAND_SAMPLE[level]).hex,
  }));

  // Top companies by open-risk load — where the practice should focus.
  const topRiskCompanies = [...companyStats]
    .filter((s) => s.risks > 0)
    .sort((a, b) => b.criticalRisks - a.criticalRisks || b.risks - a.risks)
    .slice(0, 5);

  // Function coverage across the portfolio — how many companies have each
  // function scored, so gaps in the practice's picture are visible.
  const coverage = FUNCTIONS.map((fn) => {
    const count = companyStats.filter((s) => {
      const sessions = sessionsByCompany.get(s.company.id) ?? [];
      return sessions.some(
        (x) => x.function === fn.id && x.status === "complete" && x.result,
      );
    }).length;
    return { fn, count };
  }).sort((a, b) => b.count - a.count);

  // Latest completed diagnostics — a live activity feed.
  const recentActivity = allSessions
    .filter((s) => s.status === "complete" && s.result && s.companyId)
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
    )
    .slice(0, 6)
    .map((s) => {
      const company = companies.find((c) => c.id === s.companyId);
      return { session: s, company };
    })
    .filter((x) => x.company);

  const period = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const portfolioBand = portfolioAvg > 0 ? maturityFromScore(portfolioAvg) : null;
  const portfolioTone = portfolioAvg > 0 ? scoreTone(portfolioAvg) : null;

  // Onboarding — computed server-side so the checklist reflects real state.
  const [globalConfig, users, phoneMappings] = await Promise.all([
    getGlobalAgentConfig().catch(() => ({ agentIds: {} })),
    listUsers().catch(() => []),
    listPhoneMappings().catch(() => []),
  ]);
  const agentsConfigured =
    Object.values(globalConfig.agentIds ?? {}).some((v) => v?.trim()) ||
    Boolean(process.env.ELEVENLABS_AGENT_ID_LEGAL);
  const onboardingSteps = [
    {
      id: "company",
      label: "Add your first company",
      description: "Create a client company to hold its diagnostics.",
      href: "/",
      done: companies.length > 0,
    },
    {
      id: "agents",
      label: "Configure the shared agents",
      description: "Set one ElevenLabs agent per business function (shared across all clients).",
      href: "/admin",
      done: agentsConfigured,
    },
    {
      id: "callers",
      label: "Register caller phone numbers",
      description: "Map each client's phone number so the agent knows who's calling and recalls their history.",
      href: "/admin",
      done: phoneMappings.length > 0,
    },
    {
      id: "diagnostic",
      label: "Import and score a diagnostic",
      description: "Pull a completed interview and run the analysis.",
      href: companies[0] ? `/companies/${companies[0].id}` : "/",
      done: portfolioCompleted > 0,
    },
    {
      id: "client",
      label: "Invite a client",
      description: "Provision a read-only account scoped to their company.",
      href: "/admin",
      done: users.some((u) => u.role === "client"),
    },
  ];

  const maxCoverage = Math.max(1, ...coverage.map((c) => c.count));

  return (
    <div className="animate-fade-in">
      {/* ── Editorial masthead ────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="flex items-start justify-between gap-8">
          <div className="animate-fade-in-up">
            <div className="eyebrow eyebrow-teal">Portfolio · {period}</div>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-normal leading-[1.08] text-ink sm:text-[2.75rem]">
              Where the portfolio stands
            </h1>
            <hr className="divider-teal mt-6" />
            <p className="font-text mt-6 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              {companies.length}{" "}
              {companies.length === 1 ? "company" : "companies"} under diagnosis
              across the practice — maturity, sections scored and open risks, at
              a glance.
            </p>
          </div>
          <div className="hidden shrink-0 pt-2 lg:block">
            <PortfolioOrb size={104} />
          </div>
        </div>

        {/* Headline maturity readout — the single most important number, with a
            band label and a slim gauge so it reads instantly. */}
        {portfolioBand && (
          <div className="mt-8 animate-fade-in-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="flex items-end gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "font-display text-6xl leading-none tabular-nums",
                      portfolioTone?.text,
                    )}
                  >
                    {portfolioAvg}
                  </span>
                  <span className="font-display text-2xl leading-none text-ink-faint">
                    /100
                  </span>
                </div>
                <div className="pb-1">
                  <div className="label-eyebrow">Portfolio maturity</div>
                  <div
                    className={cn(
                      "mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      portfolioTone?.bg,
                      portfolioTone?.text,
                    )}
                  >
                    {MATURITY_LABEL[portfolioBand]}
                  </div>
                </div>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
                Average across {scoredCompanies.length} scored{" "}
                {scoredCompanies.length === 1 ? "company" : "companies"}, from{" "}
                {portfolioCompleted} completed{" "}
                {portfolioCompleted === 1 ? "diagnostic" : "diagnostics"}.
              </p>
            </div>
            {/* Gauge */}
            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-line">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${portfolioAvg}%`,
                  background: portfolioTone?.hex,
                }}
              />
            </div>
          </div>
        )}
      </section>

      <OnboardingChecklist steps={onboardingSteps} />

      {/* ── Portfolio KPI strip ───────────────────────────────────────────── */}
      <section className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        <Kpi
          label="Portfolio maturity"
          value={portfolioAvg}
          suffix="/100"
          hint="avg across companies"
        />
        <Kpi label="Companies" value={companies.length} hint="on the platform" />
        <Kpi
          label="Diagnostics scored"
          value={portfolioCompleted}
          hint="completed sections"
        />
        <Kpi
          label="Open risks"
          value={portfolioRisks}
          hint="across portfolio"
          tone={portfolioRisks > 0 ? "danger" : "default"}
        />
      </section>

      {/* ── Insight band: distribution · risk focus · coverage ────────────── */}
      {portfolioCompleted > 0 && (
        <section className="mb-12">
          <div className="section-rule mb-5">
            <span className="eyebrow eyebrow-teal">Portfolio signals</span>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Maturity distribution */}
            <Card className="flex flex-col px-5 py-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal" />
                <h3 className="font-display text-lg text-ink">
                  Maturity spread
                </h3>
              </div>
              <div className="flex-1">
                <PortfolioDistribution
                  bands={distribution}
                  total={scoredCompanies.length}
                />
              </div>
            </Card>

            {/* Top open-risk companies */}
            <Card className="flex flex-col px-5 py-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gold" />
                <h3 className="font-display text-lg text-ink">Where risk sits</h3>
              </div>
              {topRiskCompanies.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-positive" />
                  <p className="text-sm text-ink-muted">
                    No open risks recorded across the portfolio.
                  </p>
                </div>
              ) : (
                <ul className="flex-1 space-y-1">
                  {topRiskCompanies.map(({ company, risks, criticalRisks }) => (
                    <li key={company.id}>
                      <Link
                        href={`/companies/${company.id}`}
                        className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-muted"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${shade(company.brandColor, -0.2)}, ${company.brandColor})`,
                          }}
                        >
                          {company.shortName}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                          {company.name}
                        </span>
                        {criticalRisks > 0 && (
                          <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                            {criticalRisks} critical
                          </span>
                        )}
                        <span className="w-12 text-right text-sm text-ink-soft tabular-nums">
                          {risks}{" "}
                          <span className="text-xs text-ink-faint">
                            {risks === 1 ? "risk" : "risks"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Function coverage */}
            <Card className="flex flex-col px-5 py-5">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="font-display text-lg text-ink">
                  Function coverage
                </h3>
                <span className="ml-auto text-xs text-ink-faint">
                  companies scored
                </span>
              </div>
              <ul className="flex-1 space-y-2.5">
                {coverage.map(({ fn, count }) => (
                  <li key={fn.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs font-medium text-ink-soft">
                      {fn.label}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700 ease-out",
                          count > 0 ? "bg-teal" : "bg-transparent",
                        )}
                        style={{ width: `${(count / maxCoverage) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 text-right text-xs text-ink-muted tabular-nums">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      )}

      {/* ── Company cards ─────────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="section-rule flex-1">
            <span className="eyebrow">All companies</span>
          </div>
          <AddCompanyButton />
        </div>
        {companyStats.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
            <Orb agent="george" size={72} interactive={false} />
            <h3 className="mt-2 font-display text-xl text-ink">
              No companies yet
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
              Add your first client company and its voice-led diagnostics will
              appear here as they complete.
            </p>
            <div className="mt-5">
              <AddCompanyButton />
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {companyStats.map(
              (
                {
                  company,
                  avgScore,
                  sectionsScored,
                  sectionsTotal,
                  risks,
                  criticalRisks,
                },
                i,
              ) => {
                const tone = avgScore > 0 ? scoreTone(avgScore) : null;
                return (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
                    className="group animate-fade-in-up overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover"
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
                          className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/20"
                        />
                      ) : (
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white ring-1 ring-white/20"
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
                          {company.sector ?? "—"}
                        </div>
                      </div>
                      {avgScore > 0 && (
                        <span className="ml-auto inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          {MATURITY_LABEL[maturityFromScore(avgScore)]}
                        </span>
                      )}
                      <ArrowUpRight
                        className={cn(
                          "h-5 w-5 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                          avgScore > 0 ? "ml-2" : "ml-auto",
                        )}
                      />
                    </div>

                    {/* Maturity progress hairline */}
                    <div className="h-1 w-full bg-surface-muted">
                      <div
                        className="h-full transition-[width] duration-700 ease-out"
                        style={{
                          width: `${avgScore}%`,
                          background: tone?.hex ?? "transparent",
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-line">
                      <Stat
                        label="Maturity"
                        value={avgScore > 0 ? `${avgScore}` : "—"}
                        sub={avgScore > 0 ? "of 100" : "Not scored"}
                        valueClass={tone?.text}
                      />
                      <Stat
                        label="Sections"
                        value={`${sectionsScored}/${sectionsTotal}`}
                        sub="scored"
                      />
                      <Stat
                        label="Risks"
                        value={`${risks}`}
                        sub={criticalRisks > 0 ? `${criticalRisks} critical` : "open"}
                        valueClass={criticalRisks > 0 ? "text-danger" : undefined}
                      />
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}
      </section>

      {/* ── Recent activity ───────────────────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <section className="mb-12">
          <div className="section-rule mb-5">
            <span className="eyebrow">Recent activity</span>
          </div>
          <Card className="divide-y divide-line overflow-hidden">
            {recentActivity.map(({ session, company }) => {
              const fn = functionById(session.function);
              const score = session.result?.overallScore ?? 0;
              const tone = scoreTone(score);
              return (
                <Link
                  key={session.id}
                  href={`/companies/${company!.id}`}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${shade(company!.brandColor, -0.2)}, ${company!.brandColor})`,
                    }}
                  >
                    {company!.shortName}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      <span className="text-ink">{company!.name}</span>
                      <span className="text-ink-faint"> · </span>
                      <span className="text-ink-soft">{fn.label}</span>
                    </div>
                    <div className="truncate text-xs text-ink-muted">
                      Scored by {fn.agentName} ·{" "}
                      {formatDate(session.completedAt ?? session.createdAt)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                      tone.bg,
                      tone.text,
                    )}
                  >
                    <span className="tabular-nums">{score}</span>
                    <span className="opacity-70">
                      {MATURITY_LABEL[maturityFromScore(score)]}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal" />
                </Link>
              );
            })}
          </Card>
        </section>
      )}

      {/* ── Maturity legend ───────────────────────────────────────────────── */}
      <section>
        <Card className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
            <span className="label-eyebrow">Maturity bands</span>
            {Object.entries(MATURITY_LABEL).map(([key, label], i) => {
              const tone = scoreTone([20, 40, 60, 78, 92][i]);
              return (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
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
  tone = "default",
}: {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="bg-surface px-5 py-6 transition-colors">
      <div className="label-eyebrow">{label}</div>
      <div
        className={cn(
          "mt-2 font-display text-3xl leading-none tabular-nums",
          tone === "danger" && value > 0 ? "text-danger" : "text-ink",
        )}
      >
        {value}
        {suffix && <span className="text-lg text-ink-faint">{suffix}</span>}
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
      <div className={cn("mt-1 font-display text-2xl text-ink tabular-nums", valueClass)}>
        {value}
      </div>
      <div className="text-xs text-ink-muted">{sub}</div>
    </div>
  );
}
