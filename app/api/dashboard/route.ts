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

  // User profile (with archetype fields) — use limit(1) to handle edge case of multiple linked rows
  const { data: profileRows } = await supabaseAdmin
    .from('user_profiles')
    .select('experience_level, primary_goal, topics, archetype, archetype_display, archetype_tagline, sequence, streak, streak_last_updated')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  const profile = profileRows?.[0] ?? null

  // Path progress from user_progress
  const { data: progressRows } = await supabaseAdmin
    .from('user_progress')
    .select(`
      id, position, completed, read_gate_passed, quiz_score, completed_at,
      articles(id, title, url, source, topics, reading_time_minutes, category)
    `)
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  const allProgress = progressRows || []
  const completedProgress = allProgress.filter((r) => r.completed)
  const totalInPath = allProgress.length
  const completedCount = completedProgress.length

  // Quiz sessions for PM Dojo score
  const { data: quizSessions } = await supabaseAdmin
    .from('quiz_sessions')
    .select('correct_answers, total_questions, completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: true })

  const sessions = quizSessions || []
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.total_questions || 0), 0)
  const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0)
  const dojoScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null

  // For non-PM-Dojo users, fall back to legacy daily_articles
  const { data: allDays } = await supabaseAdmin
    .from('daily_articles')
    .select('*, articles(title, url, source, topics, reading_time_minutes)')
    .eq('user_id', user.id)
    .order('assigned_date', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  const readDays = (allDays || []).filter((d) => d.read)
  const totalRead = completedCount > 0 ? completedCount : readDays.length
  const totalAssigned = totalInPath > 0 ? totalInPath : (allDays || []).length

  // Streak calculation — use user_profiles.streak for path users, daily_articles for legacy
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
  let streak = 0
  let readToday = readDays[0]?.assigned_date === today

  if (profile?.archetype) {
    // Path users: streak is managed by quiz completion in user_profiles
    // Apply decay: if last quiz was >48hr ago, streak has lapsed
    const lastUpdated = profile.streak_last_updated ? new Date(profile.streak_last_updated) : null
    const streakActive = lastUpdated && lastUpdated > fortyEightHoursAgo
    streak = streakActive ? (profile.streak || 0) : 0
    readToday = !!lastUpdated && lastUpdated.toISOString().split('T')[0] === today
  } else {
    // Legacy users: calculate from daily_articles
    let checkDate = readToday
      ? today
      : new Date(Date.now() - 86400000).toISOString().split('T')[0]

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
  }

  // Last 7 days (from daily_articles for streaks or from user_progress completed dates)
  // Use local date strings (YYYY-MM-DD) so day boundaries match the user's clock,
  // not UTC midnight (which can be off by a full day for users west of UTC).
  function toLocalDateString(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  const last7: { date: string; read: boolean }[] = []
  const completedDates = new Set(
    completedProgress
      .filter((r) => r.completed_at)
      .map((r) => toLocalDateString(new Date(r.completed_at!)))
  )
  for (let i = 6; i >= 0; i--) {
    const d = toLocalDateString(new Date(Date.now() - i * 86400000))
    const fromDailyArticles = (allDays || []).find((a) => a.assigned_date === d)
    const fromProgress = completedDates.has(d)
    last7.push({ date: d, read: (fromDailyArticles?.read || false) || fromProgress })
  }

  // Recent reads (from user_progress if available, else daily_articles)
  type RecentRead = {
    date: string
    title: string
    source: string
    url: string
    topics: string[]
    reading_time_minutes: number
  }
  let recentReads: RecentRead[] = []
  if (completedProgress.length > 0) {
    recentReads = completedProgress.slice(0, 5).map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = r.articles as any
      return {
        date: r.completed_at || '',
        title: a?.title || '',
        source: a?.source || '',
        url: a?.url || '',
        topics: a?.topics || [],
        reading_time_minutes: a?.reading_time_minutes || 0,
      }
    })
  } else {
    recentReads = readDays.slice(0, 5).map((d) => ({
      date: d.assigned_date,
      title: d.articles?.title || '',
      source: d.articles?.source || '',
      url: d.articles?.url || '',
      topics: d.articles?.topics || [],
      reading_time_minutes: d.articles?.reading_time_minutes || 0,
    }))
  }

  // Skill progress (for users with topics in profile)
  const userTopics: string[] = profile?.topics || []
  const topicCounts: Record<string, number> = {}
  for (const topic of userTopics) topicCounts[topic] = 0
  for (const row of completedProgress) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const topic of (((row.articles as any)?.topics) || [])) {
      if (topicCounts[topic] !== undefined) topicCounts[topic]++
    }
  }
  for (const day of readDays) {
    for (const topic of (day.articles?.topics || [])) {
      if (topicCounts[topic] !== undefined) topicCounts[topic]++
    }
  }
  const SKILL_TARGET = 10
  const skillProgress = userTopics.map((topic) => ({
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
    // PM Dojo fields
    archetype: profile?.archetype || null,
    archetypeDisplay: profile?.archetype_display || null,
    archetypeTagline: profile?.archetype_tagline || null,
    totalInPath,
    completedCount,
    dojoScore,
    quizSessions: sessions.length,
  })
}
