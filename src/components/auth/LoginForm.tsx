"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { clientAuth } from "@/lib/firebase-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // 1. Sign in with Firebase (browser) to obtain an ID token.
      const cred = await signInWithEmailAndPassword(
        clientAuth(),
        email.trim(),
        password,
      );
      const idToken = await cred.user.getIdToken();

      // 2. Exchange the ID token for an httpOnly session cookie.
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Sign-in failed.");
      }

      // 3. Route by role (clients go straight to their company dashboard).
      const claims = (await cred.user.getIdTokenResult()).claims;
      const dest =
        claims.role === "client" && typeof claims.companyId === "string"
          ? `/companies/${claims.companyId}`
          : "/";
      router.replace(dest);
      router.refresh();
    } catch (err) {
      setError(friendlyError((err as Error).message));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-24 max-w-md px-6">
      <div className="mb-6 text-center">
        <div className="font-display text-3xl leading-tight text-teal">
          Agentic Diagnostics
        </div>
        <div className="mt-1 text-sm text-ink-muted">By ValoremFirst</div>
      </div>
      <Card className="p-7">
        <h1 className="font-display text-lg text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Use the credentials provided by your consultant.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            autoFocus
            className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
          />
          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !email || !password}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Sign in
          </button>
        </form>
      </Card>
    </div>
  );
}

/** Map raw Firebase auth error strings to something a user can read. */
function friendlyError(message: string): string {
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
    return "Incorrect email or password.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (message.includes("auth/invalid-email")) {
    return "That email address is not valid.";
  }
  return message;
}
