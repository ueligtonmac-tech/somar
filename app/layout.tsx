import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Bot João · Onboarding inteligente da Ultragaz',
  description: 'Plataforma de onboarding para consultores de canais digitais Ultragaz',
  icons: {
    icon: '/bot-joao.webp',
    apple: '/bot-joao.webp',
    shortcut: '/bot-joao.webp',
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
