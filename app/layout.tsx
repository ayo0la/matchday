import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Matchday',
  description: 'Live football scores, standings, and fixtures',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
