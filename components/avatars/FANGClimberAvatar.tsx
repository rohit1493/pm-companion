'use client'

import React from 'react'

interface AvatarProps {
  size?: number
  primaryColor?: string
  secondaryColor?: string
  animated?: boolean
  className?: string
}

export function FANGClimberAvatar({
  size = 80,
  primaryColor = '#0ea5e9',
  secondaryColor = '#06b6d4',
  animated = false,
  className = '',
}: AvatarProps) {
  const id = 'faang-grad'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'avatar-float' : ''} ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
        <filter id="faang-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Bottom block — widest */}
      <rect x="18" y="82" width="84" height="22" rx="3" fill={`url(#${id})`} opacity="0.7" />

      {/* Middle block — medium, offset right */}
      <rect x="28" y="55" width="66" height="22" rx="3" fill={`url(#${id})`} opacity="0.85" />

      {/* Top block — narrow, offset left, brightest */}
      <rect x="38" y="28" width="48" height="22" rx="3" fill={primaryColor} filter="url(#faang-glow)" />

      {/* Apex glow dot */}
      <circle cx="62" cy="22" r="5" fill={secondaryColor} opacity="0.9" filter="url(#faang-glow)" />

      {/* Step lines suggesting ascension */}
      <line x1="62" y1="28" x2="62" y2="17" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}
