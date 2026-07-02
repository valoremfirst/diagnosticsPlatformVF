/* primitives.jsx — shared bits used across all screen files */

const { Orb, ORB_AGENTS } = window;

function TopNav({ businessName = 'McTaggart Construction', initials = 'SM', glass = false }) {
  return (
    <div className={"topnav " + (glass ? "glass-subtle" : "")} style={{ borderBottom: glass ? '0.5px solid var(--color-line)' : 'none' }}>
      <div className="wordmark">oracle</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14, color: 'var(--color-ink-2)' }}>
        <span>{businessName}</span>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--color-surface-alt)',
          color: 'var(--color-ink-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 500, letterSpacing: '0.04em',
        }}>{initials}</div>
      </div>
    </div>
  );
}

function Eyebrow({ children, teal = false, style }) {
  return <div className={"eyebrow" + (teal ? " eyebrow-teal" : "")} style={style}>{children}</div>;
}

function CardOfTheMoment({ eyebrow, title, body, primaryLabel = 'Talk to George', secondaryLabel = null, style }) {
  return (
    <div className="cotm" style={{ animation: 'fade-in-up var(--dur-slow) var(--ease-out) both', ...style }}>
      <Eyebrow teal>{eyebrow}</Eyebrow>
      <h2 className="serif-display" style={{
        fontSize: 28, lineHeight: 1.18, fontWeight: 400, color: 'var(--color-ink)',
        margin: '12px 0 16px', letterSpacing: '-0.015em',
      }}>{title}</h2>
      <div className="serif-text" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--color-ink-2)' }}>{body}</div>
      <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-primary">{primaryLabel}</button>
        {secondaryLabel && <button className="btn btn-secondary">{secondaryLabel}</button>}
      </div>
    </div>
  );
}

function DotScale({ value, of = 5, color = 'var(--color-teal)' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', gap: 4 }}>
        {Array.from({ length: of }).map((_, i) => (
          <span key={i} style={{
            width: 9, height: 9, borderRadius: '50%',
            border: '1px solid ' + (i < value ? color : 'var(--color-line-strong)'),
            background: i < value ? color : 'transparent',
          }} />
        ))}
      </span>
      <span className="mono" style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>{value} of {of}</span>
    </span>
  );
}

function ProfileNav({ active = 'risks' }) {
  const items = [
    { key: 'strategy',      label: 'Strategy' },
    { key: 'risks',         label: 'Risks' },
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'maturity',      label: 'Maturity' },
    { key: 'context',       label: 'Context' },
  ];
  return (
    <div style={{ padding: '20px 80px 0', display: 'flex', alignItems: 'center', gap: 36, fontSize: 14, color: 'var(--color-ink-2)' }}>
      <span className="eyebrow" style={{ marginRight: 8 }}>PROFILE</span>
      {items.map(it => (
        <div key={it.key} style={{ position: 'relative', paddingBottom: 18 }}>
          <span style={{ color: it.key === active ? 'var(--color-ink)' : 'var(--color-ink-2)', fontWeight: it.key === active ? 500 : 400 }}>{it.label}</span>
          {it.key === active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--color-teal)' }} />}
        </div>
      ))}
    </div>
  );
}

function ArtboardHeader({ section, title, lede, folio, accent }) {
  // Split title at the marker `<i>...</i>` so we can italicise + colour a phrase
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32, marginBottom: 48 }}>
      <div style={{ paddingTop: 32 }}>
        {folio && (
          <>
            <div className="eyebrow" style={{ marginBottom: 6 }}>SECTION</div>
            <div className="folio-small" style={{ fontSize: 36 }}>{folio}</div>
          </>
        )}
      </div>
      <div>
        <Eyebrow>{section}</Eyebrow>
        <h1 className="serif-display" style={{ fontSize: 52, fontWeight: 400, margin: '14px 0 18px', lineHeight: 1.04, letterSpacing: '-0.025em', textWrap: 'balance' }}>
          {accent ? (
            <>
              {title} <span style={{ fontStyle: 'italic', color: 'var(--color-teal)' }}>{accent}</span>
            </>
          ) : title}
        </h1>
        <p className="serif-text" style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--color-ink-2)', fontWeight: 300, maxWidth: 680 }}>
          {lede}
        </p>
        <hr className="divider-teal" style={{ margin: '24px 0 0' }} />
      </div>
    </div>
  );
}

Object.assign(window, { TopNav, Eyebrow, CardOfTheMoment, DotScale, ProfileNav, ArtboardHeader });
