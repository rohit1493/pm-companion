import { NextResponse, type NextRequest } from 'next/server'
import Parser from 'rss-parser'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { RSS_SOURCES } from '@/lib/rss-sources'
import { computeDifficulty } from '@/lib/difficulty'

const ALLOWED_CATEGORIES = [
  'Product Strategy',
  'AI',
  'Growth',
  'Analytics',
  'GTM',
  'Startups',
  'B2B/SaaS',
  'Design & UX',
  'PM Career',
  'Case Studies & Teardowns',
] as const

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'PM-Dojo/1.0' },
})

function estimateReadingTime(text: string): number {
  const words = text?.split(/\s+/).length || 0
  // RSS descriptions are excerpts (~100-200 words). Full articles are ~8x longer.
  // PM articles typically run 800-1500 words → 4-8 min read at 200 wpm.
  const estimatedFullWords = words * 8
  return Math.max(3, Math.round(estimatedFullWords / 200))
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || ''
}

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

// Paywall signals found in RSS descriptions of gated posts (Substack, Medium, etc.)
const PAYWALL_SIGNALS = [
  'paid subscriber',
  'subscribe to read',
  'for subscribers only',
  'upgrade to read',
  'unlock this post',
  'this post is for paying',
  'become a paid member',
  'paying member',
]

function isPaywalled(title: string, summary: string): boolean {
  const text = `${title} ${summary}`.toLowerCase()
  return PAYWALL_SIGNALS.some((s) => text.includes(s))
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

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Product Strategy': 'product vision, roadmaps, prioritisation frameworks, competitive positioning, build vs buy decisions',
  'AI': 'artificial intelligence products, machine learning, LLMs, building AI-powered features, AI strategy for PMs',
  'Growth': 'user acquisition, activation, retention, referral, revenue loops, growth experiments, PLG',
  'Analytics': 'metrics frameworks, A/B testing, data analysis, dashboards, KPIs, measuring product success',
  'GTM': 'go-to-market strategy, product launches, pricing, distribution, sales-led vs product-led growth',
  'Startups': 'early-stage company building, founding, fundraising, startup culture, 0-to-1 product development',
  'B2B/SaaS': 'enterprise software, SaaS metrics (ARR/churn/NRR), B2B sales cycles, customer success, PLG in B2B',
  'Design & UX': 'user research, interaction design, usability testing, design systems, information architecture',
  'PM Career': 'PM career growth, job interviews, PM skills, stakeholder management, leadership, soft skills',
  'Case Studies & Teardowns': 'analysis of specific products, companies, or features — how and why they succeeded or failed',
}

function buildEnrichPrompt(title: string, summary: string, strict: boolean): string {
  const categoryList = ALLOWED_CATEGORIES.map(
    (c) => `"${c}" — ${CATEGORY_DESCRIPTIONS[c] ?? c}`
  ).join('\n')

  const strictNote = strict
    ? `CRITICAL: You MUST choose one of these exact category strings. No variations, no new categories:`
    : `Choose the single best matching category string from this list:`

  return `You are enriching a PM article for a learning app. Given the article title and summary, generate the following JSON. Respond ONLY with valid JSON, no markdown.

Article title: ${title}
Article summary: ${summary.slice(0, 500)}

${strictNote}
${categoryList}

Rules for category selection:
- If the article is about general software engineering, architecture, or programming (not PM-focused), still pick the closest PM-relevant category
- "AI" is for AI product strategy and building AI products — NOT general computer science theory
- "PM Career" is only for articles explicitly about the PM job, interviews, or career development
- When in doubt between two categories, pick the one a PM reading it would find more useful

Generate:
{
  "summary_short": "50-70 word Inshorts-style summary. Punchy, specific, no fluff.",
  "key_insight": "2-3 sentences. The single most actionable insight a PM can apply this week. Start with the core idea, then give one concrete example or implication. End with what changes if you ignore this.",
  "hooks": ["One hook sentence using: specific pain + surprising claim + implied payoff. Written for a PM audience."],
  "quiz_q1": "Comprehension question about the article content (not recall). Multiple choice implied.",
  "quiz_a1": "Correct answer to quiz_q1 (1 sentence, max 12 words)",
  "quiz_q2": "A second different comprehension question",
  "quiz_a2": "Correct answer to quiz_q2 (1 sentence, max 12 words)",
  "category": "exact string from the allowed list above"
}`
}

