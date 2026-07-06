"use client";

import { CheckCircle2, Clock, Mic, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties } from "react";

import { PortalCall } from "@/components/company/PortalCall";
import { Orb } from "@/components/ui/Orb";
import { brandVars, withAlpha } from "@/lib/color";
import type { DiagnosticFunction } from "@/lib/types";
import { cn } from "@/lib/utils";

export type InterviewStatus = "not-started" | "in-review" | "done";

export interface InterviewItem {
  fn: DiagnosticFunction;
  label: string;
  agentName: string;
  agentTitle: string;
  blurb: string;
  probesFor: string[];
  status: InterviewStatus;
  completedCount: number;
}

const STATUS_META: Record<
  InterviewStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  done: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-positive/10 text-positive",
  },
  "in-review": {
    label: "Being reviewed",
    icon: Clock,
    className: "bg-gold/10 text-gold",
  },
  "not-started": {
    label: "Not started",
    icon: Mic,
    className: "bg-surface-muted text-ink-faint",
  },
};

export function InterviewsClient({
  companyId,
  companyName,
  brand,
  interviews,
  isAdmin = false,
}: {
  companyId: string;
  companyName: string;
  brand: string;
  interviews: InterviewItem[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const done = interviews.filter((i) => i.status === "done").length;
  const total = interviews.length;
  const allDone = done === total && total > 0;

  return (
    <div
      className="animate-fade-in"
      style={brandVars(brand) as CSSProperties}
    >
      {/* Hero */}
      <section className="mb-8 flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-10 text-center">
        <Orb agent="george" state="listening" size={104} interactive={false} />
        <h1 className="mt-5 font-display text-3xl text-ink">
          Your interviews
        </h1>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-muted">
          Each interview is a relaxed voice conversation with one of our AI
          consultants — around 30 minutes. Just find a quiet spot, press start,
          and talk naturally. There are no wrong answers.
        </p>

        {/* Progress */}
        <div className="mt-6 w-full max-w-xs">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>{done} of {total} completed</span>
            {allDone && (
              <span className="inline-flex items-center gap-1 text-positive">
                <Sparkles className="h-3.5 w-3.5" /> All done
              </span>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${total ? (done / total) * 100 : 0}%`,
                background: brand,
              }}
            />
          </div>
        </div>
      </section>

      {/* Interview cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {interviews.map((item) => {
          const meta = {
            ...STATUS_META[item.status],
            ...(isAdmin && item.status === "in-review"
              ? { label: "Pending analysis" }
              : {}),
          };
          const StatusIcon = meta.icon;
          const isDone = item.status === "done";
          return (
            <div
              key={item.fn}
              className="flex flex-col rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-card"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-semibold"
                  style={{ background: withAlpha(brand, 0.12), color: brand }}
                >
                  {item.agentName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-lg text-ink">
                    {item.agentName}
                  </div>
                  <div className="truncate text-xs text-ink-muted">
                    {item.label} · {item.agentTitle}
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    meta.className,
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {meta.label}
                </span>
              </div>

              {/* Blurb */}
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {item.blurb}
              </p>

              {/* Topics */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.probesFor.slice(0, 4).map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                  >
                    {p}
                  </span>
                ))}
                {item.probesFor.length > 4 && (
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-ink-faint">
                    +{item.probesFor.length - 4} more
                  </span>
                )}
              </div>

              {/* CTA */}
              <div className="mt-auto pt-5">
                <PortalCall
                  companyId={companyId}
                  fn={item.fn}
                  agentName={item.agentName}
                  agentTitle={item.agentTitle}
                  brand={brand}
                  variant="primary"
                  label={isDone ? "Start again" : "Start interview"}
                  onImported={() => router.refresh()}
                />
                <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-ink-faint">
                  <Clock className="h-3 w-3" /> About 30 minutes ·{" "}
                  {isDone
                    ? `${item.completedCount} completed`
                    : "Uses your microphone"}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <p className="mt-8 text-center text-xs text-ink-faint">
        Your responses are confidential and help {companyName}&apos;s advisors
        build an accurate picture. You can pause or hang up at any time.
      </p>
    </div>
  );
}
