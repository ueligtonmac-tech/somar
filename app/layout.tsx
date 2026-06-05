import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HUB Somar — Ultragaz',
  description: 'Plataforma de onboarding para consultores de canais digitais Ultragaz',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <body className="antialiased font-nunito">
        {children}
      </body>
    </html>
  )
}
