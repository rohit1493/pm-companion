import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  // Get authenticated user
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

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Check if today's article already assigned
  const { data: existing } = await supabaseAdmin
    .from('daily_articles')
    .select('*, articles(*)')
    .eq('user_id', user.id)
    .eq('assigned_date', today)
    .single()

  if (existing?.articles) {
    return NextResponse.json({ article: existing.articles, isNew: false })
  }

  // Get user's topics from their profile
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('topics')
    .eq('user_id', user.id)
    .single()

  // Pick a random article from user's topics that hasn't been assigned before
  const topics = profile?.topics || []

  // Get already-assigned article IDs for this user
  const { data: pastAssignments } = await supabaseAdmin
    .from('daily_articles')
    .select('article_id')
    .eq('user_id', user.id)

  const excludeIds = (pastAssignments || []).map((a: { article_id: string }) => a.article_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabaseAdmin
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50)

  if (topics.length > 0) {
    query = query.overlaps('topics', topics)
  }

  const { data: candidates } = await query

  const available = (candidates || []).filter(
    (a: { id: string }) => !excludeIds.includes(a.id)
  )

  if (!available.length) {
    return NextResponse.json({ article: null, reason: 'no_articles' })
  }

  // Pick randomly from top 10
  const pool = available.slice(0, 10)
  const picked = pool[Math.floor(Math.random() * pool.length)]

  // Assign it
  await supabaseAdmin.from('daily_articles').insert({
    user_id: user.id,
    article_id: picked.id,
    assigned_date: today,
  })

  return NextResponse.json({ article: picked, isNew: true })
}
