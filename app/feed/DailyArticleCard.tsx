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
  const [clicked, setClicked] = useState(false)
  const [read, setRead] = useState(false)
  const [marking, setMarking] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetch('/api/daily-article')
      .then(r => r.json())
      .then(data => {
        if (data.article) {
          setArticle(data.article)
          // Check if already marked read today
          const readKey = `pm_read_${today}_${data.article.id}`
          if (localStorage.getItem(readKey) === 'true') {
            setRead(true)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [today])

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(timeUntilMidnight()), 60000)
    return () => clearInterval(interval)
  }, [])

  async function handleMarkRead() {
    if (!article || marking) return
    setMarking(true)
    try {
      await fetch('/api/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: article.id }),
      })
      setRead(true)
      localStorage.setItem(`pm_read_${today}_${article.id}`, 'true')
    } catch (err) {
      console.error(err)
    } finally {
      setMarking(false)
    }
  }

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
      border: `1.5px solid ${read ? '#10B981' : '#4F46E5'}`,
      overflow: 'hidden',
      boxShadow: read
        ? '0 4px 24px rgba(16,185,129,0.08)'
        : '0 4px 24px rgba(79,70,229,0.08)',
      transition: 'border-color 400ms ease, box-shadow 400ms ease',
    }}>
      {/* Header bar */}
      <div style={{
        background: read ? '#10B981' : '#4F46E5',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background 400ms ease',
      }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: 'white',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {read ? '✓ Read today' : "Today's Read"}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px',
          color: 'rgba(255,255,255,0.7)',
        }}>
          {read ? 'New article tomorrow' : `New in ${timeLeft}`}
        </span>
      </div>

      {/* Article content */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setClicked(true)}
        style={{ display: 'block', padding: '20px 20px 12px', textDecoration: 'none' }}
      >
        {/* Topics */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {(article.topics || []).slice(0, 2).map((t) => (
            <span key={t} style={{
              padding: '3px 10px',
              background: read ? '#ECFDF5' : '#EEF2FF',
              color: read ? '#059669' : '#4F46E5',
              borderRadius: '99px',
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'background 400ms ease, color 400ms ease',
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

        {/* Meta row */}
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
          {!read && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              color: '#4F46E5',
            }}>
              Read →
            </span>
          )}
        </div>
      </a>

      {/* Mark as read button — appears after user clicks the article */}
      {!read && clicked && (
        <div style={{
          padding: '0 20px 20px',
          opacity: clicked ? 1 : 0,
          transform: clicked ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
        }}>
          <button
            onClick={handleMarkRead}
            disabled={marking}
            style={{
              width: '100%',
              padding: '12px',
              background: '#F0FDF4',
              border: '1.5px solid #10B981',
              borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#059669',
              cursor: marking ? 'wait' : 'pointer',
              transition: 'all 200ms ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#DCFCE7'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F0FDF4'
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(16,185,129,0.2)'
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            {marking ? 'Saving...' : '✓ Mark as read'}
          </button>
        </div>
      )}

      {/* Already read confirmation */}
      {read && (
        <div style={{
          padding: '0 20px 20px',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#10B981',
            fontWeight: 500,
          }}>
            Great work. Come back tomorrow for your next read.
          </p>
        </div>
      )}
    </div>
  )
}
