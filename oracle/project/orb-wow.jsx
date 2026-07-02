/* orb-wow.jsx — the orb, but for a dark, atmospheric context.
   Bigger halo. More refractive edges. Optional volumetric light cones.
*/

const WOW_ORB_AGENTS = {
  george: {
    // Warm teal — the baseline calm.
    coreStops: [
      { offset: 0,    color: '#5BA9BD' },
      { offset: 0.45, color: '#1E5868' },
      { offset: 1.0,  color: '#082028' },
    ],
    highlight: 'rgba(255, 220, 180, 0.55)',
    halo:      'rgba(232, 155, 94, 0.34)',
    haloOuter: 'rgba(232, 155, 94, 0.08)',
    accent:    '#E89B5E',
    name: 'George',
  },
  margot: {
    // Bronze / gold — ambitious, strategic.
    coreStops: [
      { offset: 0,    color: '#E0B575' },
      { offset: 0.45, color: '#8C6232' },
      { offset: 1.0,  color: '#2E1F0F' },
    ],
    highlight: 'rgba(255, 235, 195, 0.6)',
    halo:      'rgba(212, 168, 101, 0.36)',
    haloOuter: 'rgba(212, 168, 101, 0.10)',
    accent:    '#D4A865',
    name: 'Margot',
  },
  iain: {
    // Deep indigo — serious, weighty.
    coreStops: [
      { offset: 0,    color: '#8093C8' },
      { offset: 0.45, color: '#3A4C84' },
      { offset: 1.0,  color: '#0A1530' },
    ],
    highlight: 'rgba(220, 230, 250, 0.50)',
    halo:      'rgba(123, 143, 196, 0.36)',
    haloOuter: 'rgba(123, 143, 196, 0.10)',
    accent:    '#7B8FC4',
    name: 'Iain',
  },
  priya: {
    // Sage / jade — modern, digital.
    coreStops: [
      { offset: 0,    color: '#8FCFB0' },
      { offset: 0.45, color: '#3D7A5C' },
      { offset: 1.0,  color: '#0F2C20' },
    ],
    highlight: 'rgba(220, 250, 230, 0.55)',
    halo:      'rgba(122, 184, 154, 0.34)',
    haloOuter: 'rgba(122, 184, 154, 0.08)',
    accent:    '#7AB89A',
    name: 'Priya',
  },
};

function WowOrb({ agent = 'george', state = 'idle', size = 320, glow = 1 }) {
  const a = WOW_ORB_AGENTS[agent] || WOW_ORB_AGENTS.george;
  const id = React.useId().replace(/:/g, '');
  const ringSize = size * 2.4;
  const breathe = state === 'speaking' ? 'wow-breathe 1200ms ease-in-out infinite'
                : state === 'listening' ? 'wow-breathe 1600ms ease-in-out infinite'
                : 'wow-breathe 5200ms ease-in-out infinite';

  return (
    <div style={{
      position: 'relative',
      width: ringSize, height: ringSize,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Outer atmospheric halo */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle, ${a.halo} 0%, ${a.haloOuter} 30%, transparent 65%)`,
        opacity: glow,
        animation: breathe,
        pointerEvents: 'none',
      }} />
      {/* Inner concentrated halo */}
      <div style={{
        position: 'absolute',
        width: size * 1.6, height: size * 1.6, borderRadius: '50%',
        background: `radial-gradient(circle, ${a.halo} 0%, transparent 55%)`,
        opacity: 0.8 * glow,
        animation: breathe,
        pointerEvents: 'none',
        filter: 'blur(2px)',
      }} />

      {/* Core orb */}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{
        display: 'block', position: 'relative', zIndex: 2,
        filter: `drop-shadow(0 0 32px ${a.halo}) drop-shadow(0 16px 40px rgba(0,0,0,0.5))`,
      }}>
        <defs>
          <radialGradient id={`wow-core-${id}`} cx="50%" cy="50%" r="50%">
            {a.coreStops.map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color} />)}
          </radialGradient>
          <radialGradient id={`wow-hl-${id}`} cx="30%" cy="24%" r="38%">
            <stop offset="0%" stopColor={a.highlight} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id={`wow-rim-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="92%" stopColor="transparent" />
            <stop offset="98%" stopColor={a.accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor={a.accent} stopOpacity="0.2" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill={`url(#wow-core-${id})`} />
        <circle cx="50" cy="50" r="49" fill={`url(#wow-hl-${id})`} />
        <circle cx="50" cy="50" r="49" fill={`url(#wow-rim-${id})`} />
        {/* Top specular */}
        <ellipse cx="38" cy="22" rx="12" ry="5" fill="rgba(255,255,255,0.35)" transform="rotate(-25 38 22)" />
      </svg>
    </div>
  );
}

Object.assign(window, { WowOrb, WOW_ORB_AGENTS });
