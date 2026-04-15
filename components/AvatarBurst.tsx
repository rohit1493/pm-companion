'use client'

import { useEffect, useRef } from 'react'
import type { AvatarTheme } from '@/lib/avatar-themes'

interface AvatarBurstProps {
  fighter: AvatarTheme
  originX: number
  originY: number
  onComplete: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  size: number
  color: string
}

export default function AvatarBurst({ fighter, originX, originY, onComplete }: AvatarBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Spawn 22 particles from origin
    const particles: Particle[] = Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2
      const speed = 4 + Math.random() * 6
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: 4 + Math.random() * 6,
        color: fighter.moodPalette[i % 3],
      }
    })

    function draw(ts: number) {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15 // gravity
        p.alpha = Math.max(0, p.alpha - 0.018)
        ctx!.globalAlpha = p.alpha
        ctx!.fillStyle = p.color
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fill()
      })

      // Burst circle
      if (elapsed < 550) {
        const progress = elapsed / 550
        const easedProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2
        const radius = easedProgress * Math.max(canvas!.width, canvas!.height) * 0.8
        const alpha = elapsed < 200 ? 0.4 : Math.max(0, 0.4 - ((elapsed - 200) / 350) * 0.4)
        ctx!.globalAlpha = alpha
        ctx!.beginPath()
        ctx!.arc(originX, originY, radius, 0, Math.PI * 2)
        ctx!.fillStyle = fighter.accent
        ctx!.fill()
      }

      // Shockwave ring (t=80ms)
      if (elapsed > 80 && elapsed < 480) {
        const ringProgress = Math.min((elapsed - 80) / 400, 1)
        const ringRadius = ringProgress * Math.max(canvas!.width, canvas!.height) * 0.6
        const ringAlpha = Math.max(0, 1 - ringProgress * 1.2)
        ctx!.globalAlpha = ringAlpha
        ctx!.strokeStyle = fighter.accent
        ctx!.lineWidth = 3 - ringProgress * 2
        ctx!.beginPath()
        ctx!.arc(originX, originY, ringRadius, 0, Math.PI * 2)
        ctx!.stroke()
      }

      ctx!.globalAlpha = 1

      if (elapsed < 1400) {
        frameRef.current = requestAnimationFrame(draw)
      } else {
        onComplete()
      }
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameRef.current)
    }
  }, [fighter, originX, originY, onComplete])

  // Banner: visible t=300ms → t=1100ms
  const bannerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    pointerEvents: 'none',
    zIndex: 10000,
    animation: 'avatarBannerIn 0.25s cubic-bezier(0.34,1.56,0.64,1) 300ms forwards, avatarBannerOut 0.3s ease-in 1100ms forwards',
    opacity: 0,
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      />
      <div style={bannerStyle}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: fighter.accent,
          marginBottom: '8px',
          textShadow: `0 0 20px ${fighter.accent}`,
        }}>
          Power Acquired
        </p>
        <p style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '36px',
          fontWeight: 700,
          color: '#f6fafe',
          letterSpacing: '-0.02em',
          marginBottom: '8px',
          textShadow: `0 0 40px ${fighter.accent}88`,
        }}>
          {fighter.label}
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: '#8b96a5',
          fontStyle: 'italic',
        }}>
          {fighter.title}
        </p>
      </div>
      <style>{`
        @keyframes avatarBannerIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes avatarBannerOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </>
  )
}
