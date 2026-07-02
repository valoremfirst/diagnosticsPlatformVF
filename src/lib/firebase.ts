import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin (server-side) initialisation.
 *
 * The platform currently runs on the in-memory store (see store.ts). This
 * module is the foundation for moving persistence to Cloud Firestore: it boots
 * the Admin SDK from environment variables and exposes a typed Firestore
 * handle plus a `firebaseEnabled()` guard so callers can degrade gracefully
 * when credentials are absent.
 *
 * Credentials (set in .env — never commit them). Named SA_* rather than
 * FIREBASE_* because Firebase Functions reserves the FIREBASE_ env prefix and
 * rejects it at deploy time:
 *   SA_PROJECT_ID
 *   SA_CLIENT_EMAIL
 *   SA_PRIVATE_KEY   (with literal \n escapes — they are unescaped below)
 *
 * Alternatively set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON
 * path and the SDK will pick it up via applicationDefault().
 *
 * See docs/FIREBASE_SETUP.md for the full walkthrough.
 */

declare global {
  // eslint-disable-next-line no-var
  var __firebaseApp: App | undefined;
}

// True when explicit service-account credentials are provided (local dev / Vercel).
function hasExplicitCreds(): boolean {
  return Boolean(
    process.env.SA_PROJECT_ID &&
      process.env.SA_CLIENT_EMAIL &&
      process.env.SA_PRIVATE_KEY,
  );
}

// True when running on Google Cloud (Firebase App Hosting / Cloud Run).
// K_SERVICE is injected by Cloud Run; SA_PROJECT_ID can optionally pin the project.
function isGoogleCloud(): boolean {
  return Boolean(process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT);
}

export function firebaseEnabled(): boolean {
  return hasExplicitCreds() || isGoogleCloud();
}

/**
 * Returns the singleton Admin SDK app, or null when Firebase is not configured
 * or init fails. The Admin SDK is imported lazily so the dependency never loads
 * in environments that run purely on mock data.
 */
let initFailed = false;

export async function getAdminApp(): Promise<App | null> {
  if (!firebaseEnabled() || initFailed) return null;

  try {
    const { getApps, initializeApp, cert, applicationDefault } = await import("firebase-admin/app");

    if (!globalThis.__firebaseApp) {
      const existing = getApps();
      if (existing.length > 0) {
        globalThis.__firebaseApp = existing[0];
      } else if (hasExplicitCreds()) {
        globalThis.__firebaseApp = initializeApp({
          credential: cert({
            projectId: process.env.SA_PROJECT_ID,
            clientEmail: process.env.SA_CLIENT_EMAIL,
            // Vercel/CI store the key with escaped newlines.
            privateKey: process.env.SA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        });
      } else {
        // On Firebase App Hosting / Cloud Run / Cloud Functions, use ADC.
        globalThis.__firebaseApp = initializeApp({
          credential: applicationDefault(),
          projectId: process.env.SA_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
        });
      }
    }

    return globalThis.__firebaseApp;
  } catch (err) {
    // Malformed credentials, etc. Fall back rather than crashing the app, and
    // don't retry the broken init on every request.
    initFailed = true;
    console.warn(
      "[firebase] Admin SDK init failed — falling back to in-memory store.",
      (err as Error).message,
    );
    return null;
  }
}

/**
 * Returns a singleton Firestore instance, or null when Firebase is not
 * configured.
 */
export async function getDb(): Promise<Firestore | null> {
  const app = await getAdminApp();
  if (!app) return null;
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(app);
}

/**
 * Returns the Admin Auth instance, or null when Firebase is not configured.
 * Used to verify session cookies and manage users.
 */
export async function getAdminAuth(): Promise<Auth | null> {
  const app = await getAdminApp();
  if (!app) return null;
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(app);
}

// Firestore collection names — single source of truth for the data model.
export const COLLECTIONS = {
  companies: "companies",
  sessions: "diagnosticSessions",
  users: "users",
  config: "config",
} as const;
