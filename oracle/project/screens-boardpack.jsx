/* screens-boardpack.jsx — Board pack cover, headline, exhibit slope chart */

const { Orb, Eyebrow, TopNav } = window;

function AB_BoardPack_Cover() {
  return (
    <div className="oracle" style={{ width: 1280, height: 900, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Magazine masthead — heavy + hairline rule */}
      <div style={{ padding: '32px 80px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="wordmark" style={{ fontSize: 36, letterSpacing: '-0.02em' }}>oracle</div>
          <div style={{ display: 'flex', gap: 48, alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <div className="marginalia" style={{ marginBottom: 4 }}>EDITION</div>
              <div className="folio-small" style={{ fontSize: 28 }}>No. 04</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="marginalia" style={{ marginBottom: 4 }}>MONTH</div>
              <div className="folio-small" style={{ fontSize: 28 }}>May ’26</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="marginalia" style={{ marginBottom: 4 }}>FOR</div>
              <div className="folio-small" style={{ fontSize: 22, fontStyle: 'italic' }}>S. McTaggart</div>
            </div>
          </div>
        </div>
        <hr className="masthead-rule" />
        <hr className="masthead-rule-hair" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, color: 'var(--color-ink-3)', fontSize: 11, letterSpacing: '0.08em' }}>
          <span>A MONTHLY READ · BY GEORGE, YOUR FRACTIONAL ADVISOR</span>
          <span className="mono">18 PAGES · 9 MIN WALKTHROUGH</span>
        </div>
      </div>

      {/* Massive folio number in corner */}
      <div style={{ position: 'absolute', right: 64, top: 220, opacity: 1, pointerEvents: 'none', zIndex: 0 }}>
        <div className="folio" style={{ fontSize: 380, opacity: 0.08 }}>05</div>
      </div>

      {/* Headline composition */}
      <div style={{ flex: 1, padding: '64px 80px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 880 }}>
          <Eyebrow teal>THE HEADLINE</Eyebrow>
          <h1 className="serif-display" style={{ fontSize: 108, fontWeight: 400, lineHeight: 0.96, margin: '20px 0 24px', letterSpacing: '-0.035em' }}>
            Where the<br/>
            <span style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--color-teal)' }}>business</span> stands
          </h1>
          <div className="ornament-rule" style={{ maxWidth: 320, margin: '0 0 28px' }}>
            <span className="ornament-rule-icon">◆</span>
          </div>
          <p className="serif-display" style={{ fontSize: 22, lineHeight: 1.45, color: 'var(--color-ink-2)', maxWidth: 540, margin: 0, fontStyle: 'italic', fontWeight: 300 }}>
            A quietly significant month — pricing discipline is the conversation we need to have.
          </p>

          <div style={{ marginTop: 56, display: 'flex', gap: 16, alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 15 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Begin walkthrough
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 4 }}>Read it myself →</button>
          </div>
        </div>
      </div>

      {/* Footer TOC — magazine style */}
      <div style={{ padding: '24px 80px 32px', borderTop: '1px solid var(--color-line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 32 }}>
          {[
            ['01', 'The Headline', 'Pricing & margin'],
            ['02', 'Strategy', '4 objectives'],
            ['03', 'Opportunity', '4 open · 1 new'],
            ['04', 'How you run things', 'Risk & maturity'],
            ['05', 'The conversation', '18-min walkthrough'],
          ].map(([n, t, s]) => (
            <div key={n}>
              <div className="folio-small" style={{ fontSize: 18, marginBottom: 4 }}>{n}</div>
              <div className="serif-display" style={{ fontSize: 17, color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: 2 }}>{t}</div>
              <div className="note" style={{ fontSize: 12 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AB_BoardPack_Headline() {
  return (
    <div className="oracle" style={{ width: 1280, minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopNav glass />
      <div style={{ height: 1, background: 'var(--color-line)', position: 'relative' }}>
        <div style={{ width: '18%', height: 2, background: 'var(--color-teal)' }} />
      </div>

      {/* Full-bleed teal section opener */}
      <div className="oracle-teal-bg" style={{ padding: '40px 80px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -8, top: -40, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 280, lineHeight: 0.78, color: 'rgba(255,255,255,0.10)', fontWeight: 300, letterSpacing: '-0.03em', pointerEvents: 'none' }}>01</div>
        <div style={{ position: 'relative' }}>
          <div className="marginalia" style={{ color: 'rgba(255,255,255,0.7)' }}>SECTION ONE · THE HEADLINE</div>
          <h1 className="serif-display" style={{ fontSize: 64, fontWeight: 400, lineHeight: 1, margin: '12px 0 16px', letterSpacing: '-0.03em', color: '#FAFAF7' }}>
            Where we are<br/>this month.
          </h1>
          <div className="serif-display" style={{ fontSize: 22, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)', fontWeight: 300, fontStyle: 'italic', maxWidth: 540 }}>
            A quietly significant month — pricing discipline is the conversation we need to have.
          </div>
        </div>
      </div>

      {/* Editorial body — 3-column layout with marginalia rail */}
      <div style={{ flex: 1, padding: '64px 80px 200px', display: 'grid', gridTemplateColumns: '180px 1fr 200px', gap: 56 }}>
        {/* Left margin — running head */}
        <div style={{ paddingTop: 4 }}>
          <div className="marginalia" style={{ marginBottom: 14 }}>READING TIME</div>
          <div className="folio-small" style={{ fontSize: 30, marginBottom: 24 }}>2 : 14</div>
          <div className="marginalia" style={{ marginBottom: 14 }}>WRITTEN BY</div>
          <div className="serif-text" style={{ fontSize: 15, color: 'var(--color-ink-2)', marginBottom: 4, fontStyle: 'italic' }}>George</div>
          <div className="note" style={{ marginBottom: 24 }}>with Iain and Margot</div>
          <div className="marginalia" style={{ marginBottom: 14 }}>SOURCE</div>
          <div className="serif-text" style={{ fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.4 }}>Drawn from your conversations between 14 April and 12 May.</div>
        </div>

        {/* Main column */}
        <div>
          <p className="serif-text dropcap" style={{ fontSize: 20, lineHeight: 1.65, color: 'var(--color-ink)', margin: '0 0 28px' }}>
            April was the month the Henderson contract finally moved from a possibility to a commitment, and that single change has reshaped almost every line of this read. Three risks moved up the register, one strategic objective slipped from "on track" to "at risk", and Priya's maturity scores nudged operational up to a 3. Most of it is good news. Some of it is the price of growth.
          </p>

          <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.6, color: 'var(--color-ink)', margin: '0 0 24px' }}>
            The headline number is margin. The Henderson scope was won at a price that, on close reading, has eroded our blended margin by 1.4 points across the quarter. It is not catastrophic — but the pattern of the last three wins suggests this is becoming the norm, and Margot wants to make pricing discipline the focus of our next strategic conversation.
          </p>

          <blockquote style={{
            margin: '48px -24px',
            padding: '40px 56px',
            background: 'var(--color-surface-alt)',
            borderLeft: '3px solid var(--color-teal)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', left: 24, top: 4, fontFamily: 'var(--font-display)', fontSize: 80, color: 'var(--color-teal)', lineHeight: 1, fontStyle: 'italic', fontWeight: 300 }}>"</div>
            <div className="serif-display" style={{ fontSize: 30, lineHeight: 1.35, fontWeight: 300, color: 'var(--color-ink)', fontStyle: 'italic', letterSpacing: '-0.01em', marginLeft: 36 }}>
              We made a deliberate decision in March to focus on the social housing pipeline. That's started to pay off.
            </div>
            <div style={{ marginLeft: 36, marginTop: 16, fontSize: 12, color: 'var(--color-ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              — From your session, 14 April
            </div>
          </blockquote>

          <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.6, color: 'var(--color-ink)', margin: '0 0 24px' }}>
            On risk, the supplier concentration with Acme is now the single largest exposure we're tracking. Iain has drafted a mitigation — it sits on your register, ready for a ten-minute conversation when you have one. Cashflow into Q3 is also worth a look; the timing of the Henderson milestones leaves a narrower bridge than we'd like.
          </p>

          <div className="ornament-rule" style={{ margin: '64px 0 32px' }}>
            <span className="ornament-rule-icon">◆</span>
          </div>

          <div style={{ textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>
            CONTINUES OVERLEAF · STRATEGY
          </div>
        </div>

        {/* Right margin — pull stats */}
        <div style={{ paddingTop: 4 }}>
          <div style={{ marginBottom: 36 }}>
            <div className="folio-small" style={{ fontSize: 72, lineHeight: 0.9, color: 'var(--color-teal)' }}>–1.4<span style={{ fontSize: 24 }}>pts</span></div>
            <div className="marginalia" style={{ marginTop: 8, marginBottom: 4 }}>BLENDED MARGIN</div>
            <div className="note">vs Q1, against plan of +0.3</div>
          </div>
          <div style={{ marginBottom: 36 }}>
            <div className="folio-small" style={{ fontSize: 72, lineHeight: 0.9, color: 'var(--color-teal)' }}>3</div>
            <div className="marginalia" style={{ marginTop: 8, marginBottom: 4 }}>RISKS MOVED UP</div>
            <div className="note">Acme, Henderson scope, Q3 cashflow</div>
          </div>
          <div>
            <div className="folio-small" style={{ fontSize: 72, lineHeight: 0.9, color: 'var(--color-teal)' }}>64<span style={{ fontSize: 24 }}>%</span></div>
            <div className="marginalia" style={{ marginTop: 8, marginBottom: 4 }}>SUPPLIER CONCENTRATION</div>
            <div className="note">Acme's share of quarterly steel procurement</div>
          </div>
        </div>
      </div>

      {/* Walkthrough orb floating glass pill */}
      <div className="glass-heavy" style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        padding: '14px 24px 14px 14px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Orb agent="george" state="speaking" size={56} />
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-ui)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>George is reading</div>
          <div className="serif-text" style={{ fontSize: 15, color: 'var(--color-ink)', fontStyle: 'italic' }}>Section 01 · The Headline</div>
        </div>
        <div style={{ width: 1, height: 36, background: 'var(--color-line)', margin: '0 8px' }} />
        <button className="btn btn-tertiary" style={{ padding: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
        </button>
        <button className="btn btn-tertiary" style={{ padding: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
}

function AB_BoardPack_RiskChart() {
  const risks = [
    { label: 'Supplier concentration', then: 8,    now: 20, dir: 'up' },
    { label: 'Henderson scope creep',  then: 14,   now: 16, dir: 'up' },
    { label: 'Cashflow Q3',            then: null, now: 12, dir: 'new' },
    { label: 'Site agent retention',   then: 10,   now: 9,  dir: 'flat' },
    { label: 'CDM compliance audit',   then: 8,    now: 8,  dir: 'flat' },
    { label: 'Insurance renewal',      then: 12,   now: 6,  dir: 'down' },
  ];

  const W = 920, leftX = 320, rightX = 720;
  const top = 80, rowH = 50;

  const colorFor = (dir) => dir === 'up' || dir === 'new' ? 'var(--color-teal)' : dir === 'down' ? 'var(--color-success)' : 'var(--color-ink-3)';
  const maxScore = 25;
  const scoreToY = (s, i) => top + i * rowH + ((maxScore - s) / maxScore) * (rowH - 14);

  return (
    <div className="oracle" style={{ width: 1280, minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <TopNav glass />
      <div style={{ height: 1, background: 'var(--color-line)' }}>
        <div style={{ width: '64%', height: 1, background: 'var(--color-teal)' }} />
      </div>

      <div style={{ flex: 1, padding: '88px 80px 120px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 920, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="serif-display" style={{ fontSize: 18, color: 'var(--color-teal)', fontStyle: 'italic' }}>04</div>
            <Eyebrow style={{ color: 'var(--color-teal)' }}>/ HOW YOU RUN THINGS</Eyebrow>
          </div>
          <h1 className="serif-display" style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.1, margin: '20px 0 16px', letterSpacing: '-0.02em' }}>
            How the risk picture moved.
          </h1>
          <div className="serif-display" style={{ fontSize: 20, lineHeight: 1.45, color: 'var(--color-ink-2)', fontWeight: 300, fontStyle: 'italic', marginBottom: 32 }}>
            Six risks tracked. Three moved up since last month, one closed, one is new.
          </div>
          <hr className="divider-teal" style={{ marginBottom: 56 }} />

          <Eyebrow style={{ marginBottom: 24 }}>EXHIBIT · slope chart, last 30 days</Eyebrow>

          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-l)', padding: '32px 40px', boxShadow: 'var(--shadow-s)' }}>
            <svg width="100%" height={top + risks.length * rowH + 30} viewBox={`0 0 ${W} ${top + risks.length * rowH + 30}`} style={{ display: 'block', overflow: 'visible' }}>
              <text x={leftX} y={48} textAnchor="middle" style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fill: 'var(--color-ink-3)', letterSpacing: '0.12em' }}>A MONTH AGO</text>
              <text x={rightX} y={48} textAnchor="middle" style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fill: 'var(--color-ink-3)', letterSpacing: '0.12em' }}>NOW</text>
              <line x1={leftX - 60} y1={62} x2={leftX + 60} y2={62} stroke="var(--color-line-strong)" />
              <line x1={rightX - 60} y1={62} x2={rightX + 60} y2={62} stroke="var(--color-line-strong)" />

              {risks.map((r, i) => {
                const yT = scoreToY(r.then ?? r.now, i);
                const yN = scoreToY(r.now, i);
                const color = colorFor(r.dir);
                const dy = (yN - yT);
                return (
                  <g key={i}>
                    {/* Row label */}
                    <text x={leftX - 96} y={(yT + yN) / 2 + 4} textAnchor="end" style={{ fontFamily: 'var(--font-text)', fontSize: 15, fill: 'var(--color-ink)' }}>{r.label}</text>

                    {/* Slope line */}
                    {r.then !== null && (
                      <line x1={leftX + 6} y1={yT} x2={rightX - 6} y2={yN} stroke={color} strokeWidth={r.dir === 'flat' ? 0.8 : 1.6} strokeLinecap="round" />
                    )}
                    {r.then === null && (
                      <line x1={leftX + 6} y1={yN} x2={rightX - 6} y2={yN} stroke={color} strokeWidth="1.4" strokeDasharray="3 4" strokeLinecap="round" />
                    )}

                    {/* Left point */}
                    {r.then !== null
                      ? <circle cx={leftX} cy={yT} r="5" fill={color} />
                      : <text x={leftX} y={yN + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fill: 'var(--color-ink-muted)', fontStyle: 'italic' }}>new</text>}
                    {r.then !== null &&
                      <text x={leftX - 14} y={yT + 4} textAnchor="end" className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--color-ink-3)' }}>{r.then}</text>}

                    {/* Right point */}
                    <circle cx={rightX} cy={yN} r="6" fill={color} />
                    <text x={rightX + 16} y={yN + 4} className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--color-ink)' }}>{r.now}</text>

                    {/* Movement annotation */}
                    {r.dir === 'up' && r.then !== null && (
                      <text x={rightX + 50} y={yN + 4} style={{ fontFamily: 'var(--font-text)', fontSize: 12, fill: 'var(--color-teal)', fontStyle: 'italic' }}>↑ {r.now - r.then}</text>
                    )}
                    {r.dir === 'down' && (
                      <text x={rightX + 50} y={yN + 4} style={{ fontFamily: 'var(--font-text)', fontSize: 12, fill: 'var(--color-success)', fontStyle: 'italic' }}>↓ {r.then - r.now}</text>
                    )}
                    {r.dir === 'new' && (
                      <text x={rightX + 50} y={yN + 4} style={{ fontFamily: 'var(--font-text)', fontSize: 12, fill: 'var(--color-teal)', fontStyle: 'italic' }}>new</text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.65, color: 'var(--color-ink)', maxWidth: 680, margin: '48px auto 0' }}>
            The shape is what to read here. The supplier risk is now over twice the score it carried a month ago — not because the underlying probability changed, but because winning Henderson made the impact considerably worse. The honest version: this risk has been there for two years, and only now is it expensive enough to act on.
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AB_BoardPack_Cover, AB_BoardPack_Headline, AB_BoardPack_RiskChart });
