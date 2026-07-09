"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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

const HIGHLIGHTS = [
  {
    icon: MessageSquareText,
    title: "Voice-led diagnostics",
    body: "Relaxed conversations with an AI consultant — no forms to fill.",
  },
  {
    icon: Sparkles,
    title: "Framework-scored maturity",
    body: "Every interview graded against the standards that matter to you.",
  },
  {
    icon: ShieldCheck,
    title: "Private to your business",
    body: "You see only your company. Findings stay confidential.",
  },
];

export function LoginForm() {
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
      const cred = await signInWithEmailAndPassword(
        clientAuth(),
        email.trim(),
        password,
      );
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
      // Hard navigation (not router.replace + refresh) — the RSC transition was
      // briefly double-rendering the login screen over the destination. A full
      // load is clean and lets middleware set fresh chrome headers.
      window.location.assign(dest);
    } catch (err) {
      setError(friendlyError((err as Error).message));
      setBusy(false);
    }
  }

  const canSubmit = !busy && email.length > 0 && password.length > 0;

  return (
    <div className="lf-root">
      {/* ── Brand panel (left on desktop, top on mobile) ──────────────────── */}
      <aside className="lf-brand">
        <div className="lf-brand-veil" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://www.scottishconstructionnow.com/uploads/Valorem%20First%20banner.png" alt="ValoremFirst" className="lf-logo" />

        <div className="lf-brand-inner">
          <div className="lf-orb-wrap">
            <Orb agent="george" state={orbState} size={132} />
          </div>

          <p className="lf-eyebrow">Agentic Diagnostics Platform</p>
          <h2 className="lf-brand-title">
            A calmer way to read your business.
          </h2>
          <div className="lf-rule" />
          <p className="lf-brand-lede">
            Voice-led interviews, scored against proven maturity frameworks, and
            surfaced as clear risks and recommendations.
          </p>

          <ul className="lf-highlights">
            {HIGHLIGHTS.map((h, i) => {
              const Icon = h.icon;
              return (
                <li
                  key={h.title}
                  className="lf-highlight"
                  style={{ animationDelay: `${260 + i * 90}ms` }}
                >
                  <span className="lf-highlight-icon">
                    <Icon size={16} />
                  </span>
                  <span>
                    <span className="lf-highlight-title">{h.title}</span>
                    <span className="lf-highlight-body">{h.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="lf-brand-foot">
          Trouble signing in? Contact your ValoremFirst consultant.
        </p>
      </aside>

      {/* ── Form panel ────────────────────────────────────────────────────── */}
      <main className="lf-form-panel">
        <div className="lf-form-col">
          {/* Compact orb shows on mobile where the brand panel is condensed */}
          <div className="lf-mobile-orb">
            <Orb agent="george" state={orbState} size={104} interactive={false} />
          </div>

          <div className="lf-form-head">
            <p className="lf-form-eyebrow">Welcome back</p>
            <h1 className="lf-form-title">Sign in</h1>
            <p className="lf-form-sub">
              Use the credentials provided by your consultant.
            </p>
          </div>

          <form onSubmit={submit} className="lf-form">
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
                  className="lf-eye"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              hint={
                capsOn ? (
                  <span className="lf-caps">Caps Lock is on</span>
                ) : null
              }
            />

            {error && (
              <div role="alert" className="lf-error">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="lf-submit"
              style={{
                background: canSubmit ? C.orange : C.lineStrong,
                cursor: canSubmit ? "pointer" : "not-allowed",
                boxShadow: canSubmit
                  ? "0 10px 24px rgba(201,77,14,0.28)"
                  : "none",
              }}
            >
              {busy ? (
                <Loader2 size={17} className="lf-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} className="lf-arrow" />
                </>
              )}
            </button>
          </form>

          <p className="lf-legal">
            Protected access · Your session is encrypted end-to-end.
          </p>
        </div>
      </main>

      <style>{STYLES}</style>
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
    <div className="lf-field">
      <span
        className="lf-label"
        style={{ color: focused ? C.orange : C.inkMuted }}
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
            padding: rightSlot ? "0 44px 0 16px" : "0 16px",
            border: `1.5px solid ${focused ? C.orange : "#E2DFD8"}`,
            boxShadow: focused
              ? "0 0 0 3px rgba(201,77,14,0.12)"
              : "0 1px 2px rgba(26,26,26,0.04) inset",
            background: focused ? "#FFFFFF" : "#F5F3EE",
          }}
        />
        {rightSlot}
      </div>
      {hint && <div style={{ marginTop: 6 }}>{hint}</div>}
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

const STYLES = `
  .lf-root {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    grid-template-columns: 1fr;
    background: ${C.canvas};
  }
  @media (min-width: 900px) {
    .lf-root {
      grid-template-columns: 1.05fr 1fr;
      height: 100vh;
      height: 100dvh;
      min-height: 0;
      overflow: hidden;
    }
  }

  /* ── Brand panel ── */
  .lf-brand {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 30px 32px 26px;
    overflow: hidden;
    background:
      radial-gradient(ellipse 70% 50% at 22% 8%, rgba(245,133,42,0.16), transparent 60%),
      radial-gradient(ellipse 80% 60% at 90% 100%, rgba(30,77,90,0.10), transparent 62%),
      linear-gradient(160deg, #FFFDF9 0%, #F6F2EA 100%);
    border-bottom: 1px solid ${C.line};
  }
  @media (min-width: 900px) {
    .lf-brand {
      padding: 32px 48px;
      border-bottom: none;
      border-right: 1px solid ${C.line};
      align-items: center;
    }
  }
  .lf-brand-veil {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(30,77,90,0.05) 0.5px, transparent 0.5px);
    background-size: 22px 22px;
    opacity: 0.5;
    pointer-events: none;
  }
  .lf-logo {
    position: relative;
    height: 30px;
    width: auto;
    display: block;
    animation: lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }
  .lf-brand-inner {
    position: relative;
    margin: auto;
    padding: 12px 0;
    max-width: 460px;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  @media (max-width: 899px) {
    .lf-brand-inner { display: none; }
  }
  .lf-orb-wrap {
    margin: 0 0 2px;
    animation: lf-rise 0.8s cubic-bezier(0.22,1,0.36,1) 60ms both;
  }
  .lf-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: ${C.orange}; margin: 0;
    animation: lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) 120ms both;
  }
  .lf-brand-title {
    font-family: var(--font-display, Georgia, serif);
    font-size: 34px; font-weight: 400; line-height: 1.08;
    letter-spacing: -0.03em; color: ${C.ink}; margin: 12px 0 0; max-width: 12ch;
    animation: lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) 160ms both;
  }
  .lf-rule {
    width: 52px; height: 2px; background: ${C.orange}; margin: 16px 0 0;
    border-radius: 2px; opacity: 0.9;
    animation: lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) 200ms both;
  }
  .lf-brand-lede {
    font-family: var(--font-text, Georgia, serif);
    font-size: 15px; line-height: 1.55; color: ${C.inkSoft};
    margin: 14px 0 0; max-width: 42ch;
    animation: lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) 230ms both;
  }
  .lf-highlights {
    list-style: none; margin: 22px 0 0; padding: 0;
    display: flex; flex-direction: column; gap: 14px; align-items: flex-start;
  }
  .lf-highlight {
    display: flex; gap: 13px; align-items: flex-start; text-align: left;
    animation: lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }
  .lf-highlight-icon {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px;
    background: rgba(30,77,90,0.08); color: #1E4D5A;
  }
  .lf-highlight-title {
    display: block; font-size: 14px; font-weight: 600; color: ${C.ink};
  }
  .lf-highlight-body {
    display: block; font-size: 13px; line-height: 1.5; color: ${C.inkMuted}; margin-top: 2px;
  }
  .lf-brand-foot {
    position: relative; font-size: 12.5px; color: ${C.inkMuted}; margin: 0;
    text-align: center;
  }
  @media (max-width: 899px) {
    .lf-brand-foot { display: none; }
  }

  /* ── Form panel ── */
  .lf-form-panel {
    display: flex; align-items: center; justify-content: center;
    padding: 44px 24px 40px;
  }
  .lf-form-col {
    width: 100%; max-width: 384px;
    animation: lf-rise 0.7s cubic-bezier(0.22,1,0.36,1) 120ms both;
  }
  .lf-mobile-orb {
    display: flex; justify-content: center; margin: -18px 0 2px;
  }
  @media (min-width: 900px) {
    .lf-mobile-orb { display: none; }
  }
  .lf-form-head { text-align: center; }
  @media (min-width: 900px) {
    .lf-form-head { text-align: left; }
  }
  .lf-form-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: 0.16em;
    text-transform: uppercase; color: #2E6B7A; margin: 0;
  }
  .lf-form-title {
    font-family: var(--font-display, Georgia, serif);
    font-size: 34px; font-weight: 400; line-height: 1.1;
    letter-spacing: -0.03em; color: ${C.ink}; margin: 10px 0 0;
  }
  .lf-form-sub {
    font-size: 14.5px; line-height: 1.55; color: ${C.inkMuted}; margin: 10px 0 0;
  }
  .lf-form {
    margin-top: 30px; display: flex; flex-direction: column; gap: 22px;
  }
  .lf-field { display: flex; flex-direction: column; text-align: left; }
  .lf-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; transition: color 200ms ease;
    user-select: none; margin-bottom: 8px;
  }
  .lf-input {
    display: block; width: 100%; box-sizing: border-box; height: 52px;
    appearance: none; -webkit-appearance: none; border-radius: 12px; outline: none;
    font-size: 15.5px; color: ${C.ink};
    transition: border-color 200ms ease, box-shadow 200ms ease, background 200ms ease;
    font-family: inherit; line-height: 1;
  }
  .lf-input::placeholder { color: ${C.inkFaint}; opacity: 1; }
  .lf-input:-webkit-autofill,
  .lf-input:-webkit-autofill:hover,
  .lf-input:-webkit-autofill:focus {
    -webkit-text-fill-color: ${C.ink};
    -webkit-box-shadow: 0 0 0 1000px #F5F3EE inset;
    box-shadow: 0 0 0 1000px #F5F3EE inset;
    transition: background-color 9999s ease-in-out 0s;
    caret-color: ${C.ink}; border-radius: 12px;
  }
  .lf-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    border: none; background: transparent; color: ${C.inkFaint};
    cursor: pointer; padding: 4px; display: flex; align-items: center;
    transition: color 160ms ease;
  }
  .lf-eye:hover { color: ${C.inkSoft}; }
  .lf-caps { color: ${C.danger}; font-size: 11.5px; font-weight: 500; }
  .lf-error {
    display: flex; align-items: center; gap: 8px; font-size: 13px;
    color: ${C.danger}; line-height: 1.45;
    background: rgba(168,74,61,0.07); border: 1px solid rgba(168,74,61,0.18);
    border-radius: 10px; padding: 10px 12px;
    animation: lf-shake 0.4s ease;
  }
  .lf-submit {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    height: 52px; width: 100%; border-radius: 12px; border: none;
    color: #fff; font-size: 14.5px; font-weight: 600; letter-spacing: 0.01em;
    transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
    margin-top: 4px;
  }
  .lf-submit:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(201,77,14,0.34) !important;
    filter: saturate(1.05);
  }
  .lf-submit:not(:disabled):active { transform: translateY(0); }
  .lf-submit:not(:disabled):hover .lf-arrow { transform: translateX(3px); }
  .lf-arrow { transition: transform 180ms ease; }
  .lf-spin { animation: lf-spin 1s linear infinite; }
  .lf-legal {
    margin: 24px 0 0; text-align: center; font-size: 12px; color: ${C.inkFaint};
  }

  @keyframes lf-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes lf-spin { to { transform: rotate(360deg); } }
  @keyframes lf-shake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .lf-root *, .lf-root *::before { animation-duration: 0.001ms !important; }
  }
`;
