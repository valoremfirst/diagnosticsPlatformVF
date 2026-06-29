"use client";

import { Check, Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

export function ExportButton({ id }: { id: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const res = await fetch(`/api/diagnostics/${id}/export`, { method: "POST" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagnostic-${id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={state === "loading"}>
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-4 w-4 text-positive" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {state === "done" ? "Exported" : "Export report"}
    </Button>
  );
}
