import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Expose the request pathname to server components via a request header, so the
 * app shell can drop its nav/sidebar on public routes (e.g. /share/*).
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
