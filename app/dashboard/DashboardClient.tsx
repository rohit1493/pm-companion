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
      background: accent ? '#ff6b35' : '#121821',
      border: `1px solid ${accent ? '#ff6b35' : '#2a3340'}`,
      borderRadius: '14px',
      padding: '20px',
      flex: 1,
      minWidth: '0',
    }}>
      <p className="stat-value" style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: '32px',
        fontWeight: 400,
        color: accent ? 'white' : '#f6fafe',
        lineHeight: 1,
        marginBottom: '6px',
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
        color: accent ? 'rgba(255,255,255,0.75)' : '#8b96a5',
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
  const [menuOpen, setMenuOpen] = useState(false)

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
    <div style={{ minHeight: '100vh', background: '#0b0f14', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ background: '#121821', borderBottom: '1px solid #2a3340', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          height: '56px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Left — Hamburger + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                outline: 'none',
                borderRadius: '6px',
                flexShrink: 0,
              }}
            >
              <span style={{ display: 'block', width: '18px', height: '2px', background: '#8b96a5', borderRadius: '1px', transition: 'transform 200ms ease', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
              <span style={{ display: 'block', width: '18px', height: '2px', background: '#8b96a5', borderRadius: '1px', transition: 'opacity 200ms ease', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '18px', height: '2px', background: '#8b96a5', borderRadius: '1px', transition: 'transform 200ms ease', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
            </button>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '17px', fontWeight: 600, color: '#f6fafe', whiteSpace: 'nowrap' }}>
              PM Dojo
            </span>
          </div>

          {/* Centre — Tab nav, absolutely centered */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            background: '#0b0f14',
            border: '1px solid #2a3340',
            borderRadius: '999px',
            padding: '3px',
            gap: '2px',
          }}>
            <Link href="/feed" className="dash-nav-tab dash-nav-link">
              <span className="dash-nudge-arrow">←</span>
              Feed
            </Link>
            <span className="dash-nav-tab dash-nav-active">
              Dashboard
            </span>
          </div>
        </div>

        {/* Hamburger dropdown */}
        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, top: '56px', zIndex: 9 }}
            />
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '16px',
              background: '#161e28',
              border: '1px solid #2a3340',
              borderRadius: '12px',
              padding: '8px',
              zIndex: 11,
              minWidth: '200px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {userEmail && (
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #2a3340', marginBottom: '4px' }}>
                  <p style={{ fontSize: '11px', color: '#6b7685', fontFamily: "'Inter', sans-serif", marginBottom: '3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Signed in as</p>
                  <p style={{ fontSize: '13px', color: '#f6fafe', fontFamily: "'Inter', sans-serif", fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</p>
                </div>
              )}
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/auth'
                }}
                className="menu-signout-btn"
              >
                Sign out
              </button>
            </div>
          </>
        )}

        <style>{`
          @keyframes nudgeLeft {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-3px); }
          }
          .dash-nav-tab {
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            font-weight: 500;
            border-radius: 999px;
            padding: 5px 14px;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
          }
          .dash-nav-active {
            color: #f6fafe;
            background: #ff6b35;
            font-weight: 600;
          }
          .dash-nav-link {
            color: #8b96a5;
            background: transparent;
            transition: color 150ms ease, background 150ms ease;
          }
          .dash-nav-link:hover {
            color: #f6fafe;
            background: #1a2332;
          }
          .dash-nudge-arrow {
            display: inline-block;
            animation: nudgeLeft 1.8s ease-in-out infinite;
          }
          .menu-signout-btn {
            width: 100%;
            background: none;
            border: none;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 13px;
            color: #f87171;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            text-align: left;
            transition: background 150ms ease;
          }
          .menu-signout-btn:hover { background: #1a2332; }
          @media (max-width: 480px) {
            .dash-nav-tab { padding: 5px 10px; font-size: 12px; }
          }
        `}</style>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(24px, 6vw, 30px)',
            fontWeight: 400,
            color: '#f6fafe',
            lineHeight: 1.2,
            marginBottom: '4px',
          }}>
            Your progress
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7685' }}>
            {loading ? '...' : data?.readToday ? 'You read today. Keep it up.' : 'Read today to extend your streak.'}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: '90px', background: '#1e2a38', borderRadius: '14px' }} />
            ))}
          </div>
        ) : fetchError ? (
          <div style={{
            background: '#121821',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '14px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#f87171', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>
              Couldn&apos;t load your dashboard
            </p>
            <p style={{ fontSize: '13px', color: '#6b7685', marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}>
              Check your connection and reload the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#ff6b35',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: "'Inter', sans-serif",
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
                background: 'linear-gradient(135deg, #1a1208 0%, #2d1a0e 100%)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                color: 'white',
              }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#ffb89a',
                  marginBottom: '8px',
                }}>
                  You are
                </p>
                <h2 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '24px',
                  fontWeight: 400,
                  color: 'white',
                  marginBottom: '6px',
                }}>
                  {data.archetypeDisplay}
                </h2>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#ffb89a', lineHeight: 1.5 }}>
                  {data.archetypeTagline}
                </p>

                {/* Path progress */}
                {data.totalInPath > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#ffb89a' }}>
                        10-article path
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#ffb89a' }}>
                        {data.completedCount} / {data.totalInPath}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${data.totalInPath > 0 ? (data.completedCount / data.totalInPath) * 100 : 0}%`,
                        background: '#ff6b35',
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
                background: '#121821',
                border: '1px solid #2a3340',
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
                  background: data.dojoScore >= 75 ? '#ff6b35' : '#161e28',
                  border: '3px solid',
                  borderColor: data.dojoScore >= 75 ? '#ff6b35' : '#2a3340',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '20px',
                    fontWeight: 400,
                    color: data.dojoScore >= 75 ? 'white' : '#f6fafe',
                  }}>
                    {data.dojoScore}
                  </span>
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#f6fafe', marginBottom: '3px' }}>
                    PM Dojo Score
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8b96a5' }}>
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
                    background: '#121821',
                    border: '1.5px solid #2a3340',
                    borderRadius: '12px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#ff6b35',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1a2332' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#121821' }}
                >
                  <span>🔗</span> Share your {data.streak}-day streak
                </button>
                {copyToast && (
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#f6fafe',
                    color: '#0b0f14',
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
              background: '#121821',
              border: '1px solid #2a3340',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7685', marginBottom: '14px' }}>
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
                        background: day.read ? '#ff6b35' : '#1e2a38',
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
                      <span style={{ fontSize: '10px', color: '#6b7685' }}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Skill progress */}
            {data.skillProgress?.length > 0 && (
              <div style={{
                background: '#121821',
                border: '1px solid #2a3340',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7685', marginBottom: '16px' }}>
                  Skill progress
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.skillProgress.map((skill) => (
                    <div key={skill.topic}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#f6fafe' }}>{skill.topic}</span>
                        <span style={{ fontSize: '12px', color: '#6b7685' }}>{skill.count}/{skill.target}</span>
                      </div>
                      <div style={{ height: '6px', background: '#1e2a38', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${skill.percent}%`,
                          background: skill.percent >= 100 ? '#4ade80' : '#ff6b35',
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
                background: '#121821',
                border: '1px solid #2a3340',
                borderRadius: '14px',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '20px 20px 12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7685' }}>
                    Recently read
                  </p>
                </div>
                {data.recentReads.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', padding: '14px 20px', borderTop: '1px solid #1e2a38', textDecoration: 'none' }}
                  >
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: '#f6fafe', lineHeight: 1.35, marginBottom: '4px' }}>
                      {item.title}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: '#6b7685', alignItems: 'center' }}>
                      <span style={{ color: '#8b96a5', fontWeight: 500 }}>{item.source}</span>
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
