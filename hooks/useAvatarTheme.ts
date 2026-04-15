'use client'

import { useEffect } from 'react'
import { getAvatarTheme } from '@/lib/avatar-themes'

/**
 * Injects avatar CSS variables onto :root so all components can consume them.
 * Replaces useArchetypeTheme — driven by avatar key, not archetype key.
 * Call once at the top of any page that knows the user's avatar.
 */
export function useAvatarTheme(avatarKey: string | null | undefined) {
  // Set CSS variables on mount / avatar change
  useEffect(() => {
    const theme = getAvatarTheme(avatarKey)
    const root = document.documentElement

    root.style.setProperty('--avatar-accent', theme.accent)
    root.style.setProperty('--avatar-accent-dim', theme.moodPalette[2])
    root.style.setProperty('--avatar-accent-glow', theme.accent + '4d') // 30% opacity
    root.style.setProperty('--avatar-accent-mid', theme.moodPalette[1])

    // Keep legacy vars pointing to avatar accent so existing components still work
    root.style.setProperty('--archetype-primary', theme.accent)
    root.style.setProperty('--archetype-secondary', theme.moodPalette[1])
    root.style.setProperty('--archetype-tertiary', theme.moodPalette[2])
    root.style.setProperty('--archetype-glow', theme.accent + '4d')

    return () => {
      const defaults = getAvatarTheme('sensei')
      root.style.setProperty('--avatar-accent', defaults.accent)
      root.style.setProperty('--avatar-accent-dim', defaults.moodPalette[2])
      root.style.setProperty('--avatar-accent-glow', defaults.accent + '4d')
      root.style.setProperty('--avatar-accent-mid', defaults.moodPalette[1])
      root.style.setProperty('--archetype-primary', defaults.accent)
      root.style.setProperty('--archetype-secondary', defaults.moodPalette[1])
      root.style.setProperty('--archetype-tertiary', defaults.moodPalette[2])
      root.style.setProperty('--archetype-glow', defaults.accent + '4d')
    }
  }, [avatarKey])

  // Cycle accent through mood palette every 15s
  useEffect(() => {
    const theme = getAvatarTheme(avatarKey)
    const colors = theme.moodPalette
    let idx = 0

    const interval = setInterval(() => {
      idx = (idx + 1) % colors.length
      document.documentElement.style.setProperty('--avatar-accent', colors[idx])
      document.documentElement.style.setProperty('--archetype-primary', colors[idx])
    }, 15000)

    return () => clearInterval(interval)
  }, [avatarKey])
}
