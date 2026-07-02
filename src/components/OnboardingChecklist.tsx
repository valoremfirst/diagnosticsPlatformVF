"use client";

import { Check, ChevronRight, X } from "lucide-react";
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

/**
 * Editorial "getting started" checklist for consultants. Renders on the
 * portfolio page until every step is complete (or the user dismisses it —
 * remembered in localStorage).
 */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const [visible, setVisible] = useState(false);

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  useEffect(() => {
    if (allDone) return;
    setVisible(localStorage.getItem(DISMISS_KEY) !== "1");
  }, [allDone]);

  if (!visible || allDone) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <section className="mb-12 animate-fade-in-up overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div>
          <div className="eyebrow eyebrow-teal">Getting started</div>
          <h2 className="mt-1.5 font-display text-xl text-ink">
            Set up your practice
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {doneCount} of {steps.length} complete — finish these to run your
            first diagnostic end-to-end.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss onboarding"
          className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink-soft"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress hairline */}
      <div className="h-1 w-full bg-surface-muted">
        <div
          className="h-full bg-teal transition-all duration-700"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="divide-y divide-line">
        {steps.map((step, i) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "group flex items-center gap-4 px-6 py-4 transition-colors",
                step.done ? "opacity-60" : "hover:bg-surface-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  step.done
                    ? "border-positive bg-positive text-white"
                    : "border-line-strong text-ink-muted group-hover:border-teal group-hover:text-teal",
                )}
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-medium text-ink",
                    step.done && "line-through decoration-ink-faint",
                  )}
                >
                  {step.label}
                </span>
                <span className="block text-xs text-ink-muted">
                  {step.description}
                </span>
              </span>
              {!step.done && (
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-teal" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
