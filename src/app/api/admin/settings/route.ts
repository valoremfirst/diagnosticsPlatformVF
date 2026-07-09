import { NextResponse } from "next/server";

import { apiRequireAdmin } from "@/lib/auth";
import { getGlobalAgentConfig, setGlobalAgentConfig } from "@/lib/store";
import type { DiagnosticFunction } from "@/lib/types";

const VALID_FUNCTIONS: DiagnosticFunction[] = [
  "finance",
  "legal",
  "it",
  "operational-delivery",
  "sales",
  "leadership",
  "culture",
  "presales",
];

// GET /api/admin/settings — returns global ElevenLabs config (admin only).
export async function GET(_req: Request) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  const config = await getGlobalAgentConfig();
  return NextResponse.json({ config });
}

// PATCH /api/admin/settings — update global agent IDs (admin only).
export async function PATCH(req: Request) {
  const gate = await apiRequireAdmin();
  if ("response" in gate) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const agentIds: Record<string, string> = {};
  if (body.agentIds && typeof body.agentIds === "object") {
    const raw = body.agentIds as Record<string, unknown>;
    const allowedKeys = [...VALID_FUNCTIONS, "george"];
    for (const key of allowedKeys) {
      const v = raw[key];
      // Empty string clears the value; undefined means "not in payload, leave alone".
      if (typeof v === "string") agentIds[key] = v.trim();
    }
  }

  const updated = await setGlobalAgentConfig({ agentIds });
  return NextResponse.json({ config: updated });
}
