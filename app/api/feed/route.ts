import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildSequence, ARCHETYPES, type ArchetypeKey } from '@/lib/archetypes'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Keep in sync with sync-articles/route.ts → PAYWALL_SIGNALS
const PAYWALL_SIGNALS = [
  'paid subscriber',
  'subscribe to read',
  'for subscribers only',
  'upgrade to read',
  'unlock this post',
  'this post is for paying',
  'become a paid member',
  'paying member',
]

function isPaywalled(title: string | null, summary: string | null): boolean {
  const text = `${title ?? ''} ${summary ?? ''}`.toLowerCase()
  return PAYWALL_SIGNALS.some((s) => text.includes(s))
}

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
    let scannerQuery = supabaseAdmin
      .from('articles')
      .select('id, title, url, source, published_at, summary, summary_short, topics, reading_time_minutes, category, difficulty, hooks, key_insight')
      .eq('is_active', true)
    for (const signal of PAYWALL_SIGNALS) {
      scannerQuery = scannerQuery.not('summary', 'ilike', `%${signal}%`)
      scannerQuery = scannerQuery.not('title', 'ilike', `%${signal}%`)
    }
    const { data: articles } = await scannerQuery
      .order('published_at', { ascending: false })
      .limit(20) // fetch more so post-filter still yields 10

    const cleanArticles = (articles || [])
      .filter((a) => !isPaywalled(a.title, a.summary))
      .slice(0, 10)

    return NextResponse.json({
      viewType: 'scanner',
      archetypeKey: profile?.archetype || 'scanner',
      archetypeDisplay: profile?.archetype_display || 'THE SCANNER',
      archetypeTagline: profile?.archetype_tagline || 'Reading widely. Thinking fast.',
      avatar: profile?.avatar ?? 'sensei',
      articles: cleanArticles,
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
        quiz_a2,
        is_active
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
  // Cap at 10 — trims any sequences written by old code that had no limit.
  const effectiveSeq = (effectiveSequence ?? profile?.sequence ?? []).slice(0, 10)
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
          quiz_a2,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .order('position', { ascending: true })
    progressRows = rebuilt
  }

  // Filter out paywalled articles that may have been baked into an existing sequence
  const rows = (progressRows || []).filter((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = r.articles as any
    if (!a) return false
    if (a.is_active === false) return false
    if (isPaywalled(a.title, a.summary)) return false
    return true
  })

  // Enforce 10-article cap on existing path — trim lowest-priority (highest position)
  // active rows if the stored sequence was written by older code without a limit.
  const completedRows = rows.filter((r) => r.completed).map((r, i) => ({ ...r, position: i + 1 }))
  const allActiveRows = rows.filter((r) => !r.completed)
  const maxActive = Math.max(0, 10 - completedRows.length)
  let activeRows = allActiveRows.slice(0, maxActive).map((r, i) => ({ ...r, position: completedRows.length + i + 1 }))

  // Purge excess DB rows — delete uncompleted rows beyond the 10-article cap.
  // These were created by older code that had no limit. Fire-and-forget (non-blocking).
  const excessRows = allActiveRows.slice(maxActive)
  if (excessRows.length > 0) {
    const excessIds = excessRows.map((r) => r.id).filter(Boolean)
    supabaseAdmin
      .from('user_progress')
      .delete()
      .in('id', excessIds)
      .then(() => {}) // intentionally non-blocking
  }

  // Auto-refill: path is exhausted (all articles completed) — build a fresh 10-article
  // sequence excluding already-completed articles so the user never repeats content.
  if (activeRows.length === 0 && completedRows.length > 0 && profile?.archetype && profile.archetype !== 'scanner') {
    const archetype = ARCHETYPES[profile.archetype as ArchetypeKey] ?? null
    if (archetype) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const excludeIds = new Set<string>(completedRows.map((r) => (r.articles as any)?.id).filter(Boolean))
      const { data: freshArticles } = await supabaseAdmin
        .from('articles')
        .select('id, category, difficulty')
        .eq('is_active', true)
        .limit(200)
      if (freshArticles && freshArticles.length > 0) {
        const newSequence = buildSequence(archetype, freshArticles, excludeIds, 10)
        if (newSequence.length > 0) {
          await supabaseAdmin.from('user_profiles').update({ sequence: newSequence }).eq('user_id', user.id)
          await supabaseAdmin.from('user_progress').insert(
            newSequence.map((articleId, idx) => ({
              user_id: user.id,
              article_id: articleId,
              position: idx + 1,
              read_gate_passed: false,
              time_on_article_seconds: 0,
              completed: false,
            }))
          )
          // Re-fetch fresh active rows with full article data
          const { data: refilled } = await supabaseAdmin
            .from('user_progress')
            .select(`
              id, position, read_gate_passed, time_on_article_seconds, completed, completed_at,
              articles (
                id, title, url, source, published_at, summary, summary_short, topics,
                reading_time_minutes, category, difficulty, hooks, key_insight,
                quiz_q1, quiz_a1, quiz_q2, quiz_a2, is_active
              )
            `)
            .eq('user_id', user.id)
            .eq('completed', false)
            .order('position', { ascending: true })
          activeRows = (refilled || [])
            .filter((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const a = r.articles as any
              return a && a.is_active !== false && !isPaywalled(a.title, a.summary)
            })
            .slice(0, 10)
            .map((r, i) => ({ ...r, position: i + 1 }))
        }
      }
    }
  }

  const current = activeRows[0] || null
  const next = activeRows[1] || null
  const nextNext = activeRows[2] || null

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

  // Spec F6-07: indicator "Quiz coming up after this article 🧠" on current card
  // when reading it will cross the quiz threshold. Fires one article before quiz.
  const quizAfterCurrent =
    !quizReady && gatedNotCovered.length >= 1 && !!current

  return NextResponse.json({
    viewType: 'path',
    archetypeKey: profile.archetype || '',
    archetypeDisplay: profile.archetype_display || '',
    archetypeTagline: profile.archetype_tagline || '',
    avatar: profile.avatar ?? 'sensei',
    totalInPath: completedRows.length + activeRows.length,
    completedCount: completedRows.length,
    current,
    next,
    nextNext,
    completed: [...completedRows].reverse(),
    quizReady,
    quizArticleIds,
    quizAfterCurrent,
  })
}
