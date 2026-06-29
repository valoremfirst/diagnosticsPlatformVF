"use client";

import { Building2, FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useState } from "react";

import { BrandColorPicker } from "@/components/company/BrandColorPicker";
import { SectionTranscriptDialog } from "@/components/company/SectionTranscriptDialog";
import { MetricCard } from "@/components/MetricCard";
import { RadarScoreChart, type RadarDatum } from "@/components/RadarScoreChart";
import { Card } from "@/components/ui/Card";
import { brandVars, readableInk, shade, withAlpha } from "@/lib/color";
import type {
  Company,
  DiagnosticFunction,
  DiagnosticStatus,
} from "@/lib/types";
import { cn, MATURITY_LABEL, scoreTone } from "@/lib/utils";

export interface SectionTranscript {
  sessionId: string;
  title: string;
  status: DiagnosticStatus;
  score: number | null;
  turns: number;
  createdAt: string;
}

export interface SectionView {
  fn: DiagnosticFunction;
  label: string;
  agentName: string;
  agentTitle: string;
  blurb: string;
  avgScore: number | null;
  maturity: string | null;
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
  const [openFn, setOpenFn] = useState<DiagnosticFunction | null>(null);

  const brand = preview ?? savedColor;
  const ink = readableInk(brand);
  const overlay = withAlpha(ink === "#FFFFFF" ? "#FFFFFF" : "#1A1A1A", 0.16);
  const openSection = sections.find((s) => s.fn === openFn) ?? null;

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

      <section className="grid gap-6 lg:grid-cols-5">
        {/* Sections */}
        <div className="lg:col-span-3">
          <Card>
            <div className="px-6 pt-5">
              <h2 className="font-display text-xl text-ink">
                Diagnostic sections
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Open a section to manage its transcripts and add new ones
              </p>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {sections.map((s) => (
                <SectionCard
                  key={s.fn}
                  section={s}
                  brand={brand}
                  onOpen={() => setOpenFn(s.fn)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Radar */}
        <Card className="lg:col-span-2">
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
              <div className="flex h-[300px] flex-col items-center justify-center text-center">
                <p className="text-sm text-ink-muted">No scored sections yet.</p>
                <p className="mt-1 max-w-[220px] text-xs text-ink-faint">
                  Add a transcript to a section to populate the maturity radar.
                </p>
              </div>
            )}
          </div>
        </Card>
      </section>

      {openSection && (
        <SectionTranscriptDialog
          companyId={company.id}
          fn={openSection.fn}
          label={openSection.label}
          agentName={openSection.agentName}
          brand={brand}
          transcripts={openSection.transcripts}
          onClose={() => setOpenFn(null)}
          onChanged={() => router.refresh()}
        />
      )}
    </div>
  );
}

function SectionCard({
  section,
  brand,
  onOpen,
}: {
  section: SectionView;
  brand: string;
  onOpen: () => void;
}) {
  const count = section.transcripts.length;
  const tone = section.avgScore != null ? scoreTone(section.avgScore) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col rounded-xl border border-line bg-surface p-4 text-left transition-shadow hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">{section.label}</div>
          <div className="mt-0.5 text-xs text-ink-muted">
            {section.agentName} · {section.agentTitle}
          </div>
        </div>
        {section.avgScore != null ? (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-lg",
              tone?.bg,
              tone?.text,
            )}
          >
            {section.avgScore}
          </span>
        ) : (
          <span className="shrink-0 rounded-md bg-surface-muted px-2 py-1 text-[11px] font-medium text-ink-faint">
            No data
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">
        {section.blurb}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <FileText className="h-3.5 w-3.5" />
          {count === 0
            ? "No transcripts"
            : `${count} transcript${count === 1 ? "" : "s"}`}
          {section.maturity && (
            <>
              <span className="text-ink-faint">·</span>
              {MATURITY_LABEL[section.maturity as keyof typeof MATURITY_LABEL] ??
                section.maturity}
            </>
          )}
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: brand }}
        >
          <Plus className="h-3.5 w-3.5" />
          {count === 0 ? "Add" : "Manage"}
        </span>
      </div>
    </button>
  );
}
