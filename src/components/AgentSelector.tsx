"use client";

import {
  BriefcaseBusiness,
  Check,
  Compass,
  HeartHandshake,
  Presentation,
  Scale,
  ServerCog,
  Truck,
} from "lucide-react";

import { FUNCTIONS } from "@/lib/frameworks";
import type { DiagnosticFunction } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<DiagnosticFunction, React.ElementType> = {
  legal: Scale,
  it: ServerCog,
  "operational-delivery": Truck,
  sales: BriefcaseBusiness,
  leadership: Compass,
  culture: HeartHandshake,
  presales: Presentation,
};

export function AgentSelector({
  value,
  onChange,
}: {
  value: DiagnosticFunction | null;
  onChange: (fn: DiagnosticFunction) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {FUNCTIONS.map((fn) => {
        const Icon = ICONS[fn.id];
        const selected = value === fn.id;
        return (
          <button
            key={fn.id}
            type="button"
            onClick={() => onChange(fn.id)}
            className={cn(
              "relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all",
              selected
                ? "border-teal bg-teal-tint shadow-card"
                : "border-line bg-surface hover:border-line-strong hover:shadow-card",
            )}
          >
            {selected && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                selected ? "bg-teal text-white" : "bg-surface-muted text-teal",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-ink">{fn.label}</div>
              <div className="mt-0.5 text-xs text-ink-muted">
                {fn.agentName} · {fn.agentTitle}
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-ink-soft">{fn.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}
