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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all daily articles for this user
  const { data: allDays } = await supabaseAdmin
    .from('daily_articles')
    .select('*, articles(title, url, source, topics, reading_time_minutes)')
    .eq('user_id', user.id)
    .order('assigned_date', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  const readDays = (allDays || []).filter(d => d.read)
  const totalAssigned = (allDays || []).length
  const totalRead = readDays.length
  const readToday = readDays[0]?.assigned_date === today

  // Compute streak
  let streak = 0
  let checkDate = readToday ? today : new Date(Date.now() - 86400000).toISOString().split('T')[0]
  for (const row of readDays) {
    if (row.assigned_date === checkDate) {
      streak++
      const d = new Date(checkDate)
      d.setDate(d.getDate() - 1)
      checkDate = d.toISOString().split('T')[0]
    } else break
  }
  if (!readToday && readDays[0]?.assigned_date !== new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
    streak = 0
  }

  // Last 7 days activity (for calendar)
  const last7: { date: string; read: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    const found = (allDays || []).find(a => a.assigned_date === d)
    last7.push({ date: d, read: found?.read || false })
  }

  // User profile
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('experience_level, primary_goal, topics')
    .eq('user_id', user.id)
    .single()

  // Recent reads (last 5)
  const recentReads = readDays.slice(0, 5).map(d => ({
    date: d.assigned_date,
    title: d.articles?.title,
    source: d.articles?.source,
    url: d.articles?.url,
    topics: d.articles?.topics,
    reading_time_minutes: d.articles?.reading_time_minutes,
  }))

  // Skill progress: count reads per topic for user's selected topics
  const userTopics: string[] = profile?.topics || []
  const topicCounts: Record<string, number> = {}
  for (const topic of userTopics) topicCounts[topic] = 0
  for (const day of readDays) {
    for (const topic of (day.articles?.topics || [])) {
      if (topicCounts[topic] !== undefined) topicCounts[topic]++
    }
  }
  const SKILL_TARGET = 10
  const skillProgress = userTopics.map(topic => ({
    topic,
    count: topicCounts[topic] || 0,
    target: SKILL_TARGET,
    percent: Math.min(100, Math.round(((topicCounts[topic] || 0) / SKILL_TARGET) * 100)),
  }))

  return NextResponse.json({
    streak,
    totalRead,
    totalAssigned,
    readToday,
    last7,
    profile,
    recentReads,
    skillProgress,
  })
}
