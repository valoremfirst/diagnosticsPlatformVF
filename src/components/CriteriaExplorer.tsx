"use client";

import { useState } from "react";

import { CriteriaBarChart } from "@/components/CriteriaBarChart";
import type { FrameworkAssessment } from "@/lib/types";
import { cn, scoreTone } from "@/lib/utils";

export function CriteriaExplorer({
  frameworks,
}: {
  frameworks: FrameworkAssessment[];
}) {
  const [active, setActive] = useState(0);
  const fw = frameworks[active];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {frameworks.map((f, i) => {
          const on = i === active;
          return (
            <button
              key={f.framework}
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                on
                  ? "border-teal bg-teal-tint text-teal"
                  : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
              )}
            >
              {f.framework}
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                  scoreTone(f.score).bg,
                  scoreTone(f.score).text,
                )}
              >
                {f.score}
              </span>
            </button>
          );
        })}
      </div>
      <CriteriaBarChart
        data={fw.criteria.map((c) => ({ name: c.name, score: c.score }))}
      />
    </div>
  );
}
