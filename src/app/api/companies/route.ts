import { NextResponse } from "next/server";

import { apiRequireAdmin } from "@/lib/auth";
import { createCompany, listCompanies } from "@/lib/store";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// GET /api/companies — list all companies (admin only; clients see only their own).
export async function GET() {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;
  return NextResponse.json({ companies: await listCompanies() });
}

// POST /api/companies — create a new company (admin only).
export async function POST(req: Request) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Company name is required." }, {
      status: 400,
    });
  }

  const brandColor =
    body.brandColor !== undefined ? String(body.brandColor) : undefined;
  if (brandColor && !HEX_RE.test(brandColor)) {
    return NextResponse.json(
      { error: "brandColor must be a hex colour, e.g. #1E4D5A." },
      { status: 400 },
    );
  }

  const company = await createCompany({
    name,
    brandColor,
    shortName: body.shortName ? String(body.shortName) : undefined,
    sector: body.sector ? String(body.sector) : undefined,
    tagline: body.tagline ? String(body.tagline) : undefined,
    profilePicture: body.profilePicture ? String(body.profilePicture) : undefined,
    description: body.description ? String(body.description) : undefined,
  });

  return NextResponse.json({ company }, { status: 201 });
}
