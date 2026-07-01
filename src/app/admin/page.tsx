import { AgentIdAdmin } from "@/components/admin/AgentIdAdmin";
import { UserAdmin } from "@/components/admin/UserAdmin";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { listCompanies, listUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const companies = (await listCompanies()).map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    brandColor: c.brandColor,
    profilePicture: c.profilePicture,
    agentIds: c.agentIds ?? {},
  }));

  const users = await listUsers();
  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="animate-fade-in space-y-10">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Admin" }]}
        title="Admin console"
        description="Manage client access and configure each company's ElevenLabs agent IDs per business function."
      />

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Client access</h2>
        <UserAdmin users={users} companies={companyOptions} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Agent configuration</h2>
        <AgentIdAdmin companies={companies} />
      </section>
    </div>
  );
}
