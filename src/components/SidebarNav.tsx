"use client";

import { History, LayoutGrid, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CompanyNav {
  id: string;
  name: string;
  shortName: string;
  brandColor: string;
  profilePicture?: string;
}

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid, match: (p: string) => p === "/" },
  { href: "/history", label: "History", icon: History, match: (p: string) => p.startsWith("/history") },
  { href: "/admin", label: "Admin", icon: Settings2, match: (p: string) => p.startsWith("/admin") },
];

export function SidebarNav({
  companies,
  role,
  user,
}: {
  companies: CompanyNav[];
  role: UserRole;
  user: { email: string };
}) {
  const pathname = usePathname() || "/";
  const isAdmin = role === "admin";

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface px-5 py-6 lg:flex print:hidden">
      <Link href="/" className="block px-2">
        <div className="font-display text-2xl leading-tight text-teal">
          Agentic
          <br />
          Diagnostics
        </div>
        <div className="mt-1 text-xs text-ink-muted">By ValoremFirst</div>
      </Link>

      <nav className={cn("mt-9 flex flex-col gap-1", !isAdmin && "hidden")}>
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-teal-tint text-teal"
                  : "text-ink-soft hover:bg-surface-muted hover:text-ink",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-teal" />
              )}
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Companies */}
      <div className={cn(isAdmin ? "mt-7" : "mt-9")}>
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          {isAdmin ? "Companies" : "Your company"}
        </div>
        <div className="flex flex-col gap-1">
          {companies.map((c) => {
            const href = `/companies/${c.id}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={c.id}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-muted text-ink"
                    : "text-ink-soft hover:bg-surface-muted hover:text-ink",
                )}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
                    style={{ background: c.brandColor }}
                  />
                )}
                {c.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.profilePicture}
                    alt={c.name}
                    className="h-6 w-6 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ background: c.brandColor }}
                  >
                    {c.shortName}
                  </span>
                )}
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-center gap-3 border-t border-line px-1 pt-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-deep text-sm font-semibold uppercase text-white">
            {initials(user.email)}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium text-ink" title={user.email}>
              {user.email}
            </div>
            <div className="text-xs capitalize text-ink-muted">{role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Two-letter initials from an email local-part, e.g. "connor.c" → "CC". */
function initials(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).slice(0, 2);
  return local.slice(0, 2);
}
