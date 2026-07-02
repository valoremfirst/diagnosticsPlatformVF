/* wow-screens-2.jsx — Risk Constellation, Agents, Board Pack pages */

const { WowOrb, WowAtmosphere, WowEyebrow, WowTopNav } = window;

/* ──────────────────────────────────────────────────────────────────
   03 · Risk Constellation
   ────────────────────────────────────────────────────────────────── */
function WOW_Constellation() {
  // Risks placed in a starfield. Position chosen for composition; size = magnitude.
  const risks = [
    { id: 'acme',     title: 'Supplier concentration · Acme',  L: 4, I: 5, x: 0.32, y: 0.32, priority: 'high', new: false },
    { id: 'hend',     title: 'Henderson scope creep',          L: 4, I: 4, x: 0.50, y: 0.22, priority: 'high', new: false },
    { id: 'cash',     title: 'Cashflow gap · Q3',              L: 3, I: 4, x: 0.66, y: 0.38, priority: 'medium', new: true },
    { id: 'agent',    title: 'Site-agent retention',           L: 3, I: 3, x: 0.20, y: 0.58, priority: 'medium', new: false },
    { id: 'cdm',      title: 'CDM compliance audit',           L: 2, I: 4, x: 0.82, y: 0.28, priority: 'medium', new: false },
    { id: 'ins',      title: 'Insurance renewal',              L: 2, I: 3, x: 0.74, y: 0.70, priority: 'low', new: false },
    { id: 'theft',    title: 'Plant theft · Lanark',           L: 3, I: 2, x: 0.40, y: 0.72, priority: 'low', new: false },
    { id: 'it',       title: 'IT systems ageing',              L: 2, I: 2, x: 0.16, y: 0.78, priority: 'low', new: false },
    { id: 'subkey',   title: 'Sub-contractor key-person',      L: 1, I: 3, x: 0.56, y: 0.62, priority: 'low', new: false },
  ];

  // Constellation lines: thematic links (supplier & scope, scope & cashflow)
  const links = [
    ['acme', 'hend'],
    ['hend', 'cash'],
    ['agent', 'theft'],
  ];

  const W = 720, H = 540; // plotting area dimensions
  const xy = (r) => ({ x: r.x * W, y: r.y * H });
  const byId = Object.fromEntries(risks.map(r => [r.id, r]));

  return (
    <div className="wow" style={{ width: 1280, height: 920, position: 'relative', overflow: 'hidden' }}>
      <WowAtmosphere />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <WowTopNav />

        <div style={{ padding: '48px 56px 0', display: 'flex', alignItems: 'center', gap: 24 }}>
          <WowEyebrow tone="gold">PROFILE / RISKS · 9 OPEN · 2 MITIGATED THIS MONTH</WowEyebrow>
        </div>

        <div style={{ padding: '20px 56px 0', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56, flex: 1 }}>
          {/* Constellation */}
          <div>
            <h1 className="serif-display" style={{ fontSize: 48, fontWeight: 200, color: 'var(--w-ink)', margin: '0 0 8px', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              The risk sky.
            </h1>
            <p className="serif-text" style={{ fontSize: 17, color: 'var(--w-ink-3)', margin: '0 0 32px', maxWidth: 540, fontStyle: 'italic' }}>
              Each star is a risk. Brighter and larger means it matters more. Lines suggest where one might pull another.
            </p>

            {/* Plot area */}
            <div style={{ position: 'relative', width: W, height: H }}>
              {/* Atmospheric haze */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse 70% 50% at 40% 35%, rgba(232,112,96,.10) 0%, transparent 60%)',
                pointerEvents: 'none', borderRadius: 12,
              }} />

              {/* SVG lines */}
              <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {links.map(([a, b], i) => {
                  const A = xy(byId[a]), B = xy(byId[b]);
                  return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(255,247,230,.18)" strokeWidth="1" strokeDasharray="2 4" />;
                })}
              </svg>

              {/* Stars */}
              {risks.map(r => {
                const p = xy(r);
                const score = r.L * r.I;
                const size = 5 + (score / 25) * 14;
                const glow = 4 + score * 0.6;
                const color = r.priority === 'high' ? 'var(--w-danger)' : r.priority === 'medium' ? 'var(--w-warning)' : 'var(--w-ink-2)';
                const glowColor = r.priority === 'high' ? 'rgba(232,112,96,.55)' : r.priority === 'medium' ? 'rgba(212,168,101,.45)' : 'rgba(255,247,230,.3)';
                return (
                  <React.Fragment key={r.id}>
                    {/* Halo */}
                    <div style={{
                      position: 'absolute',
                      left: p.x - 28, top: p.y - 28,
                      width: 56, height: 56, borderRadius: '50%',
                      background: `radial-gradient(circle, ${glowColor} 0%, transparent 60%)`,
                      animation: 'wow-twinkle 4s ease-in-out infinite',
                      animationDelay: `${r.x * 2}s`,
                    }} />
                    {/* Star */}
                    <div style={{
                      position: 'absolute',
                      left: p.x - size / 2, top: p.y - size / 2,
                      width: size, height: size, borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 ${glow}px ${glowColor}, 0 0 ${glow * 2}px ${glowColor}`,
                    }} />
                    {/* Label */}
                    <div style={{
                      position: 'absolute',
                      left: p.x + size / 2 + 12, top: p.y - 8,
                      fontSize: 12, color: 'var(--w-ink-2)',
                      fontFamily: 'var(--w-text)', fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                    }}>{r.title}</div>
                    {r.new && (
                      <div style={{
                        position: 'absolute',
                        left: p.x + size / 2 + 12, top: p.y + 8,
                        fontSize: 9, color: 'var(--w-gold)', letterSpacing: '0.18em', textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}>new this month</div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 24, fontSize: 11, color: 'var(--w-ink-3)', marginTop: 24, letterSpacing: '0.06em' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--w-danger)', boxShadow: '0 0 6px var(--w-danger)' }} />HIGH
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--w-warning)', boxShadow: '0 0 6px var(--w-warning)' }} />MEDIUM
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--w-ink-2)' }} />LOW / ACCEPTED
              </span>
              <span style={{ marginLeft: 'auto', fontStyle: 'italic', fontFamily: 'var(--w-text)' }}>Tap any star to expand</span>
            </div>
          </div>

          {/* Right rail — top three */}
          <div>
            <WowEyebrow tone="teal" style={{ marginBottom: 16 }}>WORTH ATTENTION · TOP THREE</WowEyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {risks.slice(0, 3).map((r, i) => (
                <div key={r.id} className="wow-glass" style={{ borderRadius: 14, padding: '18px 20px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: r.priority === 'high' ? 'var(--w-danger)' : 'var(--w-warning)' }}>
                      {r.priority}
                    </div>
                    <div className="serif-display" style={{ fontSize: 24, color: 'var(--w-gold)', fontStyle: 'italic', lineHeight: 1 }}>{i + 1}</div>
                  </div>
                  <div className="serif-display" style={{ fontSize: 18, lineHeight: 1.22, color: 'var(--w-ink)', margin: '0 0 10px' }}>{r.title}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--w-ink-3)' }}>
                    L {r.L} · I {r.I} · {12 - i * 3}D AGO
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 16, fontSize: 13 }}>See all nine →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   04 · The four agents — together
   ────────────────────────────────────────────────────────────────── */
function WOW_Agents() {
  const team = [
    { agent: 'george', name: 'George',  role: 'Your check-in.\nWarm, daily.',           role2: 'family GP register' },
    { agent: 'margot', name: 'Margot',  role: 'Strategy.\nThe long view.',              role2: 'ambitious, gold' },
    { agent: 'iain',   name: 'Iain',    role: 'Risk.\nThe weight of what could go wrong.', role2: 'serious, indigo' },
    { agent: 'priya',  name: 'Priya',   role: 'Digital & AI.\nThe future, quietly.',    role2: 'modern, mint' },
  ];

  return (
    <div className="wow" style={{ width: 1280, height: 900, position: 'relative', overflow: 'hidden' }}>
      <WowAtmosphere />
      <div style={{ position: 'relative', zIndex: 1, padding: '64px 80px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <WowEyebrow tone="gold">YOUR ADVISORS · FOUR VOICES, ONE PRESENCE</WowEyebrow>
        <h1 className="serif-display" style={{ fontSize: 64, fontWeight: 200, color: 'var(--w-ink)', margin: '16px 0 8px', lineHeight: 1.02, letterSpacing: '-0.025em', maxWidth: 720 }}>
          The team you can call on.
        </h1>
        <p className="serif-text" style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--w-ink-3)', margin: '0 0 56px', maxWidth: 580, fontWeight: 300 }}>
          George leads. The others join when the conversation reaches their part of the business. You don't choose between them; the room re-arranges itself.
        </p>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {team.map((t, i) => (
            <div key={t.agent} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ marginBottom: 24, transform: i === 0 ? 'scale(1.06)' : 'scale(1)' }}>
                <WowOrb agent={t.agent} state="idle" size={170} glow={0.9} />
              </div>
              <div className="serif-display" style={{ fontSize: 32, color: 'var(--w-ink)', margin: '0 0 12px', letterSpacing: '-0.015em' }}>{t.name}</div>
              <div className="serif-text" style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--w-ink-2)', whiteSpace: 'pre-line', fontStyle: 'italic', marginBottom: 12, maxWidth: 220 }}>
                {t.role}
              </div>
              <div className="eyebrow" style={{ color: 'var(--w-ink-4)' }}>{t.role2}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   05 · Board pack — cinematic cover
   ────────────────────────────────────────────────────────────────── */
function WOW_BoardCover() {
  return (
    <div className="wow" style={{ width: 1280, height: 900, position: 'relative', overflow: 'hidden' }}>
      <WowAtmosphere />
      {/* Extra atmospheric flair — large radial gold glow lower right */}
      <div style={{
        position: 'absolute', right: -200, bottom: -200, width: 800, height: 800,
        background: 'radial-gradient(circle, rgba(212,168,101,.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <WowTopNav />

        <div style={{ flex: 1, padding: '0 96px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <WowEyebrow tone="gold" style={{ marginBottom: 28 }}>EDITION 04 · MAY 2026 · FOR SARAH MCTAGGART</WowEyebrow>

          <h1 className="serif-display" style={{ fontSize: 144, fontWeight: 200, lineHeight: 0.92, margin: '0 0 24px', color: 'var(--w-ink)', letterSpacing: '-0.04em' }}>
            Where the<br/>
            <span style={{ fontStyle: 'italic', color: 'var(--w-gold)', fontWeight: 200 }}>business</span> stands
          </h1>

          <hr className="wow-divider-short" style={{ margin: '32px 0', width: 120 }} />

          <p className="serif-display" style={{ fontSize: 22, lineHeight: 1.5, color: 'var(--w-ink-2)', maxWidth: 540, margin: 0, fontStyle: 'italic', fontWeight: 300 }}>
            A monthly read with George,<br/>your fractional advisor.
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 48, alignItems: 'center' }}>
            <button className="btn btn-light">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Begin the walkthrough · 9 min
            </button>
            <button className="btn btn-ghost">or read it yourself →</button>
          </div>

          {/* Small ambient orb */}
          <div style={{ position: 'absolute', right: 64, top: '50%', transform: 'translateY(-50%)' }}>
            <WowOrb agent="george" state="idle" size={200} glow={0.85} />
          </div>
        </div>

        {/* TOC strip */}
        <div style={{ padding: '24px 96px 32px', borderTop: '0.5px solid var(--w-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--w-ink-3)', letterSpacing: '0.08em' }}>
          <div style={{ display: 'flex', gap: 40 }}>
            {['01 The Headline','02 Strategy','03 Opportunity','04 How you run things','05 The conversation'].map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <span className="mono">18 PAGES</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   06 · Board pack — interior spread
   ────────────────────────────────────────────────────────────────── */
function WOW_BoardSpread() {
  return (
    <div className="wow" style={{ width: 1280, minHeight: 1100, position: 'relative', overflow: 'hidden' }}>
      <WowAtmosphere />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        <WowTopNav />
        {/* Progress hairline */}
        <div style={{ height: 1, background: 'var(--w-hairline)' }}>
          <div style={{ width: '18%', height: 1, background: 'var(--w-gold)', boxShadow: '0 0 8px var(--w-gold-glow)' }} />
        </div>

        <div style={{ padding: '80px 80px 200px', display: 'grid', gridTemplateColumns: '180px 1fr', gap: 56 }}>
          {/* Left margin — section marker */}
          <div style={{ paddingTop: 12 }}>
            <div className="serif-display" style={{ fontSize: 80, color: 'var(--w-gold)', fontStyle: 'italic', lineHeight: 1, fontWeight: 200 }}>01</div>
            <div style={{ marginTop: 8 }} className="eyebrow eyebrow-gold">THE HEADLINE</div>
            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--w-ink-4)', lineHeight: 1.6 }}>
              Reading time<br/>
              <span className="mono" style={{ color: 'var(--w-ink-2)' }}>2 min 14 sec</span>
            </div>
          </div>

          <div style={{ maxWidth: 680 }}>
            <h1 className="serif-display" style={{ fontSize: 64, fontWeight: 200, lineHeight: 1.02, color: 'var(--w-ink)', margin: '0 0 16px', letterSpacing: '-0.028em' }}>
              Where we are<br/>this month.
            </h1>
            <div className="serif-display" style={{ fontSize: 22, lineHeight: 1.45, color: 'var(--w-gold)', fontWeight: 300, fontStyle: 'italic', marginBottom: 48 }}>
              A quietly significant month — pricing discipline is the conversation we need to have.
            </div>
            <hr className="wow-divider-short" style={{ margin: '0 0 48px' }} />

            <p className="serif-text dropcap" style={{ fontSize: 20, lineHeight: 1.7, color: 'var(--w-ink)', margin: '0 0 28px', fontWeight: 300 }}>
              April was the month the Henderson contract finally moved from a possibility to a commitment, and that single change has reshaped almost every line of this read. Three risks moved up the register, one strategic objective slipped from "on track" to "at risk", and Priya's maturity scores nudged operational up to a 3.
            </p>

            <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.7, color: 'var(--w-ink-2)', margin: '0 0 24px', fontWeight: 300 }}>
              The headline number is margin. The Henderson scope was won at a price that, on close reading, has eroded our blended margin by 1.4 points across the quarter. It is not catastrophic — but the pattern of the last three wins suggests this is becoming the norm.
            </p>

            <blockquote style={{
              margin: '48px 0',
              padding: '40px 0',
              borderTop: '0.5px solid var(--w-hairline-2)',
              borderBottom: '0.5px solid var(--w-hairline-2)',
              textAlign: 'center', position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--w-display)', fontSize: 64, color: 'var(--w-gold)', fontWeight: 200, lineHeight: 1, background: 'var(--w-void)', padding: '0 16px', textShadow: '0 0 24px var(--w-gold-glow)' }}>“</div>
              <div className="serif-display" style={{ fontSize: 32, lineHeight: 1.35, color: 'var(--w-ink)', fontStyle: 'italic', fontWeight: 200, letterSpacing: '-0.01em' }}>
                We made a deliberate decision in March to focus on the social housing pipeline. That's started to pay off.
              </div>
              <div style={{ marginTop: 20, fontSize: 11, color: 'var(--w-ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                — Your session, 14 April
              </div>
            </blockquote>

            <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.7, color: 'var(--w-ink-2)', margin: '0 0 24px', fontWeight: 300 }}>
              On risk, the supplier concentration with Acme is now the single largest exposure we're tracking. Iain has drafted a mitigation — it sits on your register, ready for a ten-minute conversation when you have one.
            </p>

            <div style={{ marginTop: 96, textAlign: 'center' }}>
              <div className="serif-display" style={{ fontSize: 14, color: 'var(--w-gold)' }}>◆ ◆ ◆</div>
            </div>
          </div>
        </div>

        {/* Walkthrough orb floating */}
        <div className="wow-glass-heavy" style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          padding: '12px 24px 12px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <WowOrb agent="george" state="speaking" size={56} glow={0.9} />
          <div>
            <div style={{ fontSize: 10, color: 'var(--w-ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>George is reading</div>
            <div className="serif-text" style={{ fontSize: 14, color: 'var(--w-ink)', fontStyle: 'italic' }}>Section 01 · The Headline</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--w-hairline-2)', margin: '0 4px' }} />
          <button className="btn btn-ghost" style={{ padding: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
          </button>
          <button className="btn btn-ghost" style={{ padding: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WOW_Constellation, WOW_Agents, WOW_BoardCover, WOW_BoardSpread });
