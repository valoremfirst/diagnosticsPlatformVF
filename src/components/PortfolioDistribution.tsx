"use client";

import { useState } from "react";

import type { MaturityLevel } from "@/lib/types";
import { cn, MATURITY_LABEL } from "@/lib/utils";

export interface DistributionBand {
  level: MaturityLevel;
  count: number;
  hex: string;
}

/**
 * A horizontal maturity-distribution bar across the portfolio. Each segment is
 * one maturity band, sized by how many companies fall in it. Hovering a segment
 * (or its legend row) highlights it and surfaces the count — a quiet, editorial
 * way to read the shape of the portfolio at a glance.
 */
export function PortfolioDistribution({
  bands,
  total,
}: {
  bands: DistributionBand[];
  total: number;
}) {
  const [active, setActive] = useState<MaturityLevel | null>(null);

  if (total === 0) {
    return (
      <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-line-strong bg-surface-sunken px-4 py-6 text-center">
        <p className="text-sm text-ink-muted">
          No scored companies yet — the maturity spread will appear here once
          your first diagnostics complete.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stacked bar */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-line"
        role="img"
        aria-label={`Portfolio maturity distribution across ${total} scored ${total === 1 ? "company" : "companies"}`}
      >
        {bands.map((b) => {
          if (b.count === 0) return null;
          const pct = (b.count / total) * 100;
          const dimmed = active !== null && active !== b.level;
          return (
            <div
              key={b.level}
              className={cn(
                "h-full transition-all duration-300 ease-out first:rounded-l-full last:rounded-r-full",
                dimmed ? "opacity-30" : "opacity-100",
              )}
              style={{ width: `${pct}%`, background: b.hex }}
              onMouseEnter={() => setActive(b.level)}
              onMouseLeave={() => setActive(null)}
            />
          );
        })}
      </div>

      {/* Legend */}
      <ul className="mt-4 space-y-1.5">
        {bands.map((b) => {
          const dimmed = active !== null && active !== b.level;
          const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
          return (
            <li
              key={b.level}
              onMouseEnter={() => setActive(b.level)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-1 py-0.5 text-sm transition-opacity duration-200",
                dimmed ? "opacity-40" : "opacity-100",
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: b.hex }}
              />
              <span className="flex-1 text-ink-soft">
                {MATURITY_LABEL[b.level]}
              </span>
              <span className="font-display text-sm text-ink tabular-nums">
                {b.count}
              </span>
              <span className="w-9 text-right text-xs text-ink-faint tabular-nums">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
