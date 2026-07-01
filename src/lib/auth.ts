import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getAdminAuth } from "./firebase";
import type { UserRole } from "./types";

/**
 * Server-side authentication & authorization.
 *
 * Identity is owned by Firebase Auth. The browser signs in with the client SDK,
 * then exchanges the ID token for an httpOnly **session cookie** (see
 * /api/auth/session). Here we verify that cookie with the Admin SDK and read
 * the user's role/company from custom claims.
 *
 * IMPORTANT: the cookie is named `__session` on purpose — Firebase Hosting only
 * forwards a cookie with that exact name to the SSR backend; all other cookies
 * are stripped at the CDN.
 */
export const SESSION_COOKIE = "__session";

export interface AuthedUser {
  uid: string;
  email: string;
  role: UserRole;
  /** Present for clients; the single company they may access. */
  companyId?: string;
}

/**
 * Resolve the current user from the session cookie, or null when unauthenticated
 * / misconfigured. Never throws — callers decide how to react.
 */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  const auth = await getAdminAuth();
  if (!auth) return null;

  try {
    const decoded = await auth.verifySessionCookie(cookie, true);
    const role = (decoded.role as UserRole) ?? "client";
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role,
      companyId:
        typeof decoded.companyId === "string" ? decoded.companyId : undefined,
    };
  } catch {
    // Expired / revoked / malformed cookie.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Page helpers (redirect / notFound on failure) — use inside server components.
// ---------------------------------------------------------------------------

/** Require any signed-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require an admin. Clients are sent to their own company dashboard; anonymous
 * visitors go to /login.
 */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    redirect(user.companyId ? `/companies/${user.companyId}` : "/login");
  }
  return user;
}

/**
 * Require access to a specific company. Admins pass; clients pass only for their
 * own company. Everyone else hits notFound() so foreign IDs aren't enumerable.
 */
export async function assertCompanyAccess(
  companyId: string,
): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") return user;
  if (user.companyId && user.companyId === companyId) return user;
  notFound();
}

// ---------------------------------------------------------------------------
// API helpers (return a NextResponse on failure) — use inside route handlers.
// ---------------------------------------------------------------------------

export const UNAUTHORIZED = NextResponse.json(
  { error: "Authentication required." },
  { status: 401 },
);

export const FORBIDDEN = NextResponse.json(
  { error: "You do not have access to this resource." },
  { status: 403 },
);

/** For API routes: returns the user, or a NextResponse to return early. */
export async function apiRequireUser(): Promise<
  { user: AuthedUser } | { response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { response: UNAUTHORIZED };
  return { user };
}

/** For API routes: returns the admin user, or a NextResponse to return early. */
export async function apiRequireAdmin(): Promise<
  { user: AuthedUser } | { response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { response: UNAUTHORIZED };
  if (user.role !== "admin") return { response: FORBIDDEN };
  return { user };
}

/**
 * For API routes: returns the user if they may access `companyId`, or a
 * NextResponse to return early.
 */
export async function apiRequireCompanyAccess(
  companyId: string,
): Promise<{ user: AuthedUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: UNAUTHORIZED };
  if (user.role === "admin") return { user };
  if (user.companyId && user.companyId === companyId) return { user };
  return { response: FORBIDDEN };
}
