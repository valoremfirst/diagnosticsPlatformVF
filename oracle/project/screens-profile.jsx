/* screens-profile.jsx — Strategy, Risks, Opportunities, Maturity */

const { Orb, Eyebrow, TopNav, ProfileNav, DotScale, ArtboardHeader } = window;

function AB_Profile_Strategy() {
  const objectives = [
    { horizon: '12-month', title: 'Build a repeatable social housing pipeline', status: 'on track', summary: 'Three framework applications in train. Two RFTs out for delivery in Q3.', by: 'Margot', days: 12 },
    { horizon: '12-month', title: 'Lift average margin to 14%',                  status: 'at risk',  summary: "Henderson scope erosion is dragging the blended number. Margot wants to revisit pricing discipline.", by: 'Margot', days: 6 },
    { horizon: '3-year',   title: 'Move from subcontract to principal contractor on 30% of work', status: 'on track', summary: 'Two early conversations with frameworks. Insurance and bonding capacity are the limiting factors.', by: 'Margot', days: 18 },
    { horizon: '3-year',   title: 'Open a Glasgow-East delivery hub',            status: 'off track', summary: 'Plant lead times have pushed any move beyond next financial year. Held but downgraded.', by: 'Margot', days: 24 },
  ];

  const statusColor = (s) => s === 'on track' ? 'var(--color-success)' : s === 'at risk' ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div className="oracle" style={{ width: 1280, minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <TopNav />
      <ProfileNav active="strategy" />
      <div style={{ height: 1, background: 'var(--color-line)' }} />

      <div style={{ position: 'absolute', right: -20, top: 130, pointerEvents: 'none', zIndex: 0 }}>
        <div className="folio">01</div>
      </div>

      <div style={{ padding: '64px 80px', position: 'relative', zIndex: 1 }}>
        <ArtboardHeader
          folio="01"
          section="STRATEGY · 4 OBJECTIVES · WHERE YOU'RE TRYING TO TAKE THE BUSINESS"
          title="The shape of the"
          accent="next three years."
          lede="Margot reviewed these with you on 14 April. Two are tracking; one needs a pricing conversation; one we've quietly downgraded."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', columnGap: 32, rowGap: 0 }}>
          {objectives.map((o, i) => (
            <React.Fragment key={i}>
              <div style={{ paddingTop: 32 }}>
                <Eyebrow>{o.horizon.toUpperCase()}</Eyebrow>
              </div>
              <div style={{ padding: '32px 0', borderTop: '1px solid var(--color-line)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 12 }}>
                  <h3 className="serif-display" style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.2, margin: 0, letterSpacing: '-0.015em', flex: 1 }}>{o.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-ink-2)', whiteSpace: 'nowrap', paddingTop: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(o.status) }} />
                    {o.status}
                  </div>
                </div>
                <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--color-ink-2)', margin: '0 0 12px', maxWidth: 720 }}>{o.summary}</p>
                <div style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                  Reviewed with {o.by} · {o.days} days ago
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function AB_Profile_Risks() {
  const risks = [
    { id: 1, title: 'Supplier concentration · Acme Materials', L: 4, I: 5, priority: 'high', rank: 1 },
    { id: 2, title: 'Henderson scope creep',                   L: 4, I: 4, priority: 'high', rank: 2 },
    { id: 3, title: 'Cashflow gap Q3',                         L: 3, I: 4, priority: 'medium', rank: 3 },
    { id: 4, title: 'Site agent retention',                    L: 3, I: 3, priority: 'medium' },
    { id: 5, title: 'CDM compliance audit',                    L: 2, I: 4, priority: 'medium' },
    { id: 6, title: 'Insurance renewal exposure',              L: 2, I: 3, priority: 'low' },
    { id: 7, title: 'Plant theft (Lanark site)',               L: 3, I: 2, priority: 'low' },
    { id: 8, title: 'IT systems ageing',                       L: 2, I: 2, priority: 'low' },
    { id: 9, title: 'Sub-contractor key-person',               L: 1, I: 3, priority: 'low' },
  ];

  const gridW = 460, gridH = 360, padL = 48, padT = 24;

  const priorityColor = (p) => p === 'high' ? 'var(--color-teal)' : p === 'medium' ? 'var(--color-teal-3)' : 'var(--color-ink-muted)';

  return (
    <div className="oracle" style={{ width: 1280, minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <TopNav />
      <ProfileNav active="risks" />
      <div style={{ height: 1, background: 'var(--color-line)' }} />

      {/* Decorative folio in upper-right margin */}
      <div style={{ position: 'absolute', right: -20, top: 130, pointerEvents: 'none', zIndex: 0 }}>
        <div className="folio">02</div>
      </div>

      <div style={{ padding: '64px 80px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32, marginBottom: 48 }}>
          {/* Left margin */}
          <div style={{ paddingTop: 32 }}>
            <div className="marginalia" style={{ marginBottom: 6 }}>SECTION</div>
            <div className="folio-small" style={{ fontSize: 36 }}>02</div>
            <div className="marginalia" style={{ marginTop: 24, marginBottom: 4 }}>OPEN</div>
            <div className="folio-small" style={{ fontSize: 22 }}>9 risks</div>
            <div className="marginalia" style={{ marginTop: 20, marginBottom: 4 }}>MITIGATED</div>
            <div className="folio-small" style={{ fontSize: 22 }}>2 this month</div>
          </div>

          {/* Header */}
          <div>
            <Eyebrow>RISK REGISTER · WHAT COULD GO WRONG</Eyebrow>
            <h1 className="serif-display" style={{ fontSize: 56, fontWeight: 400, margin: '14px 0 18px', lineHeight: 1.04, letterSpacing: '-0.025em' }}>
              What could go wrong, and<br/>
              <span style={{ fontStyle: 'italic', color: 'var(--color-teal)' }}>what we're doing</span> about it.
            </h1>
            <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-ink-2)', fontWeight: 300, maxWidth: 680 }}>
              Three risks moved up the priority list this month. Iain's view: the supplier concentration is the one most worth your attention.
            </p>
            <hr className="divider-teal" style={{ margin: '24px 0 0' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'flex-start' }}>
          {/* Risk map */}
          <div>
            <Eyebrow style={{ marginBottom: 16 }}>THE MAP · likelihood × impact</Eyebrow>
            <div style={{ position: 'relative', width: gridW + padL + 20, height: gridH + 80 }}>
              {/* Y-axis label */}
              <div style={{ position: 'absolute', left: 0, top: padT, transform: 'rotate(-90deg) translate(-80px, -20px)', transformOrigin: 'left top', fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-ui)', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>LIKELIHOOD →</div>
              <div style={{ position: 'absolute', left: padL, bottom: 24, fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-ui)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>IMPACT →</div>

              {/* Grid backdrop */}
              <div style={{ position: 'absolute', left: padL, top: padT, width: gridW, height: gridH, borderLeft: '1px solid var(--color-line-strong)', borderBottom: '1px solid var(--color-line-strong)' }} />

              {/* Faint quadrant guide */}
              <div style={{ position: 'absolute', left: padL + gridW / 2, top: padT, width: 1, height: gridH, background: 'var(--color-line)' }} />
              <div style={{ position: 'absolute', left: padL, top: padT + gridH / 2, width: gridW, height: 1, background: 'var(--color-line)' }} />

              {/* Axis ticks */}
              {[1, 2, 3, 4, 5].map(t => (
                <React.Fragment key={t}>
                  <div className="mono" style={{ position: 'absolute', left: padL + ((t - 0.5) / 5) * gridW - 4, top: padT + gridH + 6, fontSize: 10, color: 'var(--color-ink-3)' }}>{t}</div>
                  <div className="mono" style={{ position: 'absolute', left: padL - 18, top: padT + (1 - (t - 0.5) / 5) * gridH - 6, fontSize: 10, color: 'var(--color-ink-3)' }}>{t}</div>
                </React.Fragment>
              ))}

              {/* Plot risks */}
              {risks.map(r => {
                const x = padL + ((r.I - 0.5) / 5) * gridW;
                const y = padT + (1 - (r.L - 0.5) / 5) * gridH;
                const size = 10 + r.L * r.I * 0.5;
                const color = priorityColor(r.priority);
                return (
                  <React.Fragment key={r.id}>
                    <div style={{
                      position: 'absolute',
                      left: x - size / 2, top: y - size / 2,
                      width: size, height: size, borderRadius: '50%',
                      background: color, opacity: 0.85, boxShadow: '0 2px 8px rgba(30,77,90,.12)',
                    }} />
                    {r.rank && (
                      <div className="serif-display" style={{
                        position: 'absolute',
                        left: x + size / 2 + 8, top: y - 14,
                        fontSize: 16, color: 'var(--color-teal)',
                        fontStyle: 'italic',
                      }}>{r.rank}</div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Quadrant labels */}
              <div style={{ position: 'absolute', left: padL + 12, top: padT + 8, fontSize: 11, color: 'var(--color-ink-3)', fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>watch closely</div>
              <div style={{ position: 'absolute', left: padL + gridW - 60, top: padT + 8, fontSize: 11, color: 'var(--color-ink-3)', fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>act</div>
              <div style={{ position: 'absolute', left: padL + 12, top: padT + gridH - 22, fontSize: 11, color: 'var(--color-ink-3)', fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>monitor</div>
              <div style={{ position: 'absolute', left: padL + gridW - 80, top: padT + gridH - 22, fontSize: 11, color: 'var(--color-ink-3)', fontStyle: 'italic', fontFamily: 'var(--font-text)' }}>prepare</div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 24, fontSize: 13, color: 'var(--color-ink-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-teal)' }} /> Open · high
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-teal-3)' }} /> Open · medium
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-ink-muted)' }} /> Low / accepted
              </span>
            </div>
          </div>

          {/* Top three */}
          <div>
            <Eyebrow style={{ marginBottom: 16 }}>WORTH ATTENTION · top three</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {risks.slice(0, 3).map((r, i) => (
                <div key={r.id} style={{
                  position: 'relative',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-m)',
                  padding: '20px 24px 20px 28px',
                  boxShadow: 'var(--shadow-s)',
                }}>
                  <div className={`priority-bar priority-${r.priority}`} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Eyebrow style={{ color: r.priority === 'high' ? 'var(--color-danger)' : r.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-ink-3)', fontSize: 10 }}>
                      {r.priority} priority
                    </Eyebrow>
                    <div className="serif-display" style={{ fontSize: 28, color: 'var(--color-teal)', fontStyle: 'italic', lineHeight: 1 }}>{i + 1}</div>
                  </div>
                  <div className="serif-display" style={{ fontSize: 21, lineHeight: 1.2, fontWeight: 400, margin: '4px 0 12px', letterSpacing: '-0.01em' }}>{r.title}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>
                    Likelihood {r.L} · Impact {r.I} · Reviewed {12 - i * 3} days ago
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 20, fontSize: 14 }}>See all nine risks →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AB_Risk_Expanded() {
  return (
    <div className="oracle" style={{ width: 1280, height: 900, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <TopNav />
      <ProfileNav active="risks" />
      <div style={{ height: 1, background: 'var(--color-line)' }} />

      {/* Dimmed background hint */}
      <div style={{ flex: 1, padding: '64px 80px', opacity: 0.15, pointerEvents: 'none', overflow: 'hidden' }}>
        <Eyebrow>RISK REGISTER</Eyebrow>
        <h1 className="serif-display" style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.1, marginTop: 14 }}>What could go wrong, and what we're doing about it.</h1>
      </div>

      {/* Backdrop scrim */}
      <div style={{ position: 'absolute', top: 109, left: 0, right: 0, bottom: 0, background: 'rgba(26,26,26,.05)' }} />

      {/* Side panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 580, background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-xl)',
        padding: '40px 48px',
        overflow: 'auto',
        animation: 'fade-in-up var(--dur-slow) var(--ease-out) both',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Eyebrow style={{ color: 'var(--color-danger)' }}>HIGH PRIORITY · RISK 01 OF 09</Eyebrow>
          <button className="btn btn-tertiary" aria-label="Close" style={{ marginRight: -8, marginTop: -8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <h2 className="serif-display" style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.1, margin: '14px 0 24px', letterSpacing: '-0.02em' }}>
          Supplier concentration<br/>with Acme Materials
        </h2>

        <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--color-ink-2)', margin: '0 0 28px' }}>
          Iain noted this on 14 May during the strategy session. The exposure became material after the Henderson contract was won — Acme now supply roughly 64% of the steel we're procuring quarterly.
        </p>

        <hr style={{ border: 0, height: 1, background: 'var(--color-line)', margin: '0 0 24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div>
            <Eyebrow>LIKELIHOOD</Eyebrow>
            <div style={{ marginTop: 8 }}><DotScale value={4} /></div>
          </div>
          <div>
            <Eyebrow>IMPACT</Eyebrow>
            <div style={{ marginTop: 8 }}><DotScale value={5} /></div>
          </div>
          <div>
            <Eyebrow>OWNER</Eyebrow>
            <div className="serif-text" style={{ fontSize: 16, marginTop: 6, color: 'var(--color-ink)' }}>Sarah McTaggart</div>
          </div>
          <div>
            <Eyebrow>NEXT REVIEW</Eyebrow>
            <div className="serif-text" style={{ fontSize: 16, marginTop: 6, color: 'var(--color-ink)' }}>28 May 2026</div>
          </div>
        </div>

        <div>
          <Eyebrow>MITIGATION</Eyebrow>
          <div className="serif-text" style={{ fontSize: 14, color: 'var(--color-ink-3)', fontStyle: 'italic', margin: '4px 0 14px' }}>A draft plan from Iain — review and edit as needed.</div>
          <div style={{ background: 'var(--color-surface-alt)', padding: '20px 24px', borderRadius: 'var(--radius-m)' }}>
            <ol style={{ paddingLeft: 20, margin: 0, color: 'var(--color-ink)' }}>
              <li className="serif-text" style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 12 }}>Open conversations with two alternative suppliers for the Henderson scope.</li>
              <li className="serif-text" style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 12 }}>Negotiate revised payment terms with Acme to reduce exposure on aged stock.</li>
              <li className="serif-text" style={{ fontSize: 16, lineHeight: 1.6 }}>Quarterly review of supplier dependency thresholds with the senior team.</li>
            </ol>
          </div>
        </div>

        <div style={{ marginTop: 36, display: 'flex', gap: 12 }}>
          <button className="btn btn-primary">Discuss with Iain</button>
          <button className="btn btn-secondary">Mark mitigated</button>
        </div>
      </div>
    </div>
  );
}

function AB_Profile_Opportunities() {
  const opps = [
    { title: 'Scottish Procurement framework — Housing Lot 4', summary: 'Margot identified this from your sector and revenue profile. Submission window closes 31 August.', tag: 'NEW THIS WEEK', confidence: 4 },
    { title: 'Modular construction sub-trade with Vexa', summary: 'Adjacent capability conversation. Could absorb spare project-manager capacity from Q4.', tag: 'EXPLORATORY', confidence: 2 },
    { title: 'Direct-to-housing-association sales channel', summary: 'Two associations in Lanarkshire procure outside frameworks. Small contracts, but warmer relationships.', tag: 'WORTH TESTING', confidence: 3 },
    { title: 'Retrofit decarbonisation work — PAS 2035', summary: 'Eligibility hinges on quality assurance accreditation. Six-month runway needed.', tag: 'PARKED', confidence: 1 },
  ];

  return (
    <div className="oracle" style={{ width: 1280, minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <TopNav />
      <ProfileNav active="opportunities" />
      <div style={{ height: 1, background: 'var(--color-line)' }} />

      <div style={{ position: 'absolute', right: -20, top: 130, pointerEvents: 'none', zIndex: 0 }}>
        <div className="folio">03</div>
      </div>

      <div style={{ padding: '64px 80px', position: 'relative', zIndex: 1 }}>
        <ArtboardHeader
          folio="03"
          section="OPPORTUNITIES · 4 OPEN · WHERE WE COULD PUSH NEXT"
          title="Where there's room"
          accent="to push."
          lede="Margot brings most of these in from outside — sector signals, frameworks, conversations. Four are open. One feels close."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {opps.map((o, i) => (
            <div key={i} style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-l)',
              padding: 32,
              boxShadow: 'var(--shadow-s)',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <Eyebrow teal>{o.tag}</Eyebrow>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {Array.from({ length: 4 }).map((_, k) => (
                    <span key={k} style={{ width: 14, height: 2, background: k < o.confidence ? 'var(--color-teal)' : 'var(--color-line-strong)' }} />
                  ))}
                  <span className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginLeft: 8 }}>confidence</span>
                </div>
              </div>
              <h3 className="serif-display" style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.22, margin: '0 0 14px', letterSpacing: '-0.015em' }}>{o.title}</h3>
              <p className="serif-text" style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--color-ink-2)', margin: '0 0 20px' }}>{o.summary}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button className="btn btn-secondary" style={{ fontSize: 14 }}>Talk it through with Margot →</button>
                <div style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>{i === 0 ? '2 days ago' : `${i * 9 + 4} days ago`}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AB_Profile_Maturity() {
  const dims = ['Digital', 'AI readiness', 'Operational', 'Strategic clarity', 'Risk', 'Commercial'];
  const current  = [2, 1, 3, 3, 3, 2];
  const previous = [2, 1, 2, 2, 3, 2];
  const cx = 230, cy = 230, R = 170;

  const points = (vals) => vals.map((v, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / dims.length;
    const r = (v / 4) * R;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const polygonStr = (pts) => pts.map(p => p.join(',')).join(' ');
  const rings = [1, 2, 3, 4].map(k => points(dims.map(() => k)));
  const axes = points(dims.map(() => 4));
  const labelPos = dims.map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / dims.length;
    return [cx + (R + 32) * Math.cos(angle), cy + (R + 32) * Math.sin(angle)];
  });

  return (
    <div className="oracle" style={{ width: 1280, minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <TopNav />
      <ProfileNav active="maturity" />
      <div style={{ height: 1, background: 'var(--color-line)' }} />

      <div style={{ position: 'absolute', right: -20, top: 130, pointerEvents: 'none', zIndex: 0 }}>
        <div className="folio">04</div>
      </div>

      <div style={{ padding: '64px 80px', position: 'relative', zIndex: 1 }}>
        <ArtboardHeader
          folio="04"
          section="MATURITY · WHERE THE BUSINESS IS, ACROSS SIX DIMENSIONS"
          title="A picture of how"
          accent="you run things."
          lede="Priya scored these in your April session. The shape has shifted a little — operational maturity is up; the digital gap is unchanged."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '500px 1fr', gap: 64, alignItems: 'flex-start' }}>
          <div>
            <svg width="500" height="480" viewBox="0 0 500 480">
              {rings.map((ring, i) => (
                <polygon key={i} points={polygonStr(ring)} fill="none" stroke="var(--color-line)" strokeWidth="1" opacity={0.5} />
              ))}
              {axes.map((p, i) => (
                <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="var(--color-line)" strokeWidth="0.5" />
              ))}
              {/* Previous polygon — dashed */}
              <polygon points={polygonStr(points(previous))} fill="var(--color-ink-muted)" fillOpacity="0.06" stroke="var(--color-ink-3)" strokeWidth="1" strokeDasharray="3 4" />
              {/* Current polygon */}
              <polygon points={polygonStr(points(current))} fill="var(--color-teal)" fillOpacity="0.18" stroke="var(--color-teal)" strokeWidth="1.5" />
              {points(current).map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="var(--color-teal)" />
              ))}
              {labelPos.map((p, i) => (
                <text key={i} x={p[0]} y={p[1]}
                  textAnchor="middle" dominantBaseline="middle"
                  style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fill: 'var(--color-ink-2)' }}>{dims[i]}</text>
              ))}
              {[1, 2, 3, 4].map(k => {
                const r = (k / 4) * R;
                return (
                  <text key={k} x={cx + 6} y={cy - r + 4}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-ink-3)' }}>{k}</text>
                );
              })}
            </svg>
            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--color-ink-3)', marginTop: 4, paddingLeft: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 2, background: 'var(--color-teal)' }} />
                This month
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 0, borderTop: '1.5px dashed var(--color-ink-3)' }} />
                Three months ago
              </span>
            </div>
          </div>

          <div style={{ paddingTop: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                ['Operational',    3, 'Strongest movement this quarter. Job-costing discipline has held since February.', 'Priya'],
                ['Digital',        2, "The team is still emailing snag lists around. That's the bottleneck, not the AI question.", 'Priya'],
                ['AI readiness',   1, 'Honest baseline. No internal use yet; foundations to lay before talking automation.', 'Priya'],
              ].map(([dim, score, narr, by], i) => (
                <div key={i} style={{ paddingBottom: 20, borderBottom: i < 2 ? '1px solid var(--color-line)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="serif-display" style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em' }}>{dim}</div>
                    <DotScale value={score} of={4} />
                  </div>
                  <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--color-ink-2)', margin: 0, fontStyle: 'italic' }}>
                    "{narr}"
                  </p>
                  <div style={{ fontSize: 13, color: 'var(--color-ink-3)', marginTop: 6 }}>— {by}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AB_Profile_Strategy, AB_Profile_Risks, AB_Risk_Expanded, AB_Profile_Opportunities, AB_Profile_Maturity });
