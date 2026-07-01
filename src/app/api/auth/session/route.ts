import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Session cookie lifetime (Firebase allows up to 14 days).
const EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000;

// POST /api/auth/session — exchange a Firebase ID token for a session cookie.
// Body: { idToken: string }
export async function POST(req: Request) {
  const auth = await getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  let body: { idToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  try {
    // Verify the ID token and require a recent sign-in before minting a cookie.
    const decoded = await auth.verifyIdToken(idToken, true);
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json(
        { error: "Recent sign-in required. Please log in again." },
        { status: 401 },
      );
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: EXPIRES_IN_MS / 1000,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Could not verify sign-in." },
      { status: 401 },
    );
  }
}

// DELETE /api/auth/session — sign out (clear the session cookie).
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
