"use client";

import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientAuth } from "@/lib/firebase-client";

/**
 * Minimal, chromeless top nav for the client experience — no left sidebar.
 * Mirrors the Oracle interview hero: lowercase serif wordmark on the left,
 * company name + account affordance on the right.
 */
export function ClientTopNav({
  companyId,
  companyName,
  email,
}: {
  companyId?: string;
  companyName: string;
  email: string;
}) {
  const href = companyId ? `/companies/${companyId}/interviews` : "/";
  return (
    <header className="flex h-16 items-center justify-between px-6 sm:px-10 print:hidden">
      <Link
        href={href}
        className="font-display text-[17px] leading-none tracking-tight transition-opacity hover:opacity-80 sm:text-[19px]"
        style={{ color: "#C94D0E" }}
      >
        Diagnostics Platform
      </Link>
      <div className="flex items-center gap-4 text-sm text-ink-soft">
        {companyName && <span className="hidden sm:inline">{companyName}</span>}
        <AccountMenu email={email} />
      </div>
    </header>
  );
}

function AccountMenu({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(clientAuth()).catch(() => {});
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-medium uppercase tracking-[0.04em] text-ink-soft transition-colors hover:bg-line focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
        aria-label="Account"
      >
        {initials(email)}
      </button>
      <div className="invisible absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface opacity-0 shadow-card-hover transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="truncate border-b border-line px-3 py-2.5 text-xs text-ink-muted">
          {email}
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={busy}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function initials(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}
