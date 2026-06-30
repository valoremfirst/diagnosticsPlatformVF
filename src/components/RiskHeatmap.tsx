import { EvidenceList } from "@/components/EvidenceList";
import type { RiskFinding } from "@/lib/types";
import { cn, severityTone, SEVERITY_RANK } from "@/lib/utils";

const COLUMNS: Array<{ key: RiskFinding["severity"]; label: string }> = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export function RiskHeatmap({
  risks,
  onJump,
}: {
  risks: RiskFinding[];
  onJump?: (index?: number) => void;
}) {
  const sorted = [...risks].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
  );

  return (
    <div className="space-y-4">
      {/* Triage band: count per severity */}
      <div className="grid grid-cols-4 gap-2">
        {COLUMNS.map((col) => {
          const count = risks.filter((r) => r.severity === col.key).length;
          const tone = severityTone(col.key);
          return (
            <div
              key={col.key}
              className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5"
            >
              <span className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
              <div className="min-w-0">
                <div className={cn("font-display text-xl leading-none", tone.text)}>
                  {count}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-ink-muted">
                  {col.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranked risk register */}
      <div className="space-y-2">
        {sorted.map((risk, i) => {
          const tone = severityTone(risk.severity);
          return (
            <div
              key={i}
              className="flex overflow-hidden rounded-xl border border-line bg-surface"
            >
              {/* Severity accent bar */}
              <span className={cn("w-1 shrink-0", tone.dot)} aria-hidden />
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-ink">{risk.title}</h4>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      tone.bg,
                      tone.text,
                    )}
                  >
                    {risk.severity}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                  {risk.description}
                </p>
                <EvidenceList evidence={risk.evidence} onJump={onJump} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
