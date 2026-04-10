'use client'

import { useEffect, useState } from 'react'

type Article = {
  id: string
  title: string
  url: string
  source: string
  published_at: string
  summary: string
  topics: string[]
  reading_time_minutes: number
}

function timeUntilMidnight(): string {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${mins}m`
}

export default function DailyArticleCard() {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(timeUntilMidnight())

  useEffect(() => {
    fetch('/api/daily-article')
      .then(r => r.json())
      .then(data => {
        setArticle(data.article || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(timeUntilMidnight())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div style={{
        margin: '16px',
        borderRadius: '16px',
        background: 'white',
        border: '1px solid #E2E8F0',
        padding: '24px',
      }}>
        <div style={{ width: '120px', height: '12px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '12px' }} />
        <div style={{ width: '90%', height: '18px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '8px' }} />
        <div style={{ width: '70%', height: '18px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '16px' }} />
        <div style={{ width: '40%', height: '12px', background: '#F8FAFC', borderRadius: '4px' }} />
      </div>
    )
  }

  if (!article) return null

  return (
    <div style={{
      margin: '16px',
      borderRadius: '16px',
      background: 'white',
      border: '1.5px solid #4F46E5',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(79,70,229,0.08)',
    }}>
      {/* Header bar */}
      <div style={{
        background: '#4F46E5',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: 'white',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Today&apos;s Read
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px',
          color: 'rgba(255,255,255,0.7)',
        }}>
          New in {timeLeft}
        </span>
      </div>

      {/* Article content */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          padding: '20px',
          textDecoration: 'none',
        }}
      >
        {/* Topics */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {(article.topics || []).slice(0, 2).map((t) => (
            <span key={t} style={{
              padding: '3px 10px',
              background: '#EEF2FF',
              color: '#4F46E5',
              borderRadius: '99px',
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {t}
            </span>
          ))}
        </div>

        {/* Title */}
        <p style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 'clamp(17px, 4vw, 20px)',
          fontWeight: 400,
          color: '#1E293B',
          lineHeight: 1.35,
          marginBottom: '10px',
        }}>
          {article.title}
        </p>

        {/* Summary */}
        {article.summary && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#64748B',
            lineHeight: 1.5,
            marginBottom: '14px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {article.summary}
          </p>
        )}

        {/* Meta + CTA row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: '#94A3B8',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 500, color: '#64748B' }}>{article.source}</span>
            <span>·</span>
            <span>{article.reading_time_minutes} min read</span>
          </div>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: '#4F46E5',
          }}>
            Read →
          </span>
        </div>
      </a>
    </div>
  )
}
