import Link from "next/link";
import { notFound } from "next/navigation";

import { EvidenceReview } from "@/components/EvidenceReview";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/Button";
import { functionById } from "@/lib/frameworks";
import { getSession } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EvidencePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();

  const fn = functionById(session.function);

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[
          { label: "Diagnostic Sessions", href: "/history" },
          { label: session.companyName, href: `/diagnostics/${session.id}` },
          { label: "Evidence review" },
        ]}
        title="Evidence review"
        description={`Every score below is traced to a direct quote from the ${fn.label} interview. Inspect the transcript alongside each finding to build confidence in the AI scoring.`}
        actions={
          <Link href={`/diagnostics/${session.id}`}>
            <Button variant="outline">Back to results</Button>
          </Link>
        }
      />

      {session.result ? (
        <EvidenceReview
          transcript={session.transcript}
          result={session.result}
          sessionId={session.id}
        />
      ) : (
        <EmptyState
          title="No analysis to review"
          description="This diagnostic hasn't been scored yet."
          action={
            <Link href={`/session/${session.id}`}>
              <Button>Start session</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
