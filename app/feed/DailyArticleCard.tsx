'use client'

import { useEffect, useState } from 'react'
import { getInterviewAngle } from '@/lib/interview-angles'

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
  const [showReflection, setShowReflection] = useState(false)
  const [reflection, setReflection] = useState('')
  const [savedReflection, setSavedReflection] = useState<string | null>(null)
  const [savingReflection, setSavingReflection] = useState(false)
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null)

  useEffect(() => {
    const todayDate = new Date().toISOString().split('T')[0]
    fetch('/api/daily-article')
      .then(r => r.json())
      .then(data => {
        if (data.article) {
          setArticle(data.article)
          if (data.primaryGoal) setPrimaryGoal(data.primaryGoal)
          // Server is authoritative for read state
          if (data.read) {
            setRead(true)
            if (data.reflection) setSavedReflection(data.reflection)
          } else {
            // Fallback: check localStorage
            const readKey = `pm_read_${todayDate}_${data.article.id}`
            if (localStorage.getItem(readKey) === 'true') setRead(true)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(timeUntilMidnight()), 60000)
    return () => clearInterval(interval)
  }, [])

  async function handleMarkRead() {
    if (!article || marking) return
    setMarking(true)
    const todayDate = new Date().toISOString().split('T')[0]
    try {
      await fetch('/api/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: article.id }),
      })
      setRead(true)
      setShowReflection(true)
      localStorage.setItem(`pm_read_${todayDate}_${article.id}`, 'true')
    } catch (err) {
      console.error(err)
    } finally {
      setMarking(false)
    }
  }

  async function handleSaveReflection() {
    if (!article || savingReflection || !reflection.trim()) return
    setSavingReflection(true)
    try {
      await fetch('/api/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: article.id, reflection: reflection.trim() }),
      })
      setSavedReflection(reflection.trim())
      setShowReflection(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingReflection(false)
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

      {/* Interview angle — shown for users with interview prep goal */}
      {primaryGoal === 'interviews' && article && (() => {
        const angle = getInterviewAngle(article.topics || [])
        if (!angle) return null
        return (
          <div style={{
            margin: '0 20px 16px',
            background: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: '12px',
            padding: '14px 16px',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#92400E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Interview angle
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              color: '#78350F',
              marginBottom: '6px',
              lineHeight: 1.4,
            }}>
              "{angle.question}"
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px',
              color: '#92400E',
              lineHeight: 1.5,
            }}>
              {angle.tip}
            </p>
          </div>
        )
      })()}

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

      {/* Reflection prompt — appears right after marking as read */}
      {read && showReflection && !savedReflection && (
        <div style={{
          padding: '0 20px 20px',
          animation: 'fadeUp 300ms ease forwards',
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            color: '#1E293B',
            marginBottom: '8px',
          }}>
            What's one thing you'll apply from this?
          </p>
          <textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="Write a quick thought... (optional)"
            maxLength={500}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1.5px solid #E2E8F0',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#1E293B',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              lineHeight: 1.5,
              background: '#FAFAFA',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.background = 'white' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFAFA' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleSaveReflection}
              disabled={savingReflection || !reflection.trim()}
              style={{
                flex: 1,
                padding: '10px',
                background: reflection.trim() ? '#10B981' : '#F1F5F9',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                color: reflection.trim() ? 'white' : '#94A3B8',
                cursor: reflection.trim() ? 'pointer' : 'default',
                transition: 'all 200ms ease',
                outline: 'none',
              }}
            >
              {savingReflection ? 'Saving...' : 'Save reflection'}
            </button>
            <button
              onClick={() => setShowReflection(false)}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#94A3B8',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Already read confirmation — shown when not in reflection flow */}
      {read && !showReflection && (
        <div style={{ padding: '0 20px 20px' }}>
          {savedReflection ? (
            <div style={{
              background: '#F0FDF4',
              borderRadius: '10px',
              padding: '12px',
              border: '1px solid #BBF7D0',
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#059669',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}>
                Your reflection
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#065F46',
                lineHeight: 1.5,
              }}>
                {savedReflection}
              </p>
            </div>
          ) : (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#10B981',
              fontWeight: 500,
              textAlign: 'center',
            }}>
              Great work. Come back tomorrow for your next read.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
