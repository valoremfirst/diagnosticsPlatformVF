import Link from "next/link";

import type { Priority, Severity } from "@/lib/types";

// ── Editorial label utilities ─────────────────────────────────────────────────
const MARGINALIA =
  "text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted";
const NOTE = "font-text text-[13px] italic leading-relaxed text-ink-muted";

// ── Severity / priority vocabulary ───────────────────────────────────────────
const SEV_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRI_LABEL: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function severityHex(sev: Severity): string {
  if (sev === "critical" || sev === "high") return "#A84A3D";
  if (sev === "medium") return "#B8814A";
  return "#767676";
}

function bandLabel(score: number): string {
  if (score < 30) return "Low";
  if (score < 50) return "Developing";
  if (score < 70) return "Established";
  if (score < 85) return "Advanced";
  return "Leading";
}

function interpretation(score: number): string {
  if (score < 30)
    return "Early days — the foundations need attention, but the path from here is clear.";
  if (score < 50)
    return "Developing. Strong instincts, uneven execution; the gaps are addressable.";
  if (score < 70)
    return "Established. A capable business with a handful of areas worth sharpening.";
  if (score < 85)
    return "Advanced. Strong across the board — the work now is refinement, not repair.";
  return "Leading. Genuinely mature; the focus turns to protecting what already works.";
}

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface ClientRisk {
  title: string;
  severity: Severity;
  description: string;
  fn: string;
}

export interface ClientRec {
  title: string;
  priority: Priority;
  impact: string;
  effort: string;
  description: string;
  fn: string;
}

export interface FunctionScore {
  label: string;
  score: number;
}

export interface ClientAnalyticsViewProps {
  company: {
    name: string;
    shortName: string;
    sector?: string;
    brandColor: string;
    profilePicture?: string;
  };
  overallScore: number | null;
  maturityLabel: string | null;
  scoredCount: number;
  functionScores: FunctionScore[];
  totalRisks: number;
  criticalRisks: number;
  totalRecs: number;
  topRisks: ClientRisk[];
  topRecs: ClientRec[];
  backHref: string;
}

