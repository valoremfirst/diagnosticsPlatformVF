import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { getCompany, updateCompany } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/companies/:id/share — enable sharing (create a token if needed) and
// return the public, read-only link.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const token = company.shareToken ?? randomBytes(12).toString("hex");
  if (!company.shareToken) {
    await updateCompany(params.id, { shareToken: token });
  }

  return NextResponse.json({ token, path: `/share/${token}` });
}

// DELETE /api/companies/:id/share — revoke the public link.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await updateCompany(params.id, { shareToken: "" });
  return NextResponse.json({ ok: true });
}
