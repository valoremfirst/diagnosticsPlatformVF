import { PageHeader } from "@/components/PageHeader";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="animate-fade-in space-y-10">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]}
        title="Settings"
        description="Manage your account and security preferences."
      />

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Account</h2>
        <Card className="max-w-md divide-y divide-line">
          <Row label="Email" value={user.email} />
          <Row label="Role" value={user.role} valueClass="capitalize" />
        </Card>
      </section>

      <section>
        <h2 className="mb-1 font-display text-xl text-ink">Change password</h2>
        <p className="mb-4 text-sm text-ink-muted">
          Enter your current password to set a new one.
        </p>
        <Card className="max-w-md p-6">
          <ChangePasswordForm />
        </Card>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`text-sm font-medium text-ink ${valueClass ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
