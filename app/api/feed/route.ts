import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildSequence, ARCHETYPES, type ArchetypeKey } from '@/lib/archetypes'

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

  // Get user profile — use limit(1) to handle edge case of multiple linked rows
  const { data: profiles } = await supabaseAdmin
    .from('user_profiles')
    .select('archetype, archetype_display, archetype_tagline, sequence, avatar')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  const profile = profiles?.[0] ?? null

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
      archetypeKey: profile?.archetype || 'scanner',
      archetypeDisplay: profile?.archetype_display || 'THE SCANNER',
      archetypeTagline: profile?.archetype_tagline || 'Reading widely. Thinking fast.',
      avatar: profile?.avatar ?? 'sensei',
      articles: articles || [],
    })
  }

  // --- Path view ---
  let { data: progressRows } = await supabaseAdmin
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

  // Auto-heal: if path user has 0 progress rows but sequence is null, build one first
  let effectiveSequence: string[] | null = null
  if ((!progressRows || progressRows.length === 0) && profile?.archetype && !profile.sequence) {
    const archetype = ARCHETYPES[profile.archetype as ArchetypeKey] ?? ARCHETYPES.scanner
    const { data: freshArticles } = await supabaseAdmin
      .from('articles')
      .select('id, category, difficulty')
      .eq('is_active', true)
      .limit(100)
    if (freshArticles && freshArticles.length > 0) {
      const newSequence = buildSequence(archetype, freshArticles, new Set(), 10)
      if (newSequence.length > 0) {
        await supabaseAdmin
          .from('user_profiles')
          .update({ sequence: newSequence })
          .eq('user_id', user.id)
        effectiveSequence = newSequence
      }
    }
  }

  // Auto-heal: if path user has 0 progress rows but has a saved sequence, rebuild progress
  const effectiveSeq = effectiveSequence ?? profile?.sequence
  if ((!progressRows || progressRows.length === 0) && effectiveSeq?.length) {
    const sequence = effectiveSeq as string[]
    const toInsert = sequence.map((articleId: string, idx: number) => ({
      user_id: user.id,
      article_id: articleId,
      position: idx + 1,
      read_gate_passed: false,
      time_on_article_seconds: 0,
      completed: false,
    }))
    await supabaseAdmin.from('user_progress').insert(toInsert)

    // Re-fetch after rebuild
    const { data: rebuilt } = await supabaseAdmin
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
    progressRows = rebuilt
  }

  let rows = progressRows || []

  // Sequence refresh: when ≤2 unfinished articles remain, append 5 new ones
  const activeCount = rows.filter((r) => !r.completed).length
  if (activeCount <= 2 && rows.length > 0 && profile?.archetype && profile.archetype !== 'scanner') {
    const existingIds = new Set(
      rows.map((r) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (r.articles as any)?.id as string
      }).filter(Boolean)
    )

    let freshQuery = supabaseAdmin
      .from('articles')
      .select('id, category, difficulty')
      .eq('is_active', true)
    if (existingIds.size > 0) {
      freshQuery = freshQuery.not('id', 'in', `(${[...existingIds].join(',')})`)
    }
    const { data: freshArticles } = await freshQuery.limit(100)

    if (freshArticles && freshArticles.length > 0) {
      const archetype = ARCHETYPES[profile.archetype as ArchetypeKey] ?? ARCHETYPES.scanner
      const newIds = buildSequence(archetype, freshArticles, existingIds, 5)

      if (newIds.length > 0) {
        const maxPosition = rows.reduce((max, r) => Math.max(max, r.position), 0)
        const toInsert = newIds.map((articleId, idx) => ({
          user_id: user.id,
          article_id: articleId,
          position: maxPosition + idx + 1,
          read_gate_passed: false,
          time_on_article_seconds: 0,
          completed: false,
        }))
        await supabaseAdmin.from('user_progress').insert(toInsert)

        // Re-fetch with new rows
        const { data: extended } = await supabaseAdmin
          .from('user_progress')
          .select(`
            id,
            position,
            read_gate_passed,
            time_on_article_seconds,
            completed,
            completed_at,
            articles (
              id, title, url, source, published_at, summary, summary_short,
              topics, reading_time_minutes, category, difficulty, hooks, key_insight,
              quiz_q1, quiz_a1, quiz_q2, quiz_a2
            )
          `)
          .eq('user_id', user.id)
          .order('position', { ascending: true })
        rows = extended || rows
      }
    }
  }

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
    archetypeKey: profile.archetype || '',
    archetypeDisplay: profile.archetype_display || '',
    archetypeTagline: profile.archetype_tagline || '',
    avatar: profile.avatar ?? 'sensei',
    totalInPath: rows.length,
    completedCount: completedRows.length,
    current,
    next,
    completed: [...completedRows].reverse(),
    quizReady,
    quizArticleIds,
  })
}
