'use client'

import { useState, useEffect } from 'react'

type ProfileEditorModalProps = {
  open: boolean
  mode: 'edit' | 'new'
  initialAvatar: string
  initialGoal: string | null
  initialTarget: string | null
  initialFocus: string | null
  onClose: () => void
  onSaved: (newArchetype: string) => void
}

const AVATARS = [
  { key: 'sensei', emoji: '🥷', label: 'The Sensei', desc: 'Strategic & wise' },
  { key: 'shadow', emoji: '🌑', label: 'The Shadow', desc: 'Fast & relentless' },
  { key: 'kata', emoji: '⚡', label: 'Kata', desc: 'Precise & methodical' },
  { key: 'guardian', emoji: '🛡️', label: 'The Guardian', desc: 'Steady & thorough' },
  { key: 'monk', emoji: '🧘', label: 'The Monk', desc: 'Focused & deep' },
  { key: 'chronicler', emoji: '📜', label: 'Chronicler', desc: 'Curious & wide' },
]

const GOALS = [
  { key: 'interview_prep', emoji: '🎯', label: 'Interview Prep', desc: 'Targeting FAANG or startup roles' },
  { key: 'deep_skill', emoji: '📚', label: 'Build Deep Skills', desc: 'Master a specific PM area' },
  { key: 'stay_updated', emoji: '📡', label: 'Stay Updated', desc: 'Read widely across PM topics' },
]

const TARGETS = [
  { key: 'big_tech', label: 'Big Tech / FAANG', desc: 'Google, Meta, Amazon, Apple' },
  { key: 'startup', label: 'Startup / Growth', desc: 'Series A–C companies' },
]

const FOCUSES = [
  { key: 'ai', emoji: '🤖', label: 'AI & Machine Learning', desc: 'AI products and systems' },
  { key: 'growth', emoji: '📈', label: 'Growth', desc: 'Acquisition, retention, revenue' },
  { key: 'analytics', emoji: '📊', label: 'Analytics', desc: 'Data-driven decisions' },
  { key: 'strategy', emoji: '♟️', label: 'Product Strategy', desc: 'Vision, positioning, roadmap' },
  { key: 'ux', emoji: '🎨', label: 'UX & Design', desc: 'User experience and research' },
]

