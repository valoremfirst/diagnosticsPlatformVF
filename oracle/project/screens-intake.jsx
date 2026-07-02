/* screens-intake.jsx — Intake & first contact */

const { Orb, Eyebrow, TopNav, CardOfTheMoment } = window;

function AB_Intake() {
  return (
    <div className="oracle" style={{ width: 1280, height: 800, background: 'var(--color-bg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '32px 48px', display: 'flex', alignItems: 'center' }}>
        <div className="wordmark" style={{ fontSize: 20 }}>oracle</div>

        {/* Progress hint: tiny serifed dots */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-ink-3)' }}>
          <span className="serif-display" style={{ fontStyle: 'italic', color: 'var(--color-teal)' }}>02</span>
          <span style={{ color: 'var(--color-ink-muted)' }}>/ 05</span>
          <span style={{ marginLeft: 8, color: 'var(--color-ink-muted)' }}>setting up</span>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '32%', left: 0, right: 0, padding: '0 80px', textAlign: 'center' }}>
        <Eyebrow style={{ marginBottom: 20 }}>QUESTION TWO</Eyebrow>
        <div className="serif-display" style={{ fontSize: 48, fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1, letterSpacing: '-0.025em', maxWidth: 760, margin: '0 auto' }}>
          What does your business do?
        </div>

        <div style={{ maxWidth: 640, margin: '64px auto 0', position: 'relative' }}>
          <input
            type="text"
            defaultValue="Construction subcontracting — social housing"
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent', textAlign: 'center',
              fontFamily: 'var(--font-text)',
              fontSize: 24, color: 'var(--color-ink)',
              padding: '12px 0',
              borderBottom: '1px solid var(--color-line-strong)',
            }}
            readOnly
          />
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: -1, width: 260, height: 1, background: 'var(--color-teal)' }} />
        </div>

        <div className="serif-text" style={{ fontSize: 15, color: 'var(--color-ink-3)', marginTop: 24, fontStyle: 'italic' }}>
          A sector or two is plenty. We'll get to specifics later.
        </div>
      </div>

      <div style={{ position: 'absolute', right: 64, bottom: 56, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-ink-2)', fontSize: 14 }}>
        Continue
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </div>
      <div style={{ position: 'absolute', left: 64, bottom: 56, fontSize: 14, color: 'var(--color-ink-3)' }}>← Back</div>
    </div>
  );
}

function AB_FirstContact() {
  return (
    <div className="oracle" style={{ width: 1280, height: 800, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <TopNav businessName="McTaggart Construction" initials="SM" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px', textAlign: 'center', position: 'relative' }}>
        <div style={{ marginBottom: 56, marginTop: -40 }}>
          <Orb agent="george" state="idle" size={220} />
        </div>

        <div style={{ maxWidth: 580 }}>
          <Eyebrow>WELCOME</Eyebrow>
          <div className="serif-display" style={{ fontSize: 44, fontWeight: 400, margin: '20px 0 24px', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            It's good to meet you, Sarah.
          </div>
          <div className="serif-text" style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-ink-2)', fontWeight: 300 }}>
            I'm George. When you're ready, we'll spend thirty minutes or so getting to know each other and your business.
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" style={{ padding: '14px 24px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Start our first conversation
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 14 }}>Not now, I'll come back later</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AB_Intake, AB_FirstContact });
