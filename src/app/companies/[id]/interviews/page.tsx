import { notFound } from "next/navigation";

import {
  InterviewsClient,
  type InterviewItem,
  type InterviewStatus,
} from "@/components/company/InterviewsClient";
import { assertCompanyAccess } from "@/lib/auth";
import { FUNCTIONS } from "@/lib/frameworks";
import { getCompany, listSessionsByCompany } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function InterviewsPage({
  params,
}: {
  params: { id: string };
}) {
  // Admins see any company; clients only their own (foreign IDs → notFound).
  const user = await assertCompanyAccess(params.id);

  const company = await getCompany(params.id);
  if (!company) notFound();

  const sessions = await listSessionsByCompany(company.id);

  const interviews: InterviewItem[] = FUNCTIONS.map((f) => {
    const own = sessions.filter((s) => s.function === f.id);
    const completedCount = own.filter(
      (s) => s.status === "complete" && s.result,
    ).length;
    let status: InterviewStatus = "not-started";
    if (completedCount > 0) status = "done";
    else if (own.length > 0) status = "in-review";

    return {
      fn: f.id,
      label: f.label,
      agentName: f.agentName,
      agentTitle: f.agentTitle,
      blurb: f.blurb,
      probesFor: f.probesFor,
      status,
      completedCount,
    };
  });

  return (
    <InterviewsClient
      companyId={company.id}
      companyName={company.name}
      brand={company.brandColor}
      interviews={interviews}
      isAdmin={user.role === "admin"}
    />
  );
}
