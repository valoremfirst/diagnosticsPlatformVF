"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Loader2, Mic, MicOff, PhoneCall, PhoneOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Orb, type OrbAgent, type OrbState } from "@/components/ui/Orb";
import type { DiagnosticFunction, TranscriptTurn } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase =
  | "idle"
  | "requesting"
  | "connecting"
  | "live"
  | "importing"
  | "done"
  | "error";

/** Map an ElevenLabs agent name to one of the Orb palettes. */
function orbAgentFor(name: string): OrbAgent {
  const n = name.toLowerCase();
  if (n.startsWith("marg")) return "margot";
  if (n.startsWith("iain") || n.startsWith("ian")) return "iain";
  if (n.startsWith("priy")) return "priya";
  return "george";
}

/**
 * In-portal voice interview. Opens a modal, mints a signed URL from the server,
 * and runs a live ElevenLabs conversation in the browser. When the call ends,
 * the transcript is imported into the section as a draft for later analysis.
 *
 * Available to admins (consultants) and the owning client alike.
 */
export function PortalCall({
  companyId,
  fn,
  agentName,
  agentTitle,
  brand,
  onImported,
  variant = "compact",
  label,
}: {
  companyId: string;
  fn: DiagnosticFunction;
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
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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

      {open && (
        <ConversationProvider>
          <CallModal
            companyId={companyId}
            fn={fn}
            agentName={agentName}
            agentTitle={agentTitle}
            brand={brand}
            onClose={() => setOpen(false)}
            onImported={onImported}
          />
        </ConversationProvider>
      )}
    </>
  );
}

function CallModal({
  companyId,
  fn,
  agentName,
  agentTitle,
  brand,
  onClose,
  onImported,
}: {
  companyId: string;
  fn: DiagnosticFunction;
  agentName: string;
  agentTitle: string;
  brand: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);

  const conversationIdRef = useRef<string | null>(null);
  const importedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnsRef = useRef<TranscriptTurn[]>([]);

  const stopTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  // Pull the finished conversation into the section as a draft. Guarded so it
  // only ever runs once, whoever ends the call (user, agent, or a drop).
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
          body: JSON.stringify({ fn, conversationId }),
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
  }, [companyId, fn, onImported]);

  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      conversationIdRef.current = conversationId;
      setPhase("live");
      setSeconds(0);
      stopTick();
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    },
    onDisconnect: () => {
      stopTick();
      void importCall();
    },
    onMessage: ({ message, source }) => {
      if (!message?.trim()) return;
      const turn: TranscriptTurn = {
        speaker: source === "user" ? "user" : "agent",
        text: message.trim(),
        timestamp: "",
      };
      turnsRef.current = [...turnsRef.current, turn];
      setTurns(turnsRef.current);
    },
    onError: (message) => {
      setError(message || "The voice session hit a problem.");
      setPhase("error");
      stopTick();
    },
  });

  const { status, isSpeaking, setMuted, isMuted, endSession, startSession } =
    conversation;

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
        body: JSON.stringify({ fn }),
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
    return () => {
      stopTick();
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

  const orbState: OrbState =
    phase === "error"
      ? "error"
      : phase === "live"
        ? isSpeaking
          ? "thinking"
          : "listening"
        : phase === "connecting" || phase === "requesting"
          ? "thinking"
          : "idle";

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const busy = phase === "connecting" || phase === "requesting";
  const live = phase === "live";
  const canClose = !live && !busy && phase !== "importing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <div className="label-eyebrow" style={{ color: brand }}>
              Live voice interview
            </div>
            <div className="text-sm font-semibold text-ink">
              {agentName} · {agentTitle}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (live) void hangUp();
              onClose();
            }}
            disabled={busy || phase === "importing"}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-muted hover:text-ink-muted disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center px-6 py-6">
          <Orb
            agent={orbAgentFor(agentName)}
            state={orbState}
            size={120}
            interactive={false}
          />

          <div className="mt-4 text-center">
            {phase === "idle" && (
              <p className="text-sm text-ink-muted">
                {agentName} will conduct a structured voice interview. This uses
                your microphone and is recorded for analysis.
              </p>
            )}
            {phase === "requesting" && (
              <p className="text-sm text-ink-muted">Requesting microphone…</p>
            )}
            {phase === "connecting" && (
              <p className="text-sm text-ink-muted">Connecting to {agentName}…</p>
            )}
            {live && (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-ink">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
                </span>
                {isSpeaking ? `${agentName} is speaking` : "Listening"} · {mm}:
                {ss}
              </div>
            )}
            {phase === "importing" && (
              <p className="flex items-center justify-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving the
                transcript…
              </p>
            )}
            {phase === "done" && (
              <div className="text-sm text-ink">
                <p className="font-semibold">Interview saved.</p>
                <p className="mt-1 text-ink-muted">
                  {pendingNote ??
                    "It's now a draft in this section, ready to analyse."}
                </p>
              </div>
            )}
            {phase === "error" && error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          {/* Live transcript */}
          {turns.length > 0 && (
            <div className="mt-5 max-h-40 w-full space-y-2 overflow-y-auto rounded-xl border border-line bg-canvas p-3 text-[13px]">
              {turns.map((t, i) => (
                <div key={i}>
                  <span
                    className={cn(
                      "font-semibold",
                      t.speaker === "agent" ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    {t.speaker === "agent" ? agentName : "You"}:
                  </span>{" "}
                  <span className="text-ink-soft">{t.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="mt-6 flex items-center gap-3">
            {phase === "idle" && (
              <button
                type="button"
                onClick={begin}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: brand }}
              >
                <PhoneCall className="h-4 w-4" />
                Start interview
              </button>
            )}

            {live && (
              <>
                <button
                  type="button"
                  onClick={() => setMuted(!isMuted)}
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
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
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-danger px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <PhoneOff className="h-4 w-4" />
                  End interview
                </button>
              </>
            )}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === "connecting" ? "Connecting…" : "Preparing…"}
              </div>
            )}

            {(phase === "done" || phase === "error") && (
              <button
                type="button"
                onClick={onClose}
                disabled={!canClose}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint disabled:opacity-50"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
