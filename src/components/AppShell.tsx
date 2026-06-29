import { listCompanies } from "@/lib/store";

import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const companies = listCompanies().map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    brandColor: c.brandColor,
  }));
  return (
    <div className="flex min-h-screen bg-canvas">
      <SidebarNav companies={companies} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-6 py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
