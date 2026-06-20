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
    icon: [
      { url: '/bot-joao-icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/bot-joao-icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/bot-joao-icon.png',
    shortcut: '/bot-joao-icon.png',
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
