'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  width?: number
  height?: number
  style?: React.CSSProperties
  className?: string
}

export default function BotAnimatedCanvas({ width = 370, height = 460, style, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [videoReady, setVideoReady] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const W = 1280
    const H = 720
    canvas.width = W
    canvas.height = H

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let animRunning = false

    const drawFrame = () => {
      if (!animRunning) return
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, W, H)
        const imgData = ctx.getImageData(0, 0, W, H)
        const d = imgData.data

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i]
          const g = d[i + 1]
          const b = d[i + 2]
          if (g > 80 && g > r * 1.2 && g > b * 1.2) {
            const greenness = g / (Math.max(r, b) + 1)
            const alpha = greenness > 2.2 ? 0 : Math.round(255 * (1 - (greenness - 1.2) / 1.0))
            d[i + 3] = Math.max(0, Math.min(255, alpha))
          }
        }
        ctx.putImageData(imgData, 0, 0)
      }
      rafRef.current = requestAnimationFrame(drawFrame)
    }

    const startDrawing = () => {
      if (animRunning) return
      animRunning = true
      setVideoReady(true)
      drawFrame()
    }

    const tryPlay = () => {
      video.play().then(startDrawing).catch(() => {
        setError(true)
      })
    }

    // Se já carregado (cache), tenta imediatamente
    if (video.readyState >= 3) {
      tryPlay()
    } else {
      video.addEventListener('canplay', tryPlay, { once: true })
      video.addEventListener('loadeddata', tryPlay, { once: true })
    }
    video.addEventListener('error', () => setError(true), { once: true })
    video.load()

    return () => {
      animRunning = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Fallback: imagem estática se vídeo não funcionar
  if (error) {
    return (
      <Image
        src="/bot-joao-login.png"
        alt="Bot João"
        width={width}
        height={height}
        style={{ objectFit: 'contain', ...style }}
        className={className}
        priority
      />
    )
  }

  return (
    <div style={{ position: 'relative', width, height, ...style }} className={className}>
      <video
        ref={videoRef}
        src="/bot-joao-animated.mp4"
        loop
        muted
        playsInline
        preload="auto"
        style={{ display: 'none' }}
      />
      {/* Mostra imagem estática enquanto o vídeo não carrega */}
      {!videoReady && (
        <Image
          src="/bot-joao-login.png"
          alt="Bot João"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: videoReady ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  )
}
