'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  width?: number
  height?: number
  style?: React.CSSProperties
  className?: string
}

/**
 * Bot João animado com fundo preto removido via mix-blend-mode: screen.
 * O fundo preto some sobre qualquer background escuro/colorido.
 */
export default function BotAnimatedCanvas({ width = 370, height = 460, style, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onCanPlay = () => {
      v.play()
        .then(() => setReady(true))
        .catch(() => {
          // Autoplay bloqueado: mostra imagem estática
          setFailed(true)
        })
    }

    v.addEventListener('canplay', onCanPlay, { once: true })
    v.addEventListener('error', () => setFailed(true), { once: true })

    return () => v.removeEventListener('canplay', onCanPlay)
  }, [])

  if (failed) {
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
    <div
      style={{ position: 'relative', width, height, ...style }}
      className={className}
    >
      {/* Fallback estático enquanto vídeo não inicia */}
      {!ready && (
        <Image
          src="/bot-joao-login.png"
          alt="Bot João"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      )}

      {/* Vídeo com fundo preto + screen blend: o preto desaparece no bg azul */}
      <video
        ref={videoRef}
        src="/bot-joao-animated.mp4"
        loop
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'screen',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
    </div>
  )
}
