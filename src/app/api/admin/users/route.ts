import { NextResponse } from "next/server";

import { apiRequireAdmin } from "@/lib/auth";
import { getAdminAuth } from "@/lib/firebase";
import { getCompany, listUsers, saveUser } from "@/lib/store";
import type { AppUser, UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLES: UserRole[] = ["admin", "client"];

// GET /api/admin/users — list all users (admin only).
export async function GET() {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;
  return NextResponse.json({ users: await listUsers() });
}

// POST /api/admin/users — provision a new user (admin only).
// Body: { email, password, role, companyId?, displayName? }
export async function POST(req: Request) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  const auth = await getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "client") as UserRole;
  const displayName = body.displayName ? String(body.displayName).trim() : undefined;
  const companyId = body.companyId ? String(body.companyId).trim() : undefined;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${ROLES.join(", ")}` },
      { status: 400 },
    );
  }
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
  }

  try {
    const record = await auth.createUser({ email, password, displayName });
    // Custom claims drive server-side authorization (verified in the session cookie).
    const claims: { role: UserRole; companyId?: string } = { role };
    if (role === "client" && companyId) claims.companyId = companyId;
    await auth.setCustomUserClaims(record.uid, claims);

    const user: AppUser = {
      uid: record.uid,
      email,
      role,
      companyId: role === "client" ? companyId : undefined,
      displayName,
      createdAt: new Date().toISOString(),
    };
    await saveUser(user);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    if (code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Could not create the user." },
      { status: 500 },
    );
  }
}