async function callGroq(prompt: string): Promise<Record<string, unknown> | null> {
  try {
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
    const msg = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.choices[0]?.message?.content ?? ''
    return JSON.parse(stripJsonFences(text))
  } catch {
    return null
  }
}

async function enrichArticle(article: {
  id: string
  title: string
  summary: string
  reading_time_minutes?: number
}): Promise<{
  summary_short: string
  key_insight: string
  hooks: string[]
  quiz_q1: string
  quiz_a1: string
  quiz_q2: string
  quiz_a2: string
  category: string | null
  difficulty: number
  is_active: boolean
} | null> {
  // First attempt
  const json = await callGroq(buildEnrichPrompt(article.title, article.summary, false))
  if (!json) return null

  let category: string | null = null
  if (typeof json.category === 'string' && (ALLOWED_CATEGORIES as readonly string[]).includes(json.category)) {
    category = json.category
  }

  // Category invalid — one retry with stricter prompt
  if (!category) {
    const retryJson = await callGroq(buildEnrichPrompt(article.title, article.summary, true))
    if (retryJson && typeof retryJson.category === 'string' && (ALLOWED_CATEGORIES as readonly string[]).includes(retryJson.category)) {
      category = retryJson.category
    }
  }

  // Compute difficulty deterministically — never trust LLM for this
  const difficulty = computeDifficulty(
    article.title,
    article.summary,
    article.reading_time_minutes ?? 5,
  )

  return {
    summary_short: typeof json.summary_short === 'string' ? json.summary_short : '',
    key_insight: typeof json.key_insight === 'string' ? json.key_insight : '',
    hooks: Array.isArray(json.hooks) ? json.hooks as string[] : [],
    quiz_q1: typeof json.quiz_q1 === 'string' ? json.quiz_q1 : '',
    quiz_a1: typeof json.quiz_a1 === 'string' ? json.quiz_a1 : '',
    quiz_q2: typeof json.quiz_q2 === 'string' ? json.quiz_q2 : '',
    quiz_a2: typeof json.quiz_a2 === 'string' ? json.quiz_a2 : '',
    category,
    difficulty,
    // Deactivate if we still can't get a valid category — invisible to feed
    is_active: category !== null,
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
        const title = item.title?.trim() || 'Untitled'
        const article = {
          title,
          url,
          source: source.name,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          summary: summary.slice(0, 400),
          topics: source.topics,
          reading_time_minutes: estimateReadingTime(summary),
          is_active: !isPaywalled(title, summary),
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

  // --- Phase 2: Groq enrichment (articles missing summary_short, cap at 20) ---
  const { data: toEnrich } = await supabaseAdmin
    .from('articles')
    .select('id, title, summary, reading_time_minutes')
    .is('summary_short', null)
    .limit(20)

  let enriched = 0
  for (const article of (toEnrich || [])) {
    const data = await enrichArticle(article)
    if (!data) continue

    // Validate critical fields — log if quiz data is missing
    if (!data.quiz_q1 || !data.quiz_a1) {
      console.warn(`Article "${article.title}" missing quiz_q1/a1 after enrichment`)
    }
    if (!data.category || !(ALLOWED_CATEGORIES as readonly string[]).includes(data.category)) {
      // Retry path is already handled inside enrichArticle — is_active will be false
    }

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
        // Deactivate if no valid category — prevents invisible-to-archetype articles
        is_active: data.is_active,
      })
      .eq('id', article.id)

    enriched++
  }

  const total = results.reduce((sum, r) => sum + r.inserted, 0)
  return NextResponse.json({ synced: total, enriched, sources: results })
}
