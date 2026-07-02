/**
 * One-time script: promote a Firebase Auth user to role="admin".
 * Run with: node scripts/set-admin.mjs <email>
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
try {
  const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  // No .env file — rely on environment variables already set.
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-admin.mjs <email>");
  process.exit(1);
}

const { initializeApp, cert } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");

const projectId = process.env.SA_PROJECT_ID;
const clientEmail = process.env.SA_CLIENT_EMAIL;
const privateKey = process.env.SA_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing credentials. Set SA_PROJECT_ID, SA_CLIENT_EMAIL and SA_PRIVATE_KEY in .env",
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);

const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: "admin" });
await auth.revokeRefreshTokens(user.uid);

console.log(`Done — ${email} is now role=admin. Sign out and back in for it to take effect.`);
process.exit(0);
