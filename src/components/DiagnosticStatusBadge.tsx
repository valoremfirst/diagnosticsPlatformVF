import { Badge } from "@/components/ui/Badge";
import type { DiagnosticStatus } from "@/lib/types";
import { cn, STATUS_LABEL } from "@/lib/utils";

const TONE: Record<DiagnosticStatus, string> = {
  draft: "bg-surface-muted text-ink-muted",
  in_progress: "bg-indigo/10 text-indigo",
  processing: "bg-sand/15 text-gold",
  complete: "bg-positive/10 text-positive",
  failed: "bg-danger/10 text-danger",
};

export function DiagnosticStatusBadge({
  status,
  className,
}: {
  status: DiagnosticStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(TONE[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
