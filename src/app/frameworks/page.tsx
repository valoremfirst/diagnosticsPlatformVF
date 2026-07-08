import { Check } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/auth";
import {
  FRAMEWORKS,
  FUNCTION_FRAMEWORKS,
  FUNCTIONS,
} from "@/lib/frameworks";
import { listSessions } from "@/lib/store";
import { cn, MATURITY_LABEL, maturityFromScore, scoreTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FrameworksPage() {
  await requireAdmin();
  const completed = (await listSessions()).filter((s) => s.result);

  // Reverse the function→frameworks map so each framework lists its functions.
  const functionsForFramework = (id: string): string[] =>
    FUNCTIONS.filter((fn) => FUNCTION_FRAMEWORKS[fn.id]?.includes(id)).map(
      (fn) => fn.label,
    );

  function portfolioScore(name: string): number | null {
    const scores = completed
      .map((s) => s.result?.frameworks.find((f) => f.framework === name)?.score)
      .filter((n): n is number => typeof n === "number");
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Frameworks" }]}
        title="Diagnostic frameworks"
        description="Each business function is scored against the frameworks relevant to it. Scores shown are the current portfolio average across completed diagnostics."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {FRAMEWORKS.map((f) => {
          const score = portfolioScore(f.name);
          const tone = score != null ? scoreTone(score) : null;
          return (
            <Card key={f.id} className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl text-ink">{f.name}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{f.description}</p>
                </div>
                {score != null ? (
                  <div className="text-right">
                    <div
                      className={cn(
                        "flex h-12 w-14 items-center justify-center rounded-xl font-display text-xl",
                        tone?.bg,
                        tone?.text,
                      )}
                    >
                      {score}
                    </div>
                    <div className="mt-1 text-[11px] capitalize text-ink-muted">
                      {MATURITY_LABEL[maturityFromScore(score)]}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-ink-faint">No data</span>
                )}
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {f.criteria.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-[13px] text-ink-soft">
                    <Check className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                    {c}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                <span className="text-[11px] font-medium text-ink-faint">
                  Applies to:
                </span>
                {functionsForFramework(f.id).map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
