import type { DiagnosticFunction } from "./types";

/**
 * ElevenLabs configuration helpers. The live voice interview runs through the
 * browser SDK (@elevenlabs/react), so the public agent ids are read from
 * NEXT_PUBLIC_* env vars. When no agent id is configured the UI falls back to
 * a built-in transcript simulator so the flow is always demonstrable.
 */

const PUBLIC_AGENT_ENV: Record<DiagnosticFunction, string | undefined> = {
  finance: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_FINANCE,
  legal: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_LEGAL,
  it: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_IT,
  "operational-delivery":
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_OPERATIONAL_DELIVERY,
  sales: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_SALES,
  leadership: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_LEADERSHIP,
  culture: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_CULTURE,
  presales: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_PRESALES,
};

export function getPublicAgentId(fn: DiagnosticFunction): string | undefined {
  return PUBLIC_AGENT_ENV[fn];
}

export function elevenLabsConfigured(fn: DiagnosticFunction): boolean {
  return Boolean(getPublicAgentId(fn));
}
