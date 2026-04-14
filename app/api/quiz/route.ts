import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  const articleIds = request.nextUrl.searchParams.get('article_ids')?.split(',') || []
  if (articleIds.length === 0) {
    return NextResponse.json({ error: 'No article_ids provided' }, { status: 400 })
  }

  // Fetch articles with quiz questions
  const { data: articles } = await supabaseAdmin
    .from('articles')
    .select('id, title, key_insight, quiz_q1, quiz_a1, quiz_q2, quiz_a2')
    .in('id', articleIds)

  if (!articles || articles.length === 0) {
    return NextResponse.json({ questions: [], articles: [] })
  }

  // Build quiz questions (max 2 per article, max 4 total)
  type Question = {
    id: string
    article_id: string
    article_title: string
    question: string
    correct_answer: string
    options: string[]
  }
  const questions: Question[] = []

  // Collect all answers upfront — use as cross-distractors so options differ per question
  const allAnswers: string[] = articles.flatMap((a) =>
    [a.quiz_a1, a.quiz_a2].filter((ans): ans is string => !!ans)
  )

  for (const article of articles) {
    if (article.quiz_q1 && article.quiz_a1) {
      questions.push({
        id: `${article.id}-q1`,
        article_id: article.id,
        article_title: article.title,
        question: article.quiz_q1,
        correct_answer: article.quiz_a1,
        options: shuffleOptions(article.quiz_a1, getDistractors(article.quiz_a1, allAnswers)),
      })
    }
    if (article.quiz_q2 && article.quiz_a2 && questions.length < 4) {
      questions.push({
        id: `${article.id}-q2`,
        article_id: article.id,
        article_title: article.title,
        question: article.quiz_q2,
        correct_answer: article.quiz_a2,
        options: shuffleOptions(article.quiz_a2, getDistractors(article.quiz_a2, allAnswers)),
      })
    }
    if (questions.length >= 4) break
  }

  return NextResponse.json({
    questions,
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
  await supabaseAdmin.from('quiz_sessions').insert({
    user_id: user.id,
    articles_covered: article_ids,
    total_questions: total_questions || 0,
    correct_answers: correct_answers || 0,
  })

  // Mark articles as completed in user_progress
  await supabaseAdmin
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

  await supabaseAdmin
    .from('user_profiles')
    .update({
      streak: newStreak,
      streak_last_updated: now.toISOString(),
    })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true, streak: newStreak })
}

// Use other articles' answers as cross-distractors — falls back to generic pool only if needed
function getDistractors(correctAnswer: string, allAnswers: string[]): string[] {
  // Other answers from the quiz batch are plausible but wrong — best distractors
  const crossDistractors = allAnswers.filter((a) => a !== correctAnswer)
  if (crossDistractors.length >= 3) return crossDistractors.slice(0, 3)

  // Fallback pool — varied by answer length to stay contextually plausible
  const isShort = correctAnswer.length < 25
  const fallbacks = isShort
    ? [
        'Reduce time-to-market above all else',
        'Maximise feature output per sprint',
        'Optimise for internal stakeholder approval',
        'Defer user research to post-launch',
      ]
    : [
        'Focus on shipping features faster than competitors',
        'Prioritise engineering velocity over user feedback loops',
        'Measure success primarily through internal OKR completion',
        'Treat qualitative signals as lower priority than quantitative data',
      ]

  // Mix cross-distractors with fallbacks so options are never identical across questions
  return [...crossDistractors, ...fallbacks].slice(0, 3)
}

function shuffleOptions(correct: string, distractors: string[]): string[] {
  const all = [correct, ...distractors.slice(0, 3)]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}
