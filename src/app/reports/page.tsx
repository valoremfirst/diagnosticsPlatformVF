import { FileText } from "lucide-react";
import Link from "next/link";

import { DiagnosticStatusBadge } from "@/components/DiagnosticStatusBadge";
import { ExportButton } from "@/components/ExportButton";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { functionById } from "@/lib/frameworks";
import { listSessions } from "@/lib/store";
import { cn, formatDate, scoreTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = (await listSessions()).filter(
    (s) => s.status === "complete" && s.result,
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Reports" }]}
        title="Diagnostic reports"
        description="Completed diagnostics ready to share or export. Each report bundles the scores, evidence, risks, recommendations and roadmap."
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Completed diagnostics will appear here as shareable reports."
          action={
            <Link href="/new">
              <Button>Start a diagnostic</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((s) => {
            const fn = functionById(s.function);
            const score = s.result!.overallScore;
            const tone = scoreTone(score);
            return (
              <Card key={s.id} className="flex flex-col px-5 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-tint text-teal">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "flex h-11 w-12 items-center justify-center rounded-xl font-display text-lg",
                      tone.bg,
                      tone.text,
                    )}
                  >
                    {score}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-lg leading-tight text-ink">
                  {s.companyName}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                  <span>{fn.label}</span>
                  <span className="text-ink-faint">·</span>
                  <span>{formatDate(s.completedAt ?? s.createdAt)}</span>
                </div>
                <div className="mt-3">
                  <DiagnosticStatusBadge status={s.status} />
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                  <Link href={`/diagnostics/${s.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      View report
                    </Button>
                  </Link>
                  <ExportButton id={s.id} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
