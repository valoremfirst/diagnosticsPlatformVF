"use client";

import { ArrowRight, Check, PartyPopper, Rocket, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const DISMISS_KEY = "vf-onboarding-dismissed";

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

type StepState = "done" | "current" | "upcoming";

/**
 * Guided "getting started" experience for consultants. Shows a progress ring,
 * per-step state (done / current / upcoming), and a celebratory completion
 * state before it can be dismissed (remembered in localStorage).
 */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = doneCount === total && total > 0;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  // The first not-done step is the "current" focus; earlier done, later upcoming.
  const currentIndex = steps.findIndex((s) => !s.done);

  useEffect(() => {
    setVisible(localStorage.getItem(DISMISS_KEY) !== "1");
  }, []);

  if (!visible) return null;

  function dismiss() {
    setDismissing(true);
    localStorage.setItem(DISMISS_KEY, "1");
    // Let the exit transition play before unmounting.
    window.setTimeout(() => setVisible(false), 260);
  }

  function stateFor(i: number, done: boolean): StepState {
    if (done) return "done";
    if (i === currentIndex) return "current";
    return "upcoming";
  }

  return (
    <section
      className={cn(
        "panel-lit mb-12 transition-all duration-300",
        dismissing
          ? "translate-y-1 scale-[0.99] opacity-0"
          : "animate-fade-in-up opacity-100",
      )}
    >
      {/* Header with progress ring */}
      <div className="flex items-start gap-5 border-b border-line px-6 py-5 sm:px-7">
        <ProgressRing pct={pct} celebrate={allDone} />

        <div className="min-w-0 flex-1">
          <div className="eyebrow eyebrow-teal">
            {allDone ? "You're all set" : "Getting started"}
          </div>
          <h2 className="mt-1.5 font-display text-xl text-ink sm:text-2xl">
            {allDone ? "Your practice is ready" : "Set up your practice"}
          </h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-muted">
            {allDone ? (
              <>
                Every step is complete — you can run diagnostics end-to-end.
                Dismiss this to reclaim the space.
              </>
            ) : (
              <>
                <span className="font-semibold text-ink-soft">
                  {doneCount} of {total}
                </span>{" "}
                complete — finish these to run your first diagnostic end-to-end.
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss setup guide"
          className="focus-ring -mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink-soft"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {allDone ? (
        <div className="flex flex-col items-center gap-3 px-6 py-9 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-positive/10 text-positive">
            <PartyPopper className="h-6 w-6" />
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            Nicely done. Your agents are configured, callers are registered, and
            your first diagnostic is scored.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="btn-teal mt-1 h-10"
          >
            Dismiss guide
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <ol className="relative px-2 py-2 sm:px-3">
          {steps.map((step, i) => {
            const st = stateFor(i, step.done);
            const isLast = i === steps.length - 1;
            return (
              <li key={step.id} className="relative">
                {/* Connector rail between step markers */}
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[35px] top-[46px] h-[calc(100%-30px)] w-px sm:left-[43px]",
                      st === "done" ? "bg-positive/40" : "bg-line",
                    )}
                  />
                )}
                <StepRow step={step} index={i} state={st} />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function StepRow({
  step,
  index,
  state,
}: {
  step: OnboardingStep;
  index: number;
  state: StepState;
}) {
  const marker = (
    <span
      className={cn(
        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all",
        state === "done" &&
          "border-positive bg-positive text-white shadow-sm",
        state === "current" &&
          "border-teal bg-teal-tint text-teal ring-4 ring-teal-tint/60",
        state === "upcoming" && "border-line-strong bg-surface text-ink-faint",
      )}
    >
      {state === "done" ? <Check className="h-4 w-4" /> : index + 1}
    </span>
  );

  const body = (
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-sm font-semibold",
            state === "done" ? "text-ink-muted" : "text-ink",
          )}
        >
          {step.label}
        </span>
        {state === "current" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
            <Rocket className="h-3 w-3" /> Next up
          </span>
        )}
        {state === "done" && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-positive">
            Done
          </span>
        )}
      </span>
      <span
        className={cn(
          "mt-0.5 block text-xs leading-relaxed",
          state === "upcoming" ? "text-ink-faint" : "text-ink-muted",
        )}
      >
        {step.description}
      </span>
    </span>
  );

  // Done steps aren't actionable; current/upcoming link to their setup screen.
  if (state === "done") {
    return (
      <div className="flex items-center gap-3.5 px-4 py-3.5 opacity-90 sm:px-5">
        {marker}
        {body}
      </div>
    );
  }

  return (
    <Link
      href={step.href}
      className={cn(
        "focus-ring group flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors sm:px-5",
        state === "current"
          ? "hover:bg-teal-tint/40"
          : "hover:bg-surface-muted",
      )}
    >
      {marker}
      {body}
      <span
        className={cn(
          "flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-all",
          state === "current"
            ? "bg-teal text-white shadow-sm group-hover:bg-teal-deep"
            : "text-ink-faint group-hover:text-teal",
        )}
      >
        {state === "current" ? "Start" : "Open"}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Circular SVG progress indicator with an animated stroke. */
function ProgressRing({ pct, celebrate }: { pct: number; celebrate: boolean }) {
  const size = 52;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-line"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className={celebrate ? "text-positive" : "text-teal"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums",
          celebrate ? "text-positive" : "text-teal",
        )}
      >
        {celebrate ? <Check className="h-5 w-5" /> : `${pct}%`}
      </span>
    </div>
  );
}
