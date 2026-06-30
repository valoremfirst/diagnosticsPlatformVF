import { AgentIdAdmin } from "@/components/admin/AgentIdAdmin";
import { PageHeader } from "@/components/PageHeader";
import { listCompanies } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const companies = (await listCompanies()).map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    brandColor: c.brandColor,
    profilePicture: c.profilePicture,
    agentIds: c.agentIds ?? {},
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Admin" }]}
        title="Admin console"
        description="Configure each company's ElevenLabs agent IDs per business function. Auto-import uses these to pull the right conversations; the .env defaults apply where a company leaves a field blank."
      />
      <AgentIdAdmin companies={companies} />
    </div>
  );
}
