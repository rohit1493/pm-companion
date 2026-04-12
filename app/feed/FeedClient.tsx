'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import ArticleCard from './ArticleCard'
import QuizCard from './QuizCard'
import KeyInsightCard from './KeyInsightCard'
import UnlockAnimation from './UnlockAnimation'

// --- TYPES ---

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
  quiz_q1?: string | null
  quiz_a1?: string | null
  quiz_q2?: string | null
  quiz_a2?: string | null
}

type ProgressRow = {
  id: string
  position: number
  read_gate_passed: boolean
  time_on_article_seconds: number
  completed: boolean
  completed_at: string | null
  articles: Article
}

type PathFeedData = {
  viewType: 'path'
  archetypeDisplay: string
  archetypeTagline: string
  totalInPath: number
  completedCount: number
  current: ProgressRow | null
  next: ProgressRow | null
  completed: ProgressRow[]
  quizReady: boolean
  quizArticleIds: string[]
}

type ScannerFeedData = {
  viewType: 'scanner'
  archetypeDisplay: string
  archetypeTagline: string
  articles: Article[]
}

type FeedData = PathFeedData | ScannerFeedData

type QuizResult = {
  articleIds: string[]
  correct: number
  total: number
  articles: { id: string; title: string; key_insight: string | null }[]
}

type FeedPhase = 'loading' | 'feed' | 'unlocking' | 'quiz' | 'insights'

// --- HELPERS ---

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

// --- SCANNER ARTICLE CARD ---

function ScannerCard({ article }: { article: Article }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        padding: '20px',
        background: hovered ? '#1a2332' : '#121821',
        borderBottom: '1px solid #1e2a38',
        textDecoration: 'none',
        transition: 'background 150ms ease',
      }}
    >
      {article.topics?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {article.topics.slice(0, 2).map((t) => (
            <span key={t} style={{
              padding: '3px 10px',
              background: 'rgba(255,107,53,0.12)',
              color: '#ff6b35',
              borderRadius: '99px',
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
            }}>
              {t}
            </span>
          ))}
        </div>
      )}
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '15px',
        fontWeight: 500,
        color: hovered ? '#ff6b35' : '#f6fafe',
        lineHeight: 1.4,
        marginBottom: '6px',
        transition: 'color 150ms ease',
      }}>
        {article.title}
      </p>
      {article.summary && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: '#8b96a5',
          lineHeight: 1.5,
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {article.summary}
        </p>
      )}
      <div style={{ fontSize: '12px', color: '#6b7685', fontFamily: "'Inter', sans-serif", display: 'flex', gap: '8px' }}>
        <span style={{ fontWeight: 500, color: '#8b96a5' }}>{article.source}</span>
        <span>·</span>
        <span>{timeAgo(article.published_at)}</span>
        <span>·</span>
        <span>{article.reading_time_minutes} min</span>
      </div>
    </a>
  )
}

// --- LOCKED NEXT CARD ---

function LockedCard({ row, totalInPath }: { row: ProgressRow; totalInPath: number }) {
  return (
    <div style={{
      background: '#161e28',
      border: '1px solid #2a3340',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Blur overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(4px)',
        background: 'rgba(11,15,20,0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        zIndex: 2,
      }}>
        <span style={{ fontSize: '24px' }}>🔒</span>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          color: '#8b96a5',
          textAlign: 'center',
        }}>
          Complete Article {row.position - 1} to unlock
        </p>
      </div>

      {/* Background content (blurred) */}
      <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#ff6b35',
          marginBottom: '10px',
        }}>
          Article {row.position} of {totalInPath}
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '17px',
          fontWeight: 600,
          color: '#f6fafe',
          lineHeight: 1.4,
        }}>
          {row.articles.title}
        </p>
      </div>
    </div>
  )
}

// --- COMPLETED STACK ---

