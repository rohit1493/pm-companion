'use client'

import { useState, useEffect } from 'react'

const LINES = [
  'Analysing your goals...',
  'Sequencing articles by priority...',
  'Calibrating quiz difficulty...',
  'Building your path...',
]

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [lineIdx, setLineIdx] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Fade in on mount
    const fadeIn = setTimeout(() => setMounted(true), 20)
    // Rotate status lines
    const interval = setInterval(() => setLineIdx(i => (i + 1) % LINES.length), 700)
    // Hand off to reveal
    const done = setTimeout(onComplete, 2800)
    return () => { clearTimeout(fadeIn); clearInterval(interval); clearTimeout(done) }
  }, [onComplete])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 400ms ease',
    }}>
      {/* Pulsing icon */}
      <div style={{
        width: '48px',
        height: '48px',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        animation: 'lsPulse 2s ease-in-out infinite',
      }}>
        <span style={{ color: 'var(--indigo)', fontSize: '18px' }}>◆</span>
      </div>

      {/* Headline */}
      <h2 style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 'clamp(20px, 5vw, 24px)',
        fontWeight: 400,
        color: 'var(--text-primary)',
        textAlign: 'center',
        marginBottom: '12px',
        lineHeight: 1.3,
      }}>
        Building your personalised path
      </h2>

      {/* Rotating status line — key forces remount on each change */}
      <p
        key={lineIdx}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          opacity: 0,
          animation: 'lsFadeIn 400ms ease forwards',
        }}
      >
        {LINES[lineIdx]}
      </p>

      <style>{`
        @keyframes lsFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lsPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
