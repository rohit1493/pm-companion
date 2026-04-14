/**
 * Amplitude Analytics utility for PM Dojo
 * Dynamically imported client-side only — never bundled into SSR to avoid
 * hydration mismatches from @amplitude/unified's autocapture hook instrumentation.
 */

const API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let amp: any = null
let initialised = false

export async function initAmplitude() {
  if (typeof window === 'undefined') return
  if (initialised) return
  if (!API_KEY) return
  try {
    amp = await import('@amplitude/unified')
    amp.initAll(API_KEY, {
      analytics: { autocapture: false },
      sessionReplay: { sampleRate: 0 },
    })
    initialised = true
  } catch {
    // Analytics failure is never fatal
  }
}

export function identifyUser(userId: string, properties?: Record<string, string | number | boolean>) {
  if (!initialised || !amp) return
  amp.setUserId(userId)
  if (properties) {
    const identify = new amp.Identify()
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value)
    })
    amp.identify(identify)
  }
}

export function track(event: string, properties?: Record<string, string | number | boolean | null>) {
  if (!initialised || !amp) return
  amp.track(event, properties ?? {})
}

// --- Typed event helpers ---

export const analytics = {
  // Auth
  signedUp: () =>
    track('signed_up'),

  signedIn: () =>
    track('signed_in'),

  googleSignedIn: () =>
    track('google_signed_in'),

  // Onboarding
  onboardingStarted: () =>
    track('onboarding_started'),

  onboardingCompleted: (archetype: string, archetypeDisplay: string) =>
    track('onboarding_completed', { archetype, archetype_display: archetypeDisplay }),

  // Feed
  feedLoaded: (viewType: 'path' | 'scanner', archetype: string | null) =>
    track('feed_loaded', { view_type: viewType, archetype: archetype ?? 'scanner' }),

  // Article
  articleOpened: (articleId: string, articleTitle: string, position: number) =>
    track('article_opened', { article_id: articleId, article_title: articleTitle, position }),

  readGatePassed: (articleId: string, secondsSpent: number) =>
    track('read_gate_passed', { article_id: articleId, seconds_spent: secondsSpent }),

  readGateFailed: (articleId: string, secondsSpent: number, secondsRemaining: number) =>
    track('read_gate_failed', { article_id: articleId, seconds_spent: secondsSpent, seconds_remaining: secondsRemaining }),

  // Quiz
  quizTriggered: (articleCount: number) =>
    track('quiz_triggered', { article_count: articleCount }),

  quizStarted: (articleCount: number) =>
    track('quiz_started', { article_count: articleCount }),

  quizCompleted: (correct: number, total: number, score: number, newStreak: number) =>
    track('quiz_completed', { correct_answers: correct, total_questions: total, score_pct: score, new_streak: newStreak }),

  // Key insight
  keyInsightViewed: (articleCount: number) =>
    track('key_insight_viewed', { article_count: articleCount }),

  // Streak milestones
  streakMilestone: (day: number) =>
    track('streak_milestone', { day }),

  // Path completion
  pathComplete: (totalArticles: number, dojoScore: number | null) =>
    track('path_complete', { total_articles: totalArticles, dojo_score: dojoScore }),

  // Share
  streakShared: (streak: number) =>
    track('streak_shared', { streak }),
}
