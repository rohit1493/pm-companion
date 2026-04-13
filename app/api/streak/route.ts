import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ streak: 0, readToday: false })

  // Check if user has an archetype (path user) — use user_profiles.streak if so
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('archetype, streak, streak_last_updated')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (profile?.archetype) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const lastUpdated = profile.streak_last_updated ? new Date(profile.streak_last_updated) : null
    const streakActive = lastUpdated && lastUpdated > fortyEightHoursAgo
    const readToday = !!lastUpdated && lastUpdated.toISOString().split('T')[0] === today

    const { count: completedCount } = await supabaseAdmin
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true)

    return NextResponse.json({
      streak: streakActive ? (profile.streak || 0) : 0,
      readToday,
      totalRead: completedCount || 0,
    })
  }

  // Legacy users: calculate from daily_articles
  const { data: readDays } = await supabaseAdmin
    .from('daily_articles')
    .select('assigned_date')
    .eq('user_id', user.id)
    .eq('read', true)
    .order('assigned_date', { ascending: false })

  if (!readDays || readDays.length === 0) {
    return NextResponse.json({ streak: 0, readToday: false, totalRead: 0 })
  }

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
    } else {
      break
    }
  }

  if (!readToday && readDays[0].assigned_date !== yesterday) {
    streak = 0
  }

  return NextResponse.json({
    streak,
    readToday,
    totalRead: readDays.length,
  })
}
