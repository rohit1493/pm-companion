'use client'

import { useEffect, useState } from 'react'

type StreakData = {
  streak: number
  readToday: boolean
  totalRead: number
}

export default function StreakBadge() {
  const [data, setData] = useState<StreakData | null>(null)

  useEffect(() => {
    fetch('/api/streak')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null
  if (data.streak === 0 && data.totalRead === 0) return null

  const flame = data.streak >= 7 ? '🔥' : data.streak >= 3 ? '⚡' : '📖'

  return (
    <div style={{
      margin: '0 16px 4px',
      padding: '12px 16px',
      background: data.readToday
        ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)'
        : 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)',
      border: `1px solid ${data.readToday ? '#A7F3D0' : '#FED7AA'}`,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>{flame}</span>
        <div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            color: data.readToday ? '#065F46' : '#92400E',
            lineHeight: 1.2,
          }}>
            {data.streak} day streak
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: data.readToday ? '#059669' : '#B45309',
            lineHeight: 1.2,
            marginTop: '2px',
          }}>
            {data.readToday
              ? 'Read today ✓'
              : 'Read today to keep your streak'}
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '18px',
          fontWeight: 700,
          color: data.readToday ? '#10B981' : '#F59E0B',
          lineHeight: 1,
        }}>
          {data.totalRead}
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px',
          color: '#94A3B8',
          marginTop: '2px',
        }}>
          total read
        </p>
      </div>
    </div>
  )
}
