import type { Recommendation } from "@/lib/types";
import { cn, priorityTone } from "@/lib/utils";

const PRIORITY_ACCENT: Record<string, string> = {
  high: "bg-danger",
  medium: "bg-gold",
  low: "bg-ink-faint",
};

/** Three-segment meter for low / medium / high levels (impact, effort). */
function LevelMeter({ label, value }: { label: string; value: string }) {
  const filled = value === "high" ? 3 : value === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
      <span className="text-ink-faint">{label}</span>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i <= filled ? "bg-teal" : "bg-surface-muted",
            )}
          />
        ))}
      </span>
      <span className="font-medium capitalize text-ink-soft">{value}</span>
    </span>
  );
}

export function RecommendationList({ items }: { items: Recommendation[] }) {
  const sorted = [...items].sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 } as const;
    return rank[b.priority] - rank[a.priority];
  });

  return (
    <div className="grid gap-2">
      {sorted.map((rec, i) => {
        const tone = priorityTone(rec.priority);
        return (
          <div
            key={i}
            className="flex overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-card"
          >
            {/* Priority accent bar */}
            <span
              className={cn("w-1 shrink-0", PRIORITY_ACCENT[rec.priority])}
              aria-hidden
            />
            <div className="min-w-0 flex-1 p-4">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold text-ink">{rec.title}</h4>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    tone.bg,
                    tone.text,
                  )}
                >
                  {rec.priority}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                {rec.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <LevelMeter label="Impact" value={rec.impact} />
                <LevelMeter label="Effort" value={rec.effort} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
