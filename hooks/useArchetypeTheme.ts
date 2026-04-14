'use client'

import { useEffect } from 'react'
import { getTheme } from '@/lib/archetype-themes'

/**
 * Injects archetype CSS variables onto :root so all components can consume them.
 * Call this once at the top of a page that knows the user's archetype.
 */
export function useArchetypeTheme(archetypeKey: string | null | undefined) {
  // Set CSS variables on mount / archetype change
  useEffect(() => {
    const theme = getTheme(archetypeKey)
    const root = document.documentElement

    root.style.setProperty('--archetype-primary', theme.primary)
    root.style.setProperty('--archetype-secondary', theme.secondary)
    root.style.setProperty('--archetype-tertiary', theme.tertiary)
    root.style.setProperty('--archetype-glow', theme.glow)
    root.style.setProperty('--archetype-bg', theme.bgGradient)
    root.style.setProperty('--archetype-key', theme.key)

    return () => {
      // Reset to defaults on unmount
      root.style.setProperty('--archetype-primary', '#ff6b35')
      root.style.setProperty('--archetype-secondary', '#ff8c5a')
      root.style.setProperty('--archetype-tertiary', '#cc4400')
      root.style.setProperty('--archetype-glow', 'rgba(255, 107, 53, 0.3)')
      root.style.setProperty('--archetype-bg', 'linear-gradient(135deg, #0b0f14 0%, #1a1208 100%)')
    }
  }, [archetypeKey])

  // Cycle accent color through archetype palette every 15s per step (45s full cycle)
  useEffect(() => {
    if (!archetypeKey) return
    const theme = getTheme(archetypeKey)
    const colors = [theme.primary, theme.secondary, theme.tertiary]
    let idx = 0

    const interval = setInterval(() => {
      idx = (idx + 1) % colors.length
      document.documentElement.style.setProperty('--archetype-primary', colors[idx])
    }, 15000)

    return () => clearInterval(interval)
  }, [archetypeKey])
}
