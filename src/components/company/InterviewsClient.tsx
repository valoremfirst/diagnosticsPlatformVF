"use client";

import { signOut } from "firebase/auth";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  LogOut,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useMemo, useRef, useState } from "react";

import { PortalCall } from "@/components/company/PortalCall";
import { TextChatInterview } from "@/components/company/TextChatInterview";
import { Orb, orbAccentForFunction, orbAgentForFunction } from "@/components/ui/Orb";
import {
  INTENT_SUGGESTIONS,
  routeIntent,
  type RouteMatch,
} from "@/lib/agent-routing";
import { brandVars, withAlpha } from "@/lib/color";
import { clientAuth } from "@/lib/firebase-client";
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

/** First name from an email local part, title-cased. "sarah.m" → "Sarah". */
function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const first = local.split(/[.\-_]+/).filter(Boolean)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Two-letter initials from an email local part. "sarah.m" → "SM". */
function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export function InterviewsClient({
  companyId,
  companyName,
  brand,
  interviews,
  userEmail = "",
}: {
  companyId: string;
  companyName: string;
  brand: string;
  interviews: InterviewItem[];
  isAdmin?: boolean;
  userEmail?: string;
}) {
  const router = useRouter();

  const total = interviews.length;
  const done = interviews.filter((i) => i.status === "done").length;

  const byFn = useMemo(() => {
    const m = new Map<DiagnosticFunction, InterviewItem>();
    interviews.forEach((i) => m.set(i.fn, i));
    return m;
  }, [interviews]);

  const firstName = userEmail ? firstNameFromEmail(userEmail) : null;

  // Default to George, the general agent. If a specific function is selected,
  // show that specialist instead.
  const defaultItem = useMemo(
    () => ({
      fn: "finance" as DiagnosticFunction,
      label: "General Consultant",
      agentName: "George",
      agentTitle: "General Consultant",
      blurb: "I'll help you explore any area of your business and connect you with the right specialist.",
      probesFor: [],
      status: "not-started" as InterviewStatus,
      completedCount: 0,
    }),
    [],
  );

  // ── Intent + selection state ─────────────────────────────────────────────
  const [selectedFn, setSelectedFn] = useState<DiagnosticFunction | null>(null);
  const [intent, setIntent] = useState("");
  const [matchReasons, setMatchReasons] = useState<string[]>([]);
  const [browseAll, setBrowseAll] = useState(false);
  const browseRef = useRef<HTMLDivElement>(null);

  const activeItem = selectedFn
    ? byFn.get(selectedFn) ?? defaultItem
    : defaultItem;

  // Live confidence hint under the input.
  const liveTop = useMemo<RouteMatch | null>(
    () => (intent.trim().length >= 2 ? routeIntent(intent)[0] ?? null : null),
    [intent],
  );

  function applyMatch(fn: DiagnosticFunction, reasons: string[]) {
    setSelectedFn(fn);
    setMatchReasons(Array.from(new Set(reasons)).slice(0, 4));
  }

  function submitIntent(text?: string) {
    const value = (text ?? intent).trim();
    if (value) setIntent(value);
    const results = value ? routeIntent(value) : [];
    if (results.length > 0) {
      applyMatch(results[0].fn, results[0].hits);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setBrowseAll(true);
      browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (!activeItem) return null;

  const orbAgent = orbAgentForFunction(activeItem.fn);
  // The whole hero reads as one identity: CTA, chips and hints all take the
  // accent of the orb currently on screen (George's orange by default).
  const accent = orbAccentForFunction(activeItem.fn);

  return (
    <div
      className="relative min-h-screen bg-canvas paper-texture"
      style={brandVars(brand) as CSSProperties}
    >
      {/* ── Minimal top nav (wireframe): wordmark · business · avatar ──────── */}
      <header className="flex h-16 items-center justify-between px-6 sm:px-10">
        <div className="font-display text-[17px] leading-none tracking-tight sm:text-[19px]" style={{ color: "#C94D0E" }}>
          Diagnostics Platform - By VF
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-soft">
          <span className="hidden sm:inline">{companyName}</span>
          {userEmail && <AccountMenu email={userEmail} />}
        </div>
      </header>

      {/* ── Centered first-contact hero ────────────────────────────────────── */}
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col items-center justify-center px-6 pb-16 pt-4 text-center">
        <div className="animate-fade-in-up">
          <Orb agent={orbAgent} state="idle" size={200} interactive />
        </div>

        <div
          className="mt-10 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="eyebrow" style={{ color: accent }}>
            Welcome
          </div>
          <h1 className="mt-4 font-display text-4xl font-normal leading-[1.08] tracking-tight text-ink sm:text-5xl">
            {firstName ? (
              <>It&apos;s good to meet you, {firstName}.</>
            ) : (
              <>It&apos;s good to meet you.</>
            )}
          </h1>
          <p className="font-text mx-auto mt-6 max-w-xl text-lg font-light leading-relaxed text-ink-soft sm:text-[19px]">
            I&apos;m George, your general consultant. When you&apos;re ready, we&apos;ll
            spend thirty minutes or so getting to know each other and{" "}
            {companyName}. Talk naturally — there are no wrong answers.
          </p>
        </div>

        {/* Primary call to action — the hero. */}
        <div
          className="mt-10 flex w-full max-w-sm animate-fade-in-up flex-col items-center gap-3"
          style={{ animationDelay: "160ms" }}
        >
          <PortalCall
            key={activeItem.fn}
            companyId={companyId}
            companyName={companyName}
            callerName={firstName ?? undefined}
            fn={activeItem.fn}
            agentKey={!selectedFn || !byFn.get(selectedFn) ? "george" : undefined}
            agentName={selectedFn && byFn.get(selectedFn) ? byFn.get(selectedFn)!.agentName : "George"}
            agentTitle={selectedFn && byFn.get(selectedFn) ? byFn.get(selectedFn)!.agentTitle : "General Consultant"}
            brand={accent}
            variant="primary"
            label={
              selectedFn && byFn.get(selectedFn)
                ? `Speak with ${byFn.get(selectedFn)?.agentName}`
                : "Start our conversation"
            }
            onImported={() => router.refresh()}
          />
          <TextChatInterview
            key={`${activeItem.fn}-text`}
            companyId={companyId}
            fn={activeItem.fn}
            agentName={selectedFn && byFn.get(selectedFn) ? byFn.get(selectedFn)!.agentName : "George"}
            agentTitle={selectedFn && byFn.get(selectedFn) ? byFn.get(selectedFn)!.agentTitle : "General Consultant"}
            brand={accent}
            variant="primary"
            label="Prefer to type instead?"
            onImported={() => router.refresh()}
          />
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
            <Clock className="h-3 w-3" /> About 30 minutes
            <span className="text-line-strong">·</span>
            {done} of {total} completed
          </p>
        </div>

        {/* Who you'll speak to — subtle line under the CTA. */}
        <p className="mt-4 text-sm text-ink-muted">
          {selectedFn && byFn.get(selectedFn) ? (
            <>
              We&apos;ll connect you with{" "}
              <span className="font-medium text-ink-soft">
                {byFn.get(selectedFn)?.agentName}
              </span>{" "}
              · {byFn.get(selectedFn)?.agentTitle}
            </>
          ) : (
            <>
              You&apos;ll start with{" "}
              <span className="font-medium text-ink-soft">George</span> · General Consultant
            </>
          )}
        </p>

        {matchReasons.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {matchReasons.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
                style={{ background: withAlpha(accent, 0.1), color: accent }}
              >
                <Check className="h-2.5 w-2.5" />
                {r}
              </span>
            ))}
          </div>
        )}

        {/* ── Steer the conversation: intent box + agent switcher ──────────── */}
        <div
          className="mt-14 w-full animate-fade-in-up"
          style={{ animationDelay: "240ms" }}
        >
          <div className="mx-auto flex max-w-md items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="eyebrow whitespace-nowrap">
              Or connect with a specialist
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* Intent input */}
          <form
            className="mx-auto mt-6 w-full max-w-xl"
            onSubmit={(e) => {
              e.preventDefault();
              submitIntent();
            }}
          >
            <div className="group relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-teal"
              />
              <input
                type="text"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="e.g. our cash flow feels unpredictable…"
                aria-label="Describe what you'd like to discuss"
                className="w-full rounded-2xl border border-line bg-surface pl-11 pr-28 text-[15px] text-ink shadow-sm transition-all placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/25"
                style={{ height: "3.25rem" }}
              />
              <button
                type="submit"
                disabled={intent.trim().length < 2}
                className="absolute right-2 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: accent }}
              >
                Match me
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2.5 flex min-h-[1.25rem] items-center justify-center gap-1.5 text-xs text-ink-faint">
              {liveTop ? (
                <>
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: accent }}
                  />
                  We&apos;ll connect you with{" "}
                  <span className="font-semibold text-ink-soft">
                    {byFn.get(liveTop.fn)?.agentName}
                  </span>
                </>
              ) : (
                <span>Start with George, or pick a specialist below.</span>
              )}
            </div>
          </form>

          {/* Suggestion chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {INTENT_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => submitIntent(s.label)}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink-soft transition-all hover:-translate-y-px hover:border-teal-400/50 hover:text-ink"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Browse all specialists (progressive disclosure) */}
          <div ref={browseRef} className="mt-8">
            <button
              type="button"
              onClick={() => setBrowseAll((v) => !v)}
              aria-expanded={browseAll}
              className="mx-auto inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {browseAll ? "Hide specialists" : `Browse all ${total} specialists`}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  browseAll && "rotate-180",
                )}
              />
            </button>

            {browseAll && (
              <div className="mt-5 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
                {interviews.map((item, i) => (
                  <AgentMiniCard
                    key={item.fn}
                    item={item}
                    active={activeItem.fn === item.fn}
                    delay={Math.min(i, 8) * 40}
                    onSelect={() => applyMatch(item.fn, [])}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-12 flex items-center justify-center gap-2 text-center text-xs text-ink-faint">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your responses are confidential and help {companyName}&apos;s advisors
          build an accurate picture. You can pause or hang up at any time.
        </p>
      </main>
    </div>
  );
}

// ─── Minimal account avatar + sign-out (top-right of the bare canvas) ────────
function AccountMenu({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(clientAuth()).catch(() => {});
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-medium uppercase tracking-[0.04em] text-ink-soft transition-colors hover:bg-line focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
        aria-label="Account"
      >
        {initialsFromEmail(email)}
      </button>
      {/* Hover/focus reveal — a single sign-out affordance, no heavy chrome. */}
      <div className="invisible absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface opacity-0 shadow-card-hover transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="truncate border-b border-line px-3 py-2.5 text-xs text-ink-muted">
          {email}
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={busy}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Compact consultant card in the browse-all grid ──────────────────────────
function AgentMiniCard({
  item,
  active,
  delay,
  onSelect,
}: {
  item: InterviewItem;
  active: boolean;
  delay: number;
  onSelect: () => void;
}) {
  // Each card carries its own agent's accent so the grid reads as a lineup of
  // distinct consultants rather than one repeated colour.
  const accent = orbAccentForFunction(item.fn);
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        animationDelay: `${delay}ms`,
        ...(active ? { boxShadow: `0 0 0 2px ${accent}` } : {}),
      }}
      className={cn(
        "rise-in group relative flex flex-col overflow-hidden rounded-2xl border bg-surface p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60",
        active ? "border-transparent" : "border-line hover:border-line-strong",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative -my-1.5 -ml-2 shrink-0">
          <Orb
            agent={orbAgentForFunction(item.fn)}
            state="idle"
            size={36}
            interactive={false}
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="truncate font-display text-base leading-tight text-ink">
            {item.agentName}
          </div>
          <div className="truncate text-xs text-ink-muted">{item.label}</div>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
        {item.blurb}
      </p>
      <span
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
        style={{ color: accent }}
      >
        {active ? "Speaking with" : "Choose"}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
