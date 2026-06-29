import type { DiagnosticFunction } from "./types";

/**
 * ElevenLabs configuration helpers. The live voice interview runs through the
 * browser SDK (@elevenlabs/react), so the public agent ids are read from
 * NEXT_PUBLIC_* env vars. When no agent id is configured the UI falls back to
 * a built-in transcript simulator so the flow is always demonstrable.
 */

const PUBLIC_AGENT_ENV: Record<DiagnosticFunction, string | undefined> = {
  finance: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_FINANCE,
  hr: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_HR,
  sales: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_SALES,
  it: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_IT,
  operations: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_OPERATIONS,
  leadership: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_LEADERSHIP,
};

export function getPublicAgentId(fn: DiagnosticFunction): string | undefined {
  return PUBLIC_AGENT_ENV[fn];
}

export function elevenLabsConfigured(fn: DiagnosticFunction): boolean {
  return Boolean(getPublicAgentId(fn));
}
