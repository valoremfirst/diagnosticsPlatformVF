/* Orb.jsx — the visual signature of Oracle.
   Four layers per the design spec: outer halo, core sphere, inner highlight,
   specular edge. Optional ripple for listening state.
   Four agent palettes:
     George — warm teal (the calm GP register)
     Margot — bronze / gold (strategy, confidence)
     Iain   — deep indigo / navy (risk, weight)
     Priya  — sage / jade green (digital, modern)
*/

const ORB_AGENTS = {
  george: {
    // Warm teal — the baseline. Calm, friendly, default.
    coreStops: [
      { offset: 0,    color: '#3A8794' },
      { offset: 0.55, color: '#1E4D5A' },
      { offset: 1.0,  color: '#0F2C36' },
    ],
    highlight: 'rgba(255, 235, 200, 0.46)',
    halo:      'rgba(201, 135, 74, 0.26)',
    accent:    '#C9874A',
    name: 'George',
  },
  margot: {
    // Bronze / gold — ambitious, expensive, strategic.
    coreStops: [
      { offset: 0,    color: '#D4A865' },
      { offset: 0.45, color: '#8C6232' },
      { offset: 1.0,  color: '#3D2A14' },
    ],
    highlight: 'rgba(255, 240, 200, 0.55)',
    halo:      'rgba(212, 168, 101, 0.32)',
    accent:    '#D4A865',
    name: 'Margot',
  },
  iain: {
    // Deep indigo / navy — serious, weighty, risk.
    coreStops: [
      { offset: 0,    color: '#5C6FA8' },
      { offset: 0.45, color: '#2E3D6E' },
      { offset: 1.0,  color: '#101A38' },
    ],
    highlight: 'rgba(225, 230, 250, 0.42)',
    halo:      'rgba(92, 111, 168, 0.30)',
    accent:    '#5C6FA8',
    name: 'Iain',
  },
  priya: {
    // Sage / jade — modern, clear, digital.
    coreStops: [
      { offset: 0,    color: '#7AB89A' },
      { offset: 0.45, color: '#3D7A5C' },
      { offset: 1.0,  color: '#1A3A2C' },
    ],
    highlight: 'rgba(220, 245, 230, 0.48)',
    halo:      'rgba(122, 184, 154, 0.28)',
    accent:    '#7AB89A',
    name: 'Priya',
  },
};

/**
 * Orb — props:
 *   agent: 'george' | 'margot' | 'iain' | 'priya'  (default george)
 *   state: 'idle' | 'listening' | 'speaking' | 'thinking' | 'error'  (default idle)
 *   size:  number in px (default 240)
 */
