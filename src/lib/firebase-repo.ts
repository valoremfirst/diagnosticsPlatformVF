import { COLLECTIONS, getDb } from "./firebase";
import type {
  AppUser,
  ClientPhoneMapping,
  Company,
  DiagnosticFunction,
  DiagnosticResult,
  DiagnosticSession,
} from "./types";

export interface GlobalElevenLabsConfig {
  agentIds: Partial<Record<DiagnosticFunction, string>>;
  apiKey?: string;
}

export async function getGlobalConfig(): Promise<GlobalElevenLabsConfig> {
  const doc = await (await db())
    .collection(COLLECTIONS.config)
    .doc("elevenlabs")
    .get();
  return (doc.exists ? doc.data() : {}) as GlobalElevenLabsConfig;
}

export async function setGlobalConfig(
  patch: Partial<GlobalElevenLabsConfig>,
): Promise<GlobalElevenLabsConfig> {
  const ref = (await db()).collection(COLLECTIONS.config).doc("elevenlabs");
  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return (updated.data() ?? {}) as GlobalElevenLabsConfig;
}

/**
 * Cloud Firestore repository — the persistent counterpart to the in-memory
 * store (store.ts). Every function mirrors a store.ts export but is async, so
 * swapping the app onto Firebase is a matter of awaiting these instead.
 *
 * This layer is intentionally self-contained and is NOT yet wired into the
 * pages/API routes (the app still runs on the in-memory store). To go live:
 *   1. Fill the FIREBASE_* env vars (see docs/FIREBASE_SETUP.md).
 *   2. Make the consuming server components / route handlers async and call
 *      these functions instead of the store.ts equivalents.
 *
 * All reads/writes throw if Firebase is not configured — guard with
 * firebaseEnabled() before calling, or keep store.ts as the fallback.
 */

async function db() {
  const instance = await getDb();
  if (!instance) {
    throw new Error(
      "Firestore is not configured. Set FIREBASE_* env vars (see docs/FIREBASE_SETUP.md).",
    );
  }
  return instance;
}

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export async function listCompanies(): Promise<Company[]> {
  const snap = await (await db()).collection(COLLECTIONS.companies).get();
  return snap.docs
    .map((d) => d.data() as Company)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCompany(id: string): Promise<Company | undefined> {
  const doc = await (await db()).collection(COLLECTIONS.companies).doc(id).get();
  return doc.exists ? (doc.data() as Company) : undefined;
}

export async function saveCompany(company: Company): Promise<Company> {
  await (await db())
    .collection(COLLECTIONS.companies)
    .doc(company.id)
    .set(company, { merge: true });
  return company;
}

export async function updateCompany(
  id: string,
  patch: Partial<Company>,
): Promise<Company | undefined> {
  const existing = await getCompany(id);
  if (!existing) return undefined;
  // id and createdAt are immutable.
  const next = { ...existing, ...patch, id, createdAt: existing.createdAt };
  return saveCompany(next);
}

export async function dismissConversation(
  companyId: string,
  conversationId: string,
): Promise<void> {
  const { FieldValue } = await import("firebase-admin/firestore");
  await (await db())
    .collection(COLLECTIONS.companies)
    .doc(companyId)
    .update({ dismissedConversationIds: FieldValue.arrayUnion(conversationId) });
}

// ---------------------------------------------------------------------------
// Diagnostic sessions
// ---------------------------------------------------------------------------

export async function listSessions(): Promise<DiagnosticSession[]> {
  const snap = await (await db()).collection(COLLECTIONS.sessions).get();
  return snap.docs
    .map((d) => d.data() as DiagnosticSession)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getSession(
  id: string,
): Promise<DiagnosticSession | undefined> {
  const doc = await (await db()).collection(COLLECTIONS.sessions).doc(id).get();
  return doc.exists ? (doc.data() as DiagnosticSession) : undefined;
}

export async function saveSession(
  session: DiagnosticSession,
): Promise<DiagnosticSession> {
  await (await db())
    .collection(COLLECTIONS.sessions)
    .doc(session.id)
    .set(session, { merge: true });
  return session;
}

export async function updateSession(
  id: string,
  patch: Partial<DiagnosticSession>,
): Promise<DiagnosticSession | undefined> {
  const existing = await getSession(id);
  if (!existing) return undefined;
  return saveSession({ ...existing, ...patch });
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

export async function deleteSession(id: string): Promise<void> {
  await (await db()).collection(COLLECTIONS.sessions).doc(id).delete();
}

export async function listSessionsByCompany(
  companyId: string,
): Promise<DiagnosticSession[]> {
  const all = await listSessions();
  return all.filter((s) => s.companyId === companyId);
}

export async function listSectionSessions(
  companyId: string,
  fn: DiagnosticFunction,
): Promise<DiagnosticSession[]> {
  const all = await listSessions();
  return all.filter((s) => s.companyId === companyId && s.function === fn);
}

// ---------------------------------------------------------------------------
// Users (keyed by Firebase Auth uid)
// ---------------------------------------------------------------------------

export async function listUsers(): Promise<AppUser[]> {
  const snap = await (await db()).collection(COLLECTIONS.users).get();
  return snap.docs
    .map((d) => d.data() as AppUser)
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function getUser(uid: string): Promise<AppUser | undefined> {
  const doc = await (await db()).collection(COLLECTIONS.users).doc(uid).get();
  return doc.exists ? (doc.data() as AppUser) : undefined;
}

export async function saveUser(user: AppUser): Promise<AppUser> {
  await (await db())
    .collection(COLLECTIONS.users)
    .doc(user.uid)
    .set(user, { merge: true });
  return user;
}

export async function updateUser(
  uid: string,
  patch: Partial<AppUser>,
): Promise<AppUser | undefined> {
  const existing = await getUser(uid);
  if (!existing) return undefined;
  // uid and createdAt are immutable.
  const next = { ...existing, ...patch, uid, createdAt: existing.createdAt };
  return saveUser(next);
}

export async function deleteUser(uid: string): Promise<void> {
  await (await db()).collection(COLLECTIONS.users).doc(uid).delete();
}

// ---------------------------------------------------------------------------
// Client phone-number → company mappings
// ---------------------------------------------------------------------------

export async function listPhoneMappings(): Promise<ClientPhoneMapping[]> {
  const snap = await (await db()).collection(COLLECTIONS.phoneNumbers).get();
  return snap.docs
    .map((d) => d.data() as ClientPhoneMapping)
    .sort((a, b) => a.phoneNumber.localeCompare(b.phoneNumber));
}

export async function getPhoneMapping(
  phoneNumber: string,
): Promise<ClientPhoneMapping | undefined> {
  const doc = await (await db())
    .collection(COLLECTIONS.phoneNumbers)
    .doc(phoneNumber)
    .get();
  return doc.exists ? (doc.data() as ClientPhoneMapping) : undefined;
}

export async function savePhoneMapping(
  mapping: ClientPhoneMapping,
): Promise<ClientPhoneMapping> {
  await (await db())
    .collection(COLLECTIONS.phoneNumbers)
    .doc(mapping.phoneNumber)
    .set(mapping, { merge: true });
  return mapping;
}

export async function deletePhoneMapping(phoneNumber: string): Promise<void> {
  await (await db())
    .collection(COLLECTIONS.phoneNumbers)
    .doc(phoneNumber)
    .delete();
}
