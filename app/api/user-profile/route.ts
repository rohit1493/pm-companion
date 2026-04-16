import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_AVATARS = ['sensei', 'shadow', 'kata', 'guardian', 'monk', 'chronicler']

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

// PATCH — updates fields on the user's profile. Currently supports { avatar }.
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
