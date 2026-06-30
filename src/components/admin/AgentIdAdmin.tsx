"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

import { FUNCTIONS } from "@/lib/frameworks";
import type { DiagnosticFunction } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AdminCompany {
  id: string;
  name: string;
  shortName: string;
  brandColor: string;
  profilePicture?: string;
  agentIds: Partial<Record<DiagnosticFunction, string>>;
}

export function AgentIdAdmin({ companies }: { companies: AdminCompany[] }) {
  return (
    <div className="space-y-4">
      {companies.map((c) => (
        <CompanyAgentCard key={c.id} company={c} />
      ))}
      {companies.length === 0 && (
        <p className="rounded-2xl border border-line bg-surface px-6 py-10 text-center text-sm text-ink-muted">
          No companies yet. Add one from the dashboard first.
        </p>
      )}
    </div>
  );
}

function CompanyAgentCard({ company }: { company: AdminCompany }) {
  const [ids, setIds] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const f of FUNCTIONS) seed[f.id] = company.agentIds[f.id] ?? "";
    return seed;
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function save() {
    setState("saving");
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
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
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-3 px-6 py-4">
        {company.profilePicture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.profilePicture}
            alt={company.name}
            className="h-9 w-9 rounded-lg object-cover"
          />
        ) : (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: company.brandColor }}
          >
            {company.shortName}
          </span>
        )}
        <div className="min-w-0">
          <div className="font-display text-lg leading-tight text-ink">
            {company.name}
          </div>
          <div className="text-xs text-ink-muted">
            {configured} of {FUNCTIONS.length} agents configured
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
              placeholder="agent_xxxxxxxxxxxxxxxxxxxx"
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 font-mono text-[12px] text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-3">
        {state === "error" && (
          <span className="text-xs text-danger">Could not save — try again.</span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={state === "saving"}
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
          {state === "saved" ? "Saved" : "Save agent IDs"}
        </button>
      </div>
    </div>
  );
}
