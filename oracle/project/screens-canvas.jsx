/* screens-canvas.jsx — The Canvas: idle, voice-active, handoff, mobile */

const { Orb, Eyebrow, TopNav, CardOfTheMoment } = window;

function AB_Canvas_Idle() {
  return (
    <div className="oracle" style={{ width: 1280, height: 800, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <TopNav />

      {/* Left rail — running head */}
      <div style={{ position: 'absolute', left: 40, top: 120, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="marginalia">TUESDAY · 14 MAY · 09:42</div>
        <div className="note" style={{ maxWidth: 140 }}>Twelve days since you last spoke with George.</div>
      </div>

      {/* Right rail — recent context */}
      <div style={{ position: 'absolute', right: 40, top: 120, width: 200, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'right' }}>
        <div className="marginalia">RECENT CONVERSATIONS</div>
        <div>
          <div className="serif-text" style={{ fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.35 }}>Henderson contract</div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2, fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>2 May · 18 min</div>
        </div>
        <div>
          <div className="serif-text" style={{ fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.35 }}>Q1 margin review</div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2, fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>14 April · 32 min</div>
        </div>
        <div>
          <div className="serif-text" style={{ fontSize: 14, color: 'var(--color-ink-3)', lineHeight: 1.35 }}>Hiring plan</div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2, fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>28 March · 22 min</div>
        </div>
      </div>

      {/* Decorative folio behind orb */}
      <div style={{ position: 'absolute', left: '50%', top: 130, transform: 'translateX(-50%)', zIndex: 0 }}>
        <div className="folio" style={{ fontSize: 380, opacity: 0.06 }}>04</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 36, position: 'relative', zIndex: 2 }}>
        <Orb agent="george" state="idle" size={240} />

        <div style={{ marginTop: 24 }}>
          <CardOfTheMoment
            eyebrow="GEORGE'S CHECK-IN · 14 MAY"
            title="A quiet morning. Worth a quick word about supplier risk?"
            body={<>It's been twelve days since we talked. Iain's been thinking about the Acme exposure — there's nothing urgent, but the Henderson contract changed the picture. Whenever you have ten minutes, I'd like to talk it through.</>}
            primaryLabel={<><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:2}}><path d="M8 5v14l11-7z"/></svg>Talk to George</>}
            secondaryLabel="Not now"
          />
        </div>

        <div style={{ marginTop: 24, color: 'var(--color-ink-3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 32, height: 1, background: 'var(--color-line-strong)' }} />
          <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>scroll for your profile</span>
          <span style={{ width: 32, height: 1, background: 'var(--color-line-strong)' }} />
        </div>
      </div>
    </div>
  );
}

function AB_Canvas_Voice() {
  return (
    <div className="oracle" style={{ width: 1280, height: 800, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <TopNav />
      {/* Top progress hairline */}
      <div style={{ position: 'absolute', top: 64, left: 0, right: 0, height: 1, background: 'var(--color-line)' }}>
        <div style={{ width: '34%', height: '100%', background: 'var(--color-teal)' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Orb agent="iain" state="speaking" size={260} />

        {/* Transcript */}
        <div style={{ marginTop: 48, maxWidth: 720, textAlign: 'center' }}>
          <div className="serif-text" style={{ fontSize: 16, color: 'var(--color-ink-3)', fontStyle: 'italic', opacity: 0.55, marginBottom: 24 }}>
            "What's keeping you up at night about the Henderson contract?"
            <div style={{ marginTop: 4, color: 'var(--color-ink-muted)', fontSize: 12, fontStyle: 'normal', fontFamily: 'var(--font-ui)' }}>— Iain · 11:24</div>
          </div>
          <div className="serif-text" style={{ fontSize: 22, lineHeight: 1.5, color: 'var(--color-ink-2)', fontStyle: 'italic' }}>
            "...so the supplier concentration is real, but it's not new. It's been like this for two years."
            <div style={{ marginTop: 10, color: 'var(--color-ink-3)', fontSize: 13, fontStyle: 'normal', fontFamily: 'var(--font-ui)' }}>— Sarah · 11:25</div>
          </div>
        </div>

        {/* Peripheral magic — risk being added in periphery */}
        <div style={{
          position: 'absolute', right: 56, top: 80,
          background: 'var(--color-surface)',
          padding: '14px 18px 14px 22px',
          borderRadius: 'var(--radius-m)',
          boxShadow: 'var(--shadow-m)',
          width: 290,
          animation: 'fade-in-up 480ms var(--ease-out) both',
        }}>
          <div className="priority-bar priority-high" style={{ background: 'var(--color-iain-indigo)' }} />
          <Eyebrow teal style={{ fontSize: 10, color: 'var(--color-iain-indigo)' }}>IAIN ADDED A RISK</Eyebrow>
          <div className="serif-display" style={{ fontSize: 17, fontWeight: 400, margin: '6px 0 6px', lineHeight: 1.25 }}>
            Supplier concentration · Acme
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>
            L 4 · I 5 · high priority
          </div>
        </div>

        {/* Controls — bottom right */}
        <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', gap: 12 }}>
          <button className="btn btn-tertiary" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-s)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
          </button>
          <button className="btn btn-tertiary" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-s)' }}>End session</button>
        </div>
      </div>

      {/* Bottom subtitle/state row */}
      <div style={{ padding: '0 0 24px', textAlign: 'center', color: 'var(--color-ink-3)', fontSize: 13, fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>
        Iain is speaking
      </div>
    </div>
  );
}

function AB_Canvas_Handoff() {
  return (
    <div className="oracle" style={{ width: 1280, height: 800, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopNav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64, position: 'relative' }}>
          <div style={{ opacity: 0.42, transform: 'scale(0.85)' }}>
            <Orb agent="george" state="thinking" size={200} />
          </div>
          {/* connective line */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 80, height: 1, background: 'linear-gradient(90deg, var(--color-george-warm), var(--color-margot-gold))', opacity: 0.6 }} />
          <div>
            <Orb agent="margot" state="speaking" size={240} />
          </div>
        </div>

        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <Eyebrow teal>HANDOFF</Eyebrow>
          <div className="serif-display" style={{ fontSize: 22, color: 'var(--color-ink-2)', fontStyle: 'italic', fontWeight: 300, marginTop: 12 }}>
            Margot is joining…
          </div>
        </div>

        <div style={{ marginTop: 40, maxWidth: 620, textAlign: 'center' }}>
          <div className="serif-text" style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-ink-2)', fontStyle: 'italic' }}>
            "Three objectives sounds like four. What would have to be true for the housing pipeline to pay back inside twelve months?"
            <div style={{ marginTop: 10, color: 'var(--color-ink-3)', fontSize: 13, fontStyle: 'normal', fontFamily: 'var(--font-ui)' }}>— Margot · 11:38</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AB_Canvas_Mobile() {
  const { IOSDevice } = window;
  return (
    <div style={{ width: 430, height: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-alt)', padding: 14 }}>
      {/* Outer device titanium bezel */}
      <div style={{
        padding: 6,
        borderRadius: 54,
        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 8px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        <IOSDevice width={390} height={844}>
          <div className="oracle" style={{ width: 390, minHeight: 844, background: 'var(--color-bg)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Top nav — below status bar */}
            <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginTop: 47 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              <div className="wordmark" style={{ fontSize: 18 }}>oracle</div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-alt)', color: 'var(--color-ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500 }}>SM</div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
              <Orb agent="george" state="idle" size={160} />

              <div style={{ marginTop: -8, width: '100%', padding: '0 20px' }}>
                <div style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-l)',
                  padding: 22,
                  boxShadow: 'var(--shadow-m)',
                }}>
                  <Eyebrow teal style={{ fontSize: 10 }}>GEORGE'S CHECK-IN</Eyebrow>
                  <div className="serif-display" style={{ fontSize: 22, lineHeight: 1.22, fontWeight: 400, margin: '10px 0 12px', letterSpacing: '-0.01em' }}>
                    A quiet morning. Worth a quick word about supplier risk?
                  </div>
                  <div className="serif-text" style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--color-ink-2)' }}>
                    Iain's been thinking about the Acme exposure. Nothing urgent — ten minutes if you have it.
                  </div>
                  <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-ink)' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-ink-muted)' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-ink-muted)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action bar — subtle glass; sits above the home indicator */}
            <div className="glass-subtle" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '14px 20px 44px',
            }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>
                Tap to speak
              </button>
            </div>
          </div>
        </IOSDevice>
      </div>
    </div>
  );
}

Object.assign(window, { AB_Canvas_Idle, AB_Canvas_Voice, AB_Canvas_Handoff, AB_Canvas_Mobile });
