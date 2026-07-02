import { NextResponse } from "next/server";

import { apiRequireAdmin } from "@/lib/auth";
import {
  deletePhoneMapping,
  getCompany,
  listPhoneMappings,
  savePhoneMapping,
} from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/admin/phone-numbers — list all client phone → company mappings.
export async function GET() {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  const mappings = await listPhoneMappings();
  return NextResponse.json({ mappings });
}

// POST /api/admin/phone-numbers — register (or update) a phone → company mapping.
export async function POST(req: Request) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const phoneNumber = String(body.phoneNumber ?? "").trim();
  const companyId = String(body.companyId ?? "").trim();
  const label = body.label ? String(body.label).trim() : undefined;

  if (!phoneNumber) {
    return NextResponse.json({ error: "phoneNumber is required." }, { status: 400 });
  }
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required." }, { status: 400 });
  }

  const company = await getCompany(companyId);
  if (!company) {
    return NextResponse.json({ error: "Unknown company." }, { status: 404 });
  }

  const mapping = await savePhoneMapping({ phoneNumber, companyId, label });
  if (!mapping) {
    return NextResponse.json(
      { error: "That phone number is not valid." },
      { status: 400 },
    );
  }

  return NextResponse.json({ mapping });
}

// DELETE /api/admin/phone-numbers?phone=+44... — remove a mapping.
export async function DELETE(req: Request) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  const phone = new URL(req.url).searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone query param is required." }, { status: 400 });
  }

  const ok = await deletePhoneMapping(phone);
  return NextResponse.json({ ok });
}
