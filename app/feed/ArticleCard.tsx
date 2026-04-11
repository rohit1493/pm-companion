'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import UnlockAnimation from './UnlockAnimation'

type Article = {
  id: string
  title: string
  url: string
  source: string
  published_at: string
  summary: string | null
  summary_short: string | null
  topics: string[]
  reading_time_minutes: number
  category: string | null
  difficulty: number | null
  hooks: string[] | null
  key_insight: string | null
}

type ProgressRow = {
  id: string
  position: number
  read_gate_passed: boolean
  time_on_article_seconds: number
  completed: boolean
  articles: Article
}

type GateState = 'idle' | 'reading' | 'returned_fail' | 'returned_pass'

function DifficultyBadge({ level }: { level: number }) {
  const colors: Record<number, { bg: string; color: string; label: string }> = {
    1: { bg: '#F0FDF4', color: '#16A34A', label: 'Beginner' },
    2: { bg: '#FFF7ED', color: '#EA580C', label: 'Intermediate' },
    3: { bg: '#FEF2F2', color: '#DC2626', label: 'Advanced' },
  }
  const style = colors[level] || colors[1]
  return (
    <span style={{
      padding: '3px 9px',
      background: style.bg,
      color: style.color,
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {style.label}
    </span>
  )
}

export default function ArticleCard({
  row,
  totalInPath,
  onGatePassed,
}: {
  row: ProgressRow
  totalInPath: number
  onGatePassed: () => void
}) {
  const article = row.articles
  const [gateState, setGateState] = useState<GateState>(
    row.read_gate_passed ? 'returned_pass' : 'idle'
  )
  const [timeAccumulated, setTimeAccumulated] = useState(row.time_on_article_seconds || 0)
  const [saving, setSaving] = useState(false)
  const [showUnlock, setShowUnlock] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number | null>(null)
  const isReadingRef = useRef(false)

  const saveTime = useCallback(async (seconds: number) => {
    if (seconds <= 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/read-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: article.id, seconds_to_add: seconds }),
      })
      const data = await res.json()
      if (data.passed) {
        setGateState('returned_pass')
        setShowUnlock(true)
      } else {
        setGateState('returned_fail')
      }
      setTimeAccumulated(data.total_seconds || 0)
    } catch {
      setGateState('returned_fail')
    } finally {
      setSaving(false)
    }
  }, [article.id, onGatePassed])

  // Track time when tab is hidden (user is reading)
  useEffect(() => {
    if (gateState !== 'reading') return

    function handleVisibilityChange() {
      if (document.hidden) {
        // App tab hidden = user switched to article tab — start timing
        startRef.current = Date.now()
        isReadingRef.current = true
      } else {
        // App tab visible = user returned from article tab
        if (isReadingRef.current && startRef.current) {
          const elapsed = Math.floor((Date.now() - startRef.current) / 1000)
          isReadingRef.current = false
          startRef.current = null
          if (elapsed > 0) {
            saveTime(elapsed)
          } else {
            // Sub-second return — check accumulated time to avoid stuck state
            const currentTotal = timeAccumulated
            if (currentTotal >= 30) {
              setGateState('returned_pass')
              setShowUnlock(true)
            } else {
              setGateState('returned_fail')
            }
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gateState, saveTime])

  function handleReadClick() {
    window.open(article.url, '_blank', 'noopener,noreferrer')
    setGateState('reading')
  }

  const hook = article.hooks?.[0] || null
  const summary = article.summary_short || article.summary || ''
  const remaining = Math.max(0, 30 - timeAccumulated)

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      {showUnlock && <UnlockAnimation onComplete={() => { setShowUnlock(false); onGatePassed() }} />}
      {/* Position header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FAFAFE',
      }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#4F46E5',
        }}>
          Article {row.position} of {totalInPath}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {article.difficulty && <DifficultyBadge level={article.difficulty} />}
          <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: "'DM Sans', sans-serif" }}>
            {article.reading_time_minutes} min
          </span>
        </div>
      </div>

      {/* Article content */}
      <div style={{ padding: '20px' }}>
        {/* Topics */}
        {article.topics?.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {article.topics.slice(0, 2).map((t) => (
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
        )}

        {/* Title */}
        <h2 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '17px',
          fontWeight: 600,
          color: '#1E293B',
          lineHeight: 1.4,
          marginBottom: '10px',
        }}>
          {article.title}
        </h2>

        {/* Hook — italic teaser line */}
        {hook && (
          <p style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '15px',
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: '10px',
            fontStyle: 'italic',
          }}>
            &ldquo;{hook}&rdquo;
          </p>
        )}

        {/* Summary */}
        {summary && !hook && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#64748B',
            lineHeight: 1.6,
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {summary}
          </p>
        )}

        {/* Source */}
        <p style={{ fontSize: '12px', color: '#94A3B8', fontFamily: "'DM Sans', sans-serif" }}>
          {article.source}
        </p>
      </div>

      {/* Gate / CTA area */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #F1F5F9',
        background: gateState === 'returned_pass' ? '#F0FDF4' : '#FAFAFA',
      }}>
        {gateState === 'idle' && (
          <button
            onClick={handleReadClick}
            style={{
              width: '100%',
              padding: '14px',
              background: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#3730A3' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5' }}
          >
            Read Article →
          </button>
        )}

        {gateState === 'reading' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📖</div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#475569',
              marginBottom: '4px',
            }}>
              Reading Article {row.position}...
            </p>
            <p style={{ fontSize: '13px', color: '#94A3B8', fontFamily: "'DM Sans', sans-serif" }}>
              Come back when you&apos;re done — we&apos;re tracking your time.
            </p>
          </div>
        )}

        {gateState === 'returned_fail' && (
          <div>
            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                color: '#C2410C',
                marginBottom: '4px',
              }}>
                Almost there!
              </p>
              <p style={{ fontSize: '13px', color: '#9A3412', fontFamily: "'DM Sans', sans-serif" }}>
                You need ~{remaining}s more. Give it another read.
              </p>
            </div>
            <button
              onClick={handleReadClick}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#4F46E5',
                border: '1.5px solid #4F46E5',
                borderRadius: '10px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              Keep reading →
            </button>
          </div>
        )}

        {gateState === 'returned_pass' && (
          <div style={{ textAlign: 'center' }}>
            {saving ? (
              <p style={{ fontSize: '14px', color: '#94A3B8', fontFamily: "'DM Sans', sans-serif" }}>
                Checking...
              </p>
            ) : (
              <>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>✓</div>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#16A34A',
                  marginBottom: '2px',
                }}>
                  Nice read.
                </p>
                <p style={{ fontSize: '13px', color: '#4B7A55', fontFamily: "'DM Sans', sans-serif" }}>
                  Next article is waiting for you below.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
