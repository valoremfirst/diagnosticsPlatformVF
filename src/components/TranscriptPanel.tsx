"use client";

import { Download } from "lucide-react";
import { useEffect, useRef } from "react";

import { Badge } from "@/components/ui/Badge";
import type { TranscriptTurn } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TranscriptPanel({
  transcript,
  title = "Transcript Explorer",
  sessionLabel,
  subtitle,
  highlightIndex,
  onExport,
  className,
  liveCursor = false,
}: {
  transcript: TranscriptTurn[];
  title?: string;
  sessionLabel?: string;
  subtitle?: string;
  highlightIndex?: number;
  onExport?: () => void;
  className?: string;
  liveCursor?: boolean;
}) {
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (highlightIndex != null && refs.current[highlightIndex]) {
      refs.current[highlightIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightIndex]);

  useEffect(() => {
    if (liveCursor) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript.length, liveCursor]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-start justify-between gap-3 px-1 pb-3">
        <div>
          <h3 className="font-display text-xl text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {sessionLabel && (
          <Badge className="bg-teal-tint text-teal">{sessionLabel}</Badge>
        )}
      </div>

      <div className="scroll-slim min-h-0 flex-1 space-y-4 overflow-y-auto border-t border-line pr-2 pt-4">
        {transcript.length === 0 && (
          <p className="px-1 text-sm text-ink-muted">
            No transcript captured yet.
          </p>
        )}
        {transcript.map((turn, i) => {
          const isAgent = turn.speaker === "agent";
          const highlighted = i === highlightIndex;
          return (
            <div
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={cn(
                "scroll-mt-4 rounded-lg px-2 py-1.5 transition-colors",
                highlighted && "bg-teal-tint ring-1 ring-teal-400/40",
              )}
            >
              <div
                className={cn(
                  "mb-1 text-[13px] font-semibold",
                  isAgent ? "text-teal" : "text-ink",
                )}
              >
                {isAgent ? "Consultant" : "Stakeholder"}{" "}
                <span className="font-normal text-ink-faint">[{turn.timestamp}]</span>
              </div>
              <p
                className={cn(
                  "text-[13px] leading-relaxed",
                  isAgent ? "text-ink-soft" : "text-ink",
                )}
              >
                {turn.text}
              </p>
            </div>
          );
        })}
        {liveCursor && transcript.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 text-xs text-ink-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
            Listening…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {onExport && (
        <div className="border-t border-line pt-3">
          <button
            onClick={onExport}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted"
          >
            <Download className="h-4 w-4" />
            Export Full Transcript
          </button>
        </div>
      )}
    </div>
  );
}
