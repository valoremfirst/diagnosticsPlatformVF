"use client";

import { Loader2, MessageSquare, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { withAlpha } from "@/lib/color";
import type { DiagnosticFunction } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "connecting" | "live" | "ending" | "importing" | "done" | "error";

interface ChatMessage {
  role: "agent" | "user";
  text: string;
}

export function TextChatInterview({
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
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint"
        >
          <MessageSquare className="h-4 w-4" style={{ color: brand }} />
          {label ?? "Text interview"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-ink-faint"
        >
          <MessageSquare className="h-3.5 w-3.5" style={{ color: brand }} />
          Text interview
        </button>
      )}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <ChatModal
            companyId={companyId}
            fn={fn}
            agentName={agentName}
            agentTitle={agentTitle}
            brand={brand}
            onClose={() => setOpen(false)}
            onImported={() => {
              setOpen(false);
              onImported();
            }}
          />,
          document.body,
        )}
    </>
  );
}

function ChatModal({
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentPartial, setAgentPartial] = useState<string | null>(null);
  const [awaitingAgent, setAwaitingAgent] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingNote, setPendingNote] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);
  const importedRef = useRef(false);
  const agentAccumRef = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentPartial, awaitingAgent]);

  // Commit a finished agent message, deduping against the last one (the SDK can
  // deliver a reply both as streamed parts and a final `agent_response`).
  const commitAgentMessage = useCallback((raw: string) => {
    const text = raw.trim();
    setAgentPartial(null);
    setAwaitingAgent(false);
    agentAccumRef.current = "";
    if (!text) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "agent" && last.text === text) return prev;
      return [...prev, { role: "agent", text }];
    });
  }, []);

  const importCall = useCallback(async () => {
    if (importedRef.current) return;
    const conversationId = conversationIdRef.current;
    if (!conversationId) {
      setPhase("done");
      return;
    }
    importedRef.current = true;
    setPhase("importing");
    try {
      const res = await fetch(`/api/companies/${companyId}/portal-call/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fn, conversationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error || "Could not import the interview.");
      }
      if (data.pending) {
        setPendingNote("The transcript is still finalising on ElevenLabs — it will appear in this section shortly.");
      }
      setPhase("done");
      onImported();
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, [companyId, fn, onImported]);

  async function connect() {
    setError(null);
    setPhase("connecting");
    try {
      const res = await fetch(`/api/companies/${companyId}/portal-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fn }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start the session.");

      const { TextConversation } = await import("@elevenlabs/client");
      const conv = await TextConversation.startSession({
        signedUrl: data.signedUrl,
        dynamicVariables: data.dynamicVariables,
        // Without this the agent stays in voice mode: it sends its opening line
        // but then waits for audio, so typed replies never get a text response.
        textOnly: true,
        onConnect: ({ conversationId }) => {
          conversationIdRef.current = conversationId;
          setPhase("live");
          setAwaitingAgent(true); // waiting for the opening message
          setTimeout(() => inputRef.current?.focus(), 50);
        },
        onDisconnect: () => {
          if (!importedRef.current) void importCall();
        },
        onMessage: ({ message, role }) => {
          if (!message?.trim()) return;
          // User messages are added optimistically in sendMessage(); ignore the
          // server echo so it isn't duplicated. Only commit agent messages here.
          if (role === "agent") commitAgentMessage(message);
        },
        onAgentChatResponsePart: ({ text, type }) => {
          setAwaitingAgent(false);
          if (type === "start") {
            agentAccumRef.current = "";
            setAgentPartial("");
          } else if (type === "delta") {
            agentAccumRef.current += text ?? "";
            setAgentPartial(agentAccumRef.current);
          } else if (type === "stop") {
            commitAgentMessage(agentAccumRef.current);
          }
        },
        onError: (msg) => {
          setError(msg || "The session hit a problem.");
          setAwaitingAgent(false);
          setPhase("error");
        },
      });
      conversationRef.current = conv;
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  async function endInterview() {
    setPhase("ending");
    try {
      await conversationRef.current?.endSession();
    } catch {
      void importCall();
    }
  }

  function sendMessage() {
    const text = input.trim();
    if (!text || phase !== "live") return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setAwaitingAgent(true);
    conversationRef.current?.sendUserMessage(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Safety net: end any live session if the modal unmounts.
  useEffect(() => {
    return () => {
      if (conversationRef.current && !importedRef.current) {
        try { void conversationRef.current.endSession(); } catch { /* ignore */ }
      }
    };
  }, []);

  const live = phase === "live";
  const busy = phase === "connecting" || phase === "ending" || phase === "importing";
  const canClose = !live && !busy;
  const hasUserTurn = messages.some((m) => m.role === "user");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => canClose && onClose()}
      />
      <div
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card-hover"
        style={{ height: "min(680px, 90vh)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-semibold text-white"
            style={{ background: brand }}
          >
            {agentName.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-base text-ink">{agentName}</span>
              {live && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-positive">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive/60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
                  </span>
                  Live
                </span>
              )}
            </div>
            <div className="truncate text-xs text-ink-muted">{agentTitle} · Text interview</div>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && phase === "idle" && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-semibold text-white"
                  style={{ background: brand }}
                >
                  {agentName.slice(0, 1)}
                </div>
                <p className="mt-3 text-sm font-medium text-ink">{agentName}</p>
                <p className="mt-1 max-w-xs text-xs text-ink-muted">
                  A structured text interview. Type your replies and {agentName} will guide the diagnostic.
                </p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "agent" && (
                <span
                  className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: brand }}
                >
                  {agentName.slice(0, 1)}
                </span>
              )}
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-tr-sm text-white"
                    : "rounded-tl-sm bg-surface-muted text-ink",
                )}
                style={m.role === "user" ? { background: brand } : undefined}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Streaming partial agent response */}
          {agentPartial && (
            <div className="flex justify-start">
              <span
                className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: brand }}
              >
                {agentName.slice(0, 1)}
              </span>
              <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-surface-muted px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                {agentPartial}
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-ink-faint" />
              </div>
            </div>
          )}

          {/* Typing indicator: waiting for the agent, nothing streamed yet */}
          {awaitingAgent && !agentPartial && (
            <div className="flex justify-start">
              <span
                className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: brand }}
              >
                {agentName.slice(0, 1)}
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3.5">
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          {phase === "connecting" && (
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: brand }} />
              Connecting to {agentName}…
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
          )}

          {phase === "done" && (
            <p className="rounded-lg bg-positive/10 px-3 py-2 text-center text-xs font-medium text-positive">
              {pendingNote ?? "Interview saved as a draft — you can analyse it from the section view."}
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="border-t border-line px-4 py-3">
          {phase === "idle" && (
            <button
              type="button"
              onClick={connect}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: brand }}
            >
              <MessageSquare className="h-4 w-4" />
              Start text interview
            </button>
          )}

          {live && (
            <>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Reply to ${agentName}… (Enter to send)`}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
                  style={{ maxHeight: 120 }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: brand }}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {hasUserTurn && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={endInterview}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
                    style={{ background: withAlpha(brand, 0.12), color: brand }}
                  >
                    End & save
                  </button>
                </div>
              )}
            </>
          )}

          {busy && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: brand }} />
              {phase === "importing" ? "Saving transcript…" : phase === "ending" ? "Ending interview…" : "Connecting…"}
            </div>
          )}

          {(phase === "done" || phase === "error") && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
