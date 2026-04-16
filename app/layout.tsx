import type { Metadata, Viewport } from 'next'
import './globals.css'
import AmplitudeProvider from './AmplitudeProvider'

export const metadata: Metadata = {
  title: 'PM Dojo — Your personalised PM learning path',
  description: 'Goal-anchored learning for product managers. Build your PM instincts with a curated 10-article path matched to your archetype.',
  other: { 'theme-color': '#0b0f14' },
  openGraph: {
    title: 'PM Dojo — Train like a PM who ships',
    description: 'Build your PM instincts with a curated 10-article path matched to your archetype.',
    siteName: 'PM Dojo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PM Dojo — Train like a PM who ships',
    description: 'Build your PM instincts with a curated 10-article path matched to your archetype.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Manrope:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <a
          href="#main-content"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
          onFocus={(e) => {
            e.currentTarget.style.position = 'fixed'
            e.currentTarget.style.top = '8px'
            e.currentTarget.style.left = '8px'
            e.currentTarget.style.width = 'auto'
            e.currentTarget.style.height = 'auto'
            e.currentTarget.style.padding = '8px 16px'
            e.currentTarget.style.background = '#ff6b35'
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.zIndex = '9999'
            e.currentTarget.style.borderRadius = '8px'
            e.currentTarget.style.fontFamily = 'Inter, sans-serif'
            e.currentTarget.style.fontSize = '14px'
            e.currentTarget.style.fontWeight = '600'
          }}
          onBlur={(e) => {
            e.currentTarget.style.position = 'absolute'
            e.currentTarget.style.left = '-9999px'
            e.currentTarget.style.width = '1px'
            e.currentTarget.style.height = '1px'
          }}
        >
          Skip to main content
        </a>
        <AmplitudeProvider />
        {children}
      </body>
    </html>
  )
}
