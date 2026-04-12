'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FIGHTERS = [
  { id: 'sensei',     emoji: '🧓', name: 'The Sensei',     desc: 'Seasoned strategist',  accent: '#6366f1' },
  { id: 'shadow',     emoji: '🥷', name: 'The Shadow',     desc: 'Data-driven ninja',     accent: '#64748b' },
  { id: 'kata',       emoji: '🥊', name: 'The Kata',       desc: 'Growth fighter',        accent: '#ff6b35' },
  { id: 'guardian',   emoji: '🛡️', name: 'The Guardian',   desc: 'User champion',         accent: '#22c55e' },
  { id: 'monk',       emoji: '🧘', name: 'The Monk',       desc: 'Systems thinker',       accent: '#a855f7' },
  { id: 'chronicler', emoji: '⚔️', name: 'The Chronicler', desc: 'Story builder',         accent: '#ef4444' },
]

export default function SelectPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const router = useRouter()

  function handleConfirm() {
    if (!selected) return
    sessionStorage.setItem('pmd_fighter', selected)
    router.push('/onboarding')
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0b0f14',
      padding: '40px 20px 80px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Ember glow */}
      <div style={{
        position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
        width: '420px', height: '420px',
        background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '760px', margin: '0 auto' }}>

        {/* Top nav */}
        <div className="select-nav">
          <Link href="/" style={{
            fontFamily: "'Manrope', sans-serif", fontSize: '11px',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#6b7685', textDecoration: 'none',
          }}>
            ← Back
          </Link>
          <span style={{
            fontFamily: "'Manrope', sans-serif", fontSize: '11px',
            letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4a5568',
          }}>
            Step 01 · Pick your fighter
          </span>
        </div>

        {/* Header */}
        <header style={{ textAlign: 'center', margin: '32px 0 36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(18,24,33,0.6)', border: '1px solid #2a3340',
            borderRadius: '999px', padding: '8px 16px', marginBottom: '20px',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#ff6b35', boxShadow: '0 0 8px rgba(255,107,53,0.8)',
              display: 'inline-block', animation: 'pulseGlow 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: "'Manrope', sans-serif", fontSize: '11px',
              letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b7685',
            }}>
              Choose your avatar
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(26px, 6vw, 48px)',
            fontWeight: 800, color: '#f6fafe', lineHeight: 1.1, margin: '0 0 14px',
          }}>
            Pick the fighter you see yourself as.
          </h1>
          <p style={{ fontSize: '15px', color: '#8b96a5', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
            Choose any avatar — go on instinct. We&apos;ll figure out your training path next.
          </p>
        </header>

        {/* Fighter grid — 2 cols mobile, 3 cols desktop */}
        <div className="fighter-grid">
          {FIGHTERS.map((f) => {
            const isSelected = selected === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelected(f.id)}
                aria-label={`Select ${f.name}`}
                className="fighter-card"
                style={{
                  position: 'relative',
                  background: isSelected ? 'rgba(18,24,33,0.95)' : '#121821',
                  border: `1.5px solid ${isSelected ? f.accent : '#2a3340'}`,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '12px',
                  padding: '28px 16px 20px',
                  boxShadow: isSelected ? `0 0 0 1px ${f.accent}44, 0 0 28px ${f.accent}22` : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = f.accent + '88'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#2a3340'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {/* Accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: f.accent, opacity: isSelected ? 1 : 0.4,
                  borderRadius: '20px 20px 0 0', transition: 'opacity 200ms ease',
                }} />

                {/* Avatar circle */}
                <div className="avatar-circle" style={{
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${f.accent}33, #0b0f1488)`,
                  border: `2px solid ${f.accent}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  filter: isSelected ? `drop-shadow(0 0 14px ${f.accent}88)` : 'none',
                  transition: 'filter 200ms ease',
                  flexShrink: 0,
                }}>
                  <span className="avatar-emoji">{f.emoji}</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '14px', fontWeight: 700, color: '#f6fafe', marginBottom: '4px',
                  }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7685', lineHeight: 1.4 }}>
                    {f.desc}
                  </div>
                </div>

                {/* Checkmark */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: f.accent, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: 700,
                  }}>✓</div>
                )}
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected}
            className="cta-btn"
            style={{
              height: '56px',
              background: selected ? '#ff6b35' : '#2a3340',
              color: selected ? 'white' : '#6b7685',
              border: 'none', borderRadius: '999px',
              fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: selected ? 'pointer' : 'not-allowed',
              fontFamily: "'Manrope', sans-serif",
              transition: 'background 150ms ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={(e) => { if (selected) e.currentTarget.style.background = '#e05a28' }}
            onMouseLeave={(e) => { if (selected) e.currentTarget.style.background = '#ff6b35' }}
          >
            What brings you here?
          </button>
          {!selected && (
            <p style={{ fontSize: '12px', color: '#4a5568' }}>Select a fighter to continue</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .select-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fighter-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 720px;
          margin: 0 auto;
        }
        .avatar-circle {
          width: 80px;
          height: 80px;
        }
        .avatar-emoji {
          font-size: 36px;
          line-height: 1;
        }
        .cta-btn {
          width: auto;
          padding: 0 48px;
        }
        @media (max-width: 600px) {
          .fighter-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .avatar-circle {
            width: 64px;
            height: 64px;
          }
          .avatar-emoji {
            font-size: 28px;
          }
          .cta-btn {
            width: 100%;
            padding: 0 24px;
          }
          .select-nav span:last-child {
            display: none;
          }
        }
      `}</style>
    </main>
  )
}
