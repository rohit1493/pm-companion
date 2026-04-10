'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const GOAL_LABELS: Record<string, string> = {
  interviews: 'Interview prep',
  trends: 'Stay updated',
  upskill: 'Upskill',
  all: 'Full picture',
}

const EXP_LABELS: Record<string, string> = {
  '0-2': '0–2 years',
  '3-5': '3–5 years',
  '5+': '5+ years',
}

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
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

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
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '18px',
            color: '#1E293B',
          }}>
            PM Companion
          </span>
          <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/feed" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#64748B',
              textDecoration: 'none',
            }}>
              Feed
            </Link>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              {userEmail.split('@')[0]}
            </span>
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
            {loading ? '...' : data?.readToday ? 'You read today. Keep it up.' : 'Read today\'s article to extend your streak.'}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ flex: 1, height: '90px', background: '#F1F5F9', borderRadius: '14px' }} />
            ))}
          </div>
        ) : data && (
          <>
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
                label="Completion rate"
              />
            </div>

            {/* Last 7 days */}
            <div style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '16px',
            }}>
              <p style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '14px',
              }}>
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

            {/* Profile summary */}
            {data.profile && (
              <div style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '16px',
              }}>
                <p style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#94A3B8',
                  marginBottom: '14px',
                }}>
                  Your plan
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Experience</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>
                      {EXP_LABELS[data.profile.experience_level] || data.profile.experience_level}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Goal</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>
                      {GOAL_LABELS[data.profile.primary_goal] || data.profile.primary_goal}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>Topics</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '60%' }}>
                      {(data.profile.topics || []).map(t => (
                        <span key={t} style={{
                          padding: '3px 10px',
                          background: '#EEF2FF',
                          color: '#4F46E5',
                          borderRadius: '99px',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
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
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#94A3B8',
                  }}>
                    Recently read
                  </p>
                </div>
                {data.recentReads.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '14px 20px',
                      borderTop: '1px solid #F1F5F9',
                      textDecoration: 'none',
                    }}
                  >
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1E293B',
                      lineHeight: 1.35,
                      marginBottom: '4px',
                    }}>
                      {item.title}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#94A3B8',
                      alignItems: 'center',
                    }}>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>{item.source}</span>
                      <span>·</span>
                      <span>{new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
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
