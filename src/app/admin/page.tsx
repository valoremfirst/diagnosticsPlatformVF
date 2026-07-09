import { KeyRound, Phone, Users } from "lucide-react";

import { AgentIdAdmin } from "@/components/admin/AgentIdAdmin";
import { PhoneNumberAdmin } from "@/components/admin/PhoneNumberAdmin";
import { UserAdmin } from "@/components/admin/UserAdmin";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { FUNCTIONS } from "@/lib/frameworks";
import { listCompanies, listPhoneMappings, listUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const companies = await listCompanies();
  const [users, phoneMappings] = await Promise.all([
    listUsers(),
    listPhoneMappings(),
  ]);
  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }));

  const clientCount = users.filter((u) => u.role === "client").length;

  return (
    <div className="animate-fade-in space-y-12">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Admin" }]}
        title="Admin console"
        description="Manage client access, configure the shared interview agents, and map caller identities — the three things that make a diagnostic run end-to-end."
      />

      {/* Quick config summary strip */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        <SummaryCell
          icon={Users}
          label="Client accounts"
          value={clientCount}
          hint={`${users.length} total user${users.length === 1 ? "" : "s"}`}
        />
        <SummaryCell
          icon={KeyRound}
          label="Business functions"
          value={FUNCTIONS.length}
          hint="one shared agent each"
        />
        <SummaryCell
          icon={Phone}
          label="Registered callers"
          value={phoneMappings.length}
          hint="phone → company map"
        />
      </div>

      <AdminSection
        icon={Users}
        eyebrow="Access"
        title="Client access"
        description="Provision read-only client accounts scoped to a single company, or add fellow consultants as admins."
      >
        <UserAdmin users={users} companies={companyOptions} />
      </AdminSection>

      <AdminSection
        icon={KeyRound}
        eyebrow="Integration"
        title="Agent configuration"
        description="Set one ElevenLabs agent per business function. These are shared across every client — caller identity is resolved at call time."
      >
        <AgentIdAdmin />
      </AdminSection>

      <AdminSection
        icon={Phone}
        eyebrow="Identity"
        title="Caller identification"
        description="Register client phone numbers so a shared interview agent knows which client is calling and can recall their prior conversations."
      >
        <PhoneNumberAdmin mappings={phoneMappings} companies={companyOptions} />
      </AdminSection>
    </div>
  );
}

function SummaryCell({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3.5 bg-surface px-5 py-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl leading-none text-ink tabular-nums">
            {value}
          </span>
          <span className="label-eyebrow">{label}</span>
        </div>
        <div className="mt-1 text-xs text-ink-muted">{hint}</div>
      </div>
    </div>
  );
}

function AdminSection({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: typeof Users;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="section-rule mb-2">
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-teal" />
          <span className="eyebrow eyebrow-teal">{eyebrow}</span>
        </span>
      </div>
      <h2 className="section-title text-xl">{title}</h2>
      <p className="mb-4 mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
      {children}
    </section>
  );
}
