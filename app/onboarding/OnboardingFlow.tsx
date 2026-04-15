'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { assignArchetype, type Archetype } from '@/lib/archetypes'
import LoadingScreen from './LoadingScreen'
import { createClient } from '@/lib/supabase-browser'
import { analytics } from '@/lib/analytics'
import { getAvatarComponent } from '@/components/avatars'
import { getTheme } from '@/lib/archetype-themes'

// --- HELPERS ---

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// --- REUSABLE COMPONENTS ---

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
        background: selected ? '#1a2332' : 'var(--white)',
        border: `1.5px solid ${selected ? 'var(--indigo)' : 'var(--border)'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none',
        boxShadow: selected ? '0 0 0 3px rgba(255,107,53,0.08)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#ffb89a'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
        }
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: `2px solid ${selected ? 'var(--indigo)' : '#2a3340'}`,
        background: selected ? 'var(--indigo)' : 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 200ms ease',
      }}>
        {selected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white' }} />}
      </div>
      <div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          fontWeight: 500,
          color: selected ? 'var(--indigo)' : 'var(--text-primary)',
          lineHeight: 1.3,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
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

function CheckCard({
  label,
  selected,
  onClick,
}: {
  label: string
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
        background: selected ? '#1a2332' : '#121821',
        border: `1.5px solid ${selected ? 'var(--indigo)' : 'var(--border)'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none',
        boxShadow: selected ? '0 0 0 3px rgba(255,107,53,0.08)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#ffb89a'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
        }
      }}
    >
      {/* Checkbox indicator */}
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '5px',
        border: `2px solid ${selected ? 'var(--indigo)' : '#2a3340'}`,
        background: selected ? 'var(--indigo)' : 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 200ms ease',
      }}>
        {selected && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '15px',
        fontWeight: selected ? 500 : 400,
        color: selected ? '#f6fafe' : 'var(--text-secondary)',
        transition: 'color 200ms ease',
      }}>
        {label}
      </span>
    </button>
  )
}

function StepWrapper({ children }: { children: React.ReactNode }) {
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

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        padding: '0',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        outline: 'none',
      }}
    >
      ← Back
    </button>
  )
}

function Question({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <h1 style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 'clamp(24px, 6vw, 30px)',
        fontWeight: 400,
        color: 'var(--text-primary)',
        lineHeight: 1.25,
        marginBottom: '8px',
      }}>
        {title}
      </h1>
      {sub && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: 'var(--text-muted)',
          marginBottom: '28px',
        }}>
          {sub}
        </p>
      )}
    </>
  )
}

// --- ARCHETYPE REVEAL ---

