/* screens-foundations.jsx — Foundations artboards: colour, type, orb */

const { Orb, ORB_AGENTS, Eyebrow } = window;

function AB_Colors() {
  const tokens = [
    { group: 'Surfaces', items: [
      ['--color-bg', '#FAFAF7', 'page background'],
      ['--color-surface', '#FFFFFF', 'cards, elevated'],
      ['--color-surface-alt', '#F5F3EE', 'recessed surfaces'],
    ]},
    { group: 'Ink', items: [
      ['--color-ink', '#1A1A1A', 'primary text'],
      ['--color-ink-2', '#4A4A4A', 'secondary text'],
      ['--color-ink-3', '#767676', 'tertiary, captions'],
      ['--color-ink-muted', '#A8A6A0', 'disabled, placeholders'],
    ]},
    { group: 'Lines', items: [
      ['--color-line', '#E8E6E0', 'hairlines, dividers'],
      ['--color-line-strong', '#D4D1C8', 'emphasised divides'],
    ]},
    { group: 'Brand — teal, rationed', items: [
      ['--color-teal', '#1E4D5A', 'primary accent'],
      ['--color-teal-2', '#2E6B7A', 'hover, gradients'],
      ['--color-teal-3', '#4A8A99', 'soft fills'],
      ['--color-teal-bg', '#E8F0F2', 'subtle teal tint'],
    ]},
    { group: 'Semantic — risk register & status only', items: [
      ['--color-success', '#3D7A5C', '"complete" status'],
      ['--color-warning', '#B8814A', 'medium-priority risks'],
      ['--color-danger', '#A84A3D', 'critical risks'],
    ]},
    { group: 'Agent accents — for orb halos', items: [
      ['--color-george-warm', '#C9874A', 'warm teal · copper halo'],
      ['--color-margot-gold', '#D4A865', 'bronze / gold core'],
      ['--color-iain-indigo', '#5C6FA8', 'deep indigo core'],
      ['--color-priya-mint', '#7AB89A', 'sage / jade core'],
    ]},
  ];
  return (
    <div className="oracle" style={{ width: 1280, padding: '64px 80px', background: 'var(--color-bg)' }}>
      <Eyebrow>OUTPUT 01 · FOUNDATIONS</Eyebrow>
      <h1 className="serif-display" style={{ fontSize: 56, fontWeight: 400, margin: '12px 0 8px', lineHeight: 1.05, letterSpacing: '-0.025em' }}>Colour</h1>
      <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-ink-2)', maxWidth: 680, fontWeight: 300 }}>
        The page is warm off-white. Teal is rationed — the orb gets it, primary actions get it, an editorial accent gets it. Everything else is ink and line.
      </p>
      <hr className="divider-teal" style={{ margin: '40px 0 48px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 48 }}>
        {tokens.map(({ group, items }) => (
          <div key={group}>
            <Eyebrow style={{ marginBottom: 16 }}>{group}</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(([tok, hex, desc]) => (
                <div key={tok} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-m)', boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-s)', background: hex, border: '0.5px solid var(--color-line)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--color-ink)' }}>{tok}</div>
                    <div className="serif-text" style={{ fontSize: 14, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>{desc}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>{hex}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AB_Type() {
  return (
    <div className="oracle" style={{ width: 1280, padding: '64px 80px', background: 'var(--color-bg)' }}>
      <Eyebrow>OUTPUT 02 · FOUNDATIONS</Eyebrow>
      <h1 className="serif-display" style={{ fontSize: 56, fontWeight: 400, margin: '12px 0 8px', lineHeight: 1.05, letterSpacing: '-0.025em' }}>Type</h1>
      <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-ink-2)', maxWidth: 680, fontWeight: 300 }}>
        Content reads serif. Chrome reads sans. The single most important typographic decision in the system — and the source of the editorial feel.
      </p>
      <hr className="divider-teal" style={{ margin: '40px 0 48px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
        <div>
          <Eyebrow style={{ marginBottom: 24 }}>DISPLAY — NEWSREADER · headlines</Eyebrow>
          <div className="serif-display" style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 400, margin: '0 0 8px' }}>Where the business stands</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>display-xl · 56 / 1.05 · tight</div>

          <div className="serif-display" style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 400, margin: '36px 0 8px' }}>The Headline</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>display-l · 44 / 1.10 · section openers</div>

          <div className="serif-display" style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 400, margin: '32px 0 8px' }}>Risks currently tracked</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>display-m · 32 / 1.15 · page headings</div>

          <div className="serif-display" style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 400, margin: '32px 0 8px' }}>Supplier concentration with Acme Materials</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>display-s · 24 / 1.2 · card headlines</div>
        </div>

        <div>
          <Eyebrow style={{ marginBottom: 24 }}>TEXT — SOURCE SERIF 4 · body</Eyebrow>
          <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-ink)', margin: '0 0 4px' }}>
            Iain noted this on 14 May during the strategy session. The exposure became material after the Henderson contract was won, and the dependency on one supplier now reads as the largest single risk on the register.
          </p>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 28 }}>text-l · 19 / 1.55 · lede paragraphs</div>

          <p className="serif-text" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--color-ink-2)', margin: '0 0 4px' }}>
            On balance, the Acme exposure looks more material now than it did in March. Not urgent, but worth a conversation in the next fortnight.
          </p>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 28 }}>text-m · 17 / 1.6 · default body</div>

          <p className="serif-text" style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--color-ink-3)', margin: '0 0 4px' }}>
            From your session on 14 April — when the housing pipeline was first mentioned.
          </p>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 32 }}>text-s · 15 / 1.55 · secondary, metadata</div>

          <Eyebrow style={{ marginBottom: 16 }}>UI — SYSTEM SANS · chrome</Eyebrow>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-ui)', margin: '0 0 4px' }}>Start a session</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 16 }}>ui-l · 16 / 1.4</div>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-ui)', margin: '0 0 4px' }}>Reviewed 12 days ago</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 16 }}>ui-m · 14 / 1.4 · default</div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>WORTH ATTENTION</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>ui-xs uppercase · tracked wider · eyebrows</div>
        </div>
      </div>
    </div>
  );
}

