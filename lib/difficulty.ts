// Deterministic difficulty scoring — overrides LLM guesses.
// Signals: reading time (proxy for depth), jargon density.

const ADVANCED_SIGNALS = [
  'okr', 'cohort analysis', 'regression', 'multivariate', 'ltv', 'cac', 'north star metric',
  'machine learning', 'neural', 'arpu', 'instrumentation', 'funnel optimization',
  'statistical significance', 'confidence interval', 'causal inference', 'compounding loop',
  'jtbd', 'jobs to be done', 'incentive design', 'two-sided market',
]

const INTERMEDIATE_SIGNALS = [
  'roadmap', 'stakeholder', 'sprint', 'backlog', 'velocity', 'metrics', 'framework',
  'user story', 'a/b test', 'go-to-market', 'persona', 'journey map', 'product market fit',
  'activation', 'retention', 'churn', 'monetization', 'discovery', 'prioritization',
  'north star', 'dau', 'mau', 'nps', 'csat',
]

export function computeDifficulty(
  title: string,
  summary: string,
  readingTimeMinutes: number,
): number {
  const text = `${title} ${summary}`.toLowerCase()

  const advancedCount = ADVANCED_SIGNALS.filter((s) => text.includes(s)).length
  const intermediateCount = INTERMEDIATE_SIGNALS.filter((s) => text.includes(s)).length

  if (advancedCount >= 2 || readingTimeMinutes >= 8) return 3
  if (advancedCount >= 1 || intermediateCount >= 2 || readingTimeMinutes >= 5) return 2
  return 1
}
