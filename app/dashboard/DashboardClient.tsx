'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

type DashboardData = {
  streak: number
  totalRead: number
  totalAssigned: number
  readToday: boolean
  last7: { date: string; read: boolean }[]
  profile: {
    experience_level: string
    primary_goal: string
    topics: string[]
  } | null
  recentReads: {
    date: string
    title: string
    source: string
    url: string
    topics: string[]
    reading_time_minutes: number
  }[]
  skillProgress: {
    topic: string
    count: number
    target: number
    percent: number
  }[]
  // PM Dojo fields
  archetype: string | null
  archetypeDisplay: string | null
  archetypeTagline: string | null
  totalInPath: number
  completedCount: number
  dojoScore: number | null
  quizSessions: number
}

function StatCard({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? '#4F46E5' : 'white',
      border: `1px solid ${accent ? '#4F46E5' : '#E2E8F0'}`,
      borderRadius: '14px',
      padding: '20px',
      flex: 1,
      minWidth: '0',
    }}>
      <p style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: '32px',
        fontWeight: 400,
        color: accent ? 'white' : '#1E293B',
        lineHeight: 1,
        marginBottom: '6px',
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        color: accent ? 'rgba(255,255,255,0.75)' : '#64748B',
        lineHeight: 1.3,
      }}>
        {label}
      </p>
    </div>
  )
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [copyToast, setCopyToast] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard')
        return r.json()
      })
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setFetchError(true); setLoading(false) })

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
      if (user?.id) setUserId(user.id)
    })
  }, [])

  function handleShare() {
    if (!userId) return
    const shareUrl = `${window.location.origin}/share/${userId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 2500)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 20px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: '#1E293B' }}>
            PM Dojo
          </span>
          <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/feed" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>
              Feed
            </Link>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              {userEmail.split('@')[0]}
            </span>
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
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
                outline: 'none',
              }}
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(24px, 6vw, 30px)',
            fontWeight: 400,
            color: '#1E293B',
            lineHeight: 1.2,
            marginBottom: '4px',
          }}>
            Your progress
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8' }}>
            {loading ? '...' : data?.readToday ? 'You read today. Keep it up.' : 'Read today to extend your streak.'}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: '90px', background: '#F1F5F9', borderRadius: '14px' }} />
            ))}
          </div>
        ) : fetchError ? (
          <div style={{
            background: 'white',
            border: '1px solid #FED7AA',
            borderRadius: '14px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#C2410C', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>
              Couldn&apos;t load your dashboard
            </p>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" }}>
              Check your connection and reload the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        ) : data && (
          <>
            {/* Archetype identity card */}
            {data.archetypeDisplay && (
              <div style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                color: 'white',
              }}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#818CF8',
                  marginBottom: '8px',
                }}>
                  You are
                </p>
                <h2 style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: '24px',
                  fontWeight: 400,
                  color: 'white',
                  marginBottom: '6px',
                }}>
                  {data.archetypeDisplay}
                </h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#A5B4FC', lineHeight: 1.5 }}>
                  {data.archetypeTagline}
                </p>

                {/* Path progress */}
                {data.totalInPath > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#818CF8' }}>
                        10-article path
                      </span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#818CF8' }}>
                        {data.completedCount} / {data.totalInPath}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${data.totalInPath > 0 ? (data.completedCount / data.totalInPath) * 100 : 0}%`,
                        background: '#A5B4FC',
                        borderRadius: '99px',
                        transition: 'width 600ms ease',
                        minWidth: data.completedCount > 0 ? '6px' : '0',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PM Dojo score (shown after completing path or after 7 days) */}
            {data.dojoScore !== null && data.quizSessions >= 1 && (
              <div style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: data.dojoScore >= 75 ? '#4F46E5' : '#F8FAFC',
                  border: '3px solid',
                  borderColor: data.dojoScore >= 75 ? '#4F46E5' : '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: '20px',
                    fontWeight: 400,
                    color: data.dojoScore >= 75 ? 'white' : '#1E293B',
                  }}>
                    {data.dojoScore}
                  </span>
                </div>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '3px' }}>
                    PM Dojo Score
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#64748B' }}>
                    {data.dojoScore >= 75 ? 'Strong performance across your quizzes.' : 'Keep reading and quizzing to improve.'}
                  </p>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <StatCard
                value={`${data.streak}🔥`}
                label="Day streak"
                accent={data.streak > 0}
              />
              <StatCard value={data.totalRead} label="Articles read" />
              <StatCard
                value={`${data.totalAssigned > 0 ? Math.round((data.totalRead / data.totalAssigned) * 100) : 0}%`}
                label="Completion"
              />
            </div>

            {/* Share streak */}
            {data.streak > 0 && (
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <button
                  onClick={handleShare}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'white',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#4F46E5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFF' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
                >
                  <span>🔗</span> Share your {data.streak}-day streak
                </button>
                {copyToast && (
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1E293B',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    Link copied!
                  </div>
                )}
              </div>
            )}

            {/* Last 7 days */}
            <div style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '14px' }}>
                Last 7 days
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                {data.last7.map((day) => {
                  const d = new Date(day.date)
                  const label = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)
                  return (
                    <div key={day.date} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '100%',
                        aspectRatio: '1',
                        background: day.read ? '#4F46E5' : '#F1F5F9',
                        borderRadius: '8px',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {day.read && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Skill progress */}
            {data.skillProgress?.length > 0 && (
              <div style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '16px' }}>
                  Skill progress
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.skillProgress.map((skill) => (
                    <div key={skill.topic}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>{skill.topic}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>{skill.count}/{skill.target}</span>
                      </div>
                      <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${skill.percent}%`,
                          background: skill.percent >= 100 ? '#10B981' : '#4F46E5',
                          borderRadius: '99px',
                          transition: 'width 600ms ease',
                          minWidth: skill.count > 0 ? '6px' : '0',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reads */}
            {data.recentReads.length > 0 && (
              <div style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '20px 20px 12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>
                    Recently read
                  </p>
                </div>
                {data.recentReads.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', padding: '14px 20px', borderTop: '1px solid #F1F5F9', textDecoration: 'none' }}
                  >
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: '#1E293B', lineHeight: 1.35, marginBottom: '4px' }}>
                      {item.title}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: '#94A3B8', alignItems: 'center' }}>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>{item.source}</span>
                      <span>·</span>
                      <span>{item.date ? new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
