import { NextResponse } from "next/server";

import { apiRequireAdmin } from "@/lib/auth";
import { getAdminAuth } from "@/lib/firebase";
import { deleteUser, getCompany, getUser, updateUser } from "@/lib/store";
import type { UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLES: UserRole[] = ["admin", "client"];

// PATCH /api/admin/users/:uid — change role / company / display name (admin only).
export async function PATCH(
  req: Request,
  { params }: { params: { uid: string } },
) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  const auth = await getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  const existing = await getUser(params.uid);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const role = (body.role !== undefined ? String(body.role) : existing.role) as UserRole;
  if (!ROLES.includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${ROLES.join(", ")}` },
      { status: 400 },
    );
  }

  let companyId =
    body.companyId !== undefined
      ? String(body.companyId).trim() || undefined
      : existing.companyId;

  if (role === "client") {
    if (!companyId) {
      return NextResponse.json(
        { error: "A client must be assigned to a company." },
        { status: 400 },
      );
    }
    if (!(await getCompany(companyId))) {
      return NextResponse.json(
        { error: "That company does not exist." },
        { status: 400 },
      );
    }
  } else {
    // Admins are not scoped to a company.
    companyId = undefined;
  }

  const displayName =
    body.displayName !== undefined
      ? String(body.displayName).trim() || undefined
      : existing.displayName;

  const claims: { role: UserRole; companyId?: string } = { role };
  if (role === "client" && companyId) claims.companyId = companyId;
  await auth.setCustomUserClaims(params.uid, claims);
  // Revoke existing sessions so the new claims take effect on next sign-in.
  await auth.revokeRefreshTokens(params.uid);

  const user = await updateUser(params.uid, { role, companyId, displayName });
  return NextResponse.json({ user });
}

// DELETE /api/admin/users/:uid — remove the Auth user and the mirror doc (admin only).
export async function DELETE(
  _req: Request,
  { params }: { params: { uid: string } },
) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  // Don't let an admin delete their own account.
  if (gate.user.uid === params.uid) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  const auth = await getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  await auth.deleteUser(params.uid).catch(() => {});
  await deleteUser(params.uid);
  return NextResponse.json({ ok: true });
}
