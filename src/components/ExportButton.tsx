"use client";

import { FileText } from "lucide-react";

import { Button } from "@/components/ui/Button";

/**
 * Opens the branded print route in a new tab, which auto-launches the browser
 * print dialog so the report can be saved as a styled PDF.
 */
export function ExportButton({ id }: { id: string }) {
  function handleExport() {
    window.open(`/diagnostics/${id}/print`, "_blank", "noopener,noreferrer");
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileText className="h-4 w-4" />
      Export PDF
    </Button>
  );
}
