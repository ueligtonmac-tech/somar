import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bot João · Ultragaz',
    short_name: 'Bot João',
    description: 'Plataforma de onboarding para consultores de canais digitais Ultragaz',
    start_url: '/trilha',
    display: 'standalone',
    background_color: '#000FFF',
    theme_color: '#000FFF',
    orientation: 'portrait',
    icons: [
      {
        src: '/bot-joao.webp',
        sizes: '192x192',
        type: 'image/webp',
      },
      {
        src: '/bot-joao.webp',
        sizes: '512x512',
        type: 'image/webp',
      },
      {
        src: '/bot-joao.webp',
        sizes: 'any',
        type: 'image/webp',
        purpose: 'maskable',
      },
    ],
  }
}
