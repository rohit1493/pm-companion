/**
 * Amplitude Analytics + Session Replay utility for PM Dojo
 * Uses @amplitude/unified — runs client-side only, initialised once.
 */

import * as amplitude from '@amplitude/unified'

const API_KEY = 'e9a52ad6335333f23e2ac78e97da01d7'

let initialised = false

export function initAmplitude() {
  if (typeof window === 'undefined') return
  if (initialised) return
  amplitude.initAll(API_KEY, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
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
