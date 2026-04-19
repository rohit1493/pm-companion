import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

// GET /api/quiz?article_ids=id1,id2
export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // L4 fix: filter empty strings so ?article_ids= (empty string) correctly returns 400
  const articleIds = (request.nextUrl.searchParams.get('article_ids') ?? '').split(',').filter(Boolean)
  if (articleIds.length === 0) {
    return NextResponse.json({ error: 'No article_ids provided' }, { status: 400 })
  }

  // Fetch articles with quiz questions + summary for distractor generation
  const { data: articles } = await supabaseAdmin
    .from('articles')
    .select('id, title, key_insight, summary_short, quiz_q1, quiz_a1, quiz_q2, quiz_a2')
    .in('id', articleIds)

  if (!articles || articles.length === 0) {
    return NextResponse.json({ questions: [], articles: [] })
  }

  // Collect candidate questions (max 4 total), deduplicating by question + answer text
  type RawQ = { id: string; article_id: string; article_title: string; article_context: string; question: string; correct_answer: string }
  const rawQuestions: RawQ[] = []
  const seenQuestions = new Set<string>()
  const seenAnswers = new Set<string>()
  for (const article of articles) {
    const ctx = `${article.title}. ${article.summary_short ?? ''}`
    for (const [slot, q, a] of [
      [`${article.id}-q1`, article.quiz_q1, article.quiz_a1],
      [`${article.id}-q2`, article.quiz_q2, article.quiz_a2],
    ] as [string, string | null, string | null][]) {
      if (!q || !a) continue
      if (rawQuestions.length >= 4) break
      const qKey = q.toLowerCase().trim()
      const aKey = a.toLowerCase().trim()
      // Skip if this question or its correct answer is a near-duplicate of one already queued
      if (seenQuestions.has(qKey) || seenAnswers.has(aKey)) continue
      seenQuestions.add(qKey)
      seenAnswers.add(aKey)
      rawQuestions.push({ id: slot, article_id: article.id, article_title: article.title, article_context: ctx, question: q, correct_answer: a })
    }
    if (rawQuestions.length >= 4) break
  }

  // Generate distractors sequentially so usedOptions deduplication works across questions.
  // (Promise.all would read an empty Set on every call before any completes.)
  const usedOptions = new Set<string>()
  const questionsWithOptions = []
  for (const q of rawQuestions) {
    const distractors = await generateDistractors(q.article_context, q.question, q.correct_answer, usedOptions)
    distractors.forEach((d) => usedOptions.add(d.toLowerCase().trim()))
    usedOptions.add(q.correct_answer.toLowerCase().trim())
    questionsWithOptions.push({
      id: q.id,
      article_id: q.article_id,
      article_title: q.article_title,
      question: q.question,
      correct_answer: q.correct_answer,
      options: shuffleOptions(q.correct_answer, distractors),
    })
  }

  return NextResponse.json({
    questions: questionsWithOptions,
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      key_insight: a.key_insight,
    })),
  })
}

