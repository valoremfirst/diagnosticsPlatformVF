"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { FUNCTIONS } from "@/lib/frameworks";
import { cn } from "@/lib/utils";

/**
 * Agents are global — one shared agent per business function, used across every
 * client. Per-caller context is injected at call time (phone → webhook, browser
 * → dynamic variables), so no per-company agents are needed.
 */
export function AgentIdAdmin() {
  return (
    <div className="space-y-6">
      <GlobalAgentCard />
    </div>
  );
}

/** Shared agents — one per function, stored in Firestore config/elevenlabs. */
const GEORGE_KEY = "george";

function GlobalAgentCard() {
  const [ids, setIds] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = { [GEORGE_KEY]: "" };
    for (const f of FUNCTIONS) seed[f.id] = "";
    return seed;
  });
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.config?.agentIds) {
          setIds((prev) => ({ ...prev, ...data.config.agentIds }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentIds: ids }),
      });
      if (!res.ok) throw new Error("save failed");
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
    }
  }

  const configured =
    (ids[GEORGE_KEY]?.trim() ? 1 : 0) +
    FUNCTIONS.filter((f) => ids[f.id]?.trim()).length;

  return (
    <div className="panel-lit overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-teal-tint/60 px-6 py-4">
        <div className="min-w-0">
          <div className="font-display text-lg leading-tight text-teal-deep">
            Shared agents
          </div>
          <div className="text-xs text-teal-500">
            One per function, shared across all clients.
          </div>
        </div>
        {/* Configured count with a slim progress ring vibe */}
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-surface/70 px-3 py-1.5 text-xs font-semibold text-teal-deep ring-1 ring-inset ring-teal/20">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </>
          ) : (
            <>
              <span className="tabular-nums">{configured}</span>
              <span className="text-teal-500">/ {FUNCTIONS.length + 1} set</span>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
        {/* George — the general catch-all agent that routes to specialists. */}
        {(() => {
          const set = Boolean(ids[GEORGE_KEY]?.trim());
          return (
            <label key={GEORGE_KEY} className="block sm:col-span-2">
              <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-ink-soft">
                George · General Consultant
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    set
                      ? "bg-positive/10 text-positive"
                      : "bg-surface-muted text-ink-faint",
                  )}
                >
                  {set ? (
                    <>
                      <Check className="h-2.5 w-2.5" /> Set
                    </>
                  ) : (
                    "Env / unset"
                  )}
                </span>
              </span>
              <input
                value={ids[GEORGE_KEY] ?? ""}
                onChange={(e) =>
                  setIds((prev) => ({ ...prev, [GEORGE_KEY]: e.target.value }))
                }
                disabled={loading}
                placeholder="env: ELEVENLABS_AGENT_ID_GEORGE"
                className="input-editorial h-9 rounded-lg font-mono text-[12px] disabled:opacity-50"
              />
            </label>
          );
        })()}

        {FUNCTIONS.map((f) => {
          const set = Boolean(ids[f.id]?.trim());
          return (
            <label key={f.id} className="block">
              <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-ink-soft">
                {f.label}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    set
                      ? "bg-positive/10 text-positive"
                      : "bg-surface-muted text-ink-faint",
                  )}
                >
                  {set ? (
                    <>
                      <Check className="h-2.5 w-2.5" /> Set
                    </>
                  ) : (
                    "Env / unset"
                  )}
                </span>
              </span>
              <input
                value={ids[f.id] ?? ""}
                onChange={(e) =>
                  setIds((prev) => ({ ...prev, [f.id]: e.target.value }))
                }
                disabled={loading}
                placeholder={`env: ELEVENLABS_AGENT_ID_${f.id.toUpperCase().replace(/-/g, "_")}`}
                className="input-editorial h-9 rounded-lg font-mono text-[12px] disabled:opacity-50"
              />
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-sunken/50 px-6 py-3">
        <p className="text-xs text-ink-faint">
          These override <code className="text-[11px]">ELEVENLABS_AGENT_ID_*</code> env vars when set.
        </p>
        <div className="flex items-center gap-3">
          {state === "error" && (
            <span className="text-xs text-danger">Could not save — try again.</span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={state === "saving" || loading}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-colors disabled:opacity-60",
              state === "saved" ? "bg-positive" : "bg-teal hover:bg-teal-deep",
            )}
          >
            {state === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : state === "saved" ? (
              <Check className="h-4 w-4" />
            ) : null}
            {state === "saved" ? "Saved to Firebase" : "Save to Firebase"}
          </button>
        </div>
      </div>
    </div>
  );
}
