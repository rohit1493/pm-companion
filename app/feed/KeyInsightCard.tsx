'use client'

import { useState, useEffect } from 'react'
import { analytics } from '@/lib/analytics'

type QuizArticle = {
  id: string
  title: string
  key_insight: string | null
}

export default function KeyInsightCard({
  articles,
  onDone,
}: {
  articles: QuizArticle[]
  onDone: () => void
}) {
  const withInsights = articles.filter((a) => a.key_insight)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (withInsights.length > 0) {
      analytics.keyInsightViewed(withInsights.length)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (withInsights.length === 0) {
      onDone()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withInsights.length])

  if (withInsights.length === 0) {
    return null
  }

  const current = withInsights[index]
  const isLast = index >= withInsights.length - 1

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1208 0%, #2d1a0e 100%)',
      border: '1px solid rgba(255,107,53,0.3)',
      borderRadius: '16px',
      padding: '28px 24px',
      marginBottom: '16px',
      color: 'white',
      boxShadow: `0 0 32px var(--archetype-glow, rgba(255, 107, 53, 0.2))`,
      animation: 'insightReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      animationFillMode: 'backwards',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#ff8c5a',
          }}>
            Key Insight
          </span>
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          color: '#ff6b35',
        }}>
          {index + 1} / {withInsights.length}
        </span>
      </div>

      {/* Article title */}
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
        color: '#ffb89a',
        marginBottom: '10px',
        lineHeight: 1.4,
      }}>
        {current.title.length > 60 ? current.title.slice(0, 60) + '…' : current.title}
      </p>

      {/* Insight */}
      <p style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: '20px',
        fontWeight: 400,
        color: 'white',
        lineHeight: 1.6,
        marginBottom: '28px',
        animation: 'insightTextFade 0.6s ease-out 0.3s forwards',
        opacity: 0,
      }}>
        &ldquo;{current.key_insight}&rdquo;
      </p>

      {/* Progress dots */}
      {withInsights.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
          {withInsights.map((_, i) => (
            <div key={i} style={{
              width: i === index ? '20px' : '6px',
              height: '6px',
              borderRadius: '99px',
              background: i === index ? '#ff6b35' : '#2a3340',
              transition: 'width 200ms ease, background 200ms ease',
            }} />
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => {
          if (isLast) {
            onDone()
          } else {
            setIndex(index + 1)
          }
        }}
        style={{
          width: '100%',
          padding: '14px',
          background: 'rgba(255,255,255,0.12)',
          color: 'white',
          border: '1.5px solid rgba(255,255,255,0.2)',
          borderRadius: '10px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          transition: 'background 150ms ease',
          backdropFilter: 'blur(4px)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)' }}
      >
        {isLast ? 'Back to your path →' : 'Next insight →'}
      </button>
    </div>
  )
}
