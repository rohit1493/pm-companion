'use client'

import React from 'react'

interface AvatarProps {
  size?: number
  primaryColor?: string
  secondaryColor?: string
  animated?: boolean
  className?: string
}

export function ScannerAvatar({
  size = 80,
  primaryColor = '#8b5cf6',
  secondaryColor = '#d946ef',
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
        <radialGradient id="scanner-sweep" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="0.5" />
          <stop offset="60%" stopColor={secondaryColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
        </radialGradient>
        <filter id="scanner-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Concentric rings */}
      <circle cx="60" cy="60" r="50" stroke={primaryColor} strokeWidth="1" opacity="0.2" />
      <circle cx="60" cy="60" r="36" stroke={primaryColor} strokeWidth="1.2" opacity="0.3" />
      <circle cx="60" cy="60" r="22" stroke={secondaryColor} strokeWidth="1.5" opacity="0.4" />

      {/* Cross-hairs */}
      <line x1="60" y1="10" x2="60" y2="110" stroke={primaryColor} strokeWidth="0.8" opacity="0.15" />
      <line x1="10" y1="60" x2="110" y2="60" stroke={primaryColor} strokeWidth="0.8" opacity="0.15" />

      {/* Sweep line (45° — frozen mid-scan) */}
      <line
        x1="60"
        y1="60"
        x2="102"
        y2="18"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
        filter="url(#scanner-glow)"
      />

      {/* Sweep area fill */}
      <path
        d="M 60 60 L 102 18 A 50 50 0 0 0 110 60 Z"
        fill={primaryColor}
        opacity="0.1"
      />

      {/* Center dot */}
      <circle cx="60" cy="60" r="5" fill={primaryColor} filter="url(#scanner-glow)" />

      {/* Discovery blip */}
      <circle cx="88" cy="32" r="4" fill={secondaryColor} filter="url(#scanner-glow)" opacity="0.9" />
      <circle cx="88" cy="32" r="8" stroke={secondaryColor} strokeWidth="1" opacity="0.3" />
    </svg>
  )
}
