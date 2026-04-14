export type ArchetypeKey = 'faang_climber' | 'startup_climber' | 'ai_first_pm' | 'growth_pm' | 'scanner'

export interface ArchetypeTheme {
  key: ArchetypeKey
  display: string
  primary: string      // main accent hex
  secondary: string    // secondary accent hex
  tertiary: string     // tertiary accent hex
  glow: string         // rgba glow color
  bgGradient: string   // background gradient CSS value
  particleColors: string[]
  personality: string
}

export const ARCHETYPE_THEMES: Record<ArchetypeKey, ArchetypeTheme> = {
  faang_climber: {
    key: 'faang_climber',
    display: 'FAANG Climber',
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    tertiary: '#0369a1',
    glow: 'rgba(14, 165, 233, 0.3)',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #0c4a6e 100%)',
    particleColors: ['#0ea5e9', '#06b6d4', '#38bdf8'],
    personality: 'METHODICAL',
  },
  startup_climber: {
    key: 'startup_climber',
    display: 'Startup Climber',
    primary: '#ec4899',
    secondary: '#f97316',
    tertiary: '#a21caf',
    glow: 'rgba(236, 72, 153, 0.35)',
    bgGradient: 'linear-gradient(135deg, #1f0933 0%, #6b1b47 100%)',
    particleColors: ['#ec4899', '#f97316', '#f472b6'],
    personality: 'ELECTRIC',
  },
  ai_first_pm: {
    key: 'ai_first_pm',
    display: 'AI-First PM',
    primary: '#a78bfa',
    secondary: '#60a5fa',
    tertiary: '#34d399',
    glow: 'rgba(167, 139, 250, 0.4)',
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    particleColors: ['#a78bfa', '#60a5fa', '#c4b5fd'],
    personality: 'VISIONARY',
  },
  growth_pm: {
    key: 'growth_pm',
    display: 'Growth PM',
    primary: '#10b981',
    secondary: '#3b82f6',
    tertiary: '#f59e0b',
    glow: 'rgba(16, 185, 129, 0.35)',
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    particleColors: ['#10b981', '#34d399', '#6ee7b7'],
    personality: 'ANALYTICAL',
  },
  scanner: {
    key: 'scanner',
    display: 'Scanner',
    primary: '#8b5cf6',
    secondary: '#d946ef',
    tertiary: '#f59e0b',
    glow: 'rgba(139, 92, 246, 0.35)',
    bgGradient: 'linear-gradient(135deg, #3f0f40 0%, #5b21b6 100%)',
    particleColors: ['#8b5cf6', '#d946ef', '#a78bfa'],
    personality: 'CURIOUS',
  },
}

export function getTheme(key: string | null | undefined): ArchetypeTheme {
  if (key && key in ARCHETYPE_THEMES) {
    return ARCHETYPE_THEMES[key as ArchetypeKey]
  }
  // Default fallback (neutral dark)
  return {
    key: 'faang_climber',
    display: '',
    primary: '#ff6b35',
    secondary: '#ff8c5a',
    tertiary: '#cc4400',
    glow: 'rgba(255, 107, 53, 0.3)',
    bgGradient: 'linear-gradient(135deg, #0b0f14 0%, #1a1208 100%)',
    particleColors: ['#ff6b35', '#ff8c5a'],
    personality: '',
  }
}
