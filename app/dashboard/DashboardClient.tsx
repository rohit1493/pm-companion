'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { analytics } from '@/lib/analytics'
import { useArchetypeTheme } from '@/hooks/useArchetypeTheme'
import { getAvatarComponent } from '@/components/avatars'
import { getTheme } from '@/lib/archetype-themes'
import ProfileEditorModal from './ProfileEditorModal'

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
  pmEdgeScore: {
    productStrategy: number
    execution: number
    dataThinking: number
  }
  quizSessions: number
  // Profile editor fields
  avatar: string
  primaryGoal: string | null
  upskillFocus: string | null
  targetCompany: string | null
}

function StatCard({ value, label, accent, accentColor }: { value: string | number; label: string; accent?: boolean; accentColor?: string }) {
  const bgColor = accent ? (accentColor ?? 'var(--archetype-primary)') : '#121821'
  const borderColor = accent ? (accentColor ?? 'var(--archetype-primary)') : '#2a3340'
  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
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
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileModalMode, setProfileModalMode] = useState<'edit' | 'new'>('edit')

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (r.status === 401) {
          setLoading(false)
          window.location.href = '/auth'
          return null
        }
        if (!r.ok) throw new Error('Failed to load dashboard')
        return r.json()
      })
      .then((d) => { if (d) { setData(d); setLoading(false) } })
      .catch(() => { setFetchError(true); setLoading(false) })

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
      if (user?.id) setUserId(user.id)
    })
  }, [])

  function handleProfileSaved(_newArchetype: string) {
    setProfileModalOpen(false)
    // Reload dashboard data, then redirect to feed
    window.location.href = '/feed'
  }

  async function handleShare() {
    if (!userId || !data) return
    const shareUrl = `${window.location.origin}/share/${userId}`
    const shareText = `I'm on a ${data.streak}-day streak on PM Dojo 🔥 sharpening my PM edge.`

    // Native share sheet first — opens OS-level options on mobile + supported browsers.
    // Clipboard fallback for desktop browsers without navigator.share.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'PM Dojo', text: shareText, url: shareUrl })
        analytics.streakShared(data.streak)
        return
      } catch (err) {
        // User cancelled the share sheet — nothing to do.
        if (err instanceof Error && err.name === 'AbortError') return
        // Any other error falls through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 2500)
      analytics.streakShared(data.streak)
    } catch {
      // Clipboard blocked (no HTTPS, no permission, etc.) — last-resort: open share URL
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const archetypeKey = data?.archetype ?? null
  useArchetypeTheme(archetypeKey)
  const theme = getTheme(archetypeKey)
  const AvatarComponent = getAvatarComponent(archetypeKey)

  return (
    <div style={{ minHeight: '100vh', background: theme.bgGradient, transition: 'background 1.2s ease-in-out', fontFamily: "'Inter', sans-serif" }}>
      <div className="grain-overlay" />
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
            <span className="nav-logo">PM Dojo</span>
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
          .nav-logo {
            font-family: 'Manrope', sans-serif;
            font-size: 17px;
            font-weight: 600;
            color: #f6fafe;
            white-space: nowrap;
          }
          @media (max-width: 540px) {
            .nav-logo { display: none; }
            .dash-nav-tab { padding: 6px 14px; font-size: 13px; }
            .stat-value { font-size: 24px !important; }
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
            {loading ? '...' : data?.readToday ? 'Done for today. See you tomorrow.' : 'You haven\'t read today. Your streak resets at midnight.'}
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
                marginBottom: '16px',
                color: 'white',
                overflow: 'hidden',
              }}>
                {/* Avatar + name section */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px 24px 24px',
                  background: `radial-gradient(ellipse at top, ${theme.glow} 0%, transparent 60%)`,
                  textAlign: 'center',
                }}>
                  <div
                    className="avatar-float"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      border: `1px solid ${theme.primary}33`,
                    }}
                  >
                    <AvatarComponent
                      size={64}
                      primaryColor={theme.primary}
                      secondaryColor={theme.secondary}
                      animated={true}
                    />
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--archetype-secondary)',
                    marginBottom: '8px',
                  }}>
                    You are
                  </p>
                  <h2 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '24px',
                    fontWeight: 400,
                    color: 'var(--archetype-primary)',
                    marginBottom: '6px',
                  }}>
                    {data.archetypeDisplay}
                  </h2>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'var(--archetype-secondary)', lineHeight: 1.5 }}>
                    {data.archetypeTagline}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                    <button
                      onClick={() => { setProfileModalMode('edit'); setProfileModalOpen(true) }}
                      style={{
                        padding: '8px 18px',
                        background: 'rgba(255,107,53,0.12)',
                        border: '1px solid rgba(255,107,53,0.3)',
                        borderRadius: '999px',
                        color: '#ff6b35',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => { setProfileModalMode('new'); setProfileModalOpen(true) }}
                      style={{
                        padding: '8px 18px',
                        background: 'transparent',
                        border: '1px solid #2a3340',
                        borderRadius: '999px',
                        color: '#8b96a5',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                      }}
                    >
                      New Path
                    </button>
                  </div>
                </div>

                {/* Path progress */}
                {data.totalInPath > 0 && (
                  <div style={{ padding: '0 24px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'var(--archetype-secondary)' }}>
                        10-article path
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'var(--archetype-secondary)' }}>
                        {data.completedCount} / {data.totalInPath}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${data.totalInPath > 0 ? (data.completedCount / data.totalInPath) * 100 : 0}%`,
                        background: 'var(--archetype-primary)',
                        borderRadius: '99px',
                        transition: 'width 600ms ease',
                        minWidth: data.completedCount > 0 ? '6px' : '0',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PM Edge Score — 3 dimensions (productStrategy, execution, dataThinking) per spec §7 */}
            {data.pmEdgeScore && data.quizSessions >= 1 && (
              <div style={{
                background: '#121821',
                border: '1px solid #2a3340',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7685', marginBottom: '16px' }}>
                  PM Edge Score
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {([
                    { key: 'productStrategy', label: 'Product Strategy', value: data.pmEdgeScore.productStrategy },
                    { key: 'execution', label: 'Execution', value: data.pmEdgeScore.execution },
                    { key: 'dataThinking', label: 'Data Thinking', value: data.pmEdgeScore.dataThinking },
                  ] as const).map((dim) => (
                    <div key={dim.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#f6fafe' }}>{dim.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: dim.value >= 75 ? 'var(--archetype-primary)' : '#8b96a5' }}>{dim.value}</span>
                      </div>
                      <div style={{ height: '6px', background: '#1e2a38', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${dim.value}%`,
                          background: dim.value >= 75 ? 'var(--archetype-primary)' : '#6b7685',
                          borderRadius: '99px',
                          transition: 'width 600ms ease',
                          minWidth: dim.value > 0 ? '6px' : '0',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <StatCard
                value={data.streak === 0 ? '—' : `${data.streak}🔥`}
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
                  disabled={!userId}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#121821',
                    border: '1.5px solid #2a3340',
                    borderRadius: '12px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--archetype-primary)',
                    cursor: userId ? 'pointer' : 'wait',
                    opacity: userId ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { if (userId) (e.currentTarget as HTMLButtonElement).style.background = '#1a2332' }}
                  onMouseLeave={(e) => { if (userId) (e.currentTarget as HTMLButtonElement).style.background = '#121821' }}
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
                        background: day.read ? 'var(--archetype-primary)' : '#1e2a38',
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
                          background: skill.percent >= 100 ? '#4ade80' : 'var(--archetype-primary)',
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

      {data && (
        <ProfileEditorModal
          open={profileModalOpen}
          mode={profileModalMode}
          initialAvatar={data.avatar ?? 'sensei'}
          initialGoal={data.primaryGoal}
          initialTarget={data.targetCompany}
          initialFocus={data.upskillFocus}
          onClose={() => setProfileModalOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  )
}
