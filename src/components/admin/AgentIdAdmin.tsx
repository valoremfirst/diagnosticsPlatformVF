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
function GlobalAgentCard() {
  const [ids, setIds] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
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

  const configured = FUNCTIONS.filter((f) => ids[f.id]?.trim()).length;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-teal/30 bg-surface">
      <div className="flex items-center gap-3 bg-teal-tint px-6 py-4">
        <div className="min-w-0">
          <div className="font-display text-lg leading-tight text-teal-deep">
            Shared agents
          </div>
          <div className="text-xs text-teal-500">
            {loading
              ? "Loading from Firebase…"
              : `${configured} of ${FUNCTIONS.length} agents configured · one per function, shared across all clients`}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-line px-6 py-5 sm:grid-cols-2">
        {FUNCTIONS.map((f) => (
          <label key={f.id} className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-soft">
              {f.label} agent ID
            </span>
            <input
              value={ids[f.id] ?? ""}
              onChange={(e) =>
                setIds((prev) => ({ ...prev, [f.id]: e.target.value }))
              }
              disabled={loading}
              placeholder={`env: ELEVENLABS_AGENT_ID_${f.id.toUpperCase().replace(/-/g, "_")}`}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 font-mono text-[12px] text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint disabled:opacity-50"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-3">
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
