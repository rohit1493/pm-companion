import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const READ_GATE_SECONDS = 30

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
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

  const { article_id, seconds_to_add } = await request.json()
  if (!article_id || typeof seconds_to_add !== 'number') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  // Guard against negative or absurdly large values (max 5 minutes per session)
  const safeSecs = Math.max(0, Math.min(300, seconds_to_add))

  // Get current progress row
  const { data: row } = await supabaseAdmin
    .from('user_progress')
    .select('id, time_on_article_seconds, read_gate_passed')
    .eq('user_id', user.id)
    .eq('article_id', article_id)
    .maybeSingle()

  if (!row) {
    // No progress row yet — upsert one so time tracking can begin
    const { data: newRow, error: insertError } = await supabaseAdmin
      .from('user_progress')
      .upsert({
        user_id: user.id,
        article_id,
        time_on_article_seconds: safeSecs,
        read_gate_passed: safeSecs >= READ_GATE_SECONDS,
        completed: false,
        position: 0,
      }, { onConflict: 'user_id,article_id' })
      .select('id, time_on_article_seconds, read_gate_passed')
      .maybeSingle()

    if (insertError || !newRow) {
      return NextResponse.json({ error: 'Article not in your path' }, { status: 404 })
    }

    return NextResponse.json({
      passed: newRow.read_gate_passed,
      total_seconds: newRow.time_on_article_seconds,
      quiz_ready: false,
    })
  }

  const newTotal = (row.time_on_article_seconds || 0) + safeSecs
  const passed = newTotal >= READ_GATE_SECONDS

  // Update time and gate status
  await supabaseAdmin
    .from('user_progress')
    .update({
      time_on_article_seconds: newTotal,
      ...(passed && !row.read_gate_passed ? { read_gate_passed: true } : {}),
    })
    .eq('id', row.id)

  // Check if quiz should fire
  const { data: gatedRows } = await supabaseAdmin
    .from('user_progress')
    .select('article_id')
    .eq('user_id', user.id)
    .eq('read_gate_passed', true)
    .eq('completed', false)

  const { data: lastQuiz } = await supabaseAdmin
    .from('quiz_sessions')
    .select('articles_covered')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const coveredIds = new Set<string>(
    lastQuiz ? ((lastQuiz.articles_covered as string[]) || []) : []
  )

  const uncoveredGated = (gatedRows || []).filter(
    (r) => !coveredIds.has(r.article_id)
  )
  const quizReady = uncoveredGated.length >= 2

  return NextResponse.json({
    passed,
    total_seconds: newTotal,
    quiz_ready: quizReady,
  })
}
