'use client'

import { useEffect } from 'react'
import { initAmplitude } from '@/lib/analytics'

export default function AmplitudeProvider() {
  useEffect(() => {
    initAmplitude()
  }, [])
  return null
}
