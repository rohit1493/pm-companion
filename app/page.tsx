import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0b0f14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Ember glow top-center */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '520px',
        height: '520px',
        background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Ember glow bottom-right */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        right: '20%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Hero */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '720px',
        width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 'clamp(40px, 8vw, 72px)',
          fontWeight: 800,
          lineHeight: 1.05,
          color: '#f6fafe',
          margin: 0,
        }}>
          Step into the
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #ffb690, #ff6b35, #d94f1e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            PM Dojo.
          </span>
        </h1>

        <p style={{
          marginTop: '24px',
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: '#8b96a5',
          lineHeight: 1.7,
          maxWidth: '560px',
          margin: '24px auto 0',
        }}>
          Not another newsletter. A training arena. Sequenced paths, a 30-second
          read gate, and streaks for PMs who want to actually get sharper —
          not just consume more.
        </p>

        <div style={{
          marginTop: '40px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <Link
            href="/select"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '56px',
              padding: '0 40px',
              background: '#ff6b35',
              color: 'white',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Enter the Dojo
          </Link>
          <span style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#4a5568',
          }}>
            Pick your archetype · 60 seconds
          </span>
        </div>

        {/* Feature cards */}
        <div style={{
          marginTop: '64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '640px',
          margin: '64px auto 0',
        }}>
          {[
            { k: '01', t: 'Sequenced', d: 'Paths ordered by skill, not recency' },
            { k: '02', t: 'Gated', d: '30-second read gate before the next unlock' },
            { k: '03', t: 'Streaked', d: 'Daily reps you can actually feel' },
          ].map((item) => (
            <div key={item.k} style={{
              background: 'rgba(18,24,33,0.7)',
              border: '1px solid #2a3340',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'left',
            }}>
              <div style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.18em',
                color: '#ff6b35',
                marginBottom: '8px',
              }}>
                {item.k}
              </div>
              <div style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '15px',
                fontWeight: 700,
                color: '#f6fafe',
                marginBottom: '4px',
              }}>
                {item.t}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7685',
                lineHeight: 1.5,
              }}>
                {item.d}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating ember particles (CSS animated) */}
      <style>{`
        @keyframes emberFloat {
          0%, 100% { transform: translateY(0px); opacity: 1; }
          50% { transform: translateY(-12px); opacity: 0.6; }
        }
        .ember { position: absolute; border-radius: 50%; animation: emberFloat 3s ease-in-out infinite; pointer-events: none; }
      `}</style>
      <div className="ember" style={{ left: '12%', top: '28%', width: 6, height: 6, background: '#ff6b35', boxShadow: '0 0 18px 4px rgba(255,107,53,0.6)', animationDelay: '0s' }} />
      <div className="ember" style={{ left: '78%', top: '22%', width: 4, height: 4, background: '#ffb690', boxShadow: '0 0 14px 3px rgba(255,182,144,0.5)', animationDelay: '1.2s' }} />
      <div className="ember" style={{ left: '22%', top: '74%', width: 4, height: 4, background: '#f6c74a', boxShadow: '0 0 16px 3px rgba(246,199,74,0.55)', animationDelay: '0.6s' }} />
    </main>
  )
}
