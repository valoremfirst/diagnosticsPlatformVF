import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  suffix,
  delta,
  hint,
  accent = "teal",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  delta?: number;
  hint?: string;
  accent?: "teal" | "positive" | "gold" | "danger" | "ink";
}) {
  const accentText =
    accent === "positive"
      ? "text-positive"
      : accent === "gold"
        ? "text-gold"
        : accent === "danger"
          ? "text-danger"
          : accent === "ink"
            ? "text-ink"
            : "text-teal";

  return (
    <Card className="px-5 py-4">
      <div className="label-eyebrow">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn("font-display text-[34px] leading-none", accentText)}>
          {value}
        </span>
        {suffix && <span className="text-sm text-ink-faint">{suffix}</span>}
      </div>
      <div className="mt-2.5 flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              delta >= 0 ? "text-positive" : "text-danger",
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
        {hint && <span className="text-ink-muted">{hint}</span>}
      </div>
    </Card>
  );
}
