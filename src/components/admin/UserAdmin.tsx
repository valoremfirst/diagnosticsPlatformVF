"use client";

import { Loader2, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import type { AppUser, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CompanyOption {
  id: string;
  name: string;
}

export function UserAdmin({
  users,
  companies,
}: {
  users: AppUser[];
  companies: CompanyOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          companyId: role === "client" ? companyId : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not create user.");
      }
      setEmail("");
      setPassword("");
      setRole("client");
      setAdding(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function changeCompany(uid: string, nextCompanyId: string) {
    setPendingId(uid);
    try {
      await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: nextCompanyId }),
      });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function removeUser(uid: string) {
    if (!confirm("Delete this user? They will lose access immediately.")) return;
    setPendingId(uid);
    try {
      const res = await fetch(`/api/admin/users/${uid}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not delete user.");
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {users.length} user{users.length === 1 ? "" : "s"}. Clients see only
          their assigned company; admins see everything.
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add user
          </button>
        )}
      </div>

      {adding && (
        <Card className="mb-4 border-dashed p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <UserPlus className="h-4 w-4 text-teal" /> New user
            </h3>
            <button
              type="button"
              onClick={() => { setAdding(false); setError(null); }}
              className="rounded p-1 text-ink-faint hover:bg-surface-muted hover:text-ink-muted"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="off"
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
            />
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Temporary password (min 8 chars)"
              autoComplete="off"
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={role !== "client"}
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint disabled:opacity-50"
            >
              {companies.length === 0 && <option value="">No companies</option>}
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {error && (
              <p className="sm:col-span-2 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
                {error}
              </p>
            )}
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create user
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Company</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                  No users yet. Add one to grant access.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.uid} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                        u.role === "admin"
                          ? "bg-teal-tint text-teal"
                          : "bg-surface-muted text-ink-soft",
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {u.role === "client" ? (
                      <select
                        value={u.companyId ?? ""}
                        disabled={pendingId === u.uid}
                        onChange={(e) => changeCompany(u.uid, e.target.value)}
                        className="h-8 rounded-lg border border-line bg-surface px-2 text-xs text-ink focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint disabled:opacity-50"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-ink-faint">All companies</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeUser(u.uid)}
                      disabled={pendingId === u.uid}
                      className="inline-flex items-center rounded-lg p-1.5 text-ink-faint hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      aria-label="Delete user"
                      title={`Delete ${u.email}`}
                    >
                      {pendingId === u.uid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
