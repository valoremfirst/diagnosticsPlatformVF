"use client";

import { History, LayoutGrid, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function SidebarNav({ companies }: { companies: CompanyNav[] }) {
  const pathname = usePathname() || "/";

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

      <nav className="mt-9 flex flex-col gap-1">
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
      <div className="mt-7">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          Companies
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-deep text-sm font-semibold text-white">
            CC
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-ink">Connor Campagna</div>
            <div className="text-xs text-ink-muted">Valorem First - Digital Support Engineer</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
