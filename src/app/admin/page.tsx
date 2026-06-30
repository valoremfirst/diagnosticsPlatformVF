import { AdminLogin, AdminLogout } from "@/components/admin/AdminAuth";
import { AgentIdAdmin } from "@/components/admin/AgentIdAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { adminPasswordConfigured, isAdminAuthed } from "@/lib/admin-auth";
import { listCompanies } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = adminPasswordConfigured();
  const authed = isAdminAuthed();

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          crumbs={[{ label: "Dashboard", href: "/" }, { label: "Admin" }]}
          title="Admin console"
          description="Configure each company's ElevenLabs agent IDs per business function. Auto-import uses these to pull the right conversations; the .env defaults apply where a company leaves a field blank."
        />
        {authed && (
          <div className="pt-1">
            <AdminLogout />
          </div>
        )}
      </div>

      {!configured ? (
        <Card className="mx-auto mt-8 max-w-md p-7 text-center">
          <h2 className="font-display text-lg text-ink">Admin not configured</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Set an <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">ADMIN_PASSWORD</code>{" "}
            environment variable (locally in <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">.env</code>{" "}
            and in your Vercel project settings) to enable the admin console, then reload.
          </p>
        </Card>
      ) : !authed ? (
        <AdminLogin />
      ) : (
        <AuthedConsole />
      )}
    </div>
  );
}

async function AuthedConsole() {
  const companies = (await listCompanies()).map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    brandColor: c.brandColor,
    profilePicture: c.profilePicture,
    agentIds: c.agentIds ?? {},
  }));
  return <AgentIdAdmin companies={companies} />;
}
