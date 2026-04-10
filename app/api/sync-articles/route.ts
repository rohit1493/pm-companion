import { NextResponse, type NextRequest } from 'next/server'
import Parser from 'rss-parser'
import { createClient } from '@supabase/supabase-js'
import { RSS_SOURCES } from '@/lib/rss-sources'

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'PM-Companion/1.0' },
})

function estimateReadingTime(text: string): number {
  const words = text?.split(/\s+/).length || 0
  return Math.max(1, Math.round(words / 200))
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || ''
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-sync-secret')
  const validSecret = process.env.SYNC_SECRET || 'pm-companion-sync'
  if (secret !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { source: string; inserted: number; error?: string }[] = []

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)
      const articles = (feed.items || []).slice(0, 10).map((item) => {
        const summary = stripHtml(item.contentSnippet || item.content || item.summary || '')
        return {
          title: item.title?.trim() || 'Untitled',
          url: item.link || item.guid || '',
          source: source.name,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          summary: summary.slice(0, 400),
          topics: source.topics,
          reading_time_minutes: estimateReadingTime(summary),
        }
      }).filter((a) => a.url)

      const { error } = await supabaseAdmin
        .from('articles')
        .upsert(articles, { onConflict: 'url', ignoreDuplicates: true })

      results.push({ source: source.name, inserted: error ? 0 : articles.length, error: error?.message })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.push({ source: source.name, inserted: 0, error: message })
    }
  }

  const total = results.reduce((sum, r) => sum + r.inserted, 0)
  return NextResponse.json({ synced: total, sources: results })
}
