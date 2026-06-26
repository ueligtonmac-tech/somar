import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Em breve · Bot João',
  description: 'Plataforma em preparação. Em breve disponível para consultores Ultragaz.',
}

export default function EmConstrucaoPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(135deg, #000FFF 0%, #0000cc 100%)' }}
    >
      {/* Glow decorativo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,255,255,0.08), transparent)' }}
      />

      <div className="relative flex flex-col items-center gap-6 max-w-md">

        {/* Logo */}
        <Image
          src="/bot-joao-icon1.png"
          alt="Bot João"
          width={80}
          height={80}
          className="opacity-95"
          style={{ filter: 'drop-shadow(0 0 24px rgba(255,255,255,0.3))' }}
        />

        {/* Badge */}
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 text-white/80
          text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Em preparação
        </div>

        {/* Título */}
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
          Voltamos<br />em breve.
        </h1>

        {/* Subtítulo */}
        <p className="text-blue-200 text-base leading-relaxed">
          A plataforma <strong className="text-white">Bot João — Hub Somar</strong> está
          sendo preparada e em breve estará disponível para os consultores Ultragaz autorizados.
        </p>

        {/* Divisor */}
        <div className="w-12 h-px bg-white/20 my-2" />

        {/* Info */}
        <p className="text-blue-300 text-sm leading-relaxed">
          O acesso é <strong className="text-white">restrito a consultores Ultragaz</strong> e
          será liberado pelos administradores. Se você já possui cadastro, aguarde a comunicação oficial.
        </p>

        {/* Logo Ultragaz */}
        <div className="mt-4">
          <Image
            src="/logo.png"
            alt="Ultragaz"
            width={110}
            height={34}
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.6, height: 'auto' }}
          />
        </div>

      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-white/30 text-xs">
        © 2026 Ultragaz · Bot João
      </p>
    </div>
  )
}
