/**
 * Amplitude analytics utility for PM Dojo
 * All tracking calls are no-ops if NEXT_PUBLIC_AMPLITUDE_API_KEY is not set.
 */

import * as amplitude from '@amplitude/analytics-browser'

let initialised = false

export function initAmplitude() {
  if (typeof window === 'undefined') return
  if (initialised) return
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) return
  amplitude.init(apiKey, {
    autocapture: {
      pageViews: true,
      sessions: true,
      formInteractions: false,
      fileDownloads: false,
    },
    defaultTracking: false,
  })
  initialised = true
}

export function identifyUser(userId: string, properties?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined' || !initialised) return
  amplitude.setUserId(userId)
  if (properties) {
    const identify = new amplitude.Identify()
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value)
    })
    amplitude.identify(identify)
  }
}

export function track(event: string, properties?: Record<string, string | number | boolean | null>) {
  if (typeof window === 'undefined' || !initialised) return
  amplitude.track(event, properties ?? {})
}

// --- Typed event helpers ---

export const analytics = {
  // Onboarding
  onboardingStarted: () =>
    track('onboarding_started'),

  onboardingCompleted: (archetype: string, archetypeDisplay: string) =>
    track('onboarding_completed', { archetype, archetype_display: archetypeDisplay }),

  // Feed
  articleOpened: (articleId: string, articleTitle: string, position: number) =>
    track('article_opened', { article_id: articleId, article_title: articleTitle, position }),

  readGatePassed: (articleId: string, secondsSpent: number) =>
    track('read_gate_passed', { article_id: articleId, seconds_spent: secondsSpent }),

  readGateFailed: (articleId: string, secondsSpent: number, secondsRemaining: number) =>
    track('read_gate_failed', { article_id: articleId, seconds_spent: secondsSpent, seconds_remaining: secondsRemaining }),

  // Quiz
  quizStarted: (articleCount: number) =>
    track('quiz_started', { article_count: articleCount }),

  quizCompleted: (correct: number, total: number, score: number, newStreak: number) =>
    track('quiz_completed', { correct_answers: correct, total_questions: total, score_pct: score, new_streak: newStreak }),

  // Auth
  signedUp: () =>
    track('signed_up'),

  signedIn: () =>
    track('signed_in'),

  // Dashboard
  streakShared: (streak: number) =>
    track('streak_shared', { streak }),
}
