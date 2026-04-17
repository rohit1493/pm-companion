export type ArchetypeKey = 'faang_climber' | 'startup_climber' | 'ai_first_pm' | 'growth_pm' | 'scanner'

export type Archetype = {
  key: ArchetypeKey
  display: string
  tagline: string
  emoji: string
  categoryWeights: Record<string, number>
}

const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  faang_climber: {
    key: 'faang_climber',
    display: 'THE FAANG CLIMBER',
    tagline: 'Mid-level PM building the strategic depth to crack top-tier interviews.',
    emoji: '🎯',
    categoryWeights: {
      'Product Strategy': 3,
      'Case Studies & Teardowns': 3,
      'PM Career': 2,
      'Analytics': 2,
      'AI': 1,
      'Design & UX': 1,
    },
  },
  startup_climber: {
    key: 'startup_climber',
    display: 'THE STARTUP CLIMBER',
    tagline: 'Ambitious PM targeting fast-growing startups where generalists thrive.',
    emoji: '🚀',
    categoryWeights: {
      'Startups': 3,
      'GTM': 3,
      'Growth': 2,
      'B2B/SaaS': 2,
      'Product Strategy': 1,
      'Case Studies & Teardowns': 1,
    },
  },
  ai_first_pm: {
    key: 'ai_first_pm',
    display: 'THE AI-FIRST PM',
    tagline: 'Forward-thinking PM building deep expertise in AI products and systems.',
    emoji: '🤖',
    categoryWeights: {
      'AI': 4,
      'Product Strategy': 2,
      'Analytics': 2,
      'Design & UX': 1,
      'Case Studies & Teardowns': 1,
    },
  },
  growth_pm: {
    key: 'growth_pm',
    display: 'THE GROWTH PM',
    tagline: 'Data-driven PM mastering acquisition, retention, and revenue loops.',
    emoji: '📈',
    categoryWeights: {
      'Growth': 4,
      'Analytics': 3,
      'GTM': 2,
      'B2B/SaaS': 1,
    },
  },
  scanner: {
    key: 'scanner',
    display: 'THE SCANNER',
    tagline: 'Always-curious PM who stays ahead by reading widely and thinking fast.',
    emoji: '📡',
    categoryWeights: {},
  },
}

// Rule-based archetype assignment
export function assignArchetype(
  goal: string,
  target: string,
  upskillFocus: string,
): Archetype {
  if (goal === 'stay_updated') return ARCHETYPES.scanner

  if (goal === 'interview_prep') {
    if (target === 'big_tech') return ARCHETYPES.faang_climber
    return ARCHETYPES.startup_climber
  }

  if (goal === 'deep_skill') {
    if (upskillFocus === 'ai') return ARCHETYPES.ai_first_pm
    if (upskillFocus === 'growth' || upskillFocus === 'analytics') return ARCHETYPES.growth_pm
    if (upskillFocus === 'strategy') return ARCHETYPES.faang_climber
    if (upskillFocus === 'ux') return ARCHETYPES.growth_pm
    return ARCHETYPES.ai_first_pm
  }

  return ARCHETYPES.scanner
}

// Build a sequence weighted by archetype category preferences.
// excludeIds: articles already in the user's path — prevents duplicates on refresh.
// count: how many articles to return (default 10).
//
// Personalization guarantee: matched (weight > 0) articles always fill first.
// Off-topic (weight 0) articles are only used as last-resort padding, capped at
// MAX_UNMATCHED_PADDING to prevent irrelevant articles like a Turing-test essay
// appearing in a startup_climber's feed.
const MAX_UNMATCHED_PADDING = 2

export function buildSequence(
  archetype: Archetype,
  articles: { id: string; category: string | null; difficulty: number | null }[],
  excludeIds: Set<string> = new Set(),
  count = 10,
): string[] {
  const eligible = articles.filter((a) => !excludeIds.has(a.id))
  if (eligible.length === 0) return []

  if (archetype.key === 'scanner') {
    return eligible.slice(0, count).map((a) => a.id)
  }

  const weights = archetype.categoryWeights

  const scored = eligible.map((a) => ({
    id: a.id,
    weight: weights[a.category ?? ''] ?? 0,
    difficulty: a.difficulty ?? 1,
    jitter: Math.random(),
  }))

  // Split into matched (weight > 0) and unmatched (weight = 0)
  const matched = scored.filter((a) => a.weight > 0)
  const unmatched = scored.filter((a) => a.weight === 0)

  // Sort matched: highest weight first, then Basic → Advanced, then random jitter
  matched.sort((a, b) => {
    if (a.weight !== b.weight) return b.weight - a.weight
    if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty
    return a.jitter - b.jitter
  })

  // Sort unmatched: easiest first so padding is at least digestible
  unmatched.sort((a, b) => {
    if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty
    return a.jitter - b.jitter
  })

  // Fill with matched articles first; pad with at most MAX_UNMATCHED_PADDING unmatched
  const sequence = matched.slice(0, count)
  if (sequence.length < count) {
    const paddingNeeded = Math.min(count - sequence.length, MAX_UNMATCHED_PADDING)
    sequence.push(...unmatched.slice(0, paddingNeeded))
  }

  return sequence.map((a) => a.id)
}

export { ARCHETYPES }
