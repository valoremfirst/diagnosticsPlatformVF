"use client";

import { Bell, Plus, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function TopBar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-4 border-b border-line bg-canvas/85 px-6 backdrop-blur lg:px-8">
      <form
        className="relative flex-1 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q")?.toString().trim();
          router.push(q ? `/history?q=${encodeURIComponent(q)}` : "/history");
        }}
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          name="q"
          placeholder="Search sessions or frameworks…"
          className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted"
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>
        <button
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted"
        >
          <Settings className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <Link
          href="/new"
          className="ml-1 inline-flex h-11 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-medium text-white transition-colors hover:bg-teal-deep"
        >
          <Plus className="h-4 w-4" />
          New Diagnostic
        </Link>
      </div>
    </header>
  );
}
