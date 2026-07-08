"use client";

import { Building2, Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useState } from "react";

import { BrandColorPicker } from "@/components/company/BrandColorPicker";
import { CompanyChat } from "@/components/company/CompanyChat";
import { ExecutiveReport } from "@/components/company/ExecutiveReport";
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
  importedConversationIds: string[];
  transcripts: SectionTranscript[];
}

export function CompanyDashboardClient({
  company,
  sections,
  radarData,
  aggregates,
  readOnly = false,
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
  /** Clients get a read-only view: no brand/logo/description edits or uploads. */
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [savedColor, setSavedColor] = useState(company.brandColor);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeFn, setActiveFn] = useState<DiagnosticFunction>(
    sections[0]?.fn ?? "finance",
  );
  const [savedDescription, setSavedDescription] = useState(company.description ?? "");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(company.description ?? "");
  const [savedPicture, setSavedPicture] = useState(company.profilePicture ?? "");
  const [editingPic, setEditingPic] = useState(false);
  const [picDraft, setPicDraft] = useState(company.profilePicture ?? "");

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

  async function saveDescription() {
    setSavedDescription(descDraft);
    setEditingDesc(false);
    await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: descDraft }),
    });
    router.refresh();
  }

  async function savePicture() {
    setSavedPicture(picDraft);
    setEditingPic(false);
    await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilePicture: picDraft }),
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
              {/* Logo / avatar */}
              {savedPicture ? (
                <div className="relative group/pic">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={savedPicture}
                    alt={company.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => { setPicDraft(savedPicture); setEditingPic(true); }}
                      className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-hover/pic:opacity-100 transition-opacity"
                      style={{ background: withAlpha("#000000", 0.4) }}
                      title="Change logo"
                    >
                      <Pencil className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative group/pic">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-semibold"
                    style={{ background: overlay }}
                  >
                    {company.shortName}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => { setPicDraft(""); setEditingPic(true); }}
                      className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-hover/pic:opacity-100 transition-opacity"
                      style={{ background: withAlpha("#000000", 0.4) }}
                      title="Add logo"
                    >
                      <Pencil className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                </div>
              )}
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: overlay }}
              >
                <Building2 className="h-3 w-3" />
                {company.sector ?? "Company"}
              </div>
            </div>

            {/* Logo URL edit popover */}
            {editingPic && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="url"
                  value={picDraft}
                  onChange={(e) => setPicDraft(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  autoFocus
                  className="h-9 flex-1 rounded-lg border border-white/30 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <button type="button" onClick={savePicture} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors" title="Save">
                  <Check className="h-4 w-4 text-white" />
                </button>
                <button type="button" onClick={() => setEditingPic(false)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Cancel">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            )}

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

            {/* Description with inline edit */}
            {editingDesc ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none"
                  placeholder="Add a company description..."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveDescription}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/20 px-3 text-xs font-medium text-white hover:bg-white/30 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDescDraft(savedDescription); setEditingDesc(false); }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="group/desc mt-3 flex items-start gap-2">
                {savedDescription ? (
                  <p className="text-[14px] leading-relaxed" style={{ color: withAlpha(ink, 0.75) }}>
                    {savedDescription}
                  </p>
                ) : (
                  !readOnly && (
                    <p className="text-[14px] italic" style={{ color: withAlpha(ink, 0.45) }}>
                      Add a company description...
                    </p>
                  )
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => { setDescDraft(savedDescription); setEditingDesc(true); }}
                    className="mt-0.5 flex-shrink-0 rounded p-1 opacity-0 group-hover/desc:opacity-100 transition-opacity hover:bg-white/20"
                    title="Edit description"
                  >
                    <Pencil className="h-3.5 w-3.5" style={{ color: withAlpha(ink, 0.7) }} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-4">
            {!readOnly && (
              <div className="flex items-center gap-2">
                <BrandColorPicker
                  value={savedColor}
                  onPreview={(hex) => setPreview(hex)}
                  onSave={saveColor}
                />
              </div>
            )}
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

      {/* Main diagnostic — company-wide AI executive report */}
      {aggregates.completedCount > 0 ? (
        <section className="mb-8">
          <ExecutiveReport
            companyId={company.id}
            brand={brand}
            initialReport={company.report}
            canGenerate={!readOnly}
            overallScore={aggregates.avgScore}
            functionScores={sections
              .filter((s) => s.avgScore != null)
              .map((s) => ({ label: s.label, score: s.avgScore as number }))}
          />
        </section>
      ) : (
        <section className="mb-8">
          <Card>
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <h2 className="font-display text-xl text-ink">Main diagnostic</h2>
              <p className="mt-1 max-w-sm text-sm text-ink-muted">
                No analysed reports yet. Add and analyse a transcript in a section
                below to generate the company-wide executive report.
              </p>
            </div>
          </Card>
        </section>
      )}

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

      {/* Ask the diagnostics — grounded AI Q&A */}
      <section className="mb-8">
        <Card>
          <CompanyChat companyId={company.id} brand={brand} />
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
              key={activeSection.fn}
              companyId={company.id}
              section={activeSection}
              brand={brand}
              readOnly={readOnly}
              onChanged={() => router.refresh()}
            />
          </Card>
        )}
      </section>
    </div>
  );
}
