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
    .select('archetype, streak, last_active_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.archetype) {
    const today = new Date().toISOString().split('T')[0]
    const lastActive = profile.last_active_at ? profile.last_active_at.split('T')[0] : null
    return NextResponse.json({
      streak: profile.streak || 0,
      readToday: lastActive === today,
      totalRead: profile.streak || 0,
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