function Orb({ agent = 'george', state = 'idle', size = 240, label = null }) {
  const a = ORB_AGENTS[agent] || ORB_AGENTS.george;
  const id = React.useId().replace(/:/g, '');
  const desaturate = state === 'error' ? 'grayscale(70%)' : 'none';

  // Container needs to grow for big listening pulse + ripple rings
  const ringSize = size * 2.0;

  // Each state gets its own core animation
  const coreAnim =
    state === 'idle'      ? 'orb-breathe 4800ms cubic-bezier(.4,0,.2,1) infinite'
  : state === 'listening' ? 'orb-listening 2400ms cubic-bezier(.4,0,.2,1) infinite'
  : state === 'speaking'  ? 'orb-speaking 2000ms cubic-bezier(.4,0,.2,1) infinite'
  : state === 'thinking'  ? 'orb-thinking 2800ms cubic-bezier(.65,0,.35,1) infinite'
  : state === 'error'     ? 'orb-error 1200ms ease-in-out infinite'
  : 'none';

  const haloOpacity = state === 'speaking' ? 1
                    : state === 'listening' ? 0.95
                    : state === 'thinking' ? 0.5
                    : state === 'error' ? 0.4
                    : 0.85;

  const haloAnim =
    state === 'idle'      ? 'halo-pulse 4800ms cubic-bezier(.4,0,.2,1) infinite'
  : state === 'speaking'  ? 'halo-speak-pulse 2000ms cubic-bezier(.4,0,.2,1) infinite'
  : state === 'listening' ? 'halo-pulse 3200ms cubic-bezier(.4,0,.2,1) infinite'
  : 'none';

  return (
    <div style={{ position: 'relative', width: ringSize, height: ringSize, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: desaturate }}>
      {/* Outer halo */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle, ${a.halo} 0%, rgba(30,77,90,0.08) 55%, transparent 75%)`,
        opacity: haloOpacity,
        animation: haloAnim,
        pointerEvents: 'none',
      }} />

      {/* LISTENING — three rings collecting inward toward the orb */}
      {state === 'listening' && (
        <>
          <div style={{
            position: 'absolute',
            width: size, height: size, borderRadius: '50%',
            border: `1.5px solid ${a.accent}`,
            animation: 'orb-ripple-in 3000ms cubic-bezier(.4,0,.2,1) infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: size, height: size, borderRadius: '50%',
            border: `1px solid ${a.accent}`,
            animation: 'orb-ripple-in 3000ms cubic-bezier(.4,0,.2,1) 1000ms infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: size, height: size, borderRadius: '50%',
            border: `1px solid ${a.accent}`,
            animation: 'orb-ripple-in 3000ms cubic-bezier(.4,0,.2,1) 2000ms infinite',
            pointerEvents: 'none',
          }} />
        </>
      )}

      {/* SPEAKING — three smooth ripples expanding outward */}
      {state === 'speaking' && (
        <>
          <div style={{
            position: 'absolute',
            width: size * 1.05, height: size * 1.05, borderRadius: '50%',
            border: `1.5px solid ${a.accent}`,
            animation: 'orb-ripple-tight 2000ms cubic-bezier(.22,1,.36,1) infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: size * 1.05, height: size * 1.05, borderRadius: '50%',
            border: `1px solid ${a.accent}`,
            animation: 'orb-ripple-tight 2000ms cubic-bezier(.22,1,.36,1) 700ms infinite',
            pointerEvents: 'none', opacity: 0.6,
          }} />
          <div style={{
            position: 'absolute',
            width: size * 1.05, height: size * 1.05, borderRadius: '50%',
            border: `1px solid ${a.accent}`,
            animation: 'orb-ripple-tight 2000ms cubic-bezier(.22,1,.36,1) 1400ms infinite',
            pointerEvents: 'none', opacity: 0.4,
          }} />
        </>
      )}

      {/* THINKING — orbiting arc */}
      {state === 'thinking' && (
        <svg width={size * 1.25} height={size * 1.25} viewBox="0 0 100 100" style={{
          position: 'absolute', pointerEvents: 'none',
          animation: 'orb-orbit 3200ms linear infinite',
        }}>
          <circle cx="50" cy="50" r="48" fill="none"
            stroke={a.accent} strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray="60 240" opacity="0.85" />
          <circle cx="50" cy="50" r="48" fill="none"
            stroke={a.accent} strokeWidth="1" strokeLinecap="round"
            strokeDasharray="20 280" strokeDashoffset="-80" opacity="0.5" />
        </svg>
      )}

      {/* ERROR — broken-ring overlay */}
      {state === 'error' && (
        <svg width={size * 1.15} height={size * 1.15} viewBox="0 0 100 100" style={{
          position: 'absolute', pointerEvents: 'none', opacity: 0.6,
        }}>
          <circle cx="50" cy="50" r="48" fill="none"
            stroke="var(--color-danger)" strokeWidth="1" strokeLinecap="round"
            strokeDasharray="6 8" />
        </svg>
      )}

      {/* Core sphere */}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ animation: coreAnim, display: 'block', filter: 'drop-shadow(0 8px 24px rgba(20,56,63,0.18))', position: 'relative' }}>
        <defs>
          <radialGradient id={`core-${id}`} cx="50%" cy="50%" r="50%">
            {a.coreStops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </radialGradient>
          <radialGradient id={`highlight-${id}`} cx="32%" cy="28%" r="38%">
            <stop offset="0%"   stopColor={a.highlight} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id={`specular-${id}`} cx="50%" cy="8%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
            <stop offset="20%"  stopColor="rgba(255,255,255,0.25)" />
            <stop offset="40%"  stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill={`url(#core-${id})`} />
        <circle cx="50" cy="50" r="49" fill={`url(#highlight-${id})`} />
        <circle cx="50" cy="50" r="49" fill={`url(#specular-${id})`} />
        <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
      </svg>

      {label && (
        <div style={{
          position: 'absolute', bottom: -28, left: 0, right: 0, textAlign: 'center',
          fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-3)', fontStyle: 'italic',
        }}>{label}</div>
      )}
    </div>
  );
}

window.Orb = Orb;
window.ORB_AGENTS = ORB_AGENTS;
