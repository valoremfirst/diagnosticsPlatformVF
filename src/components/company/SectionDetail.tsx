"use client";

import {
  FileText,
  Loader2,
  Plus,
  RadioTower,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { SectionView } from "@/components/company/CompanyDashboardClient";
import { Card } from "@/components/ui/Card";
import { withAlpha } from "@/lib/color";
import { cn, formatDate, MATURITY_LABEL, scoreTone } from "@/lib/utils";

const STAGES = [
  "Cleaning transcript…",
  "Extracting evidence…",
  "Scoring frameworks…",
  "Building recommendations…",
  "Generating roadmap…",
];

interface PulledConversation {
  conversationId: string;
  title: string;
  durationSeconds: number;
  startedAt: string | null;
  turns: number;
}

export function SectionDetail({
  companyId,
  section,
  brand,
  readOnly = false,
  onChanged,
}: {
  companyId: string;
  section: SectionView;
  brand: string;
  /** Clients: hide add/analyse/delete and the ElevenLabs auto-import. */
  readOnly?: boolean;
  onChanged: () => void;
}) {
  const { fn, transcripts } = section;
  const [adding, setAdding] = useState(!readOnly && transcripts.length === 0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analysingId, setAnalysingId] = useState<string | null>(null);
  const [analysingAll, setAnalysingAll] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">(
    "idle",
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoRan = useRef(false);

  const pending = transcripts.filter((t) => t.status !== "complete");

  // Auto-import: on entering a section, pull every qualifying ElevenLabs
  // conversation (>15 min) that isn't already imported and save it as a draft.
  // No manual import step — analysis stays manual.
  useEffect(() => {
    if (readOnly) return; // clients never trigger ElevenLabs imports
    if (autoRan.current) return;
    autoRan.current = true;

    // No cleanup / cancellation — React 18 setState on unmounted is a safe no-op.
    // The autoRan guard prevents re-runs from Strict Mode's double-invoke.
    (async () => {
      try {
        const res = await fetch(
          `/api/elevenlabs/transcripts?fn=${fn}&companyId=${companyId}&minMinutes=15`,
        );
        if (!res.ok) {
          setSyncState("error");
          setSyncMessage("Could not reach ElevenLabs.");
          return;
        }
        const data = await res.json();
        const convos: PulledConversation[] = data.conversations ?? [];
        const existing = new Set(section.importedConversationIds);
        const missing = convos.filter((c) => !existing.has(c.conversationId));
        if (missing.length === 0) return;

        setSyncState("syncing");
        setSyncMessage(`Importing ${missing.length} transcript${missing.length === 1 ? "" : "s"}…`);
        let imported = 0;
        for (const c of missing) {
          const r = await fetch(`/api/companies/${companyId}/sections/${fn}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: c.conversationId,
              title: c.title,
              analyse: false,
            }),
          });
          if (r.ok) imported += 1;
        }
        setSyncState("idle");
        setSyncMessage(null);
        if (imported > 0) onChanged();
      } catch {
        setSyncState("error");
        setSyncMessage("Could not sync from ElevenLabs.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn]);

  // Run Gemini scoring on an already-imported draft transcript.
  async function analyseExisting(sessionId: string) {
    setAnalysingId(sessionId);
    setError(null);
    try {
      const res = await fetch(`/api/diagnostics/${sessionId}/analyse`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed.");
      }
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalysingId(null);
    }
  }

  async function analyseAllPending() {
    setAnalysingAll(true);
    setError(null);
    for (const t of pending) {
      setAnalysingId(t.sessionId);
      try {
        const res = await fetch(`/api/diagnostics/${t.sessionId}/analyse`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Analysis failed.");
        }
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setAnalysingId(null);
    setAnalysingAll(false);
    onChanged();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
    e.target.value = "";
  }

  async function analyse() {
    const body = text.trim();
    if (!body) {
      setError("Paste or upload a transcript first.");
      return;
    }
    setBusy(true);
    setError(null);
    setStage(0);
    stageTimer.current = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 900);

    try {
      const res = await fetch(`/api/companies/${companyId}/sections/${fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: body, title: title.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed.");
      }
      if (stageTimer.current) clearInterval(stageTimer.current);
      setText("");
      setTitle("");
      setBusy(false);
      setAdding(false);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
      if (stageTimer.current) clearInterval(stageTimer.current);
    }
  }

  async function remove(sessionId: string) {
    setDeletingId(sessionId);
    try {
      await fetch(`/api/diagnostics/${sessionId}`, { method: "DELETE" });
      onChanged();
    } finally {
      setDeletingId(null);
    }
  }

  const scoredFrameworks = section.frameworks.filter((f) => f.score != null);

  return (
    <div className="animate-fade-in">
      {/* Section header */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-5">
        <div className="max-w-xl">
          <div className="label-eyebrow" style={{ color: brand }}>
            {section.label} diagnostic
          </div>
          <h2 className="mt-1 font-display text-xl text-ink">
            {section.agentName} · {section.agentTitle}
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">{section.blurb}</p>
        </div>
        {section.avgScore != null ? (
          <div className="text-right">
            <div
              className={cn(
                "inline-flex h-14 w-14 items-center justify-center rounded-xl font-display text-2xl",
                scoreTone(section.avgScore).bg,
                scoreTone(section.avgScore).text,
              )}
            >
              {section.avgScore}
            </div>
            {section.maturity && (
              <div className="mt-1 text-xs font-medium text-ink-muted">
                {MATURITY_LABEL[
                  section.maturity as keyof typeof MATURITY_LABEL
                ] ?? section.maturity}
              </div>
            )}
          </div>
        ) : (
          <span className="rounded-md bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-faint">
            No data yet
          </span>
        )}
      </div>

      <div className="grid gap-5 p-6 lg:grid-cols-5">
        {/* Left: transcripts + add */}
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Transcripts</h3>
            <div className={cn("flex items-center gap-2", readOnly && "hidden")}>
              {pending.length > 0 && (
                <button
                  type="button"
                  onClick={analyseAllPending}
                  disabled={analysingAll}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-ink-faint disabled:opacity-60"
                >
                  {analysingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" style={{ color: brand }} />
                  )}
                  Analyse all ({pending.length})
                </button>
              )}
              <span
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium",
                  syncState === "error"
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : "border-line bg-surface text-ink-soft",
                )}
                title="Transcripts over 15 minutes import automatically from ElevenLabs"
              >
                {syncState === "syncing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: brand }} />
                ) : (
                  <RadioTower className="h-3.5 w-3.5" style={{ color: brand }} />
                )}
                {syncState === "syncing"
                  ? (syncMessage ?? "Syncing…")
                  : syncState === "error"
                    ? "Sync failed"
                    : "Auto-synced"}
              </span>
              {!adding && (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: brand }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add transcript
                </button>
              )}
            </div>
          </div>

          {/* Add form */}
          {adding && (
            <Card className="mb-4 border-dashed p-4">
              {busy ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2
                    className="h-7 w-7 animate-spin"
                    style={{ color: brand }}
                  />
                  <div className="mt-4 space-y-1.5 text-center">
                    {STAGES.map((s, i) => (
                      <div
                        key={s}
                        className="text-sm"
                        style={{
                          color:
                            i < stage
                              ? "#767676"
                              : i === stage
                                ? brand
                                : "#A8A6A0",
                          fontWeight: i === stage ? 600 : 400,
                        }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-medium text-ink-soft">
                      Transcript name
                    </label>
                    {transcripts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdding(false);
                          setError(null);
                        }}
                        className="rounded p-1 text-ink-faint hover:bg-surface-muted hover:text-ink-muted"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CFO discovery interview"
                    className="mb-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
                  />

                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium text-ink-soft">
                      Interview transcript
                    </label>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                      style={{ color: brand }}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload .txt
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt,.md,.csv,.vtt,text/plain"
                      onChange={onFile}
                      className="hidden"
                    />
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={9}
                    placeholder={
                      "Consultant: How clear is your real-time revenue visibility?\nStakeholder: Honestly, it's patchy — we close around working day eight…"
                    }
                    className="w-full resize-y rounded-xl border border-line bg-surface p-3.5 font-mono text-[13px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
                  />
                  {error && (
                    <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
                      {error}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={analyse}
                      className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: brand }}
                    >
                      <Sparkles className="h-4 w-4" />
                      Analyse with Gemini
                    </button>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Transcript list */}
          <div className="space-y-2.5">
            {transcripts.map((t) => {
              const tone = t.score != null ? scoreTone(t.score) : null;
              return (
                <div
                  key={t.sessionId}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5"
                >
                  {t.score != null ? (
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-base",
                        tone?.bg,
                        tone?.text,
                      )}
                    >
                      {t.score}
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-faint">
                      <FileText className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {t.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                      <span className="capitalize">
                        {t.status === "complete"
                          ? "Scored"
                          : t.status === "draft"
                            ? "Not analysed"
                            : t.status}
                      </span>
                      <span className="text-ink-faint">·</span>
                      <span>{t.turns} turns</span>
                      <span className="text-ink-faint">·</span>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </div>
                  {t.status === "complete" ? (
                    <Link
                      href={`/diagnostics/${t.sessionId}`}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:underline"
                      style={{ color: brand }}
                    >
                      Results
                    </Link>
                  ) : readOnly ? (
                    <span className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-faint">
                      Pending review
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => analyseExisting(t.sessionId)}
                      disabled={analysingId === t.sessionId}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: brand }}
                    >
                      {analysingId === t.sessionId ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Analysing…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Analyse
                        </>
                      )}
                    </button>
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => remove(t.sessionId)}
                      disabled={deletingId === t.sessionId}
                      className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      aria-label="Delete transcript"
                    >
                      {deletingId === t.sessionId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
            {transcripts.length === 0 && !adding && (
              <p className="py-8 text-center text-sm text-ink-muted">
                {readOnly
                  ? "No transcripts in this section yet."
                  : "No transcripts yet. Add one to score this section."}
              </p>
            )}
          </div>
        </div>

        {/* Right: framework breakdown + probes */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-ink">
              Framework maturity
            </h3>
            {scoredFrameworks.length > 0 ? (
              <div className="mt-3 space-y-3">
                {section.frameworks.map((f) => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">{f.short}</span>
                      <span className="font-semibold text-ink">
                        {f.score != null ? f.score : "—"}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${f.score ?? 0}%`,
                          background: f.score != null ? brand : "transparent",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-muted">
                Scores appear here once a transcript has been analysed.
              </p>
            )}
          </Card>

          <Card className="mt-4 p-4">
            <h3 className="text-sm font-semibold text-ink">
              What {section.agentName} probes for
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {section.probesFor.map((p) => (
                <span
                  key={p}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: withAlpha(brand, 0.1), color: brand }}
                >
                  {p}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
