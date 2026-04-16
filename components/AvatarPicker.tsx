'use client'

import { useRef, useState } from 'react'
import { AVATAR_THEMES, type AvatarKey } from '@/lib/avatar-themes'

interface AvatarPickerProps {
  currentAvatar?: AvatarKey
  onSelect: (key: AvatarKey, originX: number, originY: number) => void
}

export default function AvatarPicker({ currentAvatar, onSelect }: AvatarPickerProps) {
  const cardRefs = useRef<Map<AvatarKey, HTMLButtonElement>>(new Map())
  const [clickingKey, setClickingKey] = useState<AvatarKey | null>(null)

  function handlePick(key: AvatarKey) {
    setClickingKey(key)
    setTimeout(() => {
      setClickingKey(null)
      const el = cardRefs.current.get(key)
      if (el) {
        const rect = el.getBoundingClientRect()
        onSelect(key, rect.left + rect.width / 2, rect.top + rect.height / 2)
      } else {
        onSelect(key, window.innerWidth / 2, window.innerHeight / 2)
      }
    }, 150)
  }

  const fighters = Object.values(AVATAR_THEMES)

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f14', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        padding: '48px 24px 80px',
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#6b7685',
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          PM Dojo
        </p>
        <h1 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 'clamp(26px, 6vw, 32px)',
          fontWeight: 400,
          color: '#f6fafe',
          lineHeight: 1.2,
          marginBottom: '8px',
          textAlign: 'center',
        }}>
          Choose your fighter
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: '#6b7685',
          marginBottom: '36px',
          textAlign: 'center',
        }}>
          Your fighter sets the tone for your entire experience.
        </p>

        <style>{`
          @media (max-width: 480px) {
            .avatar-picker-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        <div
          className="avatar-picker-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {fighters.map((fighter) => {
            const isSelected = currentAvatar === fighter.key
            const isClicking = clickingKey === fighter.key
            return (
              <button
                key={fighter.key}
                ref={(el) => {
                  if (el) cardRefs.current.set(fighter.key, el)
                }}
                type="button"
                onClick={() => handlePick(fighter.key)}
                aria-label={`Select ${fighter.label} fighter`}
                aria-pressed={isSelected}
                style={{
                  background: isSelected ? `${fighter.accent}14` : '#121821',
                  border: `1.5px solid ${isSelected ? fighter.accent : '#2a3340'}`,
                  borderRadius: '16px',
                  padding: '20px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  outline: 'none',
                  transition: 'all 200ms ease',
                  boxShadow: isSelected ? `0 0 20px ${fighter.accent}40` : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: isClicking ? 'scale(0.97)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = '#ff6b35'
                    el.style.transform = 'translateY(-2px)'
                    el.style.boxShadow = '0 4px 16px rgba(255,107,53,0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = '#2a3340'
                    el.style.background = '#121821'
                    el.style.transform = 'none'
                    el.style.boxShadow = 'none'
                  }
                }}
              >
                {/* Type badge */}
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: `${fighter.accent}18`,
                  color: fighter.accent,
                  borderRadius: '99px',
                  fontSize: '10px',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}>
                  {fighter.type}
                </span>

                {/* Emoji */}
                <div style={{ fontSize: '32px', marginBottom: '8px', lineHeight: 1 }}>
                  {fighter.emoji}
                </div>

                {/* Name */}
                <p style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '17px',
                  fontWeight: 600,
                  color: isSelected ? fighter.accent : '#f6fafe',
                  marginBottom: '4px',
                  transition: 'color 200ms ease',
                }}>
                  {fighter.label}
                </p>

                {/* Tagline */}
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  color: '#6b7685',
                  lineHeight: 1.4,
                  marginBottom: '12px',
                  fontStyle: 'italic',
                }}>
                  {fighter.title}
                </p>

                {/* Power tags */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {fighter.powers.map((power) => (
                    <span key={power} style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px',
                      color: '#8b96a5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      <span style={{ color: fighter.accent, fontSize: '9px' }}>◆</span>
                      {power}
                    </span>
                  ))}
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: fighter.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
