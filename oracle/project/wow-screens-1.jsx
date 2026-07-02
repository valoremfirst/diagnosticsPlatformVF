/* wow-screens.jsx — "The Observatory" direction
   Dark, cinematic, atmospheric. The orb as luminous presence.
*/

const { WowOrb } = window;

/* Atmospheric backdrop helper */
function WowAtmosphere() {
  return (
    <>
      <div className="wow-atmosphere" />
      <div className="wow-stars" />
    </>
  );
}

function WowEyebrow({ children, tone = '', style }) {
  const cls = "eyebrow" + (tone === 'teal' ? " eyebrow-light" : tone === 'gold' ? " eyebrow-gold" : "");
  return <div className={cls} style={style}>{children}</div>;
}

function WowTopNav({ tint = 'glass', business = 'McTaggart Construction', initials = 'SM' }) {
  return (
    <div style={{
      position: 'relative', zIndex: 10,
      height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 56px',
      borderBottom: '0.5px solid var(--w-hairline)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--w-teal)', boxShadow: '0 0 12px var(--w-teal-glow)' }} />
        <div style={{ fontFamily: 'var(--w-display)', fontSize: 22, fontWeight: 300, letterSpacing: '-0.01em', color: 'var(--w-ink)' }}>oracle</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, color: 'var(--w-ink-3)' }}>
        <span style={{ fontFamily: 'var(--w-text)', fontStyle: 'italic' }}>{business}</span>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--w-glass-2)', border: '0.5px solid var(--w-hairline)',
          color: 'var(--w-ink-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
        }}>{initials}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   00 · The thesis
   ────────────────────────────────────────────────────────────────── */
