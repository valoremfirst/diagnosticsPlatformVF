"use client";

import { Bell, Settings } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-end gap-4 border-b border-line bg-canvas/85 px-6 backdrop-blur lg:px-8 print:hidden">
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
      </div>
    </header>
  );
}
