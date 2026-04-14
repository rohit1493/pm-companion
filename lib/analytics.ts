/**
 * Analytics stub for PM Dojo.
 * Replace with a real provider (Amplitude, PostHog, etc.) once an API key is configured.
 * All functions are safe no-ops — zero external requests, zero React hook patching.
 */

export function initAmplitude() {}
export function identifyUser(_userId: string, _properties?: Record<string, string | number | boolean>) {}
export function track(_event: string, _properties?: Record<string, string | number | boolean | null>) {}

export const analytics = {
  signedUp: () => track('signed_up'),
  signedIn: () => track('signed_in'),
  googleSignedIn: () => track('google_signed_in'),
  onboardingStarted: () => track('onboarding_started'),
  onboardingCompleted: (archetype: string, archetypeDisplay: string) =>
    track('onboarding_completed', { archetype, archetype_display: archetypeDisplay }),
  feedLoaded: (viewType: 'path' | 'scanner', archetype: string | null) =>
    track('feed_loaded', { view_type: viewType, archetype: archetype ?? 'scanner' }),
  articleOpened: (articleId: string, articleTitle: string, position: number) =>
    track('article_opened', { article_id: articleId, article_title: articleTitle, position }),
  readGatePassed: (articleId: string, secondsSpent: number) =>
    track('read_gate_passed', { article_id: articleId, seconds_spent: secondsSpent }),
  readGateFailed: (articleId: string, secondsSpent: number, secondsRemaining: number) =>
    track('read_gate_failed', { article_id: articleId, seconds_spent: secondsSpent, seconds_remaining: secondsRemaining }),
  quizTriggered: (articleCount: number) => track('quiz_triggered', { article_count: articleCount }),
  quizStarted: (articleCount: number) => track('quiz_started', { article_count: articleCount }),
  quizCompleted: (correct: number, total: number, score: number, newStreak: number) =>
    track('quiz_completed', { correct_answers: correct, total_questions: total, score_pct: score, new_streak: newStreak }),
  keyInsightViewed: (articleCount: number) => track('key_insight_viewed', { article_count: articleCount }),
  streakMilestone: (day: number) => track('streak_milestone', { day }),
  pathComplete: (totalArticles: number, dojoScore: number | null) =>
    track('path_complete', { total_articles: totalArticles, dojo_score: dojoScore }),
  streakShared: (streak: number) => track('streak_shared', { streak }),
}
