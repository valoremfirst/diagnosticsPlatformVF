"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Loader2, Mic, MicOff, PhoneCall, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  Orb,
  orbAccentForFunction,
  orbAgentForFunction,
  type OrbState,
} from "@/components/ui/Orb";
import { bestRoute } from "@/lib/agent-routing";
import { FUNCTIONS, functionById } from "@/lib/frameworks";
import type { DiagnosticFunction, TranscriptTurn } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase =
  | "idle"
  | "requesting"
  | "connecting"
  | "live"
  | "handoff"
  | "importing"
  | "done"
  | "error";

/** The agent currently on the line — mutable, because George can hand over. */
interface AgentIdentity {
  fn: DiagnosticFunction;
  agentName: string;
  agentTitle: string;
}

const FUNCTION_IDS = FUNCTIONS.map((f) => f.id);

/**
 * Resolve whatever the agent passes to `transfer_to_specialist` into a real
 * function. Accepts a function id ("it", "operational-delivery"), an agent name
 * ("Nora"), a label ("Finance"), or free text ("cyber security") — the last
 * falls through to the same intent router the hero uses.
 */
function normaliseSpecialist(raw?: string): DiagnosticFunction | null {
  if (!raw || typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (!v) return null;

  const direct = FUNCTION_IDS.find(
    (id) => id === v || id.replace(/-/g, " ") === v,
  );
  if (direct) return direct;

  const byName = FUNCTIONS.find(
    (f) => f.agentName.toLowerCase() === v || f.label.toLowerCase() === v,
  );
  if (byName) return byName.id;

  return bestRoute(v)?.fn ?? null;
}

/** Local wall-clock stamp (HH:MM) for a live caption. */
function clock(d = new Date()): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Two-letter initials from a name or email local-part. */
function initials(value: string): string {
  const base = value.includes("@") ? value.split("@")[0] : value;
  const parts = base.split(/[.\-_\s]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

/**
 * In-portal voice interview. Opens a full-screen session, mints a signed URL
 * from the server, and runs a live ElevenLabs conversation in the browser. When
 * the call ends, the transcript is imported into the section as a draft for
 * later analysis.
 *
 * A general agent (George) can hand the caller over to a specialist mid-call by
 * invoking the `transfer_to_specialist` client tool — the browser tears down the
 * current session and reconnects to the specialist's agent, carrying the tail of
 * George's conversation as context.
 *
 * Available to admins (consultants) and the owning client alike.
 */
export function PortalCall({
  companyId,
  companyName,
  callerName,
  fn,
  agentKey,
  agentName,
  agentTitle,
  brand,
  onImported,
  variant = "compact",
  label,
}: {
  companyId: string;
  companyName?: string;
  callerName?: string;
  fn: DiagnosticFunction;
  /** Optional override — resolves this agent key instead of fn (e.g. "george"). */
  agentKey?: string;
  agentName: string;
  agentTitle: string;
  brand: string;
  onImported: () => void;
  /** compact = small outline button (in-section); primary = full-width CTA. */
  variant?: "compact" | "primary";
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "primary" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
          style={{ background: brand }}
        >
          <PhoneCall className="h-4 w-4" />
          {label ?? "Start interview"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-ink-faint"
        >
          <PhoneCall className="h-3.5 w-3.5" style={{ color: brand }} />
          {label ?? "Start voice interview"}
        </button>
      )}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <ConversationProvider>
            <CallModal
              companyId={companyId}
              companyName={companyName}
              callerName={callerName}
              fn={fn}
              agentKey={agentKey}
              agentName={agentName}
              agentTitle={agentTitle}
              onClose={() => setOpen(false)}
              onImported={onImported}
            />
          </ConversationProvider>,
          document.body,
        )}
    </>
  );
}

