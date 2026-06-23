import Link from 'next/link'
import Image from 'next/image'

export default function TrialExpiradoPage() {
  return (
    <div className="min-h-screen bg-[#000FFF] flex flex-col items-center justify-center p-6 text-center">
      <Image src="/bot-joao-icon1.png" alt="Bot João" width={80} height={80} className="mb-6 opacity-90" />

      <h1 className="text-2xl font-black text-white mb-2">Seu acesso demo expirou</h1>
      <p className="text-blue-200 text-sm mb-8 max-w-xs">
        Os 3 dias de demonstração chegaram ao fim. Para continuar aprendendo, faça seu cadastro completo.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/cadastro"
          className="w-full py-3 rounded-xl bg-white text-[#000FFF] font-black text-sm text-center hover:bg-blue-50 transition-colors"
        >
          → Criar conta completa
        </Link>
        <Link
          href="/login"
          className="w-full py-3 rounded-xl bg-transparent border border-white/30 text-white font-semibold text-sm text-center hover:bg-white/10 transition-colors"
        >
          Já tenho conta — Entrar
        </Link>
      </div>

      <p className="text-blue-300/60 text-xs mt-8">
        Dúvidas?{' '}
        <a href="https://wa.me/5565996464417" target="_blank" rel="noopener" className="underline">
          Fale conosco
        </a>
      </p>
    </div>
  )
}
