import { MOCK_SESSIONS } from "./mock-data";
import type {
  DiagnosticResult,
  DiagnosticSession,
  TranscriptTurn,
} from "./types";

/**
 * In-memory diagnostic store, seeded with mock data so the platform is fully
 * usable before any API keys or database are configured. Designed to be the
 * single integration point for swapping in Supabase persistence later.
 *
 * A module-level singleton survives across requests in a single Next.js dev
 * server / serverless instance. For production persistence, implement the same
 * surface against Supabase (see supabaseEnabled()).
 */

declare global {
  // eslint-disable-next-line no-var
  var __diagnosticStore: Map<string, DiagnosticSession> | undefined;
}

function db(): Map<string, DiagnosticSession> {
  if (!globalThis.__diagnosticStore) {
    const map = new Map<string, DiagnosticSession>();
    for (const s of MOCK_SESSIONS) {
      // Deep clone so mutations don't leak back into the mock module.
      map.set(s.id, structuredClone(s));
    }
    globalThis.__diagnosticStore = map;
  }
  return globalThis.__diagnosticStore;
}

export function supabaseEnabled(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function generateId(): string {
  const n = Math.floor(100 + Math.random() * 900);
  return `diag-${Date.now().toString().slice(-4)}${n}`;
}

export function listSessions(): DiagnosticSession[] {
  return [...db().values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getSession(id: string): DiagnosticSession | undefined {
  return db().get(id);
}

export function createSession(
  input: Partial<DiagnosticSession> &
    Pick<DiagnosticSession, "companyName" | "function">,
): DiagnosticSession {
  const id = input.id ?? generateId();
  const session: DiagnosticSession = {
    id,
    companyName: input.companyName,
    function: input.function,
    status: input.status ?? "draft",
    clientContact: input.clientContact,
    sector: input.sector,
    notes: input.notes,
    selectedFrameworks: input.selectedFrameworks ?? [],
    transcript: input.transcript ?? [],
    result: input.result,
    createdAt: input.createdAt ?? new Date().toISOString(),
    completedAt: input.completedAt,
  };
  db().set(id, session);
  return session;
}

export function updateSession(
  id: string,
  patch: Partial<DiagnosticSession>,
): DiagnosticSession | undefined {
  const existing = db().get(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  db().set(id, next);
  return next;
}

export function setTranscript(
  id: string,
  transcript: TranscriptTurn[],
): DiagnosticSession | undefined {
  return updateSession(id, { transcript });
}

export function setResult(
  id: string,
  result: DiagnosticResult,
): DiagnosticSession | undefined {
  return updateSession(id, {
    result,
    status: "complete",
    completedAt: new Date().toISOString(),
  });
}
