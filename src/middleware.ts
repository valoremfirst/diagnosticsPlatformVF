import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Kept in sync with SESSION_COOKIE in lib/auth.ts. Inlined (not imported) so the
// Edge middleware bundle doesn't pull in the server-only auth module.
const SESSION_COOKIE = "__session";

/**
 * Two jobs:
 *  1. Expose the request pathname to server components via a header, so the app
 *     shell can adapt its chrome per route.
 *  2. Gate the app: unauthenticated visitors are redirected to /login.
 *
 * This is a *lightweight* gate — it only checks that a session cookie is
 * present, because Firebase Admin (needed to actually verify the cookie) can't
 * run in the Edge middleware runtime. Real verification happens server-side in
 * lib/auth.ts (pages and API routes).
 */

// Paths reachable without a session.
const PUBLIC_PREFIXES = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (!isPublic && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
