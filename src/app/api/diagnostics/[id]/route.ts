import { NextResponse } from "next/server";

import { deleteSession, getSession } from "@/lib/store";

// GET /api/diagnostics/:id — fetch a single diagnostic session.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ session });
}

// DELETE /api/diagnostics/:id — remove an uploaded transcript / diagnostic.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const ok = await deleteSession(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
