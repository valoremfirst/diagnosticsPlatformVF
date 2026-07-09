"use client";

import { Building2, Check, Loader2, Pencil, Trash2, X } from "lucide-react";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  async function removeCompany() {
    setDeleting(true);
    try {
      await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
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
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/20"
                  style={{ color: withAlpha(ink, 0.7) }}
                  title="Delete company"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
        <div className="section-rule mb-4">
          <span className="eyebrow">Diagnostic sections</span>
          <span className="hidden text-xs text-ink-faint sm:inline">
            {sections.filter((s) => s.avgScore != null).length} of{" "}
            {sections.length} scored
          </span>
        </div>

        {/* Tab strip — horizontally scrollable for the full function set. Each
            tab carries its own scored / draft / empty state as a chip, and the
            active tab gets a brand-tinted surface + underline. */}
        <div
          role="tablist"
          aria-label="Diagnostic sections"
          className="scroll-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2"
        >
          {sections.map((s) => {
            const active = s.fn === activeFn;
            const scored = s.avgScore != null;
            const tone = scored ? scoreTone(s.avgScore as number) : null;
            return (
              <button
                key={s.fn}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveFn(s.fn)}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "border-transparent bg-surface text-ink shadow-card"
                    : "border-transparent text-ink-muted hover:bg-surface-muted hover:text-ink",
                )}
                style={
                  active
                    ? {
                        boxShadow: `0 1px 2px rgba(26,26,26,0.04), 0 1px 8px rgba(26,26,26,0.05)`,
                        borderColor: withAlpha(brand, 0.35),
                      }
                    : undefined
                }
              >
                <span className="whitespace-nowrap">{s.label}</span>

                {/* State chip: score / draft count / empty dot */}
                {scored ? (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                      tone?.bg,
                      tone?.text,
                    )}
                  >
                    {s.avgScore}
                  </span>
                ) : s.transcripts.length > 0 ? (
                  <span className="rounded-md bg-gold/10 px-1.5 py-0.5 text-[11px] font-bold text-gold">
                    {s.transcripts.length} draft
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-line-strong transition-colors group-hover:bg-ink-faint"
                  />
                )}

                {/* Active underline in brand colour */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 -bottom-2 h-0.5 rounded-full transition-all duration-200",
                    active ? "opacity-100" : "opacity-0",
                  )}
                  style={{ background: brand }}
                />
              </button>
            );
          })}
        </div>

        {/* Active tab panel */}
        {activeSection && (
          <Card className="mt-2 overflow-hidden">
            {/* Panel header echoing the active agent identity */}
            <div className="flex items-center gap-2.5 border-b border-line bg-surface-sunken/50 px-6 py-3">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: brand }}
              />
              <span className="font-display text-base text-ink">
                {activeSection.label}
              </span>
              <span className="text-xs text-ink-muted">
                · {activeSection.agentName}, {activeSection.agentTitle}
              </span>
              {activeSection.avgScore != null && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    scoreTone(activeSection.avgScore).bg,
                    scoreTone(activeSection.avgScore).text,
                  )}
                >
                  {activeSection.avgScore}/100
                </span>
              )}
            </div>
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

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmDelete(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-card-hover">
            <div className="px-6 py-5">
              <h2 className="font-display text-xl text-ink">Delete company?</h2>
              <p className="mt-2 text-sm text-ink-muted">
                This will permanently delete <strong className="text-ink">{company.name}</strong> and all its transcripts and diagnostics. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="h-10 rounded-xl px-4 text-sm font-medium text-ink-muted hover:bg-surface-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeCompany}
                disabled={deleting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-danger px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
