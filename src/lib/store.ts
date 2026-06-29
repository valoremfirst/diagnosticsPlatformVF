import { MOCK_COMPANIES, MOCK_SESSIONS } from "./mock-data";
import type {
  Company,
  DiagnosticFunction,
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
  // eslint-disable-next-line no-var
  var __companyStore: Map<string, Company> | undefined;
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

function companyDb(): Map<string, Company> {
  if (!globalThis.__companyStore) {
    const map = new Map<string, Company>();
    for (const c of MOCK_COMPANIES) {
      map.set(c.id, structuredClone(c));
    }
    globalThis.__companyStore = map;
  }
  return globalThis.__companyStore;
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
    companyId: input.companyId,
    companyName: input.companyName,
    function: input.function,
    title: input.title,
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

export function deleteSession(id: string): boolean {
  return db().delete(id);
}

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export function listCompanies(): Company[] {
  return [...companyDb().values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getCompany(id: string): Company | undefined {
  return companyDb().get(id);
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "company"
  );
}

function shortNameFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CO";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function createCompany(
  input: Pick<Company, "name"> & Partial<Company>,
): Company {
  const name = input.name.trim();
  // Ensure a unique id even if two companies share a name.
  let id = input.id ?? slugify(name);
  let n = 2;
  while (companyDb().has(id)) {
    id = `${slugify(name)}-${n++}`;
  }
  const company: Company = {
    id,
    name,
    shortName: input.shortName?.trim() || shortNameFrom(name),
    brandColor: input.brandColor ?? "#1E4D5A",
    sector: input.sector?.trim() || undefined,
    tagline: input.tagline?.trim() || undefined,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  companyDb().set(id, company);
  return company;
}

export function updateCompany(
  id: string,
  patch: Partial<Company>,
): Company | undefined {
  const existing = companyDb().get(id);
  if (!existing) return undefined;
  // id and createdAt are immutable.
  const next = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt };
  companyDb().set(id, next);
  return next;
}

/** All diagnostics belonging to a company, newest first. */
export function listSessionsByCompany(companyId: string): DiagnosticSession[] {
  return listSessions().filter((s) => s.companyId === companyId);
}

/** Every transcript/diagnostic uploaded to a (company, function) section. */
export function listSectionSessions(
  companyId: string,
  fn: DiagnosticFunction,
): DiagnosticSession[] {
  return listSessions().filter(
    (s) => s.companyId === companyId && s.function === fn,
  );
}

/**
 * Create a new diagnostic for a (company, function) section. Each uploaded
 * transcript is its own diagnostic, so a section can hold many.
 */
export function createSectionSession(
  companyId: string,
  fn: DiagnosticFunction,
  patch: Partial<DiagnosticSession>,
): DiagnosticSession | undefined {
  const company = getCompany(companyId);
  if (!company) return undefined;
  return createSession({
    companyId,
    companyName: company.name,
    function: fn,
    status: "draft",
    selectedFrameworks: [],
    ...patch,
  });
}
