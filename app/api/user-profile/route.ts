import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { assignArchetype, buildSequence } from '@/lib/archetypes'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_AVATARS = ['sensei', 'shadow', 'kata', 'guardian', 'monk', 'chronicler']
const VALID_GOALS = ['interview_prep', 'deep_skill', 'stay_updated']
const VALID_TARGETS = ['big_tech', 'startup']
const VALID_FOCUSES = ['ai', 'growth', 'analytics', 'strategy', 'ux']

async function getAuthUser() {
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
  return user
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json(null)

  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('experience_level, primary_goal, topics')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data || null)
}

// PATCH — updates fields on the user's profile.
// Supports: avatar, goal, target, upskill_focus, reset_progress.
// Runs via admin client so RLS can't block a signed-in user from persisting
// their own choice (CF-04 reproduced because the browser-side update was
// silently blocked). Updates every row with this user_id in case legacy data
// left multiple linked profiles behind.
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (body.avatar !== undefined) {
    if (typeof body.avatar !== 'string' || !VALID_AVATARS.includes(body.avatar)) {
      return NextResponse.json({ error: 'Invalid avatar' }, { status: 400 })
    }
    updates.avatar = body.avatar
  }

  const hasGoalUpdate = body.goal !== undefined
  let archetypeKey: string | null = null

  if (hasGoalUpdate) {
    if (typeof body.goal !== 'string' || !VALID_GOALS.includes(body.goal)) {
      return NextResponse.json({ error: 'Invalid goal' }, { status: 400 })
    }
    const goal: string = body.goal
    const target: string = typeof body.target === 'string' && VALID_TARGETS.includes(body.target) ? body.target : ''
    const upskillFocus: string = typeof body.upskill_focus === 'string' && VALID_FOCUSES.includes(body.upskill_focus) ? body.upskill_focus : ''

    // Compute archetype
    const archetypeObj = assignArchetype(goal, target, upskillFocus)
    archetypeKey = archetypeObj.key

    // Fetch articles for sequence building
    const { data: articles, error: articlesError } = await supabaseAdmin
      .from('articles')
      .select('id, category, difficulty')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(50)

    if (articlesError) {
      return NextResponse.json({ error: articlesError.message }, { status: 500 })
    }

    const resetProgress = body.reset_progress === true

    if (resetProgress) {
      // Build fresh sequence from all articles
      const sequence = buildSequence(archetypeObj, articles || [])

      // Update profile
      updates.archetype = archetypeObj.key
      updates.archetype_display = archetypeObj.display
      updates.archetype_tagline = archetypeObj.tagline
      updates.sequence = sequence
      updates.primary_goal = goal
      updates.upskill_focus = upskillFocus || null
      updates.target_company = target || null

      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      // Delete all progress rows
      const { error: deleteError } = await supabaseAdmin
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Insert fresh rows
      if (sequence.length > 0) {
        const progressRows = sequence.map((articleId, idx) => ({
          user_id: user.id,
          article_id: articleId,
          position: idx + 1,
          read_gate_passed: false,
          time_on_article_seconds: 0,
          completed: false,
        }))

        const { error: insertError } = await supabaseAdmin
          .from('user_progress')
          .insert(progressRows)

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    } else {
      // Keep completed rows, rebuild uncompleted
      const { data: progressRows } = await supabaseAdmin
        .from('user_progress')
        .select('article_id, completed, position')
        .eq('user_id', user.id)

      const allProgress = progressRows || []
      const completedRows = allProgress.filter((r) => r.completed)
      const completedIds = completedRows.map((r) => r.article_id as string)
      const completedCount = completedIds.length

      // Delete only uncompleted rows
      const { error: deleteError } = await supabaseAdmin
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('completed', false)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Build new sequence excluding completed articles
      const newSequence = buildSequence(archetypeObj, articles || [], new Set(completedIds))

      // Full sequence = completed IDs in order + new IDs
      const fullSequence = [...completedIds, ...newSequence]

      // Update profile
      updates.archetype = archetypeObj.key
      updates.archetype_display = archetypeObj.display
      updates.archetype_tagline = archetypeObj.tagline
      updates.sequence = fullSequence
      updates.primary_goal = goal
      updates.upskill_focus = upskillFocus || null
      updates.target_company = target || null

      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      // Insert new uncompleted rows
      if (newSequence.length > 0) {
        const newProgressRows = newSequence.map((articleId, idx) => ({
          user_id: user.id,
          article_id: articleId,
          position: completedCount + idx + 1,
          read_gate_passed: false,
          time_on_article_seconds: 0,
          completed: false,
        }))

        const { error: insertError } = await supabaseAdmin
          .from('user_progress')
          .insert(newProgressRows)

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, archetype: archetypeKey, updates })
  }

  // No goal update — just apply simple field updates (e.g. avatar only)
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, updates })
}
