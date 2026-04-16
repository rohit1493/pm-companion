import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        background: '#0b0f14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: "'Inter', sans-serif",
        textAlign: 'center',
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Inter:wght@400;500&display=swap"
      />

      {/* Glow */}
      <div style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <p style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: '#ff6b35',
        marginBottom: '20px',
      }}>
        PM Dojo
      </p>

      <h1 style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 'clamp(72px, 16vw, 120px)',
        fontWeight: 700,
        color: '#1e2a38',
        lineHeight: 1,
        marginBottom: '8px',
        letterSpacing: '-0.04em',
      }}>
        404
      </h1>

      <p style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 'clamp(20px, 5vw, 28px)',
        fontWeight: 400,
        color: '#f6fafe',
        marginBottom: '12px',
        lineHeight: 1.3,
      }}>
        Page not found
      </p>

      <p style={{
        fontSize: '15px',
        color: '#6b7685',
        maxWidth: '320px',
        lineHeight: 1.6,
        marginBottom: '40px',
      }}>
        The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on your PM path.
      </p>

      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '52px',
          padding: '0 36px',
          background: '#ff6b35',
          color: 'white',
          borderRadius: '999px',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textDecoration: 'none',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Take me home →
      </Link>
    </main>
  )
}
