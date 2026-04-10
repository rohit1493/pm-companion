import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topics = searchParams.get('topics')?.split(',').filter(Boolean) || []
  const filter = searchParams.get('filter') || 'All'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabaseAdmin
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50)

  if (filter !== 'All' && filter) {
    query = query.contains('topics', [filter])
  } else if (topics.length > 0) {
    query = query.overlaps('topics', topics)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
