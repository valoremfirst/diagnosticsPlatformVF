import { getDb } from "./firebase";
import * as fs from "./firebase-repo";
import { MOCK_COMPANIES, MOCK_SESSIONS } from "./mock-data";
import type {
  AppUser,
  ClientPhoneMapping,
  Company,
  DiagnosticFunction,
  DiagnosticResult,
  DiagnosticSession,
  TranscriptTurn,
} from "./types";

/**
 * Diagnostic data layer.
 *
 * Every function is async and routes to one of two backends:
 *   - Cloud Firestore (firebase-repo.ts) when FIREBASE_* env vars are set and
 *     the Admin SDK initialises successfully.
 *   - An in-memory map seeded from mock data otherwise, so the platform stays
 *     fully usable before any credentials are configured.
 *
 * All business logic (id generation, slugs, uniqueness) lives here; the chosen
 * backend only persists. See docs/FIREBASE_SETUP.md.
 */

declare global {
  // eslint-disable-next-line no-var
  var __diagnosticStore: Map<string, DiagnosticSession> | undefined;
  // eslint-disable-next-line no-var
  var __companyStore: Map<string, Company> | undefined;
  // eslint-disable-next-line no-var
  var __userStore: Map<string, AppUser> | undefined;
  // eslint-disable-next-line no-var
  var __phoneStore: Map<string, ClientPhoneMapping> | undefined;
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

function userDb(): Map<string, AppUser> {
  if (!globalThis.__userStore) {
    globalThis.__userStore = new Map<string, AppUser>();
  }
  return globalThis.__userStore;
}

function phoneDb(): Map<string, ClientPhoneMapping> {
  if (!globalThis.__phoneStore) {
    globalThis.__phoneStore = new Map<string, ClientPhoneMapping>();
  }
  return globalThis.__phoneStore;
}

// Set to true if a live Firestore call fails (e.g. API not yet enabled).
// Prevents retrying broken operations on every request.
let firestoreFailed = false;

async function useFs(): Promise<boolean> {
  if (firestoreFailed) return false;
  return (await getDb()) !== null;
}

/**
 * Run `firestoreOp` if Firestore is available, otherwise run `memoryFallback`.
 * If the Firestore call throws a PERMISSION_DENIED / not-enabled error (common
 * while the API is being enabled in the console), logs a warning, sets the
 * failed flag so subsequent calls skip Firestore, and returns the memory result.
 * Any other Firestore error is re-thrown so real bugs surface.
 */
async function tryFs<T>(
  firestoreOp: () => Promise<T>,
  memoryFallback: () => T,
): Promise<T> {
  if (!(await useFs())) return memoryFallback();
  try {
    return await firestoreOp();
  } catch (err) {
    const msg = String((err as Error).message ?? "");
    if (
      msg.includes("PERMISSION_DENIED") ||
      msg.includes("not been used") ||
      msg.includes("is disabled")
    ) {
      console.warn(
        "[firestore] API not yet enabled — falling back to in-memory store. " +
          "Enable Firestore at https://console.firebase.google.com and restart the server.",
      );
      firestoreFailed = true;
      return memoryFallback();
    }
    throw err;
  }
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

// ---------------------------------------------------------------------------
// Diagnostic sessions
// ---------------------------------------------------------------------------

export async function listSessions(): Promise<DiagnosticSession[]> {
  return tryFs(
    () => fs.listSessions(),
    () =>
      [...db().values()].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  );
}

export async function getSession(
  id: string,
): Promise<DiagnosticSession | undefined> {
  return tryFs(
    () => fs.getSession(id),
    () => db().get(id),
  );
}

export async function createSession(
  input: Partial<DiagnosticSession> &
    Pick<DiagnosticSession, "companyName" | "function">,
): Promise<DiagnosticSession> {
  const id = input.id ?? generateId();
  const session: DiagnosticSession = {
    id,
    companyId: input.companyId,
    companyName: input.companyName,
    function: input.function,
    title: input.title,
    sourceConversationId: input.sourceConversationId,
    sourceCallerPhone: input.sourceCallerPhone,
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
  return tryFs(
    async () => {
      await fs.saveSession(stripUndefined(session));
      return session;
    },
    () => {
      db().set(id, session);
      return session;
    },
  );
}

export async function updateSession(
  id: string,
  patch: Partial<DiagnosticSession>,
): Promise<DiagnosticSession | undefined> {
  return tryFs(
    () => fs.updateSession(id, stripUndefined(patch)),
    () => {
      const existing = db().get(id);
      if (!existing) return undefined;
      const next = { ...existing, ...patch };
      db().set(id, next);
      return next;
    },
  );
}

export async function setTranscript(
  id: string,
  transcript: TranscriptTurn[],
): Promise<DiagnosticSession | undefined> {
  return updateSession(id, { transcript });
}

export async function setResult(
  id: string,
  result: DiagnosticResult,
): Promise<DiagnosticSession | undefined> {
  return updateSession(id, {
    result,
    status: "complete",
    completedAt: new Date().toISOString(),
  });
}

export async function deleteSession(id: string): Promise<boolean> {
  return tryFs(
    async () => {
      await fs.deleteSession(id);
      return true;
    },
    () => db().delete(id),
  );
}

/**
 * After deleting a session that came from ElevenLabs, call this to add its
 * conversationId to the company's dismissed list so auto-import never pulls it again.
 */
export async function dismissConversation(
  companyId: string,
  conversationId: string,
): Promise<void> {
  return tryFs(
    () => fs.dismissConversation(companyId, conversationId),
    () => {
      const company = companyDb().get(companyId);
      if (!company) return;
      const ids = company.dismissedConversationIds ?? [];
      if (!ids.includes(conversationId)) {
        companyDb().set(companyId, {
          ...company,
          dismissedConversationIds: [...ids, conversationId],
        });
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export async function listCompanies(): Promise<Company[]> {
  return tryFs(
    () => fs.listCompanies(),
    () =>
      [...companyDb().values()].sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export async function getCompany(id: string): Promise<Company | undefined> {
  return tryFs(
    () => fs.getCompany(id),
    () => companyDb().get(id),
  );
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

export async function createCompany(
  input: Pick<Company, "name"> & Partial<Company>,
): Promise<Company> {
  const name = input.name.trim();
  // Ensure a unique id even if two companies share a name.
  let baseId = input.id ?? slugify(name);
  let id = baseId;
  let n = 2;
  // Check both backends for uniqueness using getCompany (already wrapped with tryFs).
  while ((await getCompany(id)) !== undefined) {
    id = `${baseId}-${n++}`;
  }
  const company: Company = {
    id,
    name,
    shortName: input.shortName?.trim() || shortNameFrom(name),
    brandColor: input.brandColor ?? "#1E4D5A",
    sector: input.sector?.trim() || undefined,
    tagline: input.tagline?.trim() || undefined,
    profilePicture: input.profilePicture?.trim() || undefined,
    description: input.description?.trim() || undefined,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  return tryFs(
    async () => {
      await fs.saveCompany(stripUndefined(company));
      return company;
    },
    () => {
      companyDb().set(id, company);
      return company;
    },
  );
}

export async function deleteCompany(id: string): Promise<boolean> {
  return tryFs(
    async () => {
      await fs.deleteCompany(id);
      return true;
    },
    () => {
      if (!companyDb().has(id)) return false;
      companyDb().delete(id);
      // Remove all sessions belonging to this company from the in-memory store.
      for (const [sid, s] of db().entries()) {
        if (s.companyId === id) db().delete(sid);
      }
      return true;
    },
  );
}

export async function updateCompany(
  id: string,
  patch: Partial<Company>,
): Promise<Company | undefined> {
  return tryFs(
    () => fs.updateCompany(id, stripUndefined(patch)),
    () => {
      const existing = companyDb().get(id);
      if (!existing) return undefined;
      // id and createdAt are immutable.
      const next = {
        ...existing,
        ...patch,
        id: existing.id,
        createdAt: existing.createdAt,
      };
      companyDb().set(id, next);
      return next;
    },
  );
}

/** All diagnostics belonging to a company, newest first. */
export async function listSessionsByCompany(
  companyId: string,
): Promise<DiagnosticSession[]> {
  const all = await listSessions();
  return all.filter((s) => s.companyId === companyId);
}

/** Session metadata for stats (excludes large transcript field). Used on portfolio homepage. */
export async function listSessionsLean(): Promise<
  Omit<DiagnosticSession, "transcript">[]
> {
  return tryFs(
    () => fs.listSessions().then((s) => s.map((x) => ({ ...x, transcript: undefined as never }))),
    () =>
      [...db().values()].map((s) => ({ ...s, transcript: undefined as never })).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  );
}

/** Lean sessions by company (excludes transcript). */
export async function listSessionsByCompanyLean(
  companyId: string,
): Promise<Omit<DiagnosticSession, "transcript">[]> {
  const all = await listSessionsLean();
  return all.filter((s) => s.companyId === companyId);
}

/** Every transcript/diagnostic uploaded to a (company, function) section. */
export async function listSectionSessions(
  companyId: string,
  fn: DiagnosticFunction,
): Promise<DiagnosticSession[]> {
  const all = await listSessions();
  return all.filter((s) => s.companyId === companyId && s.function === fn);
}

/**
 * Create a new diagnostic for a (company, function) section. Each uploaded
 * transcript is its own diagnostic, so a section can hold many.
 */
export async function createSectionSession(
  companyId: string,
  fn: DiagnosticFunction,
  patch: Partial<DiagnosticSession>,
): Promise<DiagnosticSession | undefined> {
  const company = await getCompany(companyId);
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

// ---------------------------------------------------------------------------
// Users (identity owned by Firebase Auth; this mirrors role/company assignment)
// ---------------------------------------------------------------------------

export async function listUsers(): Promise<AppUser[]> {
  return tryFs(
    () => fs.listUsers(),
    () =>
      [...userDb().values()].sort((a, b) => a.email.localeCompare(b.email)),
  );
}

export async function getUser(uid: string): Promise<AppUser | undefined> {
  return tryFs(
    () => fs.getUser(uid),
    () => userDb().get(uid),
  );
}

export async function getUserByEmail(
  email: string,
): Promise<AppUser | undefined> {
  const target = email.trim().toLowerCase();
  if (!target) return undefined;
  const all = await listUsers();
  return all.find((u) => u.email.toLowerCase() === target);
}

export async function saveUser(user: AppUser): Promise<AppUser> {
  return tryFs(
    async () => {
      await fs.saveUser(stripUndefined(user));
      return user;
    },
    () => {
      userDb().set(user.uid, user);
      return user;
    },
  );
}

export async function updateUser(
  uid: string,
  patch: Partial<AppUser>,
): Promise<AppUser | undefined> {
  return tryFs(
    () => fs.updateUser(uid, stripUndefined(patch)),
    () => {
      const existing = userDb().get(uid);
      if (!existing) return undefined;
      // uid and createdAt are immutable.
      const next = {
        ...existing,
        ...patch,
        uid: existing.uid,
        createdAt: existing.createdAt,
      };
      userDb().set(uid, next);
      return next;
    },
  );
}

export async function deleteUser(uid: string): Promise<boolean> {
  return tryFs(
    async () => {
      await fs.deleteUser(uid);
      return true;
    },
    () => userDb().delete(uid),
  );
}

// ---------------------------------------------------------------------------
// Global ElevenLabs configuration (agent ID defaults, stored in Firestore)
// ---------------------------------------------------------------------------

/** In-memory fallback when Firestore is unavailable. */
let _memGlobalConfig: fs.GlobalElevenLabsConfig = { agentIds: {} };

export async function getGlobalAgentConfig(): Promise<fs.GlobalElevenLabsConfig> {
  return tryFs(
    () => fs.getGlobalConfig(),
    () => _memGlobalConfig,
  );
}

export async function setGlobalAgentConfig(
  patch: Partial<fs.GlobalElevenLabsConfig>,
): Promise<fs.GlobalElevenLabsConfig> {
  return tryFs(
    () => fs.setGlobalConfig(patch),
    () => {
      _memGlobalConfig = { ..._memGlobalConfig, ...patch };
      if (patch.agentIds) {
        _memGlobalConfig.agentIds = {
          ..._memGlobalConfig.agentIds,
          ...patch.agentIds,
        };
      }
      return _memGlobalConfig;
    },
  );
}

// ---------------------------------------------------------------------------
// Client phone-number → company mappings
// ---------------------------------------------------------------------------

/**
 * Normalise a phone number to a stable key: keep a leading "+" and digits only,
 * drop spaces, dashes, brackets, etc. So "+44 (0)20 1234 5678" and
 * "+442012345678" collapse to the same key. Returns "" for empty input.
 */
export function normalisePhone(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export async function listPhoneMappings(): Promise<ClientPhoneMapping[]> {
  return tryFs(
    () => fs.listPhoneMappings(),
    () =>
      [...phoneDb().values()].sort((a, b) =>
        a.phoneNumber.localeCompare(b.phoneNumber),
      ),
  );
}

export async function getPhoneMapping(
  phoneNumber: string,
): Promise<ClientPhoneMapping | undefined> {
  const key = normalisePhone(phoneNumber);
  if (!key) return undefined;
  return tryFs(
    () => fs.getPhoneMapping(key),
    () => phoneDb().get(key),
  );
}

export async function savePhoneMapping(input: {
  phoneNumber: string;
  companyId: string;
  label?: string;
}): Promise<ClientPhoneMapping | undefined> {
  const key = normalisePhone(input.phoneNumber);
  if (!key) return undefined;
  const mapping: ClientPhoneMapping = {
    phoneNumber: key,
    companyId: input.companyId,
    label: input.label?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  return tryFs(
    async () => {
      await fs.savePhoneMapping(stripUndefined(mapping));
      return mapping;
    },
    () => {
      phoneDb().set(key, mapping);
      return mapping;
    },
  );
}

export async function deletePhoneMapping(phoneNumber: string): Promise<boolean> {
  const key = normalisePhone(phoneNumber);
  if (!key) return false;
  return tryFs(
    async () => {
      await fs.deletePhoneMapping(key);
      return true;
    },
    () => phoneDb().delete(key),
  );
}

/**
 * Firestore rejects `undefined` field values. Optional fields on our models are
 * frequently undefined, so strip them before writing.
 */
function stripUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}
