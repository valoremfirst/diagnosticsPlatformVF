import { HistoryTable } from "@/components/HistoryTable";
import { PageHeader } from "@/components/PageHeader";
import { listSessions } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const sessions = await listSessions();

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Diagnostic Sessions" }]}
        title="Diagnostic history"
        description="Every diagnostic run across the portfolio. Filter by function, company or sector and open any report for detail."
      />
      <HistoryTable sessions={sessions} initialQuery={searchParams.q ?? ""} />
    </div>
  );
}
