import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bot João · Ultragaz',
    short_name: 'Bot João',
    description: 'Plataforma de onboarding para consultores de canais digitais Ultragaz',
    start_url: '/trilha',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000FFF',
    orientation: 'portrait',
    icons: [
      {
        src: '/ug-icon.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/ug-icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
      {
        src: '/ug-icon.jpg',
        sizes: 'any',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  }
}
