import { Plus } from "lucide-react";
import Link from "next/link";

import { HistoryTable } from "@/components/HistoryTable";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { listSessions } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function HistoryPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const sessions = listSessions();

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Diagnostic Sessions" }]}
        title="Diagnostic history"
        description="Every diagnostic run across the portfolio. Filter by function, company or sector and open any report for detail."
        actions={
          <Link href="/new">
            <Button>
              <Plus className="h-4 w-4" />
              New diagnostic
            </Button>
          </Link>
        }
      />
      <HistoryTable sessions={sessions} initialQuery={searchParams.q ?? ""} />
    </div>
  );
}
