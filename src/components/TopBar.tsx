"use client";

import { signOut } from "firebase/auth";
import { ChevronDown, Loader2, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { clientAuth } from "@/lib/firebase-client";

type TopBarUser = { email: string; role: "admin" | "client" };

export function TopBar({ user }: { user: TopBarUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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

  const avatar = initials(user.email);

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-end gap-4 border-b border-line bg-canvas/85 px-6 backdrop-blur lg:px-8 print:hidden">
      <div ref={menuRef} className="relative ml-auto">
        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 items-center gap-2 rounded-xl pl-1.5 pr-2.5 text-ink-soft transition-colors hover:bg-surface-muted"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-deep text-sm font-semibold uppercase text-white">
            {avatar}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={1.8}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-card-hover animate-fade-in">
            {/* Account header */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-deep text-sm font-semibold uppercase text-white">
                {avatar}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">
                  {user.email}
                </div>
                <div className="text-xs capitalize text-ink-muted">
                  {user.role}
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              <MenuItem
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
              />
            </div>

            <div className="border-t border-line py-1.5">
              <button
                type="button"
                onClick={logout}
                disabled={busy}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-surface-muted disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/** Two-letter initials from an email local-part, e.g. "connor.c" → "CC". */
function initials(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).slice(0, 2);
  return local.slice(0, 2);
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-muted"
    >
      <span className="text-ink-muted">{icon}</span>
      {label}
    </button>
  );
}
