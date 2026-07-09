"use client";

import {
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
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
  const [resetUid, setResetUid] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

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

  function openReset(uid: string) {
    setResetUid(uid);
    setResetPw("");
    setResetError(null);
  }

  async function submitReset(uid: string) {
    if (resetPw.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    setPendingId(uid);
    setResetError(null);
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setResetError(data.error || "Could not reset password.");
        return;
      }
      setResetUid(null);
      setResetPw("");
    } catch {
      setResetError("Could not reset password.");
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

  const adminCount = users.filter((u) => u.role === "admin").length;
  const clientCount = users.length - adminCount;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1.5 font-medium text-ink-soft">
            <Users className="h-4 w-4 text-ink-faint" />
            {users.length} user{users.length === 1 ? "" : "s"}
          </span>
          <span className="text-ink-faint">·</span>
          <span>{adminCount} admin</span>
          <span className="text-ink-faint">·</span>
          <span>{clientCount} client</span>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-teal h-9 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add user
          </button>
        )}
      </div>

      <div className="p-5">
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
              className="input-editorial h-10"
            />
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Temporary password (min 8 chars)"
              autoComplete="off"
              className="input-editorial h-10"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="input-editorial h-10"
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={role !== "client"}
              className="input-editorial h-10 disabled:opacity-50"
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
              <button type="submit" disabled={busy} className="btn-teal h-10 px-5">
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
                <td colSpan={4} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted text-ink-faint">
                      <Users className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-ink-soft">
                      No users yet
                    </p>
                    <p className="max-w-xs text-xs text-ink-muted">
                      Add a client to grant read-only access to their company, or
                      a fellow consultant as an admin.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.uid}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface-muted/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                          u.role === "admin"
                            ? "bg-teal-deep text-white"
                            : "bg-surface-muted text-ink-soft",
                        )}
                      >
                        {u.email.slice(0, 2)}
                      </span>
                      <span className="min-w-0 truncate font-medium text-ink">
                        {u.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                        u.role === "admin"
                          ? "bg-teal-tint text-teal"
                          : "bg-surface-muted text-ink-soft",
                      )}
                    >
                      {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {u.role === "client" ? (
                      <select
                        value={u.companyId ?? ""}
                        disabled={pendingId === u.uid}
                        onChange={(e) => changeCompany(u.uid, e.target.value)}
                        className="input-editorial h-8 rounded-lg px-2 text-xs disabled:opacity-50"
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
                    {resetUid === u.uid ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={resetPw}
                              onChange={(e) => { setResetPw(e.target.value); setResetError(null); }}
                              placeholder="New password (min 8)"
                              autoFocus
                              className="input-editorial h-8 w-44 rounded-lg px-2 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => submitReset(u.uid)}
                              disabled={pendingId === u.uid}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-teal px-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                              {pendingId === u.uid ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setResetUid(null); setResetError(null); }}
                              className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-muted hover:text-ink-muted"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {resetError && (
                            <p className="text-xs text-danger">{resetError}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openReset(u.uid)}
                          disabled={pendingId === u.uid}
                          className="inline-flex items-center rounded-lg p-1.5 text-ink-faint hover:bg-surface-muted hover:text-ink-soft disabled:opacity-50"
                          aria-label="Reset password"
                          title={`Reset password for ${u.email}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
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
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </Card>
  );
}
