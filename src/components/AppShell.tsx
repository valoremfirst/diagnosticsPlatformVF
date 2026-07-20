import { headers } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { getCompany, listCompanies } from "@/lib/store";

import { ClientTopNav } from "./ClientTopNav";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "";

  // The login route renders bare (no nav chrome, no data).
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  // The client interview experience is a full-bleed, chromeless canvas that
  // brings its own minimal top nav (per the Oracle wireframe) — no sidebar.
  if (/^\/companies\/[^/]+\/interviews(\/|$)/.test(pathname)) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  const user = await getCurrentUser();

  // Unauthenticated visitors are redirected to /login by middleware; render the
  // children bare in the brief window before that redirect resolves.
  if (!user) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  const isAdmin = user.role === "admin";

  // Clients get a fully chromeless experience — no left sidebar, ever. Their
  // home is the Oracle interview page (handled bare above); any other client
  // page renders under the same minimal top nav.
  // Double-check interviews here too — x-pathname can be stale on first load,
  // causing the bare-canvas guard above to miss and this branch to add ClientTopNav.
  if (!isAdmin && /^\/companies\/[^/]+\/interviews(\/|$)/.test(pathname)) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  if (!isAdmin) {
    const company = user.companyId
      ? await getCompany(user.companyId)
      : undefined;
    return (
      <div className="min-h-screen bg-canvas paper-texture">
        <ClientTopNav
          companyId={company?.id}
          companyName={company?.name ?? ""}
          email={user.email}
        />
        <main className="mx-auto w-full max-w-[1180px] px-6 pt-8 pb-16 lg:px-8">
          {children}
        </main>
      </div>
    );
  }

  // Admins see the whole portfolio in the sidebar.
  const companies = (await listCompanies()).map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    brandColor: c.brandColor,
    profilePicture: c.profilePicture,
  }));

  return (
    <div className="flex min-h-screen bg-canvas">
      <SidebarNav
        companies={companies}
        role={user.role}
        user={{ email: user.email }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={{ email: user.email, role: user.role }} />
        <main className="flex-1 px-6 py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
