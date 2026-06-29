import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-6 py-16 text-sm text-ink-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger/5 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-ink-muted">{description}</p>
      )}
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export const PROCESSING_STAGES = [
  "Cleaning transcript",
  "Extracting evidence",
  "Scoring frameworks",
  "Building recommendations",
  "Generating roadmap",
];

export function ProcessingStages({ activeStage }: { activeStage: number }) {
  return (
    <ul className="space-y-3">
      {PROCESSING_STAGES.map((stage, i) => {
        const done = i < activeStage;
        const active = i === activeStage;
        return (
          <li key={stage} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done && "bg-positive/15 text-positive",
                active && "bg-teal text-white",
                !done && !active && "bg-surface-muted text-ink-faint",
              )}
            >
              {done ? "✓" : active ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-ink" : done ? "text-ink-soft" : "text-ink-faint",
              )}
            >
              {stage}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
