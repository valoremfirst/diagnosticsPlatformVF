"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DiagnosticStatusBadge } from "@/components/DiagnosticStatusBadge";
import { EmptyState } from "@/components/States";
import { FUNCTIONS, functionById } from "@/lib/frameworks";
import type {
  DiagnosticFunction,
  DiagnosticSession,
  DiagnosticStatus,
} from "@/lib/types";
import { cn, formatDate, scoreTone, STATUS_LABEL } from "@/lib/utils";

type SortKey = "date" | "score" | "company";

const STATUS_OPTIONS: DiagnosticStatus[] = [
  "complete",
  "processing",
  "in_progress",
  "draft",
  "failed",
];

export function HistoryTable({
  sessions,
  initialQuery = "",
}: {
  sessions: DiagnosticSession[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [fnFilter, setFnFilter] = useState<DiagnosticFunction | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DiagnosticStatus | "all">(
    "all",
  );
  const [sort, setSort] = useState<SortKey>("date");

  const rows = useMemo(() => {
    let r = [...sessions];
    if (fnFilter !== "all") r = r.filter((s) => s.function === fnFilter);
    if (statusFilter !== "all")
      r = r.filter((s) => s.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((s) => {
        const transcriptText = s.transcript
          ?.map((t) => t.text)
          .join(" ")
          .toLowerCase();
        return (
          s.companyName.toLowerCase().includes(q) ||
          s.function.toLowerCase().includes(q) ||
          (s.sector?.toLowerCase().includes(q) ?? false) ||
          (s.title?.toLowerCase().includes(q) ?? false) ||
          (transcriptText?.includes(q) ?? false)
        );
      });
    }
    r.sort((a, b) => {
      if (sort === "score")
        return (b.result?.overallScore ?? -1) - (a.result?.overallScore ?? -1);
      if (sort === "company") return a.companyName.localeCompare(b.companyName);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return r;
  }, [sessions, fnFilter, statusFilter, query, sort]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, function, transcript title or content…"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
          />
        </div>
        <select
          value={fnFilter}
          onChange={(e) => setFnFilter(e.target.value as DiagnosticFunction | "all")}
          className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-teal-400 focus:outline-none"
        >
          <option value="all">All functions</option>
          {FUNCTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as DiagnosticStatus | "all")
          }
          className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-teal-400 focus:outline-none"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-teal-400 focus:outline-none"
        >
          <option value="date">Sort: Newest</option>
          <option value="score">Sort: Score</option>
          <option value="company">Sort: Company</option>
        </select>
      </div>

      <div className="mb-2 text-xs text-ink-muted">
        Showing {rows.length} of {sessions.length}{" "}
        {sessions.length === 1 ? "diagnostic" : "diagnostics"}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No diagnostics match"
          description="Try clearing the filters or start a new diagnostic."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Function</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Date</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Score</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((s) => {
                const fn = functionById(s.function);
                const score = s.result?.overallScore;
                const tone = score != null ? scoreTone(score) : null;
                const href =
                  s.status === "complete"
                    ? `/diagnostics/${s.id}`
                    : s.status === "processing" || s.status === "in_progress"
                      ? `/session/${s.id}`
                      : `/diagnostics/${s.id}`;
                return (
                  <tr key={s.id} className="group transition-colors hover:bg-surface-muted/50">
                    <td className="px-5 py-3.5">
                      <Link href={href} className="font-medium text-ink hover:text-teal">
                        {s.companyName}
                      </Link>
                      {s.sector && (
                        <div className="text-xs text-ink-muted">{s.sector}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{fn.label}</td>
                    <td className="hidden px-5 py-3.5 text-ink-soft md:table-cell">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="hidden px-5 py-3.5 sm:table-cell">
                      <DiagnosticStatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {score != null ? (
                        <span
                          className={cn(
                            "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-display text-base",
                            tone?.bg,
                            tone?.text,
                          )}
                        >
                          {score}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        View
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
