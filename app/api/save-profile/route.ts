import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildSequence, ARCHETYPES, type ArchetypeKey } from '@/lib/archetypes'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_GOALS = ['interview_prep', 'deep_skill', 'stay_updated', 'interviews', 'trends', 'upskill', 'all']
const VALID_ARCHETYPES = ['faang_climber', 'startup_climber', 'ai_first_pm', 'growth_pm', 'scanner']

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    goal,
    target_company,
    upskill_focus,
    experience_level,
    weak_areas,
    session_id,
    archetype,
    archetype_display,
    archetype_tagline,
    avatar,
    // Legacy fields
    primary_goal,
    topics,
  } = body

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!session_id || !UUID_REGEX.test(session_id)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  // Validate archetype if provided
  if (archetype && !VALID_ARCHETYPES.includes(archetype)) {
    return NextResponse.json({ error: 'Invalid archetype' }, { status: 400 })
  }
  if (goal && !VALID_GOALS.includes(goal)) {
    return NextResponse.json({ error: 'Invalid goal' }, { status: 400 })
  }

  // Build sequence from articles if we have an archetype
  let sequence: string[] = []
  if (archetype && archetype !== 'scanner') {
    const archetypeObj = ARCHETYPES[archetype as ArchetypeKey]
    if (archetypeObj) {
      const { data: articles } = await supabaseAdmin
        .from('articles')
        .select('id, category, difficulty')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(50)

      if (articles && articles.length > 0) {
        sequence = buildSequence(archetypeObj, articles)
      }
    }
  } else if (archetype === 'scanner') {
    const { data: articles } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(10)

    sequence = (articles || []).map((a) => a.id)
  }

  const profileData: Record<string, unknown> = {
    session_id,
    ...(goal && { primary_goal: goal }),
    ...(target_company && { target_company }),
    ...(upskill_focus && { upskill_focus }),
    ...(experience_level && { experience_level }),
    ...(weak_areas && Array.isArray(weak_areas) && { weak_areas }),
    ...(archetype && { archetype }),
    ...(archetype_display && { archetype_display }),
    ...(archetype_tagline && { archetype_tagline }),
    ...(avatar && { avatar }),
    ...(sequence.length > 0 && { sequence }),
    // Legacy compatibility
    ...(primary_goal && !goal && { primary_goal }),
    ...(topics && Array.isArray(topics) && { topics }),
  }

  // Check if session already exists — upsert safely without needing unique constraint
  const { data: existing } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('session_id', session_id)
    .maybeSingle()

  if (existing) {
    // Update existing profile
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update(profileData)
      .eq('session_id', session_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // Insert new profile
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, archetype, sequence })
}
