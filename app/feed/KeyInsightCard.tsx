'use client'

import { useState } from 'react'

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

  if (withInsights.length === 0) {
    onDone()
    return null
  }

  const current = withInsights[index]
  const isLast = index >= withInsights.length - 1

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
      border: '1px solid #3730A3',
      borderRadius: '16px',
      padding: '28px 24px',
      marginBottom: '16px',
      color: 'white',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#A5B4FC',
          }}>
            Key Insight
          </span>
        </div>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          color: '#6366F1',
        }}>
          {index + 1} / {withInsights.length}
        </span>
      </div>

      {/* Article title */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        color: '#818CF8',
        marginBottom: '10px',
        lineHeight: 1.4,
      }}>
        {current.title.length > 60 ? current.title.slice(0, 60) + '…' : current.title}
      </p>

      {/* Insight */}
      <p style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: '20px',
        fontWeight: 400,
        color: 'white',
        lineHeight: 1.6,
        marginBottom: '28px',
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
              background: i === index ? '#A5B4FC' : '#3730A3',
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
          fontFamily: "'DM Sans', sans-serif",
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
