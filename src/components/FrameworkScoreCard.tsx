"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { EvidenceQuote } from "@/components/EvidenceQuote";
import { Card } from "@/components/ui/Card";
import type { FrameworkAssessment } from "@/lib/types";
import { cn, maturityFromScore, MATURITY_LABEL, scoreTone } from "@/lib/utils";

export function FrameworkScoreCard({
  assessment,
  onJump,
  defaultOpen = false,
}: {
  assessment: FrameworkAssessment;
  onJump?: (index?: number) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const tone = scoreTone(assessment.score);
  const level =
    assessment.maturityLevel ||
    MATURITY_LABEL[maturityFromScore(assessment.score)];

  return (
    <Card>
      <button
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <h3 className="font-display text-lg text-ink">{assessment.framework}</h3>
          <p className="mt-0.5 text-xs capitalize text-ink-muted">
            {level} maturity · {assessment.criteria.length} criteria
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden w-36 sm:block">
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${assessment.score}%`, background: tone.hex }}
              />
            </div>
          </div>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-xl",
              tone.bg,
              tone.text,
            )}
          >
            {assessment.score}
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-ink-faint transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-line px-6 py-5">
          <div className="grid gap-4">
            {assessment.criteria.map((c) => {
              const ct = scoreTone(c.score);
              return (
                <div key={c.name} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-ink">{c.name}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                        {c.rationale}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div
                        className={cn(
                          "flex h-10 w-12 items-center justify-center rounded-lg font-display text-lg",
                          ct.bg,
                          ct.text,
                        )}
                      >
                        {c.score}
                      </div>
                      <ConfidencePill value={c.confidence} />
                    </div>
                  </div>
                  {c.evidence.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {c.evidence.map((e, i) => (
                        <EvidenceQuote key={i} evidence={e} onJump={onJump} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 70 ? "text-positive" : pct >= 45 ? "text-gold" : "text-ink-muted";
  return (
    <span className={cn("mt-1.5 text-[11px] font-medium", tone)}>
      {pct}% confidence
    </span>
  );
}
