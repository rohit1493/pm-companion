import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getShareData(userId: string) {
  const { data: readDays } = await supabaseAdmin
    .from('daily_articles')
    .select('assigned_date')
    .eq('user_id', userId)
    .eq('read', true)
    .order('assigned_date', { ascending: false })

  if (!readDays || readDays.length === 0) return { streak: 0, totalRead: 0 }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const readToday = readDays[0].assigned_date === today

  let streak = 0
  let checkDate = readToday ? today : yesterday
  for (const row of readDays) {
    if (row.assigned_date === checkDate) {
      streak++
      const d = new Date(checkDate)
      d.setDate(d.getDate() - 1)
      checkDate = d.toISOString().split('T')[0]
    } else break
  }
  if (!readToday && readDays[0].assigned_date !== yesterday) streak = 0

  return { streak, totalRead: readDays.length }
}

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const { streak, totalRead } = await getShareData(userId)

  return {
    title: `${streak} day streak on PM Companion`,
    description: `I've read ${totalRead} PM articles and built a ${streak}-day reading streak. Join me on PM Companion.`,
    openGraph: {
      title: `${streak} day streak 🔥`,
      description: `${totalRead} articles read on PM Companion`,
      siteName: 'PM Companion',
    },
  }
}

export default async function SharePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const { streak, totalRead } = await getShareData(userId)

  const streakEmoji = streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '📖'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
      }}>
        {/* Logo */}
        <p style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: '16px',
          color: '#94A3B8',
          marginBottom: '32px',
          letterSpacing: '0.01em',
        }}>
          PM Companion
        </p>

        {/* Streak display */}
        <div style={{
          width: '96px',
          height: '96px',
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px',
        }}>
          {streakEmoji}
        </div>

        <p style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: '56px',
          fontWeight: 400,
          color: '#1E293B',
          lineHeight: 1,
          marginBottom: '8px',
        }}>
          {streak}
        </p>
        <p style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#4F46E5',
          marginBottom: '24px',
          letterSpacing: '-0.01em',
        }}>
          day reading streak
        </p>

        <div style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '32px',
        }}>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
            I've read <strong style={{ color: '#1E293B' }}>{totalRead} PM articles</strong> to stay sharp on product strategy, growth, and leadership.
          </p>
        </div>

        <a
          href="https://pm-companion-six.vercel.app"
          style={{
            display: 'block',
            background: '#4F46E5',
            color: 'white',
            borderRadius: '12px',
            padding: '14px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          Start your streak →
        </a>

        <p style={{
          fontSize: '12px',
          color: '#CBD5E1',
          marginTop: '16px',
        }}>
          pm-companion-six.vercel.app
        </p>
      </div>
    </div>
  )
}