function AB_OrbGrid() {
  const agents = ['george', 'margot', 'iain', 'priya'];
  const states = ['idle', 'listening', 'speaking', 'thinking', 'error'];
  const descriptions = {
    george: 'Warm baseline. Amber halo. Family-GP register.',
    margot: 'Sharper, ambitious. Warm-gold halo. Strategy.',
    iain:   'Deeper, weighty. Indigo halo. Risk and resilience.',
    priya:  'Coolest, modern. Pale-mint halo. Digital and AI.',
  };

  return (
    <div className="oracle" style={{ width: 1280, padding: '64px 80px', background: 'var(--color-bg)' }}>
      <Eyebrow>OUTPUT 03 · FOUNDATIONS</Eyebrow>
      <h1 className="serif-display" style={{ fontSize: 56, fontWeight: 400, margin: '12px 0 8px', lineHeight: 1.05, letterSpacing: '-0.025em' }}>The orb</h1>
      <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-ink-2)', maxWidth: 680, fontWeight: 300 }}>
        Four agent palettes, five states. Built from layered radial gradients — halo, core, inner highlight, specular edge. A real luminous sphere, not a circle with a fill.
      </p>
      <hr className="divider-teal" style={{ margin: '40px 0 48px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(5, 1fr)', gap: 16, alignItems: 'center' }}>
        <div />
        {states.map(s => (
          <div key={s} className="eyebrow" style={{ textAlign: 'center' }}>{s}</div>
        ))}

        {agents.map(agent => (
          <React.Fragment key={agent}>
            <div style={{ paddingRight: 16 }}>
              <div className="serif-display" style={{ fontSize: 22, color: 'var(--color-ink)', textTransform: 'capitalize' }}>{agent}</div>
              <div className="serif-text" style={{ fontSize: 14, color: 'var(--color-ink-3)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>{descriptions[agent]}</div>
            </div>
            {states.map(state => (
              <div key={state} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220, overflow: 'visible' }}>
                <Orb agent={agent} state={state} size={90} />
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AB_Colors, AB_Type, AB_OrbGrid });
