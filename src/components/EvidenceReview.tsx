"use client";

import { useState } from "react";

import { EvidenceQuote } from "@/components/EvidenceQuote";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { Card } from "@/components/ui/Card";
import type { DiagnosticResult, TranscriptTurn } from "@/lib/types";
import { cn, scoreTone } from "@/lib/utils";

export function EvidenceReview({
  transcript,
  result,
  sessionId,
}: {
  transcript: TranscriptTurn[];
  result: DiagnosticResult;
  sessionId: string;
}) {
  const [highlight, setHighlight] = useState<number | undefined>(undefined);

  // Flatten every evidence-bearing finding into a reviewable list.
  const findings = result.frameworks.flatMap((f) =>
    f.criteria
      .filter((c) => c.evidence.length > 0)
      .map((c) => ({
        framework: f.framework,
        name: c.name,
        score: c.score,
        confidence: c.confidence,
        rationale: c.rationale,
        evidence: c.evidence,
      })),
  );

  function exportTranscript() {
    const text = transcript
      .map((t) => `${t.speaker === "agent" ? "Consultant" : "Stakeholder"} [${t.timestamp}]\n${t.text}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Findings with clickable evidence */}
      <div className="space-y-4 lg:col-span-3">
        <Card className="px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Findings & evidence</h2>
            <span className="text-sm text-ink-muted">{findings.length} linked findings</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Click any quote to locate it in the transcript and verify the scoring.
          </p>
        </Card>

        {findings.map((f, i) => {
          const tone = scoreTone(f.score);
          return (
            <Card key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    {f.framework}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-ink">{f.name}</h3>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={cn(
                      "flex h-10 w-12 items-center justify-center rounded-lg font-display text-lg",
                      tone.bg,
                      tone.text,
                    )}
                  >
                    {f.score}
                  </span>
                  <span className="mt-1 text-[11px] text-ink-muted">
                    {Math.round(f.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{f.rationale}</p>
              <div className="mt-3 grid gap-2">
                {f.evidence.map((e, j) => (
                  <EvidenceQuote key={j} evidence={e} onJump={setHighlight} />
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Transcript */}
      <div className="lg:col-span-2">
        <Card className="sticky top-[88px] flex h-[calc(100vh-120px)] flex-col px-5 py-5">
          <TranscriptPanel
            transcript={transcript}
            sessionLabel={`SESSION ${sessionId.toUpperCase()}`}
            highlightIndex={highlight}
            onExport={exportTranscript}
          />
        </Card>
      </div>
    </div>
  );
}
