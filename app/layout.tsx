import type { Metadata, Viewport } from 'next'
import './globals.css'
import AmplitudeProvider from './AmplitudeProvider'

export const metadata: Metadata = {
  title: 'PM Dojo — Your personalised PM learning path',
  description: 'Goal-anchored learning for product managers.',
  other: { 'theme-color': '#0b0f14' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AmplitudeProvider />
        {children}
      </body>
    </html>
  )
}
