import { EvidenceQuote } from "@/components/EvidenceQuote";
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
    <div className="space-y-5">
      {/* Triage band: count per severity */}
      <div className="grid grid-cols-4 gap-2">
        {COLUMNS.map((col) => {
          const count = risks.filter((r) => r.severity === col.key).length;
          const tone = severityTone(col.key);
          return (
            <div
              key={col.key}
              className={cn("rounded-xl border border-line p-3 text-center", tone.bg)}
            >
              <div className={cn("font-display text-2xl", tone.text)}>{count}</div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {col.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranked risk register */}
      <div className="space-y-3">
        {sorted.map((risk, i) => {
          const tone = severityTone(risk.severity);
          return (
            <div key={i} className="rounded-xl border border-line p-4">
              <div className="flex items-start gap-3">
                <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", tone.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-ink">{risk.title}</h4>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
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
                  {risk.evidence.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {risk.evidence.map((e, j) => (
                        <EvidenceQuote key={j} evidence={e} onJump={onJump} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
