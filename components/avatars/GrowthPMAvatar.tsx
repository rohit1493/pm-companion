'use client'

import React from 'react'

interface AvatarProps {
  size?: number
  primaryColor?: string
  secondaryColor?: string
  animated?: boolean
  className?: string
}

export function GrowthPMAvatar({
  size = 80,
  primaryColor = '#10b981',
  secondaryColor = '#3b82f6',
  animated = false,
  className = '',
}: AvatarProps) {
  // Bar data: [x, height] pairs — ascending pattern
  const bars = [
    { x: 16, h: 28 },
    { x: 34, h: 44 },
    { x: 52, h: 56 },
    { x: 70, h: 68 },
    { x: 88, h: 82 },
  ]
  const baseY = 100

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
        <linearGradient id="growth-bar-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.6" />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
        <filter id="growth-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Bars */}
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={baseY - bar.h}
          width="14"
          height={bar.h}
          rx="3"
          fill="url(#growth-bar-grad)"
          opacity={0.5 + i * 0.1}
        />
      ))}

      {/* Trend line overlay */}
      <polyline
        points={bars.map(b => `${b.x + 7},${baseY - b.h - 4}`).join(' ')}
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#growth-glow)"
      />

      {/* Top dot on last bar */}
      <circle
        cx={bars[4].x + 7}
        cy={baseY - bars[4].h - 4}
        r="5"
        fill={primaryColor}
        filter="url(#growth-glow)"
      />

      {/* Baseline */}
      <line x1="12" y1={baseY + 2} x2="108" y2={baseY + 2} stroke={primaryColor} strokeWidth="1.5" opacity="0.3" />
    </svg>
  )
}