function CallModal({
  companyId,
  companyName,
  callerName,
  fn,
  agentKey: initialAgentKey,
  agentName: initialAgentName,
  agentTitle: initialAgentTitle,
  onClose,
  onImported,
}: {
  companyId: string;
  companyName?: string;
  callerName?: string;
  fn: DiagnosticFunction;
  agentKey?: string;
  agentName: string;
  agentTitle: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);

  // The agent on the line. Starts as whoever launched the call (George, by
  // default) and flips when a handoff completes.
  const [identity, setIdentity] = useState<AgentIdentity>({
    fn,
    agentName: initialAgentName,
    agentTitle: initialAgentTitle,
  });
  const identityRef = useRef(identity);
  identityRef.current = identity;

  // The agent key for the current leg (e.g. "george"). Cleared on handoff so
  // specialist legs resolve normally by fn.
  const agentKeyRef = useRef<string | undefined>(initialAgentKey);

  // The specialist we're transferring to, shown on the transition screen.
  const [handoffTo, setHandoffTo] = useState<AgentIdentity | null>(null);

  const conversationIdRef = useRef<string | null>(null);
  const importedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnsRef = useRef<TranscriptTurn[]>([]);
  // True from the moment a handoff starts until the specialist connects — tells
  // onDisconnect to skip the import (the next leg is about to begin).
  const handoffRef = useRef(false);
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  // Pull the finished conversation into the section as a draft. Guarded so it
  // only ever runs once, whoever ends the call (user, agent, or a drop). Imports
  // under the *current* identity's function so a specialist leg lands correctly.
  const importCall = useCallback(async () => {
    if (importedRef.current) return;
    const conversationId = conversationIdRef.current;
    if (!conversationId) {
      // Never connected far enough to get an id — nothing to import.
      setPhase((p) => (p === "error" ? p : "done"));
      return;
    }
    importedRef.current = true;
    setPhase("importing");
    try {
      const res = await fetch(
        `/api/companies/${companyId}/portal-call/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fn: identityRef.current.fn,
            conversationId,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error || "Could not import the interview.");
      }
      if (data.pending) {
        setPendingNote(
          "The transcript is still finalising on ElevenLabs — it will appear in this section shortly.",
        );
      }
      setPhase("done");
      onImported();
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, [companyId, onImported]);

  const conversation = useConversation({
    // Client tools the agent can invoke mid-call. George's agent must declare a
    // matching client tool named exactly `transfer_to_specialist` with a string
    // `specialist` parameter, or this handler never fires.
    clientTools: {
      transfer_to_specialist: async (params: { specialist?: string }) => {
        console.log("[handoff] tool fired. params =", params);
        const target = normaliseSpecialist(params?.specialist);
        console.log("[handoff] normalised target =", target);
        if (!target) {
          return "I couldn't place that specialism — let's keep talking and I'll help directly.";
        }
        const isGeorge = agentKeyRef.current === "george";
        console.log(
          "[handoff] isGeorge =",
          isGeorge,
          "currentFn =",
          identityRef.current.fn,
        );
        if (!isGeorge && target === identityRef.current.fn) {
          return "You're already with the right specialist, so just carry on the conversation.";
        }
        const spec = functionById(target);
        console.log("[handoff] scheduling handoff to", spec.agentName, target);
        void performHandoff(target);
        return `Handing over to ${spec.agentName}, ${spec.agentTitle}. Give the client a short, warm goodbye now.`;
      },
    },
    onConnect: ({ conversationId }) => {
      console.log(
        "[handoff] onConnect — conversationId =",
        conversationId,
        "wasHandoff =",
        handoffRef.current,
      );
      conversationIdRef.current = conversationId;
      // Whatever leg just connected, any in-flight handoff is now complete.
      handoffRef.current = false;
      setHandoffTo(null);
      setPhase("live");
      setSeconds(0);
      stopTick();
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    },
    onDisconnect: () => {
      console.log(
        "[handoff] onDisconnect — handoffInProgress =",
        handoffRef.current,
      );
      stopTick();
      // Mid-handoff disconnects are expected — the specialist leg reconnects.
      if (handoffRef.current) return;
      void importCall();
    },
    onMessage: ({ message, source }) => {
      if (!message?.trim()) return;
      const turn: TranscriptTurn = {
        speaker: source === "user" ? "user" : "agent",
        text: message.trim(),
        timestamp: clock(),
      };
      turnsRef.current = [...turnsRef.current, turn];
      setTurns(turnsRef.current);
    },
    onError: (message) => {
      console.error("[handoff] onError from SDK:", message);
      setError(message || "The voice session hit a problem.");
      setPhase("error");
      stopTick();
    },
  });

  const { isSpeaking, setMuted, isMuted, endSession, startSession } =
    conversation;

  async function connectSpecialist(
    target: DiagnosticFunction,
    priorTurns: TranscriptTurn[],
  ) {
    setPhase("connecting");
    try {
      console.log("[handoff] fetching signed url for", target);
      const res = await fetch(`/api/companies/${companyId}/portal-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fn: target, priorTurns }),
      });
      const data = await res.json().catch(() => ({}));
      console.log("[handoff] portal-call response", res.status, data);
      if (!res.ok) {
        throw new Error(data.error || "Could not connect the specialist.");
      }
      console.log("[handoff] calling startSession for specialist…");
      await startSession({
        signedUrl: data.signedUrl,
        connectionType: "websocket",
        dynamicVariables: data.dynamicVariables,
      });
      console.log("[handoff] startSession resolved for specialist");
    } catch (e) {
      console.error("[handoff] connectSpecialist FAILED", e);
      handoffRef.current = false;
      setHandoffTo(null);
      setError((e as Error).message);
      setPhase("error");
    }
  }

  async function performHandoff(target: DiagnosticFunction) {
    if (handoffRef.current) return;
    handoffRef.current = true;

    const spec = functionById(target);
    const next: AgentIdentity = {
      fn: target,
      agentName: spec.agentName,
      agentTitle: spec.agentTitle,
    };
    setHandoffTo(next);
    setPhase("handoff");
    stopTick();

    // Give the outgoing agent a beat to deliver their closing line before we
    // tear the session down.
    await new Promise<void>((resolve) => {
      handoffTimerRef.current = setTimeout(resolve, 2200);
    });

    // Carry the tail of the conversation so the specialist picks up naturally.
    const priorTurns = turnsRef.current.slice(-10);

    console.log("[handoff] ending George's session…");
    try {
      await endSession();
      console.log("[handoff] endSession resolved");
    } catch (e) {
      console.warn("[handoff] endSession threw (continuing)", e);
      /* the reconnect below is what matters */
    }

    // Fresh transcript + identity for the specialist leg.
    turnsRef.current = [];
    setTurns([]);
    conversationIdRef.current = null;
    agentKeyRef.current = undefined; // specialist resolves by fn, not key
    identityRef.current = next;
    setIdentity(next);

    await connectSpecialist(target, priorTurns);
  }

  async function begin() {
    setError(null);
    setPendingNote(null);
    setPhase("requesting");
    try {
      // Explicit mic permission up front for a clean prompt.
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "Microphone access is required for the interview. Please allow it and try again.",
      );
      setPhase("error");
      return;
    }

    setPhase("connecting");
    try {
      const res = await fetch(`/api/companies/${companyId}/portal-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fn: identityRef.current.fn,
          ...(agentKeyRef.current ? { agentKey: agentKeyRef.current } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start the call.");

      await startSession({
        signedUrl: data.signedUrl,
        connectionType: "websocket",
        dynamicVariables: data.dynamicVariables,
      });
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  async function hangUp() {
    try {
      await endSession();
    } catch {
      /* onDisconnect handles the import path */
    }
  }

  // Safety net: end any live session if the modal unmounts.
  useEffect(() => {
    console.log(
      "[handoff] CallModal mounted — transfer_to_specialist tool registered. agentKey =",
      initialAgentKey,
    );
    return () => {
      stopTick();
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
      if (conversationIdRef.current && !importedRef.current) {
        try {
          void endSession();
        } catch {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape when it's safe to bail (not mid-call / mid-save).
  const busy =
    phase === "connecting" || phase === "requesting" || phase === "handoff";
  const live = phase === "live";
  const canClose = !live && !busy && phase !== "importing";
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [canClose, onClose]);

  const orbAgent = orbAgentForFunction(identity.fn);
  const accent = orbAccentForFunction(identity.fn);

  const orbState: OrbState =
    phase === "error"
      ? "error"
      : phase === "live"
        ? isSpeaking
          ? "thinking"
          : "listening"
        : phase === "connecting" ||
            phase === "requesting" ||
            phase === "handoff"
          ? "thinking"
          : "idle";

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // Most-recent line from each speaker drives the editorial captions.
  const lastAgent = [...turns].reverse().find((t) => t.speaker === "agent");
  const lastUser = [...turns].reverse().find((t) => t.speaker === "user");
  const you = callerName?.trim() || "You";
  const avatar = initials(callerName || companyName || "You");

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-canvas paper-texture animate-fade-in">
      <style>{PORTAL_KEYFRAMES}</style>

      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <header className="relative flex h-16 shrink-0 items-center justify-between px-6 sm:px-10">
        <div
          className="font-display text-[17px] leading-none tracking-tight sm:text-[19px]"
          style={{ color: "#C94D0E" }}
        >
          Diagnostics Platform - By VF
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-soft">
          {companyName && (
            <span className="hidden sm:inline">{companyName}</span>
          )}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-medium uppercase tracking-[0.04em] text-ink-soft">
            {avatar}
          </span>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Hairline with an accent segment that draws in on mount. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line" />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-px"
          style={{
            width: "34%",
            background: accent,
            transformOrigin: "left",
            animation: "portal-navline 900ms cubic-bezier(.22,1,.36,1) both",
          }}
        />
      </header>

      {/* ── Stage ────────────────────────────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6">
        {/* Live "recording" card, echoing the wireframe's floating insight. */}
        {live && (
          <div
            className="absolute right-4 top-4 z-10 w-[260px] rounded-xl border border-line bg-surface/85 px-4 py-3 shadow-card backdrop-blur-sm sm:right-10 sm:top-6"
            style={{
              borderLeft: `3px solid ${accent}`,
              animation:
                "portal-card-in 600ms cubic-bezier(.22,1,.36,1) 200ms both",
            }}
          >
            <div
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: accent }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                  style={{ background: accent }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                />
              </span>
              Recording · live
            </div>
            <div className="mt-1.5 font-display text-lg leading-tight text-ink">
              {identity.agentName}
            </div>
            <div className="mt-0.5 font-mono text-xs text-ink-muted">
              {identity.agentTitle} · {mm}:{ss}
            </div>
          </div>
        )}

        {/* Orb — the heart of the session. */}
        <Orb agent={orbAgent} state={orbState} size={200} interactive={false} />

        {/* Phase-specific content, sitting under the orb's halo. */}
        <div className="-mt-6 w-full max-w-2xl text-center">
          {phase === "idle" && (
            <div className="flex flex-col items-center gap-5 animate-fade-in-up">
              <div>
                <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
                  Ready when you are
                </h2>
                <p className="font-text mx-auto mt-3 max-w-md text-[17px] font-light leading-relaxed text-ink-soft">
                  {identity.agentName} will guide a relaxed voice conversation.
                  We&apos;ll use your microphone and record it so your advisors
                  can review it later.
                </p>
              </div>
              <button
                type="button"
                onClick={begin}
                className="inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-95"
                style={{ background: accent }}
              >
                <PhoneCall className="h-4 w-4" />
                Start conversation
              </button>
              <p className="text-xs text-ink-faint">
                About 30 minutes · you can end any time
              </p>
            </div>
          )}

          {(phase === "requesting" || phase === "connecting") && (
            <p className="font-text animate-fade-in text-lg italic text-ink-soft">
              {phase === "requesting"
                ? "Requesting your microphone…"
                : `Connecting you to ${identity.agentName}…`}
            </p>
          )}

          {phase === "handoff" && handoffTo && (
            <div className="animate-fade-in-up">
              <p className="font-text text-lg italic leading-relaxed text-ink-soft sm:text-xl">
                Introducing you to {handoffTo.agentName}…
              </p>
              <p className="mt-2 text-xs text-ink-faint">
                {handoffTo.agentTitle}
              </p>
            </div>
          )}

          {live && (
            <div className="flex flex-col items-center gap-6">
              {lastAgent && (
                <div
                  key={`a-${lastAgent.text}`}
                  className="animate-fade-in-up"
                >
                  <p className="font-text text-lg italic leading-relaxed text-ink-faint sm:text-xl">
                    &ldquo;{lastAgent.text}&rdquo;
                  </p>
                  <p className="mt-2 text-xs text-ink-faint">
                    — {identity.agentName} · {lastAgent.timestamp}
                  </p>
                </div>
              )}

              {lastUser && (
                <div
                  key={`u-${lastUser.text}`}
                  className="animate-fade-in-up"
                >
                  <p className="font-text text-2xl italic leading-relaxed text-ink sm:text-[26px]">
                    &ldquo;{lastUser.text}&rdquo;
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    — {you} · {lastUser.timestamp}
                  </p>
                </div>
              )}

              <p className="font-text text-sm italic text-ink-faint">
                {!lastAgent && !lastUser
                  ? "Say hello when you're ready…"
                  : isSpeaking
                    ? `${identity.agentName} is speaking`
                    : "Listening"}
              </p>
            </div>
          )}

          {phase === "importing" && (
            <p className="flex items-center justify-center gap-2 text-sm text-ink-muted animate-fade-in">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving the
              transcript…
            </p>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center gap-5 animate-fade-in-up">
              <div>
                <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
                  Thank you
                </h2>
                <p className="font-text mx-auto mt-3 max-w-md text-[17px] font-light leading-relaxed text-ink-soft">
                  {pendingNote ??
                    "Your conversation has been saved. Your advisors will review and analyse it shortly."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: accent }}
              >
                Done
              </button>
            </div>
          )}

          {phase === "error" && error && (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <p className="max-w-md rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={begin}
                  className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: accent }}
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-6 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Live controls (bottom-right, per the wireframe) ──────────────── */}
      {live && (
        <div className="absolute bottom-6 right-6 flex items-center gap-2.5 animate-fade-in sm:bottom-8 sm:right-10">
          <button
            type="button"
            onClick={() => setMuted(!isMuted)}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-all hover:-translate-y-0.5",
              isMuted
                ? "border-danger/30 bg-danger/10 text-danger"
                : "border-line bg-surface text-ink-soft hover:border-ink-faint",
            )}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={hangUp}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-semibold text-ink-soft shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink-faint hover:text-ink"
          >
            End session
          </button>
        </div>
      )}
    </div>
  );
}

const PORTAL_KEYFRAMES = `
  @keyframes portal-navline { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes portal-card-in {
    from { opacity: 0; transform: translateY(-8px) translateX(10px); }
    to { opacity: 1; transform: translateY(0) translateX(0); }
  }
`;
