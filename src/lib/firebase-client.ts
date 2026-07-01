"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase client (browser) SDK — used only for authentication. The login form
 * signs the user in here to obtain an ID token, which is exchanged for an
 * httpOnly session cookie via POST /api/auth/session. All data access still
 * happens server-side through the Admin SDK.
 *
 * These NEXT_PUBLIC_* values are safe to expose to the browser (they identify
 * the project; they are not secrets). Set them in .env / .env.production.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function clientAuth(): Auth {
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}
