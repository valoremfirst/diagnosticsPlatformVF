"use client";

import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useState } from "react";

import { BrandColorPicker } from "@/components/company/BrandColorPicker";
import { SectionDetail } from "@/components/company/SectionDetail";
import { MetricCard } from "@/components/MetricCard";
import { RadarScoreChart, type RadarDatum } from "@/components/RadarScoreChart";
import { Card } from "@/components/ui/Card";
import { brandVars, readableInk, shade, withAlpha } from "@/lib/color";
import type {
  Company,
  DiagnosticFunction,
  DiagnosticStatus,
} from "@/lib/types";
import { cn, scoreTone } from "@/lib/utils";

export interface SectionTranscript {
  sessionId: string;
  title: string;
  status: DiagnosticStatus;
  score: number | null;
  turns: number;
  createdAt: string;
}

export interface SectionFrameworkScore {
  name: string;
  short: string;
  score: number | null;
}

export interface SectionView {
  fn: DiagnosticFunction;
  label: string;
  agentName: string;
  agentTitle: string;
  blurb: string;
  probesFor: string[];
  avgScore: number | null;
  maturity: string | null;
  frameworks: SectionFrameworkScore[];
  transcripts: SectionTranscript[];
}

export function CompanyDashboardClient({
  company,
  sections,
  radarData,
  aggregates,
}: {
  company: Company;
  sections: SectionView[];
  radarData: RadarDatum[];
  aggregates: {
    avgScore: number;
    completedCount: number;
    sectionsScored: number;
    sectionsTotal: number;
    totalRisks: number;
    criticalRisks: number;
  };
}) {
  const router = useRouter();
  const [savedColor, setSavedColor] = useState(company.brandColor);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeFn, setActiveFn] = useState<DiagnosticFunction>(
    sections[0]?.fn ?? "finance",
  );

  const brand = preview ?? savedColor;
  const ink = readableInk(brand);
  const overlay = withAlpha(ink === "#FFFFFF" ? "#FFFFFF" : "#1A1A1A", 0.16);
  const activeSection =
    sections.find((s) => s.fn === activeFn) ?? sections[0] ?? null;

  async function saveColor(hex: string) {
    setSavedColor(hex);
    setPreview(null);
    await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandColor: hex }),
    });
    router.refresh();
  }

  return (
    <div
      className="animate-fade-in"
      style={brandVars(brand) as CSSProperties}
    >
      {/* Brand hero */}
      <section
        className="mb-8 overflow-hidden rounded-2xl border border-line p-8"
        style={{
          background: `linear-gradient(135deg, ${shade(brand, -0.25)} 0%, ${brand} 60%, ${shade(brand, 0.12)} 100%)`,
          color: ink,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-semibold"
                style={{ background: overlay }}
              >
                {company.shortName}
              </div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: overlay }}
              >
                <Building2 className="h-3 w-3" />
                {company.sector ?? "Company"}
              </div>
            </div>
            <h1 className="mt-4 font-display text-4xl leading-tight">
              {company.name}
            </h1>
            {company.tagline && (
              <p
                className="mt-2 text-[15px] leading-relaxed"
                style={{ color: withAlpha(ink, 0.8) }}
              >
                {company.tagline}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-4">
            <BrandColorPicker
              value={savedColor}
              onPreview={(hex) => setPreview(hex)}
              onSave={saveColor}
            />
            <div
              className="rounded-2xl p-5 text-right"
              style={{ background: withAlpha(ink === "#FFFFFF" ? "#FFFFFF" : "#1A1A1A", 0.12) }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: withAlpha(ink, 0.7) }}
              >
                Overall maturity
              </div>
              <div className="mt-1 font-display text-5xl">
                {aggregates.avgScore}
                <span className="text-2xl" style={{ color: withAlpha(ink, 0.6) }}>
                  /100
                </span>
              </div>
              <div className="mt-1 text-sm" style={{ color: withAlpha(ink, 0.7) }}>
                {aggregates.sectionsScored} of {aggregates.sectionsTotal} sections
                scored
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Avg maturity score"
          value={aggregates.avgScore}
          suffix="/100"
          hint="across scored sections"
        />
        <MetricCard
          label="Sections scored"
          value={`${aggregates.sectionsScored}/${aggregates.sectionsTotal}`}
          hint="business functions"
          accent="ink"
        />
        <MetricCard
          label="Open risks"
          value={aggregates.totalRisks}
          hint="across diagnostics"
          accent="gold"
        />
        <MetricCard
          label="Critical risks"
          value={aggregates.criticalRisks}
          hint="need immediate action"
          accent="danger"
        />
      </section>

      {/* Company-wide maturity radar */}
      <section className="mb-8">
        <Card>
          <div className="px-6 pt-5">
            <h2 className="font-display text-xl text-ink">Framework maturity</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              {company.name} average vs industry benchmark
            </p>
          </div>
          <div className="px-4 pb-5 pt-2">
            {aggregates.completedCount > 0 ? (
              <RadarScoreChart data={radarData} accent={brand} />
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center text-center">
                <p className="text-sm text-ink-muted">No scored sections yet.</p>
                <p className="mt-1 max-w-[260px] text-xs text-ink-faint">
                  Open a section tab below and add a transcript to populate the
                  maturity radar.
                </p>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Diagnostic sections as in-page tabs */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-xl text-ink">Diagnostic sections</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Select a function to manage its transcripts and review detail
          </p>
        </div>

        {/* Tab strip */}
        <div className="flex flex-wrap gap-2 border-b border-line">
          {sections.map((s) => {
            const active = s.fn === activeFn;
            return (
              <button
                key={s.fn}
                type="button"
                onClick={() => setActiveFn(s.fn)}
                className={cn(
                  "group relative -mb-px flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink-soft",
                )}
              >
                {s.label}
                {s.avgScore != null ? (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                      scoreTone(s.avgScore).bg,
                      scoreTone(s.avgScore).text,
                    )}
                  >
                    {s.avgScore}
                  </span>
                ) : (
                  s.transcripts.length > 0 && (
                    <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink-faint">
                      {s.transcripts.length}
                    </span>
                  )
                )}
                {active && (
                  <span
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                    style={{ background: brand }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Active tab panel */}
        {activeSection && (
          <Card className="rounded-t-none border-t-0">
            <SectionDetail
              companyId={company.id}
              section={activeSection}
              brand={brand}
              onChanged={() => router.refresh()}
            />
          </Card>
        )}
      </section>
    </div>
  );
}