export default function ProfileEditorModal({
  open,
  mode,
  initialAvatar,
  initialGoal,
  initialTarget,
  initialFocus,
  onClose,
  onSaved,
}: ProfileEditorModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar || 'sensei')
  const [selectedGoal, setSelectedGoal] = useState<string | null>(initialGoal)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(initialTarget)
  const [selectedFocus, setSelectedFocus] = useState<string | null>(initialFocus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Sync state when modal opens with new initial values
  useEffect(() => {
    if (open) {
      setSelectedAvatar(initialAvatar || 'sensei')
      setSelectedGoal(initialGoal)
      setSelectedTarget(initialTarget)
      setSelectedFocus(initialFocus)
      setError('')
      setSaving(false)
    }
  }, [open, initialAvatar, initialGoal, initialTarget, initialFocus])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const isSaveDisabled =
    saving ||
    (selectedGoal === 'interview_prep' && !selectedTarget) ||
    (selectedGoal === 'deep_skill' && !selectedFocus)

  async function handleSave() {
    setSaving(true)
    setError('')
    const body: Record<string, unknown> = {
      avatar: selectedAvatar,
      reset_progress: mode === 'new',
    }
    if (selectedGoal) {
      body.goal = selectedGoal
      if (selectedGoal === 'interview_prep' && selectedTarget) body.target = selectedTarget
      if (selectedGoal === 'deep_skill' && selectedFocus) body.upskill_focus = selectedFocus
    }
    const res = await fetch('/api/user-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save')
      setSaving(false)
      return
    }
    onSaved(data.archetype)
  }

  const title = mode === 'edit' ? 'Edit Profile' : 'Start New Path'
  const primaryLabel = mode === 'edit' ? 'Save Changes' : 'Start New Path →'

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
        }}
      />

      {/* Desktop: rounded all corners */}
      <style>{`
        @media (min-width: 640px) {
          .profile-editor-panel {
            border-radius: 20px !important;
            bottom: auto !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
          }
        }
        .profile-option-card:hover {
          border-color: rgba(255,107,53,0.4) !important;
        }
      `}</style>

      {/* Modal panel */}
      <div
        className="profile-editor-panel"
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#121821',
          border: '1px solid #2a3340',
          borderRadius: '20px 20px 0 0',
          zIndex: 101,
          fontFamily: "'Inter', sans-serif",
        }}
        // Prevent overlay click from firing when clicking inside modal
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #2a3340',
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '18px',
            fontWeight: 600,
            color: '#f6fafe',
            margin: 0,
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8b96a5',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
          {/* Avatar section */}
          <div style={{ marginBottom: '28px' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6b7685',
              marginBottom: '12px',
            }}>
              Fighter
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}>
              {AVATARS.map((av) => {
                const selected = selectedAvatar === av.key
                return (
                  <button
                    key={av.key}
                    className="profile-option-card"
                    onClick={() => setSelectedAvatar(av.key)}
                    style={{
                      background: selected ? 'rgba(255,107,53,0.08)' : '#0b0f14',
                      border: selected ? '1.5px solid #ff6b35' : '1px solid #2a3340',
                      borderRadius: '12px',
                      padding: '12px 8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'border-color 150ms ease, background 150ms ease',
                    }}
                  >
                    <div style={{ fontSize: '28px', lineHeight: 1, marginBottom: '6px' }}>{av.emoji}</div>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: selected ? '#ff6b35' : '#f6fafe',
                      marginBottom: '2px',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {av.label}
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: '#6b7685',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {av.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Goal section */}
          <div style={{ marginBottom: '28px' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6b7685',
              marginBottom: '12px',
            }}>
              Experience Goal
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {GOALS.map((g) => {
                const selected = selectedGoal === g.key
                return (
                  <button
                    key={g.key}
                    className="profile-option-card"
                    onClick={() => {
                      setSelectedGoal(g.key)
                      // Reset sub-selections when goal changes
                      if (g.key !== 'interview_prep') setSelectedTarget(null)
                      if (g.key !== 'deep_skill') setSelectedFocus(null)
                    }}
                    style={{
                      background: selected ? 'rgba(255,107,53,0.08)' : '#0b0f14',
                      border: selected ? '1.5px solid #ff6b35' : '1px solid #2a3340',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'border-color 150ms ease, background 150ms ease',
                    }}
                  >
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>{g.emoji}</span>
                    <div>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: selected ? '#ff6b35' : '#f6fafe',
                        marginBottom: '2px',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {g.label}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#8b96a5',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {g.desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Target (only for interview_prep) */}
          {selectedGoal === 'interview_prep' && (
            <div style={{ marginBottom: '28px' }}>
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6b7685',
                marginBottom: '12px',
              }}>
                Target Company Type
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TARGETS.map((t) => {
                  const selected = selectedTarget === t.key
                  return (
                    <button
                      key={t.key}
                      className="profile-option-card"
                      onClick={() => setSelectedTarget(t.key)}
                      style={{
                        background: selected ? 'rgba(255,107,53,0.08)' : '#0b0f14',
                        border: selected ? '1.5px solid #ff6b35' : '1px solid #2a3340',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 150ms ease, background 150ms ease',
                      }}
                    >
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: selected ? '#ff6b35' : '#f6fafe',
                        marginBottom: '2px',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {t.label}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#8b96a5',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {t.desc}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Focus (only for deep_skill) */}
          {selectedGoal === 'deep_skill' && (
            <div style={{ marginBottom: '28px' }}>
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6b7685',
                marginBottom: '12px',
              }}>
                Focus Area
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {FOCUSES.map((f) => {
                  const selected = selectedFocus === f.key
                  return (
                    <button
                      key={f.key}
                      className="profile-option-card"
                      onClick={() => setSelectedFocus(f.key)}
                      style={{
                        background: selected ? 'rgba(255,107,53,0.08)' : '#0b0f14',
                        border: selected ? '1.5px solid #ff6b35' : '1px solid #2a3340',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'border-color 150ms ease, background 150ms ease',
                      }}
                    >
                      <span style={{ fontSize: '22px', flexShrink: 0 }}>{f.emoji}</span>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: selected ? '#ff6b35' : '#f6fafe',
                          marginBottom: '2px',
                          fontFamily: "'Inter', sans-serif",
                        }}>
                          {f.label}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#8b96a5',
                          fontFamily: "'Inter', sans-serif",
                        }}>
                          {f.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #2a3340',
          flexShrink: 0,
          background: '#121821',
        }}>
          {error && (
            <p style={{
              fontSize: '13px',
              color: '#f87171',
              fontFamily: "'Inter', sans-serif",
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8b96a5',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                padding: '12px 16px',
                borderRadius: '10px',
                flexShrink: 0,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              style={{
                flex: 1,
                padding: '13px 20px',
                background: isSaveDisabled ? 'rgba(255,107,53,0.3)' : '#ff6b35',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
                transition: 'background 150ms ease',
                letterSpacing: '0.01em',
              }}
            >
              {saving ? 'Saving...' : primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
