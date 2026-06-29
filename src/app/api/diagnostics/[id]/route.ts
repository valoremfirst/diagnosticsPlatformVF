import { NextResponse } from "next/server";

import { getSession } from "@/lib/store";

// GET /api/diagnostics/:id — fetch a single diagnostic session.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ session });
}
