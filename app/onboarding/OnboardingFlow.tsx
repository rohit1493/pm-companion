'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// --- DATA ---

const EXPERIENCE_OPTIONS = [
  {
    value: '0-2',
    label: '0–2 years',
    sub: 'Aspiring or junior PM, building the fundamentals',
  },
  {
    value: '3-5',
    label: '3–5 years',
    sub: 'Early-stage PM, growing toward Senior',
  },
  {
    value: '5+',
    label: '5+ years',
    sub: 'Senior PM, sharpening leadership & strategy',
  },
]

const GOAL_OPTIONS = [
  {
    value: 'interviews',
    label: 'Prepare for PM interviews',
    sub: 'Get structured and interview-ready',
  },
  {
    value: 'trends',
    label: 'Stay updated on PM trends',
    sub: 'Cut through the noise, stay sharp',
  },
  {
    value: 'upskill',
    label: 'Upskill in a specific area',
    sub: 'Go deep on one domain',
  },
  {
    value: 'all',
    label: 'All of the above',
    sub: 'I want the full picture',
  },
]

const TOPICS = [
  'AI',
  'Analytics',
  'GTM',
  'Product Strategy',
  'Growth',
  'Design & UX',
  'Startups',
  'B2B/SaaS',
  'PM Career',
  'Case Studies & Teardowns',
]

// --- HELPERS ---

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// --- PROGRESS BAR ---

