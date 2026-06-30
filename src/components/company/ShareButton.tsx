"use client";

import { Check, Link2, Loader2 } from "lucide-react";
import { useState } from "react";

import { withAlpha } from "@/lib/color";

/**
 * Creates (or reuses) a public read-only share link for the company and copies
 * it to the clipboard. Styled for the branded hero, so colours are passed in.
 */
export function ShareButton({
  companyId,
  ink,
}: {
  companyId: string;
  ink: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  async function share() {
    setState("loading");
    try {
      const res = await fetch(`/api/companies/${companyId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      const url = `${window.location.origin}${data.path}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      setState("copied");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={state === "loading"}
      className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors disabled:opacity-60"
      style={{ background: withAlpha(ink === "#FFFFFF" ? "#FFFFFF" : "#1A1A1A", 0.16), color: ink }}
      title="Copy a public, read-only link to share with the client"
    >
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "copied" ? (
        <Check className="h-4 w-4" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
      {state === "copied" ? "Link copied" : "Share report"}
    </button>
  );
}
