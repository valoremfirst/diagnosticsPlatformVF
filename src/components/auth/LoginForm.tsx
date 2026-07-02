"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Orb, type OrbState } from "@/components/ui/Orb";
import { clientAuth } from "@/lib/firebase-client";

const C = {
  canvas: "#FAFAF7",
  ink: "#1A1A1A",
  inkSoft: "#4A4A4A",
  inkMuted: "#767676",
  inkFaint: "#A8A6A0",
  line: "#E8E6E0",
  lineStrong: "#D4D1C8",
  orange: "#C94D0E",
  orangeSoft: "#F5852A",
  danger: "#A84A3D",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInput = email.length > 0 || password.length > 0;
  const orbState: OrbState = busy
    ? "thinking"
    : error
      ? "error"
      : hasInput
        ? "listening"
        : "idle";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(clientAuth(), email.trim(), password);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Sign-in failed.");
      }

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

  const canSubmit = !busy && email.length > 0 && password.length > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.canvas,
        backgroundImage: `
          radial-gradient(ellipse 60% 45% at 50% 12%, rgba(245,133,42,0.12), transparent 58%),
          radial-gradient(ellipse 90% 55% at 50% 112%, rgba(30,77,90,0.05), transparent 65%)
        `,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        position: "relative",
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 36,
          fontFamily: "var(--font-display, Georgia, serif)",
          fontSize: 19,
          letterSpacing: "-0.01em",
          color: C.ink,
          textTransform: "lowercase",
        }}
      >
        valorem<span style={{ color: C.orange }}>first</span>
      </div>

      {/* Centred canvas column — orb + editorial heading + form, no card */}
      <div
        style={{
          width: "100%",
          maxWidth: 348,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ animation: "lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) both" }}>
          <Orb agent="george" state={orbState} size={132} />
        </div>

        <div
          style={{
            marginTop: -6,
            animation: "lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) 90ms both",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.orange,
              margin: 0,
            }}
          >
            Agentic Diagnostics
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: 42,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: C.ink,
              margin: "16px 0 0",
            }}
          >
            Sign In
          </h1>
          <div style={{ width: 52, height: 1, background: C.orange, margin: "22px auto 0", opacity: 0.85 }} />
          <p
            style={{
              fontFamily: "var(--font-text, Georgia, serif)",
              fontSize: 15,
              fontStyle: "italic",
              lineHeight: 1.6,
              color: C.inkMuted,
              margin: "20px auto 0",
              maxWidth: 300,
            }}
          >
            Sign in with the credentials provided by your consultant.
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{
            width: "100%",
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            gap: 26,
            animation: "lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) 180ms both",
          }}
        >
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
          />

          <Field
            label="Password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Enter your password"
            onKeyEvent={(e) => setCapsOn(e.getModifierState("CapsLock"))}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: C.inkFaint,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            hint={
              capsOn ? (
                <span style={{ color: C.danger, fontSize: 11.5, fontWeight: 500 }}>
                  Caps Lock is on
                </span>
              ) : null
            }
          />

          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                fontSize: 13,
                color: C.danger,
                lineHeight: 1.45,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="lf-submit"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 50,
              width: "100%",
              borderRadius: 8,
              border: "none",
              background: canSubmit ? C.orange : C.lineStrong,
              color: "#fff",
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "0.01em",
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit ? "0 8px 20px rgba(201,77,14,0.26)" : "none",
              transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
              marginTop: 6,
            }}
          >
            {busy ? (
              <Loader2 size={17} style={{ animation: "lf-spin 1s linear infinite" }} />
            ) : (
              <>
                Sign in
                <ArrowRight size={17} className="lf-arrow" />
              </>
            )}
          </button>
        </form>

      </div>

      <p
        style={{
          position: "absolute",
          bottom: 28,
          fontSize: 12.5,
          color: C.inkMuted,
          textAlign: "center",
        }}
      >
        Trouble signing in? Contact your ValoremFirst consultant.
      </p>

      <style>{`
        @keyframes lf-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lf-spin { to{transform:rotate(360deg)} }
        .lf-submit:not(:disabled):hover { transform:translateY(-1px); box-shadow:0 12px 28px rgba(201,77,14,0.32); filter:saturate(1.05); }
        .lf-submit:not(:disabled):active { transform:translateY(0); }
        .lf-submit:not(:disabled):hover .lf-arrow { transform:translateX(3px); }
        .lf-arrow { transition: transform 180ms ease; }
        .lf-input::placeholder { color:${C.inkFaint}; opacity:1; }
        /* Override browser autofill — match our warm input background. */
        .lf-input:-webkit-autofill,
        .lf-input:-webkit-autofill:hover,
        .lf-input:-webkit-autofill:focus {
          -webkit-text-fill-color: ${C.ink};
          -webkit-box-shadow: 0 0 0 1000px #F5F3EE inset;
          box-shadow: 0 0 0 1000px #F5F3EE inset;
          transition: background-color 9999s ease-in-out 0s;
          caret-color: ${C.ink};
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  autoFocus,
  placeholder,
  rightSlot,
  hint,
  onKeyEvent,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
  placeholder?: string;
  rightSlot?: React.ReactNode;
  hint?: React.ReactNode;
  onKeyEvent?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: focused ? C.orange : C.inkMuted,
          transition: "color 200ms ease",
          userSelect: "none",
          marginBottom: 8,
        }}
      >
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <input
          className="lf-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={onKeyEvent}
          onKeyDown={onKeyEvent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            height: 52,
            padding: rightSlot ? "0 44px 0 16px" : "0 16px",
            appearance: "none",
            WebkitAppearance: "none",
            border: `1.5px solid ${focused ? C.orange : "#E2DFD8"}`,
            borderRadius: 12,
            outline: "none",
            boxShadow: focused
              ? "0 0 0 3px rgba(201,77,14,0.12)"
              : "0 1px 2px rgba(26,26,26,0.04) inset",
            background: focused ? "#FFFFFF" : "#F5F3EE",
            fontSize: 15.5,
            color: C.ink,
            transition: "border-color 200ms ease, box-shadow 200ms ease, background 200ms ease",
            fontFamily: "inherit",
            lineHeight: 1,
          }}
        />
        {rightSlot}
      </div>
      {hint && <div style={{ marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function friendlyError(message: string): string {
  if (
    message.includes("auth/invalid-credential") ||
    message.includes("auth/wrong-password") ||
    message.includes("auth/user-not-found")
  ) {
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
