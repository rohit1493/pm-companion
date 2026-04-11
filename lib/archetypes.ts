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
      'AI': 1,
      'Analytics': 1,
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
    return ARCHETYPES.ai_first_pm
  }

  return ARCHETYPES.scanner
}

// Build a 10-article sequence weighted by archetype category preferences
export function buildSequence(
  archetype: Archetype,
  articles: { id: string; category: string | null; difficulty: number | null }[],
): string[] {
  if (articles.length === 0) return []

  if (archetype.key === 'scanner') {
    return articles.slice(0, 10).map((a) => a.id)
  }

  const weights = archetype.categoryWeights

  const scored = articles.map((a) => ({
    id: a.id,
    // Weighted score + tiny randomness for variety
    score: (weights[a.category ?? ''] ?? 0) + Math.random() * 0.3,
    difficulty: a.difficulty ?? 1,
  }))

  // High score first; within same score, easier articles come first
  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.01) return b.score - a.score
    return a.difficulty - b.difficulty
  })

  return scored.slice(0, 10).map((a) => a.id)
}

export { ARCHETYPES }
