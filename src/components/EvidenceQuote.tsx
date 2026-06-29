import { Quote } from "lucide-react";

import type { EvidenceItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EvidenceQuote({
  evidence,
  onJump,
  className,
}: {
  evidence: EvidenceItem;
  onJump?: (index?: number) => void;
  className?: string;
}) {
  const interactive = Boolean(onJump);
  return (
    <blockquote
      className={cn(
        "rounded-lg border-l-2 border-teal-400 bg-surface-muted/70 px-4 py-3",
        interactive && "cursor-pointer transition-colors hover:bg-teal-tint",
        className,
      )}
      onClick={interactive ? () => onJump?.(evidence.transcriptIndex) : undefined}
      role={interactive ? "button" : undefined}
    >
      <p className="flex gap-2 text-[13px] italic leading-relaxed text-ink-soft">
        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
        <span>“{evidence.quote}”</span>
      </p>
      <div className="mt-1.5 flex items-center gap-2 pl-5 text-[11px] text-ink-muted">
        <span className="font-medium capitalize">
          {evidence.speaker === "user" ? "Stakeholder" : "Consultant"}
        </span>
        {typeof evidence.transcriptIndex === "number" && (
          <span className="text-ink-faint">
            · turn #{evidence.transcriptIndex}
            {interactive && " · view in transcript"}
          </span>
        )}
      </div>
    </blockquote>
  );
}
