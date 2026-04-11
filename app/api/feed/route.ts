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

  // Get user profile (maybeSingle = no error when 0 rows)
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('archetype, archetype_display, archetype_tagline, sequence')
    .eq('user_id', user.id)
    .maybeSingle()

  const isScanner = !profile?.archetype || profile.archetype === 'scanner'

  // --- Scanner view ---
  if (isScanner) {
    const { data: articles } = await supabaseAdmin
      .from('articles')
      .select('id, title, url, source, published_at, summary, summary_short, topics, reading_time_minutes, category, difficulty, hooks, key_insight')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      viewType: 'scanner',
      archetypeDisplay: profile?.archetype_display || 'THE SCANNER',
      archetypeTagline: profile?.archetype_tagline || 'Reading widely. Thinking fast.',
      articles: articles || [],
    })
  }

  // --- Path view ---
  const { data: progressRows } = await supabaseAdmin
    .from('user_progress')
    .select(`
      id,
      position,
      read_gate_passed,
      time_on_article_seconds,
      completed,
      completed_at,
      articles (
        id,
        title,
        url,
        source,
        published_at,
        summary,
        summary_short,
        topics,
        reading_time_minutes,
        category,
        difficulty,
        hooks,
        key_insight,
        quiz_q1,
        quiz_a1,
        quiz_q2,
        quiz_a2
      )
    `)
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  const rows = progressRows || []
  const completedRows = rows.filter((r) => r.completed)
  const activeRows = rows.filter((r) => !r.completed)
  const current = activeRows[0] || null
  const next = activeRows[1] || null

  // Quiz trigger: articles with gate passed but not yet covered by a quiz session
  const { data: lastQuiz } = await supabaseAdmin
    .from('quiz_sessions')
    .select('completed_at, articles_covered')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const coveredIds = new Set<string>(
    lastQuiz ? ((lastQuiz.articles_covered as string[]) || []) : []
  )

  const gatedNotCovered = rows.filter((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articleId = (r.articles as any)?.id
    return r.read_gate_passed && !r.completed && articleId && !coveredIds.has(articleId)
  })

  const quizReady = gatedNotCovered.length >= 2
  const quizArticleIds = gatedNotCovered
    .slice(0, 3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r) => (r.articles as any)?.id as string | undefined)
    .filter((id): id is string => !!id)

  return NextResponse.json({
    viewType: 'path',
    archetypeDisplay: profile.archetype_display || '',
    archetypeTagline: profile.archetype_tagline || '',
    totalInPath: rows.length,
    completedCount: completedRows.length,
    current,
    next,
    completed: [...completedRows].reverse(),
    quizReady,
    quizArticleIds,
  })
}
