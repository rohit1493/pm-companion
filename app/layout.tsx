import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PM Companion — Your learning plan, not another feed',
  description: 'Goal-anchored learning for product managers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
