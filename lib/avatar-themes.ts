export type AvatarKey = 'sensei' | 'shadow' | 'kata' | 'guardian' | 'monk' | 'chronicler'

export interface AvatarTheme {
  key: AvatarKey
  label: string
  emoji: string
  type: 'mental' | 'action'
  title: string
  powers: [string, string, string]
  accent: string
  moodPalette: [string, string, string]
}

export const AVATAR_THEMES: Record<AvatarKey, AvatarTheme> = {
  sensei: {
    key: 'sensei',
    label: 'Sensei',
    emoji: '🧠',
    type: 'mental',
    title: '"Reads the room before it reads you"',
    powers: ['Deep Recall', 'Pattern Lock', 'Mentor Vision'],
    accent: '#a78bfa',
    moodPalette: ['#a78bfa', '#c4b5fd', '#7c3aed'],
  },
  shadow: {
    key: 'shadow',
    label: 'Shadow',
    emoji: '⚡',
    type: 'action',
    title: '"Moves before you see them coming"',
    powers: ['Silent Read', 'Edge Strike', 'Ghost Mode'],
    accent: '#06b6d4',
    moodPalette: ['#06b6d4', '#22d3ee', '#0891b2'],
  },
  kata: {
    key: 'kata',
    label: 'Kata',
    emoji: '🔥',
    type: 'action',
    title: '"Perfect form, every single rep"',
    powers: ['Form Lock', 'Precision Chain', 'Flow State'],
    accent: '#fb923c',
    moodPalette: ['#fb923c', '#fdba74', '#ea580c'],
  },
  guardian: {
    key: 'guardian',
    label: 'Guardian',
    emoji: '🛡️',
    type: 'action',
    title: '"Takes the hit so the team doesn\'t"',
    powers: ['Risk Shield', 'Team Buffer', 'Iron Frame'],
    accent: '#3b82f6',
    moodPalette: ['#3b82f6', '#60a5fa', '#1d4ed8'],
  },
  monk: {
    key: 'monk',
    label: 'Monk',
    emoji: '☯️',
    type: 'mental',
    title: '"Processes 10x while others react"',
    powers: ['Calm Core', 'Signal Filter', 'Zero Noise'],
    accent: '#34d399',
    moodPalette: ['#34d399', '#6ee7b7', '#059669'],
  },
  chronicler: {
    key: 'chronicler',
    label: 'Chronicler',
    emoji: '📜',
    type: 'mental',
    title: '"Sees the whole story, not just today"',
    powers: ['Memory Vault', 'Story Thread', 'Long View'],
    accent: '#fbbf24',
    moodPalette: ['#fbbf24', '#fde68a', '#d97706'],
  },
}

export function getAvatarTheme(key: string | null | undefined): AvatarTheme {
  if (key && key in AVATAR_THEMES) {
    return AVATAR_THEMES[key as AvatarKey]
  }
  return AVATAR_THEMES.sensei
}
