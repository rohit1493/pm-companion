'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const GOAL_LABELS: Record<string, string> = {
  interviews: 'Prepare for PM interviews',
  trends: 'Stay updated on PM trends',
  upskill: 'Upskill in a specific area',
  all: 'All of the above',
}

export default function DonePage() {
  const [goal, setGoal] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setGoal(localStorage.getItem('pm_goal') || '')
    const t = localStorage.getItem('pm_topics')
    setTopics(t ? JSON.parse(t) : [])
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}>
        {/* Icon */}
        <div style={{
          fontSize: '48px',
          marginBottom: '24px',
          textAlign: 'center',
        }} aria-hidden="true">
          🎯
        </div>

        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 'clamp(28px, 7vw, 36px)',
          fontWeight: 400,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          textAlign: 'center',
          marginBottom: '10px',
        }}>
          Your PM learning plan<br />is ready.
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginBottom: '36px',
          lineHeight: 1.6,
        }}>
          Every day, one article. Proven you read it.<br />
          Actually getting better — not just consuming.
        </p>

        {/* Summary card */}
        <div style={{
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '28px',
        }}>
          {!goal && topics.length === 0 ? (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}>
              Your plan is saved. Sign in to see it.
            </p>
          ) : (
            <>
              {goal && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}>
                    Goal
                  </p>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}>
                    {GOAL_LABELS[goal] || goal}
                  </p>
                </div>
              )}
              {topics.length > 0 && (
                <div>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                  }}>
                    Focus areas
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {topics.map((t) => (
                      <span key={t} style={{
                        padding: '6px 14px',
                        background: 'var(--indigo-light)',
                        color: 'var(--indigo)',
                        borderRadius: '99px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '13px',
                        fontWeight: 500,
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/auth"
          style={{
            display: 'block',
            width: '100%',
            padding: '16px',
            background: 'var(--indigo)',
            color: 'white',
            borderRadius: '12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            fontWeight: 500,
            textAlign: 'center',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            transition: 'background 200ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--indigo-dark)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--indigo)' }}
        >
          Start Learning →
        </Link>
      </div>
    </div>
  )
}