// POST /api/quiz — complete a quiz session
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { article_ids, total_questions, correct_answers } = await request.json()

  if (!article_ids || !Array.isArray(article_ids)) {
    return NextResponse.json({ error: 'Missing article_ids' }, { status: 400 })
  }

  // Save quiz session
  const { error: sessionError } = await supabaseAdmin.from('quiz_sessions').insert({
    user_id: user.id,
    articles_covered: article_ids,
    total_questions: total_questions || 0,
    correct_answers: correct_answers || 0,
  })
  if (sessionError) {
    console.error('quiz_sessions insert failed:', sessionError)
    return NextResponse.json({ error: 'Failed to record quiz session' }, { status: 500 })
  }

  // Mark articles as completed in user_progress
  const { error: progressError } = await supabaseAdmin
    .from('user_progress')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      quiz_score: total_questions > 0
        ? Math.round((correct_answers / total_questions) * 100)
        : null,
    })
    .eq('user_id', user.id)
    .in('article_id', article_ids)
  if (progressError) {
    console.error('user_progress update failed:', progressError)
    return NextResponse.json({ error: 'Failed to update article progress' }, { status: 500 })
  }

  // Update streak (unified system via user_profiles)
  const now = new Date()
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('streak, streak_last_updated')
    .eq('user_id', user.id)
    .maybeSingle()

  const lastUpdated = profile?.streak_last_updated ? new Date(profile.streak_last_updated) : null
  const currentStreak = profile?.streak || 0

  // Within 48hr grace → increment; beyond 48hr → reset to 1
  const newStreak = lastUpdated && lastUpdated > fortyEightHoursAgo
    ? currentStreak + 1
    : 1

  const { error: streakError } = await supabaseAdmin
    .from('user_profiles')
    .update({
      streak: newStreak,
      streak_last_updated: now.toISOString(),
    })
    .eq('user_id', user.id)
  if (streakError) {
    console.error('streak update failed:', streakError)
    // Non-fatal: still return success but log the streak failure
    // The client will see a slightly stale streak on next load
  }

  return NextResponse.json({ success: true, streak: newStreak })
}

// Generate 3 article-specific wrong options via Groq.
// Falls back to inline generation if Groq is unavailable.
async function generateDistractors(
  articleContext: string,
  question: string,
  correctAnswer: string,
  usedOptions: Set<string>,
): Promise<string[]> {
  try {
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const prompt = `You are building a multiple-choice quiz for a PM learning app.

Article context: "${articleContext.slice(0, 300)}"
Question: "${question}"
Correct answer: "${correctAnswer}"

Generate exactly 3 wrong answer options that:
- Are plausible but clearly incorrect based on the article
- Are directly about THIS article's specific topic (not generic PM advice)
- Are similar in length and style to the correct answer
- Do NOT contain any wording from the correct answer
- Are meaningfully different from each other

Reply ONLY with a JSON array of exactly 3 strings. No explanation. Example format:
["wrong option 1", "wrong option 2", "wrong option 3"]`

    const msg = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 200,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.choices[0]?.message?.content ?? '').trim()
    const parsed = JSON.parse(text.replace(/^```json?\s*/i, '').replace(/```$/, '').trim())
    if (!Array.isArray(parsed)) throw new Error('Not an array')

    // Deduplicate against already-used options and correct answer
    const clean = parsed
      .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
      .filter((d) => d.toLowerCase().trim() !== correctAnswer.toLowerCase().trim())
      .filter((d) => !usedOptions.has(d.toLowerCase().trim()))
      .slice(0, 3)

    if (clean.length === 3) return clean
    // Pad if dedup reduced count below 3
    return padDistractors(clean, correctAnswer, usedOptions)
  } catch {
    return padDistractors([], correctAnswer, usedOptions)
  }
}

// Fallback: generate plausible-sounding wrong answers by negating or inverting the correct answer.
// Much better than generic PM platitudes because they at least reference the right topic.
function padDistractors(existing: string[], correctAnswer: string, usedOptions: Set<string>): string[] {
  const fallbacks = [
    `Only when all stakeholders have formally signed off`,
    `By maximising the number of features shipped per quarter`,
    `Through top-down prioritisation without user input`,
    `By focusing solely on short-term revenue metrics`,
    `When the engineering team estimates velocity above the threshold`,
    `By avoiding qualitative research in favour of A/B tests exclusively`,
  ].filter((f) => !usedOptions.has(f.toLowerCase().trim()) && f.toLowerCase() !== correctAnswer.toLowerCase())

  const result = [...existing]
  for (const f of fallbacks) {
    if (result.length >= 3) break
    result.push(f)
  }
  return result.slice(0, 3)
}

function shuffleOptions(correct: string, distractors: string[]): string[] {
  const all = [correct, ...distractors.slice(0, 3)]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}
