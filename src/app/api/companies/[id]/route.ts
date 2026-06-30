import { NextResponse } from "next/server";

import { isAdminAuthed } from "@/lib/admin-auth";
import { getCompany, updateCompany } from "@/lib/store";
import type { Company, DiagnosticFunction } from "@/lib/types";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const VALID_FUNCTIONS: DiagnosticFunction[] = [
  "finance",
  "hr",
  "sales",
  "operations",
  "it",
  "leadership",
];

// GET /api/companies/:id — fetch a single company.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ company });
}

// PATCH /api/companies/:id — update editable company fields (e.g. brand colour).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patch: Partial<Company> = {};

  if (body.brandColor !== undefined) {
    const brandColor = String(body.brandColor);
    if (!HEX_RE.test(brandColor)) {
      return NextResponse.json(
        { error: "brandColor must be a hex colour, e.g. #1E4D5A." },
        { status: 400 },
      );
    }
    patch.brandColor = brandColor;
  }
  if (body.name !== undefined && String(body.name).trim()) {
    patch.name = String(body.name).trim();
  }
  if (body.sector !== undefined) {
    patch.sector = String(body.sector).trim();
  }
  if (body.tagline !== undefined) {
    patch.tagline = String(body.tagline).trim();
  }
  if (body.profilePicture !== undefined) {
    patch.profilePicture = String(body.profilePicture).trim();
  }
  if (body.description !== undefined) {
    patch.description = String(body.description).trim();
  }
  if (body.agentIds !== undefined && typeof body.agentIds === "object") {
    // Agent IDs are admin-only — they control which ElevenLabs conversations
    // get pulled, so writing them requires a valid admin session.
    if (!isAdminAuthed()) {
      return NextResponse.json(
        { error: "Admin authentication required to change agent IDs." },
        { status: 403 },
      );
    }
    // Keep only valid function keys with non-empty string ids.
    const raw = body.agentIds as Record<string, unknown>;
    const cleaned: Partial<Record<DiagnosticFunction, string>> = {};
    for (const fn of VALID_FUNCTIONS) {
      const v = raw[fn];
      if (typeof v === "string" && v.trim()) cleaned[fn] = v.trim();
    }
    patch.agentIds = cleaned;
  }

  const updated = await updateCompany(params.id, patch);
  return NextResponse.json({ company: updated });
}
