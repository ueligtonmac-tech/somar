'use client'

import { useEffect, useRef } from 'react'

interface Props {
  width?: number
  height?: number
  style?: React.CSSProperties
  className?: string
}

/**
 * Reproduz bot-joao-animated.mp4 com remoção de cromakey verde em tempo real via Canvas.
 * Nenhum processamento server-side necessário.
 */
export default function BotAnimatedCanvas({ width = 370, height = 460, style, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // Resolução interna do canvas = resolução original do vídeo
    const W = 1280
    const H = 720
    canvas.width = W
    canvas.height = H

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const drawFrame = () => {
      if (!video.paused && !video.ended && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, W, H)

        const imgData = ctx.getImageData(0, 0, W, H)
        const d = imgData.data

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i]
          const g = d[i + 1]
          const b = d[i + 2]

          // Chroma key: verde com boa tolerância para gradiente de iluminação
          // g > 80 evita remover sombras escuras
          // g > r*1.25 e g > b*1.25 exclui pixels com outra dominância de cor
          if (g > 80 && g > r * 1.25 && g > b * 1.25) {
            // Blend suave nas bordas: quanto mais "verde puro", mais transparente
            const greenness = g / Math.max(r, b, 1)
            const alpha = greenness > 2 ? 0 : Math.round(255 * (1 - (greenness - 1.25) / 0.75))
            d[i + 3] = Math.max(0, Math.min(255, alpha))
          }
        }

        ctx.putImageData(imgData, 0, 0)
      }

      rafRef.current = requestAnimationFrame(drawFrame)
    }

    const onPlay = () => {
      drawFrame()
    }

    video.addEventListener('play', onPlay)
    // Tenta autoplay (muted é necessário para navegadores modernos)
    video.muted = true
    video.play().catch(() => {
      // Autoplay bloqueado — canvas ficará vazio até interação do usuário
    })

    return () => {
      video.removeEventListener('play', onPlay)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width, height, ...style }} className={className}>
      {/* Vídeo escondido — fonte dos frames */}
      <video
        ref={videoRef}
        src="/bot-joao-animated.mp4"
        loop
        muted
        playsInline
        preload="auto"
        style={{ display: 'none' }}
      />
      {/* Canvas com cromakey aplicado */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
