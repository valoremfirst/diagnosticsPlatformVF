import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { MaturityLevel } from "./types";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Map a 0-100 score to a maturity band. */
export function maturityFromScore(score: number): MaturityLevel {
  if (score < 30) return "low";
  if (score < 50) return "developing";
  if (score < 70) return "established";
  if (score < 85) return "advanced";
  return "leading";
}

export const MATURITY_LABEL: Record<MaturityLevel, string> = {
  low: "Low",
  developing: "Developing",
  established: "Established",
  advanced: "Advanced",
  leading: "Leading",
};

/** Tailwind text/border colour token for a score band. */
export function scoreTone(score: number): {
  text: string;
  bg: string;
  ring: string;
  hex: string;
} {
  if (score < 30)
    return { text: "text-danger", bg: "bg-danger/10", ring: "ring-danger/30", hex: "#A84A3D" };
  if (score < 50)
    return { text: "text-gold", bg: "bg-gold/10", ring: "ring-gold/30", hex: "#C9874A" };
  if (score < 70)
    return { text: "text-sand", bg: "bg-sand/15", ring: "ring-sand/30", hex: "#D4A865" };
  if (score < 85)
    return { text: "text-teal-500", bg: "bg-teal-tint", ring: "ring-teal-400/30", hex: "#2E6B7A" };
  return { text: "text-positive", bg: "bg-positive/10", ring: "ring-positive/30", hex: "#3D7A5C" };
}

export const SEVERITY_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function severityTone(severity: string): { text: string; bg: string; dot: string } {
  switch (severity) {
    case "critical":
      return { text: "text-danger", bg: "bg-danger/10", dot: "bg-danger" };
    case "high":
      return { text: "text-gold", bg: "bg-gold/10", dot: "bg-gold" };
    case "medium":
      return { text: "text-sand", bg: "bg-sand/15", dot: "bg-sand" };
    default:
      return { text: "text-ink-muted", bg: "bg-surface-muted", dot: "bg-ink-faint" };
  }
}

export function priorityTone(level: string): { text: string; bg: string } {
  switch (level) {
    case "high":
      return { text: "text-danger", bg: "bg-danger/10" };
    case "medium":
      return { text: "text-gold", bg: "bg-gold/10" };
    default:
      return { text: "text-ink-muted", bg: "bg-surface-muted" };
  }
}

/** Format an ISO date as a UK-style date string. */
export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Seconds -> mm:ss */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_progress: "In progress",
  processing: "Processing",
  complete: "Complete",
  failed: "Failed",
};
