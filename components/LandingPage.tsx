'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const VIDEO_ID = 'Cpw2eXnaOoc' // mesmo vídeo do WelcomeVideoPopup pós-login

const FEATURES = [
  { icon: '📚', title: 'Trilha guiada', desc: 'Módulos progressivos que desbloqueiam conforme você avança' },
  { icon: '🤖', title: 'Bot João', desc: 'Assistente IA treinado para responder suas dúvidas na hora' },
  { icon: '🏆', title: 'Pontos e conquistas', desc: 'Ganhe pontos e badges ao concluir cada etapa' },
  { icon: '📖', title: 'Biblioteca', desc: 'Acesso a materiais, manuais e documentos da Ultragaz' },
]

/* ── Modal de acesso trial ──────────────────────────────────── */
function TrialModal({ trigger, onClose }: { trigger: string; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/trial/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (data.redirect) {
        window.location.href = data.redirect
        return
      }
      setError(data.error || 'Erro ao criar acesso. Tente novamente.')
      return
    }

    // Redireciona para magic link → login automático → /trilha
    window.location.href = data.actionLink
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#000FFF] px-6 pt-6 pb-5">
          <div className="flex items-center justify-between mb-3">
            <Image src="/bot-joao-icon1.png" alt="Bot João" width={36} height={36} />
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <h2 className="text-white font-black text-lg leading-tight">
            {trigger === 'bot' ? 'Converse com o Bot João' : 'Iniciar sua jornada'}
          </h2>
          <p className="text-blue-200 text-xs mt-1">
            Acesso demo grátis por 3 dias · Sem cartão de crédito
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Seu nome</label>
            <input
              type="text"
              placeholder="Como você se chama?"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900
                focus:outline-none focus:border-[#000FFF] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900
                focus:outline-none focus:border-[#000FFF] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#000FFF] text-white font-black text-sm rounded-xl py-3.5 mt-1
              hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando acesso...
              </>
            ) : (
              '→ Começar demo grátis'
            )}
          </button>

          <p className="text-center text-[11px] text-gray-400 leading-relaxed">
            Ao continuar você concorda com os{' '}
            <Link href="/termos" className="text-[#000FFF] font-semibold underline">Termos de Uso</Link>
            {' '}e{' '}
            <Link href="/politica" className="text-[#000FFF] font-semibold underline">Privacidade</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

/* ── Landing Page ────────────────────────────────────────────── */
export default function LandingPage() {
  const [modal, setModal] = useState<'bot' | 'trail' | null>(null)
  const [videoPlaying, setVideoPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Ultragaz" width={100} height={30} style={{ height: 'auto' }} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Bot João</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-bold text-[#000FFF] border-2 border-[#000FFF] rounded-xl px-4 py-2
            hover:bg-[#000FFF] hover:text-white transition-all"
        >
          Fazer Login
        </Link>
      </header>

      {/* ── Hero com vídeo ── */}
      <section className="bg-[#000FFF] px-5 pt-10 pb-0 text-center overflow-hidden">
        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">
          Plataforma de Onboarding · Ultragaz
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
          Aprenda. Pratique.<br />Venda mais.
        </h1>
        <p className="text-blue-200 text-sm max-w-sm mx-auto mb-6">
          Trilha completa para consultores Ultragaz dominarem os canais digitais e o HUB Somar.
        </p>

        <button
          onClick={() => setModal('trail')}
          className="inline-flex items-center gap-2 bg-white text-[#000FFF] font-black text-sm rounded-xl px-6 py-3
            hover:bg-blue-50 transition-colors shadow-lg mb-8"
        >
          🚀 Experimentar grátis por 3 dias
        </button>

        {/* Vídeo — thumbnail + play igual ao WelcomeVideoPopup */}
        <div className="relative max-w-2xl mx-auto rounded-t-2xl overflow-hidden shadow-2xl"
          style={{ paddingBottom: '56.25%' }}>
          {videoPlaying ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
              title="Bot João — Plataforma Ultragaz"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <button
              onClick={() => setVideoPlaying(true)}
              className="absolute inset-0 w-full h-full group"
              style={{
                backgroundImage: `url(https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-[#000FFF] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-semibold drop-shadow">
                Clique para assistir com som 🔊
              </p>
            </button>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-5 py-12 max-w-2xl mx-auto">
        <h2 className="text-xl font-black text-gray-900 text-center mb-8">
          Tudo que você precisa numa plataforma
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <span className="text-2xl block mb-2">{f.icon}</span>
              <p className="font-black text-gray-900 text-sm mb-1">{f.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bot João preview ── */}
      <section className="bg-[#f5f6ff] px-5 py-10 text-center">
        <h2 className="text-xl font-black text-gray-900 mb-2">Conheça o Bot João</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          Tire dúvidas a qualquer hora sobre os processos Ultragaz com IA especializada.
        </p>

        {/* Preview do chat */}
        <div className="max-w-xs mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left mb-6">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-50">
            <Image src="/bot-joao-icon1.png" alt="Bot João" width={28} height={28} />
            <span className="text-xs font-black text-gray-700">Bot João</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="space-y-2.5">
            <div className="bg-gray-100 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 font-medium max-w-[80%]">
              Como faço para validar o Vale Gás no MAP?
            </div>
            <div className="bg-[#000FFF] rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white font-medium ml-auto max-w-[80%]">
              Para validar o Vale Gás, acesse o MAP, clique em &ldquo;Benefícios&rdquo; e siga o fluxo de aprovação...
            </div>
          </div>
          <button
            onClick={() => setModal('bot')}
            className="w-full mt-4 bg-[#000FFF] text-white text-xs font-bold rounded-xl py-2.5
              hover:bg-blue-700 transition-colors"
          >
            💬 Conversar com o Bot João
          </button>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="bg-[#000FFF] px-5 py-12 text-center">
        <Image src="/bot-joao-icon1.png" alt="Bot João" width={56} height={56} className="mx-auto mb-4 opacity-90" />
        <h2 className="text-2xl font-black text-white mb-2">Pronto para começar?</h2>
        <p className="text-blue-200 text-sm mb-6">3 dias grátis. Sem cartão de crédito.</p>
        <button
          onClick={() => setModal('trail')}
          className="bg-white text-[#000FFF] font-black text-sm rounded-xl px-8 py-3.5
            hover:bg-blue-50 transition-colors shadow-lg"
        >
          → Criar acesso demo agora
        </button>
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-blue-300/60 text-xs">© 2026 Arkanjia · <Link href="/termos" className="underline">Termos</Link> · <Link href="/politica" className="underline">Privacidade</Link></p>
        </div>
      </section>

      {/* ── Modal ── */}
      {modal && <TrialModal trigger={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
