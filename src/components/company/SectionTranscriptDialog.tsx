"use client";

import {
  ArrowLeft,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { SectionTranscript } from "@/components/company/CompanyDashboardClient";
import { withAlpha } from "@/lib/color";
import type { DiagnosticFunction } from "@/lib/types";
import { cn, formatDate, scoreTone } from "@/lib/utils";

const STAGES = [
  "Cleaning transcript…",
  "Extracting evidence…",
  "Scoring frameworks…",
  "Building recommendations…",
  "Generating roadmap…",
];

export function SectionTranscriptDialog({
  companyId,
  fn,
  label,
  agentName,
  brand,
  transcripts,
  onClose,
  onChanged,
}: {
  companyId: string;
  fn: DiagnosticFunction;
  label: string;
  agentName: string;
  brand: string;
  transcripts: SectionTranscript[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<"list" | "add">(
    transcripts.length === 0 ? "add" : "list",
  );
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

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
      setMode("list");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card-hover">
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 px-6 py-5"
          style={{ background: withAlpha(brand, 0.08) }}
        >
          <div>
            <div className="label-eyebrow" style={{ color: brand }}>
              {label} diagnostic
            </div>
            <h2 className="mt-1 font-display text-xl text-ink">
              {mode === "add" ? "Add a transcript" : "Transcripts"}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {mode === "add"
                ? `Paste or upload the interview with ${agentName}. Gemini scores it against all five frameworks.`
                : `${transcripts.length} transcript${transcripts.length === 1 ? "" : "s"} in this section.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-slim px-6 py-5">
          {busy ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: brand }}
              />
              <div className="mt-5 space-y-2 text-center">
                {STAGES.map((s, i) => (
                  <div
                    key={s}
                    className="text-sm"
                    style={{
                      color:
                        i < stage ? "#767676" : i === stage ? brand : "#A8A6A0",
                      fontWeight: i === stage ? 600 : 400,
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ) : mode === "list" ? (
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
                          {t.status === "complete" ? "Scored" : t.status}
                        </span>
                        <span className="text-ink-faint">·</span>
                        <span>{t.turns} turns</span>
                        <span className="text-ink-faint">·</span>
                        <span>{formatDate(t.createdAt)}</span>
                      </div>
                    </div>
                    {t.status === "complete" && (
                      <Link
                        href={`/diagnostics/${t.sessionId}`}
                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:underline"
                        style={{ color: brand }}
                      >
                        Results
                      </Link>
                    )}
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
                  </div>
                );
              })}
              {transcripts.length === 0 && (
                <p className="py-8 text-center text-sm text-ink-muted">
                  No transcripts yet.
                </p>
              )}
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Transcript name
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CFO discovery interview"
                className="mb-4 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
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
                rows={12}
                placeholder={
                  "Consultant: How clear is your real-time revenue visibility?\nStakeholder: Honestly, it's patchy — we close around working day eight…"
                }
                className="w-full resize-y rounded-xl border border-line bg-surface p-3.5 font-mono text-[13px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
              />
              <p className="mt-2 text-xs text-ink-muted">
                Prefix lines with <code className="text-[11px]">Consultant:</code>{" "}
                and <code className="text-[11px]">Stakeholder:</code>, or paste
                plain text — speakers alternate automatically.
              </p>
              {error && (
                <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!busy && (
          <div className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
            {mode === "add" && transcripts.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setMode("list");
                  setError(null);
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ink-muted hover:bg-surface-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <span />
            )}

            {mode === "list" ? (
              <button
                type="button"
                onClick={() => setMode("add")}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: brand }}
              >
                <Plus className="h-4 w-4" />
                Add transcript
              </button>
            ) : (
              <button
                type="button"
                onClick={analyse}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: brand }}
              >
                <Sparkles className="h-4 w-4" />
                Analyse with Gemini
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
