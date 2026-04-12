'use client'

import { useState, useEffect } from 'react'

type Phase = 'slideUp' | 'gap' | 'dropIn' | 'done'

export default function UnlockAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('slideUp')
  const [exitVisible, setExitVisible] = useState(true)
  const [enterVisible, setEnterVisible] = useState(false)

  useEffect(() => {
    // Trigger exit transition on next frame so CSS picks it up
    const t0 = setTimeout(() => setExitVisible(false), 20)
    const t1 = setTimeout(() => setPhase('gap'), 300)
    const t2 = setTimeout(() => setPhase('dropIn'), 380)
    // rAF ensures the dropIn element is mounted before we start the transition
    const t3 = setTimeout(() => requestAnimationFrame(() => setEnterVisible(true)), 400)
    const t4 = setTimeout(() => { setPhase('done'); onComplete() }, 680)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  return (
    <div style={{ overflow: 'hidden', paddingBottom: '16px' }}>
      {/* Completed card — slides up and fades out */}
      {phase === 'slideUp' && (
        <div style={{
          padding: '20px',
          background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: '14px',
          marginBottom: '16px',
          opacity: exitVisible ? 1 : 0,
          transform: exitVisible ? 'translateY(0) scale(1)' : 'translateY(-32px) scale(0.95)',
          transition: 'opacity 280ms cubic-bezier(0.4,0,1,1), transform 280ms cubic-bezier(0.4,0,1,1)',
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#4ade80',
          }}>
            ✓ Article read
          </span>
        </div>
      )}

      {/* Brief gap between cards */}
      {phase === 'gap' && <div style={{ height: '64px' }} />}

      {/* Next article card — drops in with overshoot */}
      {phase === 'dropIn' && (
        <div style={{
          padding: '20px',
          background: '#121821',
          border: '1.5px solid var(--indigo)',
          borderRadius: '14px',
          boxShadow: '0 0 0 3px rgba(255,107,53,0.08)',
          opacity: enterVisible ? 1 : 0,
          transform: enterVisible ? 'translateY(0)' : 'translateY(-16px)',
          transition: 'opacity 300ms ease, transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--indigo)',
          }}>
            Next article unlocked ↓
          </p>
        </div>
      )}
    </div>
  )
}

/*
  Timing:
    0ms      → exitVisible=false fires → completed card fades + slides up (280ms)
    300ms    → phase='gap'
    380ms    → phase='dropIn' (card mounts, still invisible)
    400ms    → enterVisible=true → drop-in transition starts (300ms, spring)
    680ms    → onComplete() fires → FeedClient re-fetches feed
*/
