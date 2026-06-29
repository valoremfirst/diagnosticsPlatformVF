import { NextResponse } from "next/server";

import { createCompany, listCompanies } from "@/lib/store";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// GET /api/companies — list all companies.
export async function GET() {
  return NextResponse.json({ companies: listCompanies() });
}

// POST /api/companies — create a new company.
export async function POST(req: Request) {
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

  const company = createCompany({
    name,
    brandColor,
    shortName: body.shortName ? String(body.shortName) : undefined,
    sector: body.sector ? String(body.sector) : undefined,
    tagline: body.tagline ? String(body.tagline) : undefined,
  });

  return NextResponse.json({ company }, { status: 201 });
}
