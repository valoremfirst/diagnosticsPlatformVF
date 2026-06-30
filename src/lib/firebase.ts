import type { App } from "firebase-admin/app";
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
 * Credentials (set in .env.local — never commit them):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (with literal \n escapes — they are unescaped below)
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

export function firebaseEnabled(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

/**
 * Returns a singleton Firestore instance, or null when Firebase is not
 * configured. The Admin SDK is imported lazily so the dependency never loads
 * in environments that run purely on mock data.
 */
let initFailed = false;

export async function getDb(): Promise<Firestore | null> {
  if (!firebaseEnabled() || initFailed) return null;

  try {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!globalThis.__firebaseApp) {
      const existing = getApps();
      globalThis.__firebaseApp =
        existing.length > 0
          ? existing[0]
          : initializeApp({
              credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Vercel/CI store the key with escaped newlines.
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
                  /\\n/g,
                  "\n",
                ),
              }),
            });
    }

    return getFirestore(globalThis.__firebaseApp);
  } catch (err) {
    // Malformed credentials, etc. Fall back to the in-memory store rather than
    // crashing the app, and don't retry the broken init on every request.
    initFailed = true;
    console.warn(
      "[firebase] Admin SDK init failed — falling back to in-memory store.",
      (err as Error).message,
    );
    return null;
  }
}

// Firestore collection names — single source of truth for the data model.
export const COLLECTIONS = {
  companies: "companies",
  sessions: "diagnosticSessions",
} as const;
