"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";

/**
 * Triggers the browser print dialog once the report has painted, so opening the
 * print route immediately offers "Save as PDF". Also renders a manual button
 * (hidden in the printed output) in case the user dismisses the dialog.
 */
export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-deep print:hidden"
    >
      <Printer className="h-4 w-4" />
      Save as PDF
    </button>
  );
}
