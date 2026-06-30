"use client";

import { Loader2, Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

const SUGGESTIONS = [
  "What are the top 3 risks across all sections?",
  "Which function is least mature and why?",
  "Summarise the quick wins.",
];

export function CompanyChat({
  companyId,
  brand,
}: {
  companyId: string;
  brand: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json().catch(() => ({}));
      const text = res.ok
        ? data.answer
        : data.error || "Something went wrong — please retry.";
      setMessages((m) => [...m, { role: "ai", text }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Network error — please retry." },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-6 pt-5">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
          style={{ background: brand }}
        >
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-xl text-ink">Ask the diagnostics</h2>
          <p className="text-sm text-ink-muted">
            Answers grounded in this company&apos;s analysed transcripts
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mx-6 mt-4 max-h-80 space-y-3 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2 pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink-faint"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                  m.role === "user"
                    ? "bg-teal text-white"
                    : "border border-line bg-surface-muted/60 text-ink-soft",
                )}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {busy && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface-muted/60 px-4 py-2.5 text-[13px] text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="m-6 mt-4 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about risks, maturity, recommendations…"
          className="h-10 flex-1 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: brand }}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
