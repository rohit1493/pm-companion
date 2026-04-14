'use client'

import React from 'react'

interface AvatarProps {
  size?: number
  primaryColor?: string
  secondaryColor?: string
  tertiaryColor?: string
  animated?: boolean
  className?: string
}

export function AIFirstPMAvatar({
  size = 80,
  primaryColor = '#a78bfa',
  secondaryColor = '#60a5fa',
  tertiaryColor = '#34d399',
  animated = false,
  className = '',
}: AvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="ai-core-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.6" />
        </radialGradient>
        <filter id="ai-glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer ring */}
      <circle cx="60" cy="60" r="48" stroke={primaryColor} strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />

      {/* Middle ring */}
      <circle cx="60" cy="60" r="34" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />

      {/* Connection lines to nodes */}
      <line x1="60" y1="60" x2="60" y2="26" stroke={primaryColor} strokeWidth="1" opacity="0.4" />
      <line x1="60" y1="60" x2="90" y2="78" stroke={secondaryColor} strokeWidth="1" opacity="0.4" />
      <line x1="60" y1="60" x2="30" y2="78" stroke={tertiaryColor} strokeWidth="1" opacity="0.4" />

      {/* Orbiting nodes */}
      <circle cx="60" cy="26" r="6" fill={primaryColor} filter="url(#ai-glow)" />
      <circle cx="90" cy="78" r="5" fill={secondaryColor} filter="url(#ai-glow)" opacity="0.9" />
      <circle cx="30" cy="78" r="5" fill={tertiaryColor} filter="url(#ai-glow)" opacity="0.9" />

      {/* Core circle */}
      <circle cx="60" cy="60" r="14" fill="url(#ai-core-grad)" filter="url(#ai-glow)" />
      <circle cx="60" cy="60" r="6" fill="white" opacity="0.9" />
    </svg>
  )
}
