import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Lightweight admin gate for the agent-ID console.
 *
 * Access is controlled by a single shared secret in the ADMIN_PASSWORD env var
 * (set it locally in .env and in the Vercel project settings). On successful
 * login we set an httpOnly cookie whose value is a hash of the password — the
 * raw password is never stored in the cookie, and the cookie can't be forged
 * without knowing the secret. Both the /admin page and the agent-ID API check
 * this so the UI and the data layer are protected together.
 */

export const ADMIN_COOKIE = "adp_session";

export function adminPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Deterministic token derived from the configured password. */
export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`adp:v1:${pw}`).digest("hex");
}

/** Constant-time check of a submitted password against ADMIN_PASSWORD. */
export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  if (!pw) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** True when the current request carries a valid admin session cookie. */
export function isAdminAuthed(): boolean {
  if (!adminPasswordConfigured()) return false;
  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  const expected = adminToken();
  const a = Buffer.from(cookie);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
