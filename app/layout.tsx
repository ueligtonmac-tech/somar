import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'HUB Somar — Ultragaz',
  description: 'Plataforma de onboarding para consultores de canais digitais Ultragaz',
  icons: {
    icon: '/ug-logo.jpeg',
    apple: '/ug-logo.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