function CompletedStack({ rows }: { rows: ProgressRow[] }) {
  if (rows.length === 0) return null
  return (
    <div style={{ marginTop: '24px' }}>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#6b7685',
        marginBottom: '12px',
      }}>
        Completed
      </p>
      <div style={{
        background: '#121821',
        border: '1px solid #2a3340',
        borderRadius: '14px',
        overflow: 'hidden',
      }}>
        {rows.map((row) => (
          <a
            key={row.id}
            href={row.articles.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderBottom: '1px solid #1e2a38',
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(74,222,128,0.08)',
              border: '1.5px solid rgba(74,222,128,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                color: '#8b96a5',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {row.articles.title}
              </p>
              <p style={{ fontSize: '11px', color: '#6b7685', fontFamily: "'Inter', sans-serif" }}>
                Article {row.position}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// --- PROGRESS BAR ---

function PathProgress({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#8b96a5' }}>
          Your path
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#6b7685' }}>
          {completed} / {total}
        </span>
      </div>
      <div style={{ height: '6px', background: '#2a3340', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct >= 100 ? '#4ade80' : '#ff6b35',
          borderRadius: '99px',
          transition: 'width 600ms ease',
          minWidth: completed > 0 ? '8px' : '0',
        }} />
      </div>
    </div>
  )
}

// --- SKELETON ---

function Skeleton() {
  return (
    <div style={{ background: '#121821', border: '1px solid #2a3340', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ width: '120px', height: '12px', background: '#1e2a38', borderRadius: '4px', marginBottom: '12px' }} />
      <div style={{ width: '90%', height: '18px', background: '#1e2a38', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ width: '70%', height: '18px', background: '#1e2a38', borderRadius: '4px', marginBottom: '14px' }} />
      <div style={{ width: '100%', height: '44px', background: '#1e2a38', borderRadius: '10px' }} />
    </div>
  )
}

// --- MAIN COMPONENT ---

export default function FeedClient() {
  const [feedData, setFeedData] = useState<FeedData | null>(null)
  const [phase, setPhase] = useState<FeedPhase>('loading')
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [error, setError] = useState('')

  const loadFeed = useCallback(async () => {
    setPhase('loading')
    setError('')
    try {
      const res = await fetch('/api/feed')
      if (res.status === 401) {
        window.location.href = '/auth'
        return
      }
      if (!res.ok) throw new Error('Failed to load feed')
      const data = await res.json()
      setFeedData(data)
      setPhase('feed')
    } catch {
      setError('Could not load your feed. Please refresh.')
      setPhase('feed')
    }
  }, [])

  useEffect(() => {
    // Get user email + link profile
    const supabaseClient = createClient()
    supabaseClient.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/auth'; return }
      if (user?.email) setUserEmail(user.email)

      const sessionId = localStorage.getItem('pm_session_id')
      if (sessionId) {
        // Await link-profile before loading feed so path is ready on first login
        try {
          await fetch('/api/link-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          })
          localStorage.removeItem('pm_session_id')
        } catch {}
      }

      await loadFeed()
    })
  }, [loadFeed])

  function handleGatePassed() {
    setPhase('unlocking')
  }

  function handleUnlockComplete() {
    fetch('/api/feed')
      .then((r) => r.json())
      .then((data: FeedData) => {
        setFeedData(data)
        if (data.viewType === 'path' && data.quizReady) {
          setPhase('quiz')
        } else {
          setPhase('feed')
        }
      })
      .catch(() => { setPhase('feed') })
  }

  function handleQuizComplete(result: QuizResult) {
    setQuizResult(result)
    setPhase('insights')
  }

  function handleInsightsDone() {
    setQuizResult(null)
    loadFeed()
  }

  const isPath = feedData?.viewType === 'path'
  const pathData = isPath ? (feedData as PathFeedData) : null
  const scannerData = !isPath ? (feedData as ScannerFeedData) : null

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f14', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{
        background: '#121821',
        borderBottom: '1px solid #2a3340',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          height: '56px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}>
          {/* Left — Logo */}
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '18px', fontWeight: 600, color: '#f6fafe', whiteSpace: 'nowrap' }}>
            PM Dojo
          </span>

          {/* Centre — Tab nav */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0b0f14',
            border: '1px solid #2a3340',
            borderRadius: '999px',
            padding: '3px',
            gap: '2px',
          }}>
            <span className="nav-tab nav-tab-active">Feed</span>
            <Link href="/dashboard" className="nav-tab nav-tab-link">
              Dashboard
              <span className="nav-pulse-dot" />
            </Link>
          </div>

          {/* Right — User + sign out */}
          {userEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <span className="nav-username-pill">{userEmail.split('@')[0]}</span>
              <button
                className="nav-signout"
                onClick={async () => {
                  const supabaseClient = createClient()
                  await supabaseClient.auth.signOut()
                  window.location.href = '/auth'
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes navPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(0.6); }
          }
          .nav-tab {
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            font-weight: 500;
            border-radius: 999px;
            padding: 5px 14px;
            white-space: nowrap;
            cursor: pointer;
            transition: color 150ms ease, background 150ms ease;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .nav-tab-active {
            color: #f6fafe;
            background: #ff6b35;
            font-weight: 600;
          }
          .nav-tab-link {
            color: #8b96a5;
            background: transparent;
          }
          .nav-tab-link:hover {
            color: #f6fafe;
            background: #1a2332;
          }
          .nav-pulse-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #ff6b35;
            flex-shrink: 0;
            animation: navPulse 2s ease-in-out infinite;
          }
          .nav-username-pill {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            color: #6b7685;
            background: #161e28;
            border: 1px solid #2a3340;
            border-radius: 999px;
            padding: 5px 12px;
            max-width: 110px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .nav-signout {
            background: none;
            border: 1px solid #2a3340;
            border-radius: 8px;
            padding: 5px 10px;
            font-size: 12px;
            color: #6b7685;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            white-space: nowrap;
          }
          @media (max-width: 540px) {
            .nav-username-pill { display: none; }
            .nav-tab { padding: 5px 10px; font-size: 12px; }
          }
        `}</style>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px 80px' }}>

        {error && (
          <div style={{ padding: '20px', color: '#EF4444', fontSize: '14px', textAlign: 'center' }} role="alert">
            {error}
          </div>
        )}

        {phase === 'loading' && (
          <>
            <Skeleton />
            <Skeleton />
          </>
        )}

        {/* UNLOCK ANIMATION */}
        {phase === 'unlocking' && (
          <UnlockAnimation onComplete={handleUnlockComplete} />
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && pathData && (
          <QuizCard
            articleIds={pathData.quizArticleIds}
            onComplete={handleQuizComplete}
            onReRead={loadFeed}
          />
        )}

        {/* INSIGHTS PHASE */}
        {phase === 'insights' && quizResult && (
          <KeyInsightCard
            articles={quizResult.articles}
            onDone={handleInsightsDone}
          />
        )}

        {/* FEED PHASE */}
        {phase === 'feed' && feedData && (
          <>
            {/* Archetype identity header */}
            {feedData.archetypeDisplay && (
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '22px',
                  fontWeight: 400,
                  color: '#f6fafe',
                  marginBottom: '4px',
                }}>
                  {feedData.archetypeDisplay}
                </h1>
                <p style={{ fontSize: '14px', color: '#6b7685' }}>
                  {feedData.archetypeTagline}
                </p>
              </div>
            )}

            {/* PATH VIEW */}
            {pathData && (
              <>
                <PathProgress completed={pathData.completedCount} total={pathData.totalInPath} />

                {pathData.quizReady && (
                  <div style={{
                    background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onClick={() => setPhase('quiz')}
                  >
                    <div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>
                        ⚡ Quiz ready
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                        Test what you&apos;ve learned
                      </p>
                    </div>
                    <span style={{ color: 'white', fontSize: '20px' }}>→</span>
                  </div>
                )}

                {pathData.current && (
                  <ArticleCard
                    row={pathData.current}
                    totalInPath={pathData.totalInPath}
                    onGatePassed={handleGatePassed}
                  />
                )}

                {pathData.next && !pathData.current?.read_gate_passed && (
                  <LockedCard row={pathData.next} totalInPath={pathData.totalInPath} />
                )}

                {pathData.next && pathData.current?.read_gate_passed && (
                  <ArticleCard
                    row={pathData.next}
                    totalInPath={pathData.totalInPath}
                    onGatePassed={handleGatePassed}
                  />
                )}

                {pathData.current === null && pathData.completedCount === pathData.totalInPath && pathData.totalInPath > 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                    <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '24px', fontWeight: 400, color: '#f6fafe', marginBottom: '8px' }}>
                      Path complete!
                    </h2>
                    <p style={{ fontSize: '14px', color: '#8b96a5', fontFamily: "'Inter', sans-serif" }}>
                      You&apos;ve read all 10 articles. Check your dashboard for your PM Dojo score.
                    </p>
                    <Link href="/dashboard" style={{
                      display: 'inline-block',
                      marginTop: '20px',
                      padding: '12px 24px',
                      background: '#ff6b35',
                      color: 'white',
                      borderRadius: '10px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}>
                      View dashboard →
                    </Link>
                  </div>
                )}

                {pathData.current === null && pathData.totalInPath === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7685' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
                      Your path is being built. Check back shortly.
                    </p>
                  </div>
                )}

                <CompletedStack rows={pathData.completed} />
              </>
            )}

            {/* SCANNER VIEW */}
            {scannerData && (
              <div style={{ background: '#121821', border: '1px solid #2a3340', borderRadius: '14px', overflow: 'hidden' }}>
                {scannerData.articles.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7685' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>No articles yet. Check back soon.</p>
                  </div>
                ) : (
                  scannerData.articles.map((article) => (
                    <ScannerCard key={article.id} article={article} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
