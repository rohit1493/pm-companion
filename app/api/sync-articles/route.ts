import { NextResponse, type NextRequest } from 'next/server'
import Parser from 'rss-parser'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { RSS_SOURCES } from '@/lib/rss-sources'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'PM-Dojo/1.0' },
})

function estimateReadingTime(text: string): number {
  const words = text?.split(/\s+/).length || 0
  return Math.max(1, Math.round(words / 200))
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || ''
}

async function isUrlAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    })
    return res.status < 400
  } catch {
    return false
  }
}

async function enrichArticle(article: {
  id: string
  title: string
  summary: string
}): Promise<{
  summary_short: string
  key_insight: string
  hooks: string[]
  quiz_q1: string
  quiz_a1: string
  quiz_q2: string
  quiz_a2: string
  category: string
  difficulty: number
} | null> {
  try {
    const prompt = `You are enriching a PM article for a learning app. Given the article title and summary, generate the following JSON. Respond ONLY with valid JSON, no markdown.

Article title: ${article.title}
Article summary: ${article.summary.slice(0, 500)}

Generate:
{
  "summary_short": "50-70 word Inshorts-style summary. Punchy, specific, no fluff.",
  "key_insight": "Single most actionable sentence a PM can take away. Start with a verb.",
  "hooks": ["One hook sentence using: specific pain + surprising claim + implied payoff. Written for a PM audience."],
  "quiz_q1": "Comprehension question about the article content (not recall). Multiple choice implied.",
  "quiz_a1": "Correct answer to quiz_q1 (1 sentence, max 12 words)",
  "quiz_q2": "A second different comprehension question",
  "quiz_a2": "Correct answer to quiz_q2 (1 sentence, max 12 words)",
  "category": "One of: Product Strategy, AI, Growth, Analytics, GTM, Startups, B2B/SaaS, Design & UX, PM Career, Case Studies & Teardowns",
  "difficulty": 1
}

difficulty: 1=Beginner, 2=Intermediate, 3=Advanced. Judge by technical depth and assumed PM experience needed.`

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const json = JSON.parse(text.trim())
    return json
  } catch (e) {
    console.error('enrichArticle error:', e)
    return null
  }
}

export async function GET(request: NextRequest) {
  // Accept secret via header OR query param (Vercel cron can't set custom headers)
  const headerSecret = request.headers.get('x-sync-secret')
  const querySecret = request.nextUrl.searchParams.get('secret')
  const validSecret = process.env.SYNC_SECRET || 'pm-companion-sync'

  if (headerSecret !== validSecret && querySecret !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { source: string; inserted: number; skipped: number; error?: string }[] = []

  // --- Phase 1: RSS sync ---
  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)
      const items = (feed.items || []).slice(0, 10)

      let inserted = 0
      let skipped = 0

      for (const item of items) {
        const url = item.link || item.guid || ''
        if (!url) { skipped++; continue }

        // HEAD check — skip dead URLs
        const alive = await isUrlAlive(url)
        if (!alive) { skipped++; continue }

        const summary = stripHtml(item.contentSnippet || item.content || item.summary || '')
        const article = {
          title: item.title?.trim() || 'Untitled',
          url,
          source: source.name,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          summary: summary.slice(0, 400),
          topics: source.topics,
          reading_time_minutes: estimateReadingTime(summary),
          is_active: true,
        }

        const { error } = await supabaseAdmin
          .from('articles')
          .upsert(article, { onConflict: 'url', ignoreDuplicates: true })

        if (error) skipped++
        else inserted++
      }

      results.push({ source: source.name, inserted, skipped })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.push({ source: source.name, inserted: 0, skipped: 0, error: message })
    }
  }

  // --- Phase 2: Claude enrichment (articles missing summary_short, cap at 20) ---
  const { data: toEnrich } = await supabaseAdmin
    .from('articles')
    .select('id, title, summary')
    .is('summary_short', null)
    .limit(20)

  let enriched = 0
  let enrichError = ''
  for (const article of (toEnrich || [])) {
    const data = await enrichArticle(article)
    if (!data) { if (!enrichError) enrichError = 'enrichArticle returned null for: ' + article.id; continue }

    await supabaseAdmin
      .from('articles')
      .update({
        summary_short: data.summary_short,
        key_insight: data.key_insight,
        hooks: data.hooks,
        quiz_q1: data.quiz_q1,
        quiz_a1: data.quiz_a1,
        quiz_q2: data.quiz_q2,
        quiz_a2: data.quiz_a2,
        category: data.category,
        difficulty: data.difficulty,
      })
      .eq('id', article.id)

    enriched++
  }

  const total = results.reduce((sum, r) => sum + r.inserted, 0)
  return NextResponse.json({ synced: total, enriched, toEnrichCount: (toEnrich || []).length, enrichError, sources: results })
}
