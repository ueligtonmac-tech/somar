'use client'

interface Props {
  width?: number
  height?: number
  style?: React.CSSProperties
  className?: string
}

export default function BotAnimatedCanvas({ width = 370, height = 460, style, className }: Props) {
  return (
    <video
      src="/bot-joao-animated.mp4"
      autoPlay
      loop
      muted
      playsInline
      width={width}
      height={height}
      style={{
        objectFit: 'contain',
        mixBlendMode: 'screen',
        display: 'block',
        ...style,
      }}
      className={className}
    />
  )
}
