"use client";

import { BarChart3, History, LayoutGrid, Mic, Settings2 } from "lucide-react";
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
  { href: "/analytics", label: "Analytics", icon: BarChart3, match: (p: string) => p.startsWith("/analytics") },
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
      <Link
        href="/"
        className="group focus-ring block rounded-xl px-2 py-1 transition-colors hover:bg-surface-muted/50"
      >
        <div className="font-display text-[19px] leading-tight" style={{ color: "#C94D0E" }}>
          Diagnostics Platform
        </div>
      </Link>

      <nav className={cn("mt-8 flex flex-col gap-0.5", !isAdmin && "hidden")}>
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          Menu
        </div>
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active ? "text-ink" : "text-ink-soft hover:bg-surface-muted hover:text-ink",
              )}
              style={active ? { background: "rgba(201,77,14,0.08)", color: "#C94D0E" } : undefined}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
                style={{ background: "#C94D0E" }}
              />
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-transform",
                  !active && "group-hover:scale-110",
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Clients: a prominent, friendly entry point to do their interviews
          and review their own analytics. */}
      {!isAdmin && companies[0] && (
        <nav className="mt-9 flex flex-col gap-1">
          {[
            {
              href: `/companies/${companies[0].id}/interviews`,
              label: "Interviews",
              icon: Mic,
            },
            {
              href: `/companies/${companies[0].id}/analytics`,
              label: "Analytics",
              icon: BarChart3,
            },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                  active ? "text-ink" : "text-ink-soft hover:bg-surface-muted hover:text-ink",
                )}
                style={active ? { background: "rgba(201,77,14,0.08)", color: "#C94D0E" } : undefined}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
                    active ? "opacity-100" : "opacity-0",
                  )}
                  style={{ background: "#C94D0E" }}
                />
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-transform",
                    !active && "group-hover:scale-110",
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Companies */}
      <div className={cn(isAdmin ? "mt-7" : "mt-6")}>
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          {isAdmin ? "Companies" : "Your company"}
        </div>
        <div className="flex flex-col gap-1">
          {companies.map((c) => {
            const href = `/companies/${c.id}`;
            // Active on the company dashboard, but not on its /interviews or
            // /analytics sub-pages (those get their own nav entries).
            const active =
              pathname === href ||
              (pathname.startsWith(`${href}/`) &&
                !pathname.startsWith(`${href}/interviews`) &&
                !pathname.startsWith(`${href}/analytics`));
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

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-sunken/60 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase text-white ring-2 ring-white" style={{ background: "#C94D0E" }}>
            {initials(user.email)}
          </div>
          <div className="min-w-0 leading-tight">
            <div
              className="truncate text-sm font-medium text-ink"
              title={user.email}
            >
              {user.email}
            </div>
            <div className="flex items-center gap-1 text-xs capitalize text-ink-muted">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#C94D0E" }}
              />
              {role}
            </div>
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
