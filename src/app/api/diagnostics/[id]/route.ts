import { NextResponse } from "next/server";

import {
  apiRequireAdmin,
  apiRequireCompanyAccess,
} from "@/lib/auth";
import { deleteSession, getSession } from "@/lib/store";

// GET /api/diagnostics/:id — fetch a single diagnostic (admin or owning client).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const gate = session.companyId
    ? await apiRequireCompanyAccess(session.companyId)
    : await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  return NextResponse.json({ session });
}

// DELETE /api/diagnostics/:id — remove an uploaded transcript / diagnostic (admin).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  const ok = await deleteSession(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