function WOW_Thesis() {
  return (
    <div className="wow" style={{ width: 1280, padding: '88px 96px 96px', position: 'relative', overflow: 'hidden' }}>
      <WowAtmosphere />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--w-display)', fontSize: 18, color: 'var(--w-gold)', fontStyle: 'italic' }}>00</div>
          <WowEyebrow tone="gold">A NEW DIRECTION · "THE OBSERVATORY"</WowEyebrow>
        </div>
        <h1 className="serif-display" style={{ fontSize: 88, lineHeight: 0.98, margin: '0 0 32px', letterSpacing: '-0.035em', color: 'var(--w-ink)' }}>
          What if the orb<br/>
          <span style={{ fontStyle: 'italic', color: 'var(--w-gold)' }}>were the room?</span>
        </h1>
        <hr className="wow-divider-short" style={{ margin: '0 0 36px' }} />

        <p className="serif-text dropcap" style={{ fontSize: 22, lineHeight: 1.6, color: 'var(--w-ink)', margin: '0 0 24px', fontWeight: 300 }}>
          The other direction is a magazine. This one is a planetarium. Same orb, same agents, same editorial register — but pulled into a darker, deeper, more atmospheric world where the orb feels like a real luminous presence and the content materialises in its light.
        </p>

        <p className="serif-text" style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--w-ink-2)', margin: '0 0 22px' }}>
          The risk register becomes a constellation. The board pack opens like a film. Glass surfaces refract the orb's light. Type becomes large and confident, written as if onto night sky. Chrome almost disappears. What remains is conversation, light, and the editorial pages George has written for you.
        </p>

        <p className="serif-text" style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--w-ink-3)', margin: 0, fontStyle: 'italic' }}>
          Six artboards below. Read them as a single experience, not as alternates.
        </p>

        <div style={{ marginTop: 56, display: 'flex', gap: 56, color: 'var(--w-ink-3)', fontSize: 12 }}>
          {[['Atmosphere', 'midnight teal'], ['Light', 'gold + cyan'], ['Surfaces', 'frosted glass'], ['Type', 'large serif'], ['Charts', 'constellations']].map(([k, v]) => (
            <div key={k}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>{k}</div>
              <div className="serif-text" style={{ fontSize: 14, color: 'var(--w-ink-2)', fontStyle: 'italic' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Small ambient orb in corner */}
      <div style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.7 }}>
        <WowOrb agent="george" state="idle" size={260} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   01 · The Canvas — Hero
   ────────────────────────────────────────────────────────────────── */
function WOW_Hero() {
  return (
    <div className="wow" style={{ width: 1280, height: 900, position: 'relative', overflow: 'hidden' }}>
      <WowAtmosphere />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <WowTopNav />

        {/* Hero stage */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
          {/* Orb backdrop */}
          <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
            <WowOrb agent="george" state="idle" size={380} />
          </div>

          {/* Greeting text — wraps the orb */}
          <div style={{ position: 'absolute', top: 168, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
            <div className="serif-display" style={{ fontSize: 16, color: 'var(--w-gold)', fontStyle: 'italic', letterSpacing: '0.06em', marginBottom: 12 }}>good morning, Sarah</div>
          </div>

          {/* Headline below orb */}
          <div style={{ position: 'absolute', top: 540, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
            <h1 className="serif-display" style={{ fontSize: 52, fontWeight: 200, margin: 0, lineHeight: 1.05, color: 'var(--w-ink)', letterSpacing: '-0.02em' }}>
              A quiet morning.
            </h1>
            <h1 className="serif-display" style={{ fontSize: 52, fontWeight: 200, margin: '4px 0 0', lineHeight: 1.05, color: 'var(--w-ink-3)', letterSpacing: '-0.02em', fontStyle: 'italic' }}>
              Worth a word about supplier risk?
            </h1>
          </div>

          {/* Card of the moment — glass */}
          <div className="wow-glass-heavy" style={{
            position: 'absolute', bottom: 88, left: '50%', transform: 'translateX(-50%)',
            width: 720, borderRadius: 24, padding: 32,
            zIndex: 3,
            animation: 'wow-fade-in-up 800ms cubic-bezier(.22,1,.36,1) 200ms both',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <div style={{ flex: 1 }}>
                <WowEyebrow tone="teal" style={{ marginBottom: 12 }}>GEORGE · TWELVE DAYS SINCE WE TALKED</WowEyebrow>
                <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--w-ink)', margin: 0 }}>
                  Iain's been thinking about the Acme exposure — there's nothing urgent, but the Henderson contract changed the picture. Whenever you have ten minutes, I'd like to talk it through.
                </p>
              </div>
              <button className="btn btn-light" style={{ flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Begin
              </button>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--w-ink-3)', letterSpacing: '0.2em', textTransform: 'uppercase', zIndex: 3 }}>
            <span>scroll for the constellation</span>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 2v10M2 9l3 3 3-3"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   02 · Voice-active session
   ────────────────────────────────────────────────────────────────── */
function WOW_Voice() {
  return (
    <div className="wow" style={{ width: 1280, height: 900, position: 'relative', overflow: 'hidden' }}>
      <WowAtmosphere />
      {/* Extra glow concentrated where orb sits */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 1000, height: 1000, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,143,196,.12) 0%, rgba(123,143,196,.04) 30%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <WowTopNav />

        {/* Recording indicator top */}
        <div style={{ position: 'absolute', top: 96, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'var(--w-glass-2)', borderRadius: 999, border: '0.5px solid var(--w-hairline)', backdropFilter: 'blur(20px)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--w-iain)', boxShadow: '0 0 8px var(--w-iain)', animation: 'wow-twinkle 1.4s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--w-ink-2)' }}>Iain is speaking · 04:18</span>
          </div>
        </div>

        {/* Orb */}
        <div style={{ position: 'absolute', top: 240, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
          <WowOrb agent="iain" state="speaking" size={300} />
        </div>

        {/* Live transcript — center */}
        <div style={{ position: 'absolute', bottom: 240, left: 0, right: 0, textAlign: 'center', padding: '0 120px', zIndex: 3 }}>
          <div className="serif-text" style={{ fontSize: 15, color: 'var(--w-ink-3)', fontStyle: 'italic', opacity: 0.6, marginBottom: 24 }}>
            "What's keeping you up at night about the Henderson contract?"
            <div style={{ fontSize: 11, fontStyle: 'normal', marginTop: 4, fontFamily: 'var(--w-ui)', letterSpacing: '0.1em', color: 'var(--w-ink-4)' }}>IAIN · 11:24</div>
          </div>
          <div className="serif-display" style={{ fontSize: 32, lineHeight: 1.35, color: 'var(--w-ink)', fontWeight: 300, fontStyle: 'italic', maxWidth: 880, margin: '0 auto' }}>
            "…so the supplier concentration is real, but it's not new. It's been like this for two years."
          </div>
          <div style={{ fontSize: 11, fontStyle: 'normal', marginTop: 12, fontFamily: 'var(--w-ui)', letterSpacing: '0.1em', color: 'var(--w-ink-4)' }}>SARAH · 11:25</div>
        </div>

        {/* Peripheral magic — a risk crystallising */}
        <div className="wow-glass" style={{
          position: 'absolute', right: 56, top: 200, width: 280,
          borderRadius: 16, padding: '20px 22px',
          zIndex: 3, borderLeft: '2px solid var(--w-iain)',
          animation: 'wow-fade-in-up 600ms cubic-bezier(.22,1,.36,1) both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--w-iain)', boxShadow: '0 0 6px var(--w-iain)' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--w-iain)' }}>Iain added a risk</span>
          </div>
          <div className="serif-display" style={{ fontSize: 18, lineHeight: 1.2, color: 'var(--w-ink)', margin: '0 0 8px' }}>
            Supplier concentration
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--w-ink-3)' }}>
            L 4 · I 5 · HIGH PRIORITY
          </div>
        </div>

        {/* Controls — bottom */}
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, zIndex: 3 }}>
          <button className="btn btn-glass">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
            Muted
          </button>
          <button className="btn btn-glass">End session</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WowAtmosphere, WowEyebrow, WowTopNav, WOW_Thesis, WOW_Hero, WOW_Voice });
