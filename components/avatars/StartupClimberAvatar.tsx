'use client'

import React from 'react'

interface AvatarProps {
  size?: number
  primaryColor?: string
  secondaryColor?: string
  animated?: boolean
  className?: string
}

export function StartupClimberAvatar({
  size = 80,
  primaryColor = '#ec4899',
  secondaryColor = '#f97316',
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
      className={`${animated ? 'avatar-float' : ''} ${className}`}
      style={{ transform: 'rotate(-5deg)' }}
    >
      <defs>
        <linearGradient id="startup-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
        <filter id="startup-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Arrow shaft */}
      <rect x="52" y="42" width="16" height="56" rx="2" fill="url(#startup-grad)" />

      {/* Arrow head */}
      <polygon
        points="60,15 82,50 38,50"
        fill={primaryColor}
        filter="url(#startup-glow)"
      />

      {/* Motion trail lines */}
      <line x1="35" y1="75" x2="20" y2="75" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="35" y1="85" x2="14" y2="85" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <line x1="35" y1="95" x2="22" y2="95" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.2" />
    </svg>
  )
}
