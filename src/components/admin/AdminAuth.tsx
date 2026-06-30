"use client";

import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/Card";

/** Password gate shown when the visitor has no valid admin session. */
export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed.");
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-md">
      <Card className="p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-tint text-teal">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg text-ink">Restricted area</h2>
            <p className="text-sm text-ink-muted">
              Enter the admin password to configure agent IDs.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
          />
          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !password}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Unlock console
          </button>
        </form>
      </Card>
    </div>
  );
}

/** Sign-out button shown inside the authenticated admin console. */
export function AdminLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink-faint disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Sign out
    </button>
  );
}
