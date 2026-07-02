"use client";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { clientAuth } from "@/lib/firebase-client";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit =
    !busy && current.length > 0 && next.length >= 6 && confirm.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    const user = clientAuth().currentUser;
    if (!user || !user.email) {
      setError("You must be signed in to change your password.");
      return;
    }

    setBusy(true);
    try {
      // Firebase requires a recent login to change a password, so reauthenticate
      // with the current password first.
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(friendlyError((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <Field
        label="Current password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
      />
      <Field
        label="New password"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        hint="At least 6 characters."
      />
      <Field
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      {done && (
        <p className="flex items-center gap-1.5 text-sm text-positive">
          <CheckCircle2 className="h-4 w-4" />
          Password updated.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal px-4 text-sm font-medium text-white transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Update password
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="mt-1.5 block h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/15"
      />
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

function friendlyError(message: string): string {
  if (
    message.includes("auth/invalid-credential") ||
    message.includes("auth/wrong-password")
  ) {
    return "Your current password is incorrect.";
  }
  if (message.includes("auth/weak-password")) {
    return "That new password is too weak.";
  }
  if (message.includes("auth/requires-recent-login")) {
    return "Please sign out and back in, then try again.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message;
}