function ArchetypeReveal({
  archetype,
  submitting,
  error,
  onStart,
}: {
  archetype: Archetype
  submitting: boolean
  error: string
  onStart: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const AvatarComponent = getAvatarComponent(archetype?.key)
  const theme = getTheme(archetype?.key)

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.96)',
      transition: 'opacity 400ms ease, transform 400ms ease',
      textAlign: 'center',
      padding: '8px 0',
    }}>
      {/* Avatar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div
          className="avatar-entrance avatar-glow-pulse"
          style={{
            width: '128px',
            height: '128px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)',
            marginBottom: '16px',
          }}
        >
          <AvatarComponent
            size={96}
            primaryColor={theme.primary}
            secondaryColor={theme.secondary}
            tertiaryColor={theme.tertiary}
            animated={true}
          />
        </div>
      </div>

      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#6b7685',
        marginBottom: '12px',
      }}>
        You are
      </p>

      <h1 style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 'clamp(28px, 7vw, 36px)',
        fontWeight: 400,
        color: '#ff6b35',
        textShadow: '0 0 20px rgba(255,107,53,0.35)',
        lineHeight: 1.2,
        marginBottom: '16px',
        letterSpacing: '-0.02em',
      }}>
        {archetype.display}
      </h1>

      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '15px',
        color: '#8b96a5',
        lineHeight: 1.6,
        maxWidth: '320px',
        margin: '0 auto 32px',
        animation: 'archetypeFadeUp 0.5s ease-out 0.3s forwards',
        opacity: 0,
      }}>
        {archetype.tagline}
      </p>

      <div style={{
        background: 'rgba(255,107,53,0.08)',
        border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '32px',
        textAlign: 'left',
        animation: 'archetypeFadeUp 0.5s ease-out 0.6s forwards',
        opacity: 0,
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: '#ff6b35',
          marginBottom: '6px',
        }}>
          Your 10-article path is ready
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: '#8b96a5',
          lineHeight: 1.5,
        }}>
          Curated for your archetype. Article 1 is waiting.
        </p>
      </div>

      {error && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: '#EF4444',
          marginBottom: '12px',
        }} role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={submitting}
        style={{
          width: '100%',
          padding: '16px',
          background: submitting ? '#2a3340' : '#ff6b35',
          color: submitting ? '#6b7685' : 'white',
          border: 'none',
          borderRadius: '12px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          fontWeight: 500,
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'background 200ms ease',
          outline: 'none',
          animation: 'archetypeFadeUp 0.5s ease-out 0.8s forwards',
          opacity: 0,
          boxShadow: submitting ? 'none' : '0 4px 20px rgba(255,107,53,0.3)',
        }}
        onMouseEnter={(e) => {
          if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#e05a28'
        }}
        onMouseLeave={(e) => {
          if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#ff6b35'
        }}
      >
        {submitting ? 'Setting up your path...' : 'Start reading →'}
      </button>
    </div>
  )
}

// --- PROGRESS BAR ---

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100
  return (
    <div style={{ padding: '24px 24px 0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          PM Dojo
        </span>
        {current < total && (
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}>
            Step {current} of {total - 1}
          </span>
        )}
      </div>
      <div style={{ height: '3px', background: '#2a3340', borderRadius: '99px', overflow: 'hidden' }}>
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

// --- MAIN ---

type Goal = 'interview_prep' | 'deep_skill' | 'stay_updated' | ''
type Target = 'big_tech' | 'startup_b2b' | ''
type UpskillFocus = 'ai' | 'growth' | 'strategy' | 'ux' | ''
type Experience = '0-2' | '3-5' | '5+' | ''

export default function OnboardingFlow() {
  const router = useRouter()

  useEffect(() => { analytics.onboardingStarted() }, [])

  // Answers
  const [goal, setGoal] = useState<Goal>('')
  const [target, setTarget] = useState<Target>('')
  const [upskillFocus, setUpskillFocus] = useState<UpskillFocus>('')
  const [experience, setExperience] = useState<Experience>('')
  const [weakAreas, setWeakAreas] = useState<string[]>([])

  // Navigation
  const [step, setStep] = useState(1)
  const [showLoader, setShowLoader] = useState(false)

  // Archetype (computed when reaching reveal)
  const [archetype, setArchetype] = useState<Archetype | null>(null)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Total steps per path.
  const totalSteps = goal === 'stay_updated' ? 2 : goal === 'deep_skill' ? 4 : 5

  // Stabilised total for the progress bar: on step 1 the goal hasn't been
  // confirmed yet, so keep the label fixed at "Step 1 of 4" (4-step baseline)
  // instead of jumping as the user clicks different options.
  const progressBarTotal = step === 1 ? 5 : totalSteps

  function handleBack() {
    if (step === 3 && goal === 'deep_skill') {
      setExperience('') // deep_skill: step 3 is experience; reset on back
    }
    if (step === 3 && goal !== 'deep_skill') {
      setTarget('') // interview_prep: step 3 is target; reset on back
    }
    if (step === 4) {
      setWeakAreas([]) // interview_prep: step 4 is weakAreas; reset on back
    }
    setStep((s) => s - 1)
  }

  function computeAndReveal() {
    setShowLoader(true)
  }

  const handleLoaderComplete = useCallback(() => {
    const a = assignArchetype(goal, target, upskillFocus)
    setArchetype(a)
    setStep(totalSteps)
    setShowLoader(false)
  }, [goal, target, upskillFocus, totalSteps])

  async function handleStart() {
    if (!archetype) return
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
          goal,
          target_company: target,
          upskill_focus: upskillFocus,
          experience_level: experience,
          weak_areas: weakAreas,
          session_id: sessionId,
          archetype: archetype.key,
          archetype_display: archetype.display,
          archetype_tagline: archetype.tagline,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to save profile')
      }

      // Store archetype locally
      localStorage.setItem('pm_archetype', archetype.key)
      localStorage.setItem('pm_goal', goal)
      analytics.onboardingCompleted(archetype.key, archetype.display)

      // If user is already authenticated, link profile directly and go to feed
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await fetch('/api/link-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
        localStorage.removeItem('pm_session_id')
        router.push('/feed')
      } else {
        router.push('/auth')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  const WEAK_AREA_OPTIONS = [
    'Metrics & Analytics',
    'Stakeholder management',
    'Technical depth',
    'Strategy & vision',
    'Execution & delivery',
    'Communication',
  ]

  function toggleWeakArea(area: string) {
    setWeakAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  if (showLoader) {
    return <LoadingScreen onComplete={handleLoaderComplete} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <ProgressBar current={step} total={progressBarTotal} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px 120px',
      }}>

        {/* Step 1: What brings you here? */}
        {step === 1 && (
          <StepWrapper key="step1">
            <Question
              title="What brings you here?"
              sub="We'll build your personalised 10-article path."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <RadioCard
                label="Crack PM interviews"
                sub="Get structured and interview-ready fast"
                selected={goal === 'interview_prep'}
                onClick={() => setGoal('interview_prep')}
              />
              <RadioCard
                label="Go deep on a skill"
                sub="Master AI, growth, strategy, or UX"
                selected={goal === 'deep_skill'}
                onClick={() => setGoal('deep_skill')}
              />
              <RadioCard
                label="Stay updated on PM trends"
                sub="Read widely, stay sharp, no path needed"
                selected={goal === 'stay_updated'}
                onClick={() => setGoal('stay_updated')}
              />
            </div>
          </StepWrapper>
        )}

        {/* Interview prep — Step 2: Experience */}
        {step === 2 && goal === 'interview_prep' && (
          <StepWrapper key="step2-ip">
            <BackBtn onClick={handleBack} />
            <Question
              title="Where are you in your PM journey?"
              sub="Helps us calibrate depth and difficulty."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {([
                { value: '0-2', label: '0–2 years', sub: 'Aspiring or junior PM' },
                { value: '3-5', label: '3–5 years', sub: 'Early PM, growing toward Senior' },
                { value: '5+', label: '5+ years', sub: 'Senior PM, sharpening strategy' },
              ] as const).map((opt) => (
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

        {/* Interview prep — Step 3: Target company */}
        {step === 3 && goal === 'interview_prep' && (
          <StepWrapper key="step3-ip">
            <BackBtn onClick={handleBack} />
            <Question
              title="What's your target?"
              sub="Your path gets calibrated to the interview style."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <RadioCard
                label="Big Tech / FAANG"
                sub="Google, Meta, Amazon, Apple, Microsoft"
                selected={target === 'big_tech'}
                onClick={() => setTarget('big_tech')}
              />
              <RadioCard
                label="Startup / B2B / Scale-up"
                sub="Series A–D, high-growth, generalist PMs"
                selected={target === 'startup_b2b'}
                onClick={() => setTarget('startup_b2b')}
              />
            </div>
          </StepWrapper>
        )}

        {/* Interview prep — Step 4: Weak areas (optional) */}
        {step === 4 && goal === 'interview_prep' && (
          <StepWrapper key="step4-ip">
            <BackBtn onClick={handleBack} />
            <Question
              title="Where do you want to improve?"
              sub="Optional — pick any that apply."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {WEAK_AREA_OPTIONS.map((area) => (
                <CheckCard
                  key={area}
                  label={area}
                  selected={weakAreas.includes(area)}
                  onClick={() => toggleWeakArea(area)}
                />
              ))}
            </div>
          </StepWrapper>
        )}

        {/* Deep skill — Step 2: Focus area */}
        {step === 2 && goal === 'deep_skill' && (
          <StepWrapper key="step2-ds">
            <BackBtn onClick={handleBack} />
            <Question
              title="What do you want to master?"
              sub="We'll build a path focused on your chosen domain."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {([
                { value: 'ai', label: 'AI & Machine Learning', sub: 'AI products, LLMs, and modern PM skills' },
                { value: 'growth', label: 'Growth & Analytics', sub: 'Metrics, loops, retention, and revenue' },
                { value: 'strategy', label: 'Product Strategy', sub: 'Vision, prioritisation, and competitive thinking' },
                { value: 'ux', label: 'Design & UX', sub: 'Research, interaction design, and user insight' },
              ] as const).map((opt) => (
                <RadioCard
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  selected={upskillFocus === opt.value}
                  onClick={() => setUpskillFocus(opt.value)}
                />
              ))}
            </div>
          </StepWrapper>
        )}

        {/* Deep skill — Step 3: Experience */}
        {step === 3 && goal === 'deep_skill' && (
          <StepWrapper key="step3-ds">
            <BackBtn onClick={handleBack} />
            <Question
              title="Where are you in your PM journey?"
              sub="Helps us calibrate depth and difficulty."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {([
                { value: '0-2', label: '0–2 years', sub: 'Aspiring or junior PM' },
                { value: '3-5', label: '3–5 years', sub: 'Early PM, growing toward Senior' },
                { value: '5+', label: '5+ years', sub: 'Senior PM, sharpening strategy' },
              ] as const).map((opt) => (
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

        {/* Archetype Reveal (last step for all paths) */}
        {archetype && step === totalSteps && (
          <ArchetypeReveal
            archetype={archetype}
            submitting={submitting}
            error={error}
            onStart={handleStart}
          />
        )}

      </div>

      {/* Sticky CTA (not shown on reveal step) */}
      {step < totalSteps && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
          padding: '20px 24px 32px',
          zIndex: 20,
        }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            {(() => {
              // Compute canProceed and next step
              let canProceed = false
              let nextStep = step + 1

              if (step === 1) {
                canProceed = !!goal
                if (goal === 'stay_updated') nextStep = totalSteps // skip to reveal
              } else if (goal === 'interview_prep') {
                if (step === 2) canProceed = !!experience
                if (step === 3) canProceed = !!target
                if (step === 4) canProceed = true // optional
              } else if (goal === 'deep_skill') {
                if (step === 2) canProceed = !!upskillFocus
                if (step === 3) canProceed = !!experience
              }

              const isLastBeforeReveal =
                (goal === 'stay_updated' && step === 1) ||
                (goal === 'interview_prep' && step === 4) ||
                (goal === 'deep_skill' && step === 3)

              function advance() {
                if (isLastBeforeReveal) {
                  computeAndReveal()
                } else {
                  setStep(nextStep)
                }
              }

              return (
                <button
                  type="button"
                  disabled={!canProceed}
                  onClick={advance}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: canProceed ? 'var(--indigo)' : '#2a3340',
                    color: canProceed ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '12px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: canProceed ? 'pointer' : 'not-allowed',
                    transition: 'all 200ms ease',
                    outline: 'none',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    if (canProceed) (e.currentTarget as HTMLButtonElement).style.background = 'var(--indigo-dark)'
                  }}
                  onMouseLeave={(e) => {
                    if (canProceed) (e.currentTarget as HTMLButtonElement).style.background = 'var(--indigo)'
                  }}
                >
                  {isLastBeforeReveal ? 'See my archetype →' : 'Next →'}
                </button>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
