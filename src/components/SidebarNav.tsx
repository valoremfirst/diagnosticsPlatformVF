"use client";

import {
  FileText,
  LayoutGrid,
  Network,
  Radio,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, match: (p: string) => p === "/" },
  {
    href: "/history",
    label: "Diagnostic Sessions",
    icon: Radio,
    match: (p: string) => p.startsWith("/history") || p.startsWith("/session") || p.startsWith("/diagnostics"),
  },
  {
    href: "/frameworks",
    label: "Frameworks",
    icon: Network,
    match: (p: string) => p.startsWith("/frameworks"),
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileText,
    match: (p: string) => p.startsWith("/reports"),
  },
];

export function SidebarNav() {
  const pathname = usePathname() || "/";

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface px-5 py-6 lg:flex">
      <Link href="/" className="block px-2">
        <div className="font-display text-2xl leading-tight text-teal">
          Agentic
          <br />
          Diagnostics
        </div>
        <div className="mt-1 text-xs text-ink-muted">Consulting as a Service</div>
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

      <div className="mt-auto">
        <div className="mb-5 border-t border-line pt-5">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-deep">
            <Sparkles className="h-4 w-4" />
            Upgrade Plan
          </button>
        </div>
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-deep text-sm font-semibold text-white">
            CC
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-ink">User Profile</div>
            <div className="text-xs text-ink-muted">Senior Consultant</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
