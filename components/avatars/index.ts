import React from 'react'

export { FANGClimberAvatar } from './FANGClimberAvatar'
export { StartupClimberAvatar } from './StartupClimberAvatar'
export { AIFirstPMAvatar } from './AIFirstPMAvatar'
export { GrowthPMAvatar } from './GrowthPMAvatar'
export { ScannerAvatar } from './ScannerAvatar'

import { FANGClimberAvatar } from './FANGClimberAvatar'
import { StartupClimberAvatar } from './StartupClimberAvatar'
import { AIFirstPMAvatar } from './AIFirstPMAvatar'
import { GrowthPMAvatar } from './GrowthPMAvatar'
import { ScannerAvatar } from './ScannerAvatar'
import type { ArchetypeKey } from '@/lib/archetype-themes'

type AvatarComponent = React.ComponentType<{
  size?: number
  primaryColor?: string
  secondaryColor?: string
  tertiaryColor?: string
  animated?: boolean
  className?: string
}>

export const ARCHETYPE_AVATARS: Record<ArchetypeKey, AvatarComponent> = {
  faang_climber: FANGClimberAvatar,
  startup_climber: StartupClimberAvatar,
  ai_first_pm: AIFirstPMAvatar,
  growth_pm: GrowthPMAvatar,
  scanner: ScannerAvatar,
}

/**
 * Get the avatar component for an archetype key.
 * Returns FANGClimberAvatar as fallback.
 */
export function getAvatarComponent(key: string | null | undefined): AvatarComponent {
  if (key && key in ARCHETYPE_AVATARS) {
    return ARCHETYPE_AVATARS[key as ArchetypeKey]
  }
  return FANGClimberAvatar
}
