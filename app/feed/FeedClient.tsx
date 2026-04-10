'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function TopicPill({ topic }: { topic: string }) {
  return (
    <span style={{
      padding: '3px 10px',
      background: '#EEF2FF',
      color: '#4F46E5',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      {topic}
    </span>
  )
}

function ArticleCard({ article }: { article: Article }) {
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
        background: hovered ? '#FAFAFE' : 'white',
        borderBottom: '1px solid #F1F5F9',
        textDecoration: 'none',
        transition: 'background 150ms ease',
        cursor: 'pointer',
      }}
    >
      {/* Topics row */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {(article.topics || []).slice(0, 2).map((t) => (
          <TopicPill key={t} topic={t} />
        ))}
      </div>

      {/* Title */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '15px',
        fontWeight: 500,
        color: hovered ? '#4F46E5' : '#1E293B',
        lineHeight: 1.4,
        marginBottom: '6px',
        transition: 'color 150ms ease',
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
          marginBottom: '10px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
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
        gap: '8px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        color: '#94A3B8',
      }}>
        <span style={{ fontWeight: 500, color: '#64748B' }}>{article.source}</span>
        <span>·</span>
        <span>{timeAgo(article.published_at)}</span>
        <span>·</span>
        <span>{article.reading_time_minutes} min read</span>
      </div>
    </a>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      padding: '20px',
      borderBottom: '1px solid #F1F5F9',
      background: 'white',
    }}>
      <div style={{ width: '80px', height: '20px', background: '#F1F5F9', borderRadius: '99px', marginBottom: '10px' }} />
      <div style={{ width: '90%', height: '16px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ width: '70%', height: '16px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '12px' }} />
      <div style={{ width: '40%', height: '12px', background: '#F8FAFC', borderRadius: '4px' }} />
    </div>
  )
}

export default function FeedClient() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [userTopics, setUserTopics] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const fetchArticles = useCallback(async (topics: string[], filter: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (topics.length > 0) params.set('topics', topics.join(','))
      if (filter) params.set('filter', filter)

      const res = await fetch(`/api/articles?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setArticles(data)
    } catch (err) {
      setError('Could not load articles. Check your Supabase connection.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const syncArticles = useCallback(async () => {
    setSyncing(true)
    try {
      await fetch('/api/sync-articles')
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('pm_topics')
    const topics: string[] = stored ? JSON.parse(stored) : []
    setUserTopics(topics)
    // Sync then fetch with default 'All' filter
    syncArticles().then(() => fetchArticles(topics, 'All'))

    // Fetch current user
    const supabaseClient = createClient()
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userTopics.length === 0 && activeFilter === 'All') return
    fetchArticles(userTopics, activeFilter)
  }, [activeFilter, fetchArticles, userTopics])

  const filterTabs = ['All', ...userTopics]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '52px',
          }}>
            <span style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '18px',
              color: '#1E293B',
            }}>
              PM Companion
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {syncing && (
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Syncing...
                </span>
              )}
              {userEmail && (
                <>
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                    {userEmail.split('@')[0]}
                  </span>
                  <button
                    onClick={async () => {
                      const supabaseClient = createClient()
                      await supabaseClient.auth.signOut()
                      window.location.href = '/auth'
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      color: '#64748B',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          {filterTabs.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '4px',
              overflowX: 'auto',
              paddingBottom: '12px',
              scrollbarWidth: 'none',
            }}>
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '99px',
                    border: `1.5px solid ${activeFilter === tab ? '#4F46E5' : '#E2E8F0'}`,
                    background: activeFilter === tab ? '#4F46E5' : 'white',
                    color: activeFilter === tab ? 'white' : '#64748B',
                    fontSize: '13px',
                    fontWeight: activeFilter === tab ? 500 : 400,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    outline: 'none',
                    transition: 'all 150ms ease',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Article list */}
      <main
        style={{ maxWidth: '640px', margin: '0 auto', background: 'white' }}
        aria-busy={loading}
        aria-label="Article feed"
      >
        {error && (
          <div style={{
            padding: '20px',
            color: '#EF4444',
            fontSize: '14px',
            textAlign: 'center',
          }} role="alert">
            {error}
          </div>
        )}

        {loading && !error && (
          <>
            {[1,2,3,4,5].map((i) => <SkeletonCard key={i} />)}
          </>
        )}

        {!loading && !error && articles.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#94A3B8',
            fontSize: '14px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            No articles found. Try syncing or changing your filter.
          </div>
        )}

        {!loading && articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}

        {!loading && articles.length > 0 && (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: '#94A3B8',
            fontSize: '13px',
            borderTop: '1px solid #F1F5F9',
          }}>
            {articles.length} articles · filtered by your topics
          </div>
        )}
      </main>
    </div>
  )
}
