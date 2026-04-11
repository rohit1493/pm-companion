import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildSequence, ARCHETYPES, type ArchetypeKey } from '@/lib/archetypes'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    // Legacy fields
    primary_goal,
    topics,
  } = body

  if (!session_id) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
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

  // Upsert profile (handle both new and returning users)
  const profileData: Record<string, unknown> = {
    session_id,
    // New PM Dojo fields
    ...(goal && { primary_goal: goal }),
    ...(target_company && { target_company }),
    ...(upskill_focus && { upskill_focus }),
    ...(experience_level && { experience_level }),
    ...(weak_areas && { weak_areas }),
    ...(archetype && { archetype }),
    ...(archetype_display && { archetype_display }),
    ...(archetype_tagline && { archetype_tagline }),
    ...(sequence.length > 0 && { sequence }),
    // Legacy compatibility
    ...(primary_goal && !goal && { primary_goal }),
    ...(topics && { topics }),
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .upsert(profileData, { onConflict: 'session_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, archetype, sequence })
}
