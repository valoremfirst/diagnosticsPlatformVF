import { Flag } from "lucide-react";

import type { RoadmapItem, RoadmapPhase } from "@/lib/types";

const PHASE_ORDER: RoadmapPhase[] = ["0-30 days", "31-90 days", "3-6 months"];

const PHASE_META: Record<RoadmapPhase, { title: string; tone: string }> = {
  "0-30 days": { title: "Stabilise", tone: "text-danger" },
  "31-90 days": { title: "Build", tone: "text-gold" },
  "3-6 months": { title: "Scale", tone: "text-positive" },
};

export function RoadmapTimeline({ items }: { items: RoadmapItem[] }) {
  const grouped = PHASE_ORDER.map((phase) => ({
    phase,
    items: items.filter((i) => i.phase === phase),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-line" aria-hidden />
      <div className="space-y-7">
        {grouped.map((group) => {
          const meta = PHASE_META[group.phase];
          return (
            <div key={group.phase} className="relative pl-10">
              <div className="absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface">
                <Flag className={`h-4 w-4 ${meta.tone}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-base text-ink">{meta.title}</span>
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  {group.phase}
                </span>
              </div>
              <div className="mt-2.5 grid gap-2.5">
                {group.items.map((item, i) => (
                  <div key={i} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-sm font-medium text-ink">{item.action}</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                      <span>
                        <span className="text-ink-faint">Owner: </span>
                        {item.ownerRole}
                      </span>
                      <span>
                        <span className="text-ink-faint">Outcome: </span>
                        {item.expectedOutcome}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
