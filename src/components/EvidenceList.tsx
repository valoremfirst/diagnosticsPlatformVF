"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { EvidenceQuote } from "@/components/EvidenceQuote";
import type { EvidenceItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Collapsible list of evidence quotes. Evidence is hidden behind a toggle by
 * default so dense reports (scorecards, risk register) stay scannable, and the
 * supporting quotes are one click away when the reader wants them.
 */
export function EvidenceList({
  evidence,
  onJump,
  defaultOpen = false,
}: {
  evidence: EvidenceItem[];
  onJump?: (index?: number) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (evidence.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[12px] font-medium text-teal transition-colors hover:text-teal-deep"
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
        />
        {evidence.length} supporting {evidence.length === 1 ? "quote" : "quotes"}
      </button>
      {open && (
        <div className="mt-2 grid gap-2">
          {evidence.map((e, i) => (
            <EvidenceQuote key={i} evidence={e} onJump={onJump} />
          ))}
        </div>
      )}
    </div>
  );
}
