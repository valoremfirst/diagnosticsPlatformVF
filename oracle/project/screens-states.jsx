/* screens-states.jsx — Errors, Valorem-First handoff, toast, email */

const { Orb, Eyebrow, TopNav } = window;

function AB_VF_Handoff() {
  return (
    <div className="oracle" style={{ width: 1280, height: 900, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <TopNav />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 56 }}>
        <Orb agent="george" state="idle" size={200} />

        <div style={{ marginTop: 32, maxWidth: 680, width: '100%', padding: '0 32px' }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            padding: 40,
            boxShadow: 'var(--shadow-m)',
            position: 'relative',
            animation: 'fade-in-up var(--dur-slow) var(--ease-out) both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Eyebrow teal>A THOUGHT FROM GEORGE · HANDOFF</Eyebrow>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="1.5">
                <path d="M7 17 17 7M17 7H8M17 7v9"/>
              </svg>
            </div>

            <h2 className="serif-display" style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 400, margin: '12px 0 18px', letterSpacing: '-0.02em' }}>
              This is past where I can help on my own.
            </h2>

            <p className="serif-text" style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--color-ink-2)', margin: '0 0 24px' }}>
              The Henderson pricing question — and the framework bond capacity behind it — is genuinely the sort of thing worth a proper conversation with the Valorem First team. They've done two similar engagements with social housing subcontractors in the last year and would have specific patterns to share.
            </p>

            <div style={{ margin: '24px 0', padding: '20px 24px', background: 'var(--color-teal-bg)', borderRadius: 'var(--radius-m)', borderLeft: '3px solid var(--color-teal)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-teal)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>SUGGESTED ENGAGEMENT</div>
              <div className="serif-display" style={{ fontSize: 19, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                Two-day pricing &amp; bond capacity review
              </div>
              <div className="serif-text" style={{ fontSize: 14, color: 'var(--color-ink-2)', marginTop: 6, fontStyle: 'italic' }}>
                Glasgow · with the framework team · ~£8,500
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button className="btn btn-primary">Request a callback</button>
              <button className="btn btn-secondary">Tell me more first</button>
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--color-ink-3)', fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>
            Nothing happens without your nod. Your conversation history isn't shared until you ask us to.
          </div>
        </div>
      </div>
    </div>
  );
}

function AB_Errors_Toast() {
  return (
    <div className="oracle" style={{ width: 1280, minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <div style={{ padding: '56px 80px' }}>
        <Eyebrow>STATES · ERRORS, LOADING, NOTIFICATIONS</Eyebrow>
        <h1 className="serif-display" style={{ fontSize: 44, fontWeight: 400, margin: '14px 0 16px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          When things go quiet, or wrong.
        </h1>
        <p className="serif-text" style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--color-ink-2)', maxWidth: 620, fontWeight: 300 }}>
          No red error backgrounds. No "Oops!" No spinners. The orb desaturates; the copy stays warm; the user keeps their dignity.
        </p>
        <hr className="divider-teal" style={{ margin: '32px 0 56px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {/* Recoverable */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-l)', padding: 32, boxShadow: 'var(--shadow-s)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 420 }}>
            <Eyebrow style={{ alignSelf: 'flex-start' }}>A · RECOVERABLE</Eyebrow>
            <div style={{ margin: '32px 0 28px' }}>
              <Orb agent="george" state="error" size={130} />
            </div>
            <div className="serif-display" style={{ fontSize: 26, fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.01em' }}>Brief hiccup.</div>
            <p className="serif-text" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--color-ink-2)', margin: '0 0 24px' }}>
              We've lost connection for a moment. Trying to reconnect now.
            </p>
            <button className="btn btn-primary" style={{ padding: '10px 18px' }}>Try again</button>
          </div>

          {/* Generating */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-l)', padding: 32, boxShadow: 'var(--shadow-s)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 420 }}>
            <Eyebrow style={{ alignSelf: 'flex-start' }}>B · BOARD PACK GENERATING</Eyebrow>
            <div style={{ margin: '32px 0 28px' }}>
              <Orb agent="george" state="thinking" size={130} />
            </div>
            <div className="serif-display" style={{ fontSize: 26, fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.01em' }}>Drafting your May read…</div>
            <p className="serif-text" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--color-ink-3)', margin: '0 0 8px', fontStyle: 'italic' }}>
              George is reviewing the last four weeks.
            </p>
            <p className="serif-text" style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>About a minute.</p>
          </div>

          {/* Limit reached */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-l)', padding: 32, boxShadow: 'var(--shadow-s)', display: 'flex', flexDirection: 'column', minHeight: 420 }}>
            <Eyebrow>C · A BRIEF NOTE</Eyebrow>
            <div className="serif-display" style={{ fontSize: 26, fontWeight: 400, margin: '32px 0 16px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              We're approaching your trial limit.
            </div>
            <p className="serif-text" style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--color-ink-2)', margin: '0 0 24px', flex: 1 }}>
              You've had eight sessions this month. George will be back next month — or if you'd like more time now, we can extend.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <button className="btn btn-primary" style={{ padding: '10px 18px' }}>Request more sessions</button>
              <button className="btn btn-secondary">Wait until next month</button>
            </div>
          </div>
        </div>

        {/* Toast / pill */}
        <div style={{ marginTop: 56 }}>
          <Eyebrow>NOTIFICATION TOAST · heavy glass, floats above content</Eyebrow>
          <div style={{ marginTop: 16, position: 'relative', height: 140, background: 'linear-gradient(135deg, var(--color-teal-bg) 0%, var(--color-surface-alt) 70%)', borderRadius: 'var(--radius-l)', padding: 16, overflow: 'hidden' }}>
            <div className="glass-heavy" style={{
              position: 'absolute', left: 32, bottom: 32,
              padding: '14px 22px 14px 16px', borderRadius: 999,
              display: 'flex', alignItems: 'center', gap: 14,
              minWidth: 360,
            }}>
              <Orb agent="george" state="idle" size={36} />
              <div>
                <div className="serif-display" style={{ fontSize: 15, color: 'var(--color-ink)', fontStyle: 'italic' }}>Your May read is ready.</div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2 }}>Tap to walk through with George →</div>
              </div>
              <span style={{ flex: 1 }} />
              <button className="btn btn-tertiary" style={{ padding: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AB_Email() {
  return (
    <div className="oracle" style={{ width: 1280, minHeight: '100%', background: '#EDEAE4', padding: '64px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Eyebrow style={{ alignSelf: 'flex-start' }}>TRANSACTIONAL EMAIL · BOARD PACK READY</Eyebrow>
      <h1 className="serif-display" style={{ alignSelf: 'flex-start', fontSize: 40, fontWeight: 400, margin: '14px 0 16px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        It should feel like a letter, not a notification.
      </h1>
      <hr className="divider-teal" style={{ alignSelf: 'flex-start', margin: '0 0 56px' }} />

      {/* Email card */}
      <div style={{
        width: 600, background: 'var(--color-surface)', borderRadius: 'var(--radius-m)',
        boxShadow: '0 24px 60px rgba(26,26,26,0.10), 0 4px 12px rgba(26,26,26,0.06)',
        overflow: 'hidden',
      }}>
        {/* Email envelope strip */}
        <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-line)', background: 'var(--color-bg)', fontSize: 12, color: 'var(--color-ink-3)', fontFamily: 'var(--font-ui)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><span style={{ color: 'var(--color-ink-2)' }}>From:</span> George at Oracle &lt;george@oracle.valoremfirst.com&gt;</span>
            <span>Today, 7:02 am</span>
          </div>
          <div style={{ marginTop: 4 }}><span style={{ color: 'var(--color-ink-2)' }}>To:</span> Sarah McTaggart</div>
          <div style={{ marginTop: 4 }}><span style={{ color: 'var(--color-ink-2)' }}>Subject:</span> Your May read is ready</div>
        </div>

        <div style={{ padding: '40px 48px 48px' }}>
          <div className="wordmark" style={{ fontSize: 22, marginBottom: 28 }}>oracle</div>

          <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--color-ink)', margin: '0 0 18px' }}>
            Sarah,
          </p>
          <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--color-ink)', margin: '0 0 18px' }}>
            Your May read is finished. The short version: a quietly significant month — pricing discipline is the conversation I'd like to have with you when you've got time.
          </p>
          <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--color-ink)', margin: '0 0 18px' }}>
            I've drafted eighteen pages, but the headline is on the first one. Take five minutes when you can — and if you'd rather I read it with you, the walkthrough button is at the top.
          </p>
          <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--color-ink)', margin: '0 0 32px' }}>
            Yours,<br/>
            <span style={{ fontStyle: 'italic' }}>George</span>
          </p>

          <a href="#" style={{
            display: 'inline-block',
            background: 'var(--color-teal)',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: 'var(--radius-s)',
            textDecoration: 'none',
            fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
          }}>Open your May read →</a>

          <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--color-line)', fontSize: 12, color: 'var(--color-ink-3)', lineHeight: 1.6 }}>
            You're receiving this because Oracle drafts a monthly read for McTaggart Construction. <a href="#" style={{ color: 'var(--color-ink-2)' }}>Adjust how often →</a><br/>
            <span style={{ fontStyle: 'italic' }}>A Valorem First service.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AB_VF_Handoff, AB_Errors_Toast, AB_Email });