function ProgressBar({ step }: { step: number }) {
  const pct = (step / 3) * 100
  return (
    <div style={{ padding: '24px 24px 0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          PM Companion
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}>
          Step {step} of 3
        </span>
      </div>
      <div style={{
        height: '3px',
        background: '#E2E8F0',
        borderRadius: '99px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--indigo)',
          borderRadius: '99px',
          transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  )
}

// --- RADIO CARD ---

function RadioCard({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string
  sub: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '18px 20px',
        background: selected ? '#FAFAFE' : 'var(--white)',
        border: `1.5px solid ${selected ? 'var(--indigo)' : 'var(--border)'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none',
        boxShadow: selected ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#A5B4FC'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
        }
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.2)'
      }}
      onBlur={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
        } else {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'
        }
      }}
    >
      {/* Radio dot */}
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: `2px solid ${selected ? 'var(--indigo)' : '#CBD5E1'}`,
        background: selected ? 'var(--indigo)' : 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 200ms ease',
      }}>
        {selected && (
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'white',
          }} />
        )}
      </div>
      <div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          fontWeight: 500,
          color: selected ? 'var(--indigo)' : 'var(--text-primary)',
          lineHeight: 1.3,
          transition: 'color 200ms ease',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginTop: '3px',
          lineHeight: 1.4,
        }}>
          {sub}
        </div>
      </div>
    </button>
  )
}

// --- TOPIC CHIP ---

function TopicChip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      aria-pressed={selected}
      style={{
        padding: '9px 16px',
        borderRadius: '99px',
        border: `1.5px solid ${selected ? 'var(--indigo)' : '#E2E8F0'}`,
        background: selected ? 'var(--indigo)' : 'white',
        color: selected ? 'white' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        fontWeight: selected ? 500 : 400,
        cursor: disabled && !selected ? 'not-allowed' : 'pointer',
        opacity: disabled && !selected ? 0.4 : 1,
        transition: 'all 180ms ease',
        outline: 'none',
        whiteSpace: 'nowrap',
      }}
      onFocus={(e) => {
        if (!disabled || selected) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.2)'
        }
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
      }}
    >
      {label}
    </button>
  )
}

// --- STEP WRAPPER (handles slide animation) ---

function StepWrapper({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 300ms ease, transform 300ms ease',
    }}>
      {children}
    </div>
  )
}

// --- MAIN COMPONENT ---

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [experience, setExperience] = useState('')
  const [goal, setGoal] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function toggleTopic(topic: string) {
    setTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : prev.length < 3
        ? [...prev, topic]
        : prev
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      let sessionId = localStorage.getItem('pm_session_id')
      if (!sessionId) {
        sessionId = generateSessionId()
        localStorage.setItem('pm_session_id', sessionId)
      }

      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_level: experience,
          primary_goal: goal,
          topics,
          session_id: sessionId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      // Store selections for done page
      localStorage.setItem('pm_goal', goal)
      localStorage.setItem('pm_topics', JSON.stringify(topics))

      router.push('/onboarding/done')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }
    setSubmitting(false)
  }

  const canProceed = step === 1 ? !!experience : step === 2 ? !!goal : topics.length >= 1

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Progress */}
      <ProgressBar step={step} />

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px 120px',
      }}>

        {/* -- STEP 1 -- */}
        {step === 1 && (
          <StepWrapper stepKey={1}>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(24px, 6vw, 30px)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              marginBottom: '8px',
            }}>
              Where are you in your<br />PM journey?
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '28px',
            }}>
              We&apos;ll tailor your learning path accordingly.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  selected={experience === opt.value}
                  onClick={() => setExperience(opt.value)}
                />
              ))}
            </div>
          </StepWrapper>
        )}

        {/* -- STEP 2 -- */}
        {step === 2 && (
          <StepWrapper stepKey={2}>
            <button
              onClick={() => setStep(1)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                padding: '0',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                outline: 'none',
              }}
              onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--indigo)' }}
              onBlur={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
            >
              ← Back
            </button>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(24px, 6vw, 30px)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              marginBottom: '8px',
            }}>
              What&apos;s your #1 goal<br />right now?
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '28px',
            }}>
              This shapes what shows up in your feed.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {GOAL_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  selected={goal === opt.value}
                  onClick={() => setGoal(opt.value)}
                />
              ))}
            </div>
          </StepWrapper>
        )}

        {/* -- STEP 3 -- */}
        {step === 3 && (
          <StepWrapper stepKey={3}>
            <button
              onClick={() => setStep(2)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                padding: '0',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                outline: 'none',
              }}
              onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--indigo)' }}
              onBlur={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
            >
              ← Back
            </button>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(24px, 6vw, 30px)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              marginBottom: '8px',
            }}>
              What topics matter most?
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}>
              Pick up to 3.
            </p>
            {/* Live counter */}
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: topics.length === 3 ? 'var(--indigo)' : 'var(--text-muted)',
              marginBottom: '20px',
              fontWeight: topics.length === 3 ? 500 : 400,
              transition: 'color 200ms ease',
            }}>
              {topics.length} of 3 selected
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '8px',
            }}>
              {TOPICS.map((topic) => (
                <TopicChip
                  key={topic}
                  label={topic}
                  selected={topics.includes(topic)}
                  disabled={topics.length >= 3}
                  onClick={() => toggleTopic(topic)}
                />
              ))}
            </div>
          </StepWrapper>
        )}

      </div>

      {/* Sticky CTA — always visible at bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
        padding: '20px 24px 32px',
        zIndex: 20,
      }}>
        {error && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#EF4444',
            marginBottom: '10px',
            textAlign: 'center',
          }} role="alert">
            {error}
          </p>
        )}
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <button
            type="button"
            disabled={!canProceed || submitting}
            onClick={() => {
              if (step < 3) setStep(step + 1)
              else handleSubmit()
            }}
            style={{
              width: '100%',
              padding: '16px',
              background: canProceed ? 'var(--indigo)' : '#E2E8F0',
              color: canProceed ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '12px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              fontWeight: 500,
              cursor: canProceed ? 'pointer' : 'not-allowed',
              transition: 'all 200ms ease',
              outline: 'none',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={(e) => {
              if (canProceed) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--indigo-dark)'
              }
            }}
            onMouseLeave={(e) => {
              if (canProceed) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--indigo)'
              }
            }}
            onFocus={(e) => {
              if (canProceed) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.3)'
              }
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
            aria-disabled={!canProceed}
          >
            {submitting ? 'Saving...' : step < 3 ? 'Next →' : 'Build my plan →'}
          </button>
        </div>
      </div>
    </div>
  )
}
