import { headers } from "next/headers";

import { listCompanies } from "@/lib/store";

import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  // Public routes (read-only client share) render without the nav chrome so no
  // internal data — like the company list — is exposed.
  const pathname = headers().get("x-pathname") ?? "";
  if (pathname.startsWith("/share")) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  const companies = (await listCompanies()).map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    brandColor: c.brandColor,
    profilePicture: c.profilePicture,
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
