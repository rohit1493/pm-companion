import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  const { session_id } = await request.json()
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  // Check if user already has a linked profile
  const { data: existing } = await supabaseAdmin
    .from('user_profiles')
    .select('id, sequence, archetype')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (existing) {
    // Already linked — check if session profile has a better (non-scanner) archetype
    const { data: sessionProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('archetype, archetype_display, archetype_tagline, sequence')
      .eq('session_id', session_id)
      .maybeSingle()

    const betterArchetype = sessionProfile?.archetype && sessionProfile.archetype !== 'scanner'
    const currentIsBad = !existing.archetype || existing.archetype === 'scanner'

    if (betterArchetype && (currentIsBad || sessionProfile!.archetype !== existing.archetype)) {
      // Update linked profile with correct archetype + rebuild sequence
      await supabaseAdmin
        .from('user_profiles')
        .update({
          archetype: sessionProfile!.archetype,
          archetype_display: sessionProfile!.archetype_display,
          archetype_tagline: sessionProfile!.archetype_tagline,
          sequence: sessionProfile!.sequence,
        })
        .eq('user_id', user.id)

      await ensureUserProgress(user.id, sessionProfile!.sequence, sessionProfile!.archetype)
    } else {
      await ensureUserProgress(user.id, existing.sequence, existing.archetype)
    }
    return NextResponse.json({ linked: true, already: true })
  }

  // Link the session profile to this user
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ user_id: user.id })
    .eq('session_id', session_id)
    .is('user_id', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Verify the update actually linked a row (Supabase doesn't error on 0 rows updated)
  const { data: linked } = await supabaseAdmin
    .from('user_profiles')
    .select('sequence, archetype')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!linked) {
    // 0 rows were updated — session_id may not match. Try finding by session_id directly
    // and set user_id (handles case where row was already linked by a concurrent call)
    const { data: sessionRow } = await supabaseAdmin
      .from('user_profiles')
      .select('id, sequence, archetype, user_id')
      .eq('session_id', session_id)
      .limit(1)
      .maybeSingle()

    if (sessionRow && !sessionRow.user_id) {
      // Row exists but couldn't be updated — return error so client retains session_id
      return NextResponse.json({ error: 'Failed to link profile' }, { status: 500 })
    }
    // Either row doesn't exist or already has user_id — nothing to do
    return NextResponse.json({ linked: true })
  }

  if (linked.sequence) {
    await ensureUserProgress(user.id, linked.sequence, linked.archetype)
  }

  return NextResponse.json({ linked: true })
}

async function ensureUserProgress(
  userId: string,
  sequence: string[] | null,
  _archetype: string | null,
) {
  if (!sequence || sequence.length === 0) return

  // Check existing progress rows
  const { data: existingProgress } = await supabaseAdmin
    .from('user_progress')
    .select('article_id')
    .eq('user_id', userId)

  const existingIds = new Set((existingProgress || []).map((p) => p.article_id))

  // Create missing rows — position comes from sequence order (1-indexed)
  const toInsert = sequence
    .filter((articleId) => !existingIds.has(articleId))
    .map((articleId) => ({
      user_id: userId,
      article_id: articleId,
      position: sequence.indexOf(articleId) + 1,
      read_gate_passed: false,
      time_on_article_seconds: 0,
      completed: false,
    }))

  if (toInsert.length > 0) {
    await supabaseAdmin.from('user_progress').insert(toInsert)
  }
}