export function ClientAnalyticsView({
  company,
  overallScore,
  maturityLabel,
  scoredCount,
  functionScores,
  totalRisks,
  criticalRisks,
  totalRecs,
  topRisks,
  topRecs,
  backHref,
}: ClientAnalyticsViewProps) {
  const hasData = scoredCount > 0 && overallScore != null;
  const areaCount = functionScores.length;
  const s = (n: number) => (n === 1 ? "" : "s");

  // Brand color drives all accent: score, folios, progress bars, CTAs.
  // Teal (#1E4D5A) is the fallback; real companies supply their own hex.
  const brand = company.brandColor || "#1E4D5A";

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!hasData) {
    return (
      <article className="animate-fade-in pb-16">
        <section className="relative overflow-hidden pt-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 right-0 select-none font-display font-light italic leading-[0.78] tracking-tighter"
            style={{
              fontSize: "clamp(160px, 22vw, 280px)",
              color: brand,
              opacity: 0.07,
            }}
          >
            {company.name.charAt(0)}
          </div>
          <div className="relative max-w-2xl">
            <div
              className="text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: brand }}
            >
              Your diagnostic profile
              {company.sector ? ` · ${company.sector}` : ""}
            </div>
            <h1 className="mt-4 font-display text-5xl font-normal leading-[1.03] tracking-tight text-ink sm:text-[64px]">
              Your reading isn&apos;t{" "}
              <em className="not-italic" style={{ color: brand }}>
                ready
              </em>{" "}
              yet.
            </h1>
            <p className="dropcap font-text mt-6 max-w-xl text-xl font-light leading-relaxed text-ink-soft">
              Once you&apos;ve completed a conversation and your advisors have
              reviewed it, {company.name}&apos;s profile will appear here — laid
              out like a board pack, in plain language: where the business
              stands, what to watch, and where there&apos;s room to push.
            </p>
            <hr
              className="mt-8 h-px w-20 border-0"
              style={{ background: brand }}
            />
            <Link
              href={backHref}
              className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-all"
              style={{
                background: brand,
                boxShadow: `0 6px 16px ${brand}33`,
              }}
            >
              Start a conversation →
            </Link>
          </div>
        </section>
      </article>
    );
  }

  const ranked = [...functionScores].sort((a, b) => b.score - a.score);
  const restRisks = topRisks.slice(3);

  return (
    <article className="animate-fade-in overflow-x-hidden pb-20">
      {/* ── Masthead / hero ─────────────────────────────────────────────── */}
      <section className="relative pt-6">
        {/* Company initial as faint watermark — not the score, to avoid doubling */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-6 right-0 select-none overflow-hidden font-display font-light italic leading-[0.78] tracking-tighter"
          style={{
            fontSize: "clamp(140px, 20vw, 260px)",
            color: brand,
            opacity: 0.07,
            maxWidth: "50%",
          }}
        >
          {company.name.charAt(0)}
        </div>

        {/* Two-column grid: left = editorial narrative, right = score plate */}
        <div className="relative grid gap-10 lg:grid-cols-[1fr_210px] lg:items-start">
          <div className="min-w-0 max-w-2xl">
            {company.sector && (
              <div
                className="text-[11px] font-medium uppercase tracking-[0.12em]"
                style={{ color: brand }}
              >
                {company.sector}
              </div>
            )}
            <h1 className="mt-4 font-display text-5xl font-normal leading-[1.02] tracking-tight text-ink sm:text-[62px]">
              Where {company.name}{" "}
              <em className="italic" style={{ color: brand }}>
                stands
              </em>
              .
            </h1>
            <p className="dropcap font-text mt-6 max-w-xl text-xl font-light leading-relaxed text-ink-soft">
              Drawn from {scoredCount} conversation{s(scoredCount)} across{" "}
              {areaCount} area{s(areaCount)} of the business, this is the shape
              of where things stand — and where your attention is best spent.
            </p>
            {/* Interpretation lives in the left col so it reads naturally with the headline */}
            <p className="font-text mt-5 max-w-2xl text-lg italic leading-relaxed text-ink-soft">
              {interpretation(overallScore)}
            </p>
            <hr
              className="mt-8 h-px w-20 border-0"
              style={{ background: brand }}
            />
          </div>

          {/* Score plate — card so the number feels anchored, not floating */}
          <div className="shrink-0 lg:pt-14">
            <div className="inline-block rounded-2xl border border-line bg-surface px-7 py-6 text-center shadow-card lg:w-full">
              <div className={`${MARGINALIA} mb-3`}>Overall maturity</div>
              <div
                className="flex items-baseline justify-center gap-1 font-display leading-none"
                style={{ color: brand }}
              >
                <span className="text-[76px]">{overallScore}</span>
                <span className="text-2xl text-ink-faint">/100</span>
              </div>
              {maturityLabel && (
                <div className="mt-3 border-t border-line pt-3 font-text text-base italic text-ink-muted">
                  {maturityLabel}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pull-stats ──────────────────────────────────────────────────── */}
      <section className="mt-10 rounded-2xl border border-line bg-surface shadow-card">
        <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
          <Stat n={scoredCount} label="Conversations" note="analysed to date" brand={brand} />
          <Stat n={areaCount} label="Areas assessed" note="of the business" brand={brand} />
          <Stat n={criticalRisks} label="Priority risks" note={`of ${totalRisks} tracked`} brand={brand} />
          <Stat n={totalRecs} label="Recommended actions" note="to consider" brand={brand} />
        </div>
      </section>

      {/* ── 01 · Maturity ───────────────────────────────────────────────── */}
      {ranked.length > 0 && (
        <section className="mt-20">
          <SectionHead
            folio="01"
            eyebrow="Maturity · across the business"
            title="A picture of how"
            accent="you run things."
            lede="Each area scored against the frameworks that matter to it. The shape is what to read — the strongest areas, and where the ground is softest."
            brand={brand}
          />
          <div className="mt-10 divide-y divide-line">
            {ranked.map((f) => (
              <div
                key={f.label}
                className="grid items-center gap-x-8 gap-y-3 py-6 sm:grid-cols-[1fr_160px]"
              >
                <div className="min-w-0">
                  <div className="font-display text-xl font-normal leading-tight text-ink">
                    {f.label}
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, f.score)}%`,
                        background: brand,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 sm:justify-end">
                  <div
                    className="font-display text-[42px] leading-none"
                    style={{ color: brand }}
                  >
                    {f.score}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-ink-faint">/100</span>
                    <span className={MARGINALIA}>{bandLabel(f.score)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 02 · Risk register ──────────────────────────────────────────── */}
      {topRisks.length > 0 && (
        <section className="mt-20">
          <SectionHead
            folio="02"
            eyebrow="Risk register · what to watch"
            title="What could go wrong,"
            accent="and where to look."
            lede={`${totalRisks} risk${s(totalRisks)} surfaced across your conversations. These are the ones worth your attention first.`}
            brand={brand}
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {topRisks.slice(0, 3).map((r, i) => {
              const hex = severityHex(r.severity);
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-xl border border-line bg-surface p-6 shadow-card"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ background: hex }}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: hex }}
                    >
                      {SEV_LABEL[r.severity]} priority
                    </span>
                    <span
                      className="shrink-0 font-display text-3xl italic leading-none"
                      style={{ color: brand }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-normal leading-snug text-ink">
                    {r.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 font-text text-[14px] leading-relaxed text-ink-soft">
                    {r.description}
                  </p>
                  <div className={`${MARGINALIA} mt-5 border-t border-line pt-3`}>
                    {r.fn}
                  </div>
                </div>
              );
            })}
          </div>

          {restRisks.length > 0 && (
            <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-card">
              {restRisks.map((r, i) => {
                const hex = severityHex(r.severity);
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-base font-normal leading-snug text-ink">
                        {r.title}
                      </div>
                      <p className="mt-0.5 line-clamp-1 font-text text-sm text-ink-muted">
                        {r.description}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: hex }}
                    >
                      {SEV_LABEL[r.severity]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 03 · Recommendations ────────────────────────────────────────── */}
      {topRecs.length > 0 && (
        <section className="mt-20">
          <SectionHead
            folio="03"
            eyebrow="Recommendations · where to push"
            title="Where there's room"
            accent="to improve."
            lede="Practical moves your advisors have drawn from the conversations — ranked by priority, with a read on impact and effort."
            brand={brand}
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {topRecs.map((r, i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl border border-line bg-surface p-7 shadow-card"
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className="text-[11px] font-medium uppercase tracking-[0.14em]"
                    style={{ color: brand }}
                  >
                    {PRI_LABEL[r.priority]} priority
                  </span>
                  <Meter level={r.impact} label="impact" brand={brand} />
                </div>
                <h3 className="mt-4 font-display text-[22px] font-normal leading-snug text-ink">
                  {r.title}
                </h3>
                <p className="mt-3 flex-1 font-text text-[14px] leading-relaxed text-ink-soft">
                  {r.description}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className={MARGINALIA}>{r.fn}</span>
                  <span className="text-xs text-ink-muted">
                    Effort ·{" "}
                    <span className="capitalize text-ink-soft">{r.effort}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Colophon ────────────────────────────────────────────────────── */}
      <section className="mt-20">
        <div className="flex items-center gap-4" style={{ color: brand }}>
          <span className="h-px flex-1 bg-line-strong" />
          <span className="font-display text-sm leading-none">◆</span>
          <span className="h-px flex-1 bg-line-strong" />
        </div>
        <div className="mt-8 text-center">
          <p className="mx-auto max-w-lg font-text text-lg italic leading-relaxed text-ink-soft">
            This profile is drawn from your conversations and reviewed by your
            advisors. The more you talk to us, the sharper it becomes.
          </p>
          <Link
            href={backHref}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-all"
            style={{
              background: brand,
              boxShadow: `0 6px 16px ${brand}33`,
            }}
          >
            Start another conversation →
          </Link>
        </div>
      </section>
    </article>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHead({
  folio,
  eyebrow,
  title,
  accent,
  lede,
  brand,
}: {
  folio: string;
  eyebrow: string;
  title: string;
  accent?: string;
  lede?: string;
  brand: string;
}) {
  return (
    <div className="relative overflow-hidden">
      {/* Background section watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 right-0 select-none font-display font-light italic leading-[0.78] tracking-tighter"
        style={{
          fontSize: "clamp(100px, 14vw, 180px)",
          color: brand,
          opacity: 0.07,
          maxWidth: "40%",
          overflow: "hidden",
        }}
      >
        {folio}
      </div>

      <div className="relative grid gap-x-8 gap-y-2 sm:grid-cols-[72px_1fr]">
        {/* Folio number only — no redundant "Section" label */}
        <div className="hidden pt-1 sm:block">
          <div
            className="font-display text-5xl italic leading-none tracking-tight"
            style={{ color: brand, opacity: 0.65 }}
          >
            {folio}
          </div>
        </div>
        <div>
          <div
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: brand }}
          >
            {eyebrow}
          </div>
          <h2 className="mt-3 font-display text-4xl font-normal leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {title}
            {accent && (
              <>
                {" "}
                <em className="italic" style={{ color: brand }}>
                  {accent}
                </em>
              </>
            )}
          </h2>
          {lede && (
            <p className="mt-4 max-w-2xl font-text text-lg font-light leading-relaxed text-ink-soft">
              {lede}
            </p>
          )}
          <hr
            className="mt-6 h-px w-20 border-0"
            style={{ background: brand }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  n,
  label,
  note,
  brand,
}: {
  n: number;
  label: string;
  note: string;
  brand: string;
}) {
  return (
    <div className="px-5 py-6 sm:px-8">
      <div
        className="font-display text-[52px] leading-none"
        style={{ color: brand }}
      >
        {n}
      </div>
      <div className={`${MARGINALIA} mt-3`}>{label}</div>
      <div className={`${NOTE} mt-0.5`}>{note}</div>
    </div>
  );
}

function Meter({
  level,
  label,
  brand,
}: {
  level: string;
  label: string;
  brand: string;
}) {
  const n = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <div className="flex items-center gap-2">
      <span className="flex gap-1">
        {[0, 1, 2].map((k) => (
          <span
            key={k}
            className="h-0.5 w-4"
            style={{ background: k < n ? brand : "#D4D1C8" }}
          />
        ))}
      </span>
      <span className="text-[11px] text-ink-muted">{label}</span>
    </div>
  );
}
