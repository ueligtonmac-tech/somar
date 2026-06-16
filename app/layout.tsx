import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Bot João · Ultragaz',
  description: 'Plataforma de onboarding para consultores de canais digitais Ultragaz',
  icons: {
    icon: '/ug-icon.jpg',
    apple: '/ug-icon.jpg',
    shortcut: '/ug-icon.jpg',
  },
  manifest: '/manifest.webmanifest',
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
