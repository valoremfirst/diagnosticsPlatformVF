import { headers } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { getCompany, listCompanies } from "@/lib/store";

import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "";

  // The login route renders bare (no nav chrome, no data).
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  const user = await getCurrentUser();

  // Unauthenticated visitors are redirected to /login by middleware; render the
  // children bare in the brief window before that redirect resolves.
  if (!user) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  const isAdmin = user.role === "admin";

  // Admins see the whole portfolio; clients see only their own company.
  const companies = isAdmin
    ? (await listCompanies()).map((c) => ({
        id: c.id,
        name: c.name,
        shortName: c.shortName,
        brandColor: c.brandColor,
        profilePicture: c.profilePicture,
      }))
    : user.companyId
      ? await getCompany(user.companyId).then((c) =>
          c
            ? [
                {
                  id: c.id,
                  name: c.name,
                  shortName: c.shortName,
                  brandColor: c.brandColor,
                  profilePicture: c.profilePicture,
                },
              ]
            : [],
        )
      : [];

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
