import { Bot } from "lucide-react";

import type { Recommendation } from "@/lib/types";
import { cn, priorityTone } from "@/lib/utils";

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-[11px] text-ink-soft">
      <span className="text-ink-faint">{label}</span>
      <span className="font-semibold capitalize">{value}</span>
    </span>
  );
}

export function RecommendationList({ items }: { items: Recommendation[] }) {
  const sorted = [...items].sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 } as const;
    return rank[b.priority] - rank[a.priority];
  });

  return (
    <div className="grid gap-3">
      {sorted.map((rec, i) => {
        const tone = priorityTone(rec.priority);
        return (
          <div
            key={i}
            className="rounded-xl border border-line bg-surface p-4 transition-shadow hover:shadow-card"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-tint text-teal">
                <Bot className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-ink">{rec.title}</h4>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      tone.bg,
                      tone.text,
                    )}
                  >
                    {rec.priority} priority
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                  {rec.description}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Pill label="Impact" value={rec.impact} />
                  <Pill label="Effort" value={rec.effort} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
