"use client";

import { useEffect, useId, useRef } from "react";

export type OrbAgent = "george" | "margot" | "iain" | "priya";
export type OrbState = "idle" | "listening" | "thinking" | "error";

const AGENTS: Record<
  OrbAgent,
  {
    coreStops: { offset: number; color: string }[];
    highlight: string;
    rim: string;
    halo: string;
    accent: string;
    /** Inner aurora blobs that drift inside the glass. */
    swirlA: string;
    swirlB: string;
    ember: string;
  }
> = {
  george: {
    // Molten amber-orange glass — the ValoremFirst signature.
    coreStops: [
      { offset: 0, color: "#FFD592" },
      { offset: 0.38, color: "#F5852A" },
      { offset: 0.7, color: "#C94D0E" },
      { offset: 1.0, color: "#571F03" },
    ],
    highlight: "rgba(255,246,224,0.9)",
    rim: "rgba(255,178,90,0.9)",
    halo: "rgba(245,133,42,0.42)",
    accent: "#F5852A",
    swirlA: "rgba(255,205,130,0.5)",
    swirlB: "rgba(140,40,4,0.55)",
    ember: "rgba(255,230,180,0.55)",
  },
  margot: {
    coreStops: [
      { offset: 0, color: "#FFD98C" },
      { offset: 0.42, color: "#E89A3C" },
      { offset: 0.75, color: "#A85C14" },
      { offset: 1.0, color: "#4E2606" },
    ],
    highlight: "rgba(255,246,214,0.8)",
    rim: "rgba(255,196,110,0.85)",
    halo: "rgba(232,160,64,0.36)",
    accent: "#E89A3C",
    swirlA: "rgba(255,214,150,0.45)",
    swirlB: "rgba(120,58,10,0.5)",
    ember: "rgba(255,236,196,0.5)",
  },
  iain: {
    coreStops: [
      { offset: 0, color: "#8B9BD4" },
      { offset: 0.45, color: "#3E4E86" },
      { offset: 1.0, color: "#101A38" },
    ],
    highlight: "rgba(230,236,255,0.75)",
    rim: "rgba(140,158,220,0.8)",
    halo: "rgba(92,111,168,0.34)",
    accent: "#5C6FA8",
    swirlA: "rgba(160,180,240,0.45)",
    swirlB: "rgba(20,30,70,0.55)",
    ember: "rgba(210,222,255,0.5)",
  },
  priya: {
    coreStops: [
      { offset: 0, color: "#A6E0C4" },
      { offset: 0.45, color: "#3D7A5C" },
      { offset: 1.0, color: "#123326" },
    ],
    highlight: "rgba(230,250,240,0.78)",
    rim: "rgba(140,210,180,0.8)",
    halo: "rgba(122,184,154,0.32)",
    accent: "#7AB89A",
    swirlA: "rgba(170,230,200,0.45)",
    swirlB: "rgba(12,45,32,0.55)",
    ember: "rgba(220,250,238,0.5)",
  },
};

// Self-contained keyframes so the orb works regardless of Tailwind config.
const ORB_KEYFRAMES = `
  @keyframes orb-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.045)} }
  @keyframes orb-listening { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }
  @keyframes orb-thinking { 0%,100%{transform:scale(0.975)} 50%{transform:scale(1.02)} }
  @keyframes orb-error {
    0%,100%{transform:translateX(0) scale(1)}
    20%{transform:translateX(-3px) scale(.99)}
    40%{transform:translateX(3px) scale(.99)}
    60%{transform:translateX(-1px) scale(1)}
    80%{transform:translateX(1px) scale(1)}
  }
  @keyframes halo-idle { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:.95;transform:scale(1.05)} }
  @keyframes halo-listen { 0%,100%{opacity:.8;transform:scale(1)} 50%{opacity:1;transform:scale(1.07)} }
  @keyframes orb-ripple-in { 0%{transform:scale(1.7);opacity:0} 35%{opacity:.4} 100%{transform:scale(.92);opacity:0} }
  @keyframes orb-orbit { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes sheen-drift { 0%,100%{opacity:.5} 50%{opacity:.85} }
  @keyframes orb-swirl { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes orb-swirl-rev { from{transform:rotate(360deg)} to{transform:rotate(0)} }
  @keyframes ember-pulse { 0%,100%{opacity:.35;transform:scale(.92)} 50%{opacity:.7;transform:scale(1.06)} }
`;

export function Orb({
  agent = "george",
  state = "idle",
  size = 240,
  interactive = true,
  className,
}: {
  agent?: OrbAgent;
  state?: OrbState;
  size?: number;
  /** Track the pointer so the specular highlight follows the cursor. */
  interactive?: boolean;
  className?: string;
}) {
  const a = AGENTS[agent] ?? AGENTS.george;
  const id = useId().replace(/:/g, "");
  const pad = size * 0.75; // room for halo + rings
  const total = size + pad * 2;

  const wrapRef = useRef<HTMLDivElement>(null);
  const specRef = useRef<SVGRadialGradientElement>(null);
  const glossRef = useRef<SVGEllipseElement>(null);

  // Pointer-reactive specular highlight — the orb catches the "light" of the
  // cursor like a real glass sphere. Updates DOM attributes directly (no
  // re-render) and is rAF-throttled for smoothness.
  useEffect(() => {
    if (!interactive) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 50;
    let ty = 34;
    let cx = 50;
    let cy = 34;

    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ox = r.left + r.width / 2;
      const oy = r.top + r.height / 2;
      // Normalise pointer offset over a generous radius so a full-screen sweep
      // moves the highlight edge-to-edge.
      const nx = Math.max(-1, Math.min(1, (e.clientX - ox) / 320));
      const ny = Math.max(-1, Math.min(1, (e.clientY - oy) / 320));
      tx = 50 + nx * 30; // 20 → 80 across the sphere
      ty = 34 + ny * 30; // 4 → 64
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      raf = 0;
      // Ease toward the target for a liquid, weighty feel.
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      specRef.current?.setAttribute("cx", `${cx}%`);
      specRef.current?.setAttribute("cy", `${cy}%`);
      if (glossRef.current) {
        glossRef.current.setAttribute("cx", `${38 + (cx - 50) * 0.35}`);
        glossRef.current.setAttribute("cy", `${30 + (cy - 34) * 0.35}`);
      }
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [interactive]);

  const desaturate = state === "error" ? "grayscale(65%)" : "none";

  const coreAnim =
    state === "idle" ? "orb-breathe 4800ms cubic-bezier(.4,0,.2,1) infinite"
    : state === "listening" ? "orb-listening 2400ms cubic-bezier(.4,0,.2,1) infinite"
    : state === "thinking" ? "orb-thinking 2800ms cubic-bezier(.65,0,.35,1) infinite"
    : state === "error" ? "orb-error 1200ms ease-in-out infinite"
    : "orb-breathe 4800ms cubic-bezier(.4,0,.2,1) infinite";

  const haloAnim =
    state === "listening"
      ? "halo-listen 2400ms cubic-bezier(.4,0,.2,1) infinite"
      : "halo-idle 4800ms cubic-bezier(.4,0,.2,1) infinite";

  const haloOpacity = state === "thinking" ? 0.5 : state === "error" ? 0.3 : 0.9;

  // The inner aurora churns faster while thinking, drifts gently otherwise.
  const swirlDur = state === "thinking" ? "6s" : "16s";

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        position: "relative",
        width: total,
        height: total,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: desaturate,
      }}
    >
      <style>{ORB_KEYFRAMES}</style>

      {/* Outer halo — ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${a.halo} 0%, rgba(120,48,8,0.08) 52%, transparent 72%)`,
          opacity: haloOpacity,
          animation: haloAnim,
          pointerEvents: "none",
        }}
      />

      {/* Listening — rings collecting inward */}
      {state === "listening" &&
        [0, 1000, 2000].map((delay) => (
          <div
            key={delay}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: `1.5px solid ${a.accent}`,
              animation: `orb-ripple-in 3000ms cubic-bezier(.4,0,.2,1) ${delay}ms infinite`,
              pointerEvents: "none",
            }}
          />
        ))}

      {/* Thinking — orbiting arcs */}
      {state === "thinking" && (
        <svg
          width={size * 1.25}
          height={size * 1.25}
          viewBox="0 0 100 100"
          style={{ position: "absolute", pointerEvents: "none", animation: "orb-orbit 2400ms linear infinite" }}
        >
          <circle cx="50" cy="50" r="48" fill="none" stroke={a.accent} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="55 245" opacity="0.85" />
          <circle cx="50" cy="50" r="48" fill="none" stroke={a.accent} strokeWidth="1" strokeLinecap="round" strokeDasharray="18 282" strokeDashoffset="-90" opacity="0.45" />
        </svg>
      )}

      {/* Core sphere */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{
          display: "block",
          filter: `drop-shadow(0 10px 30px ${a.halo}) drop-shadow(0 4px 12px rgba(94,36,4,0.30))`,
          position: "relative",
          animation: coreAnim,
          transformOrigin: "center",
        }}
        aria-label={`${agent} orb, ${state}`}
      >
        <defs>
          {/* Base sphere shading */}
          <radialGradient id={`core-${id}`} cx="50%" cy="38%" r="65%">
            {a.coreStops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </radialGradient>
          {/* Warm fresnel rim at the base for depth */}
          <radialGradient id={`rim-${id}`} cx="50%" cy="88%" r="58%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="88%" stopColor={a.rim} stopOpacity="0.55" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          {/* Soft upper-left glass sheen (static) */}
          <radialGradient id={`hl-${id}`} cx="34%" cy="26%" r="42%">
            <stop offset="0%" stopColor={a.highlight} />
            <stop offset="70%" stopColor={a.highlight} stopOpacity="0" />
          </radialGradient>
          {/* Bright specular hotspot that follows the pointer */}
          <radialGradient ref={specRef} id={`spec-${id}`} cx="50%" cy="34%" r="26%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="35%" stopColor="rgba(255,250,235,0.35)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          {/* Inner darkening at the edge for a rounded, contained look */}
          <radialGradient id={`edge-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="82%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(50,18,2,0.45)" />
          </radialGradient>
          {/* Molten ember core */}
          <radialGradient id={`ember-${id}`} cx="50%" cy="58%" r="34%">
            <stop offset="0%" stopColor={a.ember} />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          {/* Everything painted inside the sphere stays inside the sphere */}
          <clipPath id={`clip-${id}`}>
            <circle cx="50" cy="50" r="49" />
          </clipPath>
          <filter id={`blur-${id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <circle cx="50" cy="50" r="49" fill={`url(#core-${id})`} />

        {/* Inner aurora — two blurred blobs slowly counter-rotating inside the
            glass, like liquid catching the light. */}
        <g clipPath={`url(#clip-${id})`}>
          <g
            style={{
              animation: `orb-swirl ${swirlDur} linear infinite`,
              transformOrigin: "50px 50px",
            }}
          >
            <ellipse
              cx="34"
              cy="62"
              rx="30"
              ry="17"
              fill={a.swirlA}
              filter={`url(#blur-${id})`}
              style={{ mixBlendMode: "screen" }}
            />
          </g>
          <g
            style={{
              animation: `orb-swirl-rev ${swirlDur === "6s" ? "9s" : "22s"} linear infinite`,
              transformOrigin: "50px 50px",
            }}
          >
            <ellipse
              cx="66"
              cy="42"
              rx="26"
              ry="15"
              fill={a.swirlB}
              filter={`url(#blur-${id})`}
              style={{ mixBlendMode: "multiply" }}
            />
          </g>
          {/* Ember glow pulsing at the heart of the sphere */}
          <circle
            cx="50"
            cy="56"
            r="22"
            fill={`url(#ember-${id})`}
            style={{
              animation: "ember-pulse 4200ms ease-in-out infinite",
              transformOrigin: "50px 56px",
            }}
          />
        </g>

        <circle cx="50" cy="50" r="49" fill={`url(#rim-${id})`} />
        <circle cx="50" cy="50" r="49" fill={`url(#hl-${id})`} />

        {/* Glossy reflection cap near the top (mouse-parallaxed) */}
        <ellipse
          ref={glossRef}
          cx="38"
          cy="30"
          rx="26"
          ry="16"
          fill="rgba(255,255,255,0.35)"
          style={{ mixBlendMode: "screen", animation: "sheen-drift 5200ms ease-in-out infinite" }}
        />

        {/* Slim secondary bounce-light at the lower right, like light bending
            through the glass onto the far edge. */}
        <path
          d="M 78 68 A 34 34 0 0 1 62 84"
          fill="none"
          stroke={a.highlight}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.35"
        />

        <circle cx="50" cy="50" r="49" fill={`url(#spec-${id})`} />
        <circle cx="50" cy="50" r="49" fill={`url(#edge-${id})`} />
        <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,240,220,0.22)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
