'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const VIDEO_SRC = '/bot-joao-animated.mp4'

const PILLARS = [
  {
    icon: '🗺️',
    title: 'Trilha guiada',
    desc: 'Módulos progressivos com conteúdo exclusivo sobre os canais digitais Ultragaz.',
    color: '#000FFF',
  },
  {
    icon: '🤖',
    title: 'Bot João',
    desc: 'Assistente com IA treinado para responder dúvidas sobre processos, HUB e Vale Gás.',
    color: '#6366f1',
  },
  {
    icon: '📖',
    title: 'Biblioteca',
    desc: 'Acesso a manuais, materiais e documentos oficiais da Ultragaz em um só lugar.',
    color: '#0891b2',
  },
  {
    icon: '🏆',
    title: 'Conquistas',
    desc: 'Pontue e desbloqueie conquistas a cada módulo concluído na jornada.',
    color: '#ea580c',
  },
]

const CHAT_DEMO = [
  { from: 'user', text: 'Como valido o Vale Gás no MAP?' },
  { from: 'bot',  text: 'Acesse o MAP → Benefícios → Vale Gás. Insira o CPF do cliente, confirme o endereço e clique em Validar. O benefício é processado em até 2 horas.' },
  { from: 'user', text: 'E se o cliente não aparecer no sistema?' },
  { from: 'bot',  text: 'Nesse caso, peça o NIS do cliente e tente pela busca avançada. Se ainda não localizar, acione o suporte via HUB com o código de erro.' },
]

/* ── Modal Trial ─────────────────────────────────────────────── */
function TrialModal({ onClose }: { onClose: () => void }) {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res  = await fetch('/api/trial/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      if (data.redirect) { window.location.href = data.redirect; return }
      setError(data.error || 'Erro ao criar acesso. Tente novamente.')
      return
    }
    window.location.href = data.actionLink
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,5,80,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#000FFF] px-6 pt-6 pb-5">
          <div className="flex items-center justify-between mb-4">
            <Image src="/logo.png" alt="Ultragaz" width={100} height={30} style={{ filter: 'brightness(0) invert(1)', height: 'auto' }} />
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <h2 className="text-white font-black text-xl leading-tight">
            Acesse a demonstração
          </h2>
          <p className="text-blue-200 text-sm mt-1">
            Explore a plataforma completa por 3 dias
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Seu nome</label>
            <input
              type="text" placeholder="Como você se chama?"
              value={name} onChange={e => setName(e.target.value)}
              required autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium
                text-gray-900 focus:outline-none focus:border-[#000FFF] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">E-mail</label>
            <input
              type="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium
                text-gray-900 focus:outline-none focus:border-[#000FFF] transition-colors"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-[#000FFF] text-white font-black text-sm rounded-xl py-3.5 mt-1
              hover:bg-[#0009cc] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Acessando...</>
              : '→ Acessar demonstração'
            }
          </button>
          <p className="text-center text-[11px] text-gray-400 leading-relaxed">
            Ao continuar você concorda com os{' '}
            <Link href="/termos" className="text-[#000FFF] font-semibold">Termos de Uso</Link>
            {' '}e{' '}
            <Link href="/politica" className="text-[#000FFF] font-semibold">Privacidade</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

/* ── Chat animado ─────────────────────────────────────────────── */
function AnimatedChat() {
  const [visible, setVisible] = useState(0)
  const [key, setKey] = useState(0) // força restart
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible < CHAT_DEMO.length) {
      const delay = visible === 0 ? 800 : 1600
      const t = setTimeout(() => setVisible(v => v + 1), delay)
      return () => clearTimeout(t)
    } else {
      // Após mostrar tudo, aguarda 3s e reinicia
      const t = setTimeout(() => {
        setVisible(0)
        setKey(k => k + 1)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [visible])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [visible])

  return (
    <div key={key} className="flex flex-col gap-2.5 h-48 overflow-hidden">
      {CHAT_DEMO.slice(0, visible).map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          style={{ animation: 'fadeUp 0.3s ease both' }}
        >
          {msg.from === 'bot' && (
            <div className="w-7 h-7 rounded-full bg-[#000FFF] flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <Image src="/bot-joao-icon1.png" alt="" width={18} height={18} />
            </div>
          )}
          <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed font-medium
            ${msg.from === 'user'
              ? 'bg-[#000FFF] text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
            {msg.text}
          </div>
        </div>
      ))}
      {visible < CHAT_DEMO.length && (
        <div className="flex justify-start" style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="w-7 h-7 rounded-full bg-[#000FFF] flex items-center justify-center shrink-0 mr-2">
            <Image src="/bot-joao-icon1.png" alt="" width={18} height={18} />
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
            {[0,1,2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                style={{ animation: `bounce 1.2s ease ${i * 0.18}s infinite` }} />
            ))}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

/* ── Número animado ───────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = Math.ceil(target / 40)
      const t = setInterval(() => {
        start = Math.min(start + step, target)
        setVal(start)
        if (start >= target) clearInterval(t)
      }, 35)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{val}{suffix}</span>
}

/* ── Vídeo local com autoplay ao scroll e toggle de áudio ────── */
function AutoplayVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const tryPlay = () => video.play().then(() => setPlaying(true)).catch(() => {})
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { tryPlay() }
        else { video.pause(); setPlaying(false) }
      },
      { threshold: 0.3 }
    )
    obs.observe(video)
    return () => obs.disconnect()
  }, [])

  const handlePlayClick = () => {
    const video = videoRef.current
    if (!video) return
    video.play().then(() => setPlaying(true)).catch(() => {})
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return (
    <div
      className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 cursor-pointer"
      style={{ aspectRatio: '16/9' }}
      onClick={handlePlayClick}
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        loop
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Overlay play — aparece só quando pausado */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl
            hover:scale-110 transition-transform duration-200">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#000FFF">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>
      )}

      {/* Botão de áudio — sempre visível no canto */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm
          flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10 shadow-lg"
        title={muted ? 'Ativar áudio' : 'Silenciar'}
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>
    </div>
  )
}

/* ── Landing Page ─────────────────────────────────────────────── */
export default function LandingPage() {
  const [modal, setModal] = useState(false)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Mangueira', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bounce  { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse2  { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/96 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Ultragaz" width={110} height={34} style={{ height: 'auto' }} />
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <span className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest">Bot João</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-bold text-[#000FFF] border-2 border-[#000FFF] rounded-xl px-5 py-2
              hover:bg-[#000FFF] hover:text-white transition-all duration-200"
          >
            Fazer Login
          </Link>
        </div>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative bg-[#000FFF] overflow-hidden">
        {/* Onda decorativa */}
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, #ffffff, transparent)' }} />
        <Image src="/onda-bg.png" alt="" fill className="object-cover opacity-5 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-0">
          <div className="grid lg:grid-cols-2 gap-12 items-end">

            {/* Texto */}
            <div className="text-center lg:text-left pb-12 lg:pb-16">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold
                uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
                style={{ animation: 'fadeUp .5s ease both' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'pulse2 2s infinite' }} />
                Plataforma oficial Ultragaz
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-5"
                style={{ animation: 'fadeUp .6s ease .1s both' }}
              >
                Prepare-se para<br />
                <span style={{ color: '#a5b4fc' }}>vender mais</span><br />
                com o Bot João
              </h1>

              <p
                className="text-blue-200 text-base sm:text-lg max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed"
                style={{ animation: 'fadeUp .6s ease .2s both' }}
              >
                Trilha completa de capacitação para consultores Ultragaz dominarem os canais digitais e o HUB Somar.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                style={{ animation: 'fadeUp .6s ease .3s both' }}
              >
                <button
                  onClick={() => setModal(true)}
                  className="bg-white text-[#000FFF] font-black text-base rounded-2xl px-8 py-4
                    hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  → Acessar demonstração
                </button>
                <button
                  onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-white/80 font-semibold text-sm flex items-center justify-center gap-2
                    hover:text-white transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Assistir apresentação
                </button>
              </div>
            </div>

            {/* Chat preview flutuante */}
            <div
              className="hidden lg:block pb-0"
              style={{ animation: 'fadeUp .7s ease .35s both' }}
            >
              <div className="bg-white rounded-t-3xl shadow-2xl p-5 max-w-sm mx-auto lg:mx-0 lg:ml-auto">
                <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-gray-100">
                  <Image src="/bot-joao-icon1.png" alt="Bot João" width={32} height={32} />
                  <div>
                    <p className="text-sm font-black text-gray-900">Bot João</p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-gray-400 font-semibold">Online agora</span>
                    </div>
                  </div>
                </div>
                <AnimatedChat />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ NÚMEROS ══════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: 12,  suffix: '',   label: 'Módulos de conteúdo' },
            { value: 100, suffix: '%',  label: 'Digital e prático' },
            { value: 3,   suffix: ' dias', label: 'Para explorar tudo' },
            { value: 1,   suffix: '',   label: 'Assistente IA dedicado' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-black text-[#000FFF] mb-1">
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ VÍDEO ════════════════════════════════════════════ */}
      <section id="video-section" className="bg-[#f5f6ff] py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-black uppercase tracking-widest text-[#000FFF] text-center mb-2">Apresentação</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-8">
            Conheça o Bot João em ação
          </h2>
          <AutoplayVideo />
        </div>
      </section>

      {/* ══ PILARES ══════════════════════════════════════════ */}
      <section className="bg-white py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-black uppercase tracking-widest text-[#000FFF] text-center mb-2">O que você encontra</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-10">
            Uma plataforma completa de capacitação
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map(p => (
              <div key={p.title}
                className="group rounded-2xl border border-gray-100 bg-gray-50 p-6
                  hover:border-[#000FFF]/30 hover:bg-[#f0f1ff] hover:-translate-y-1 transition-all duration-200 cursor-default">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${p.color}18` }}>
                  {p.icon}
                </div>
                <h3 className="font-black text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRILHA PREVIEW ══════════════════════════════════ */}
      <section className="bg-[#000FFF] py-16 px-5 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 80% 50%, #a5b4fc, transparent)' }} />
        <div className="relative max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-300 mb-2">Trilha de aprendizado</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
              Uma etapa de cada vez.<br />
              <span className="text-blue-300">No seu ritmo.</span>
            </h2>
            <p className="text-blue-200 leading-relaxed mb-6">
              Módulos progressivos que se desbloqueiam conforme você avança. Conteúdo prático sobre HUB Somar, Vale Gás, App Ultragaz, AmigU e mais.
            </p>
            <button
              onClick={() => setModal(true)}
              className="inline-flex items-center gap-2 bg-white text-[#000FFF] font-black text-sm
                rounded-xl px-6 py-3 hover:bg-blue-50 transition-colors shadow-lg"
            >
              → Explorar a trilha
            </button>
          </div>

          {/* Steps preview */}
          <div className="flex flex-col gap-3">
            {[
              { n: 1, title: 'Como funciona sua trilha',   done: true,    color: '#22c55e' },
              { n: 2, title: 'Canais Digitais Ultragaz',   active: true,  color: '#000FFF' },
              { n: 3, title: 'HUB Somar — Acesso e uso',   locked: true,  color: '#6b7280' },
              { n: 4, title: 'Vale Gás — Validação no MAP', locked: true, color: '#6b7280' },
            ].map(step => (
              <div key={step.n}
                className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-all
                  ${step.done   ? 'bg-green-500/15 border border-green-400/30' :
                    step.active ? 'bg-white shadow-lg border border-white/20' :
                                  'bg-white/8 border border-white/10 opacity-50'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0
                  ${step.done   ? 'bg-green-500 text-white' :
                    step.active ? 'bg-[#000FFF] text-white' :
                                  'bg-white/20 text-white/50'}`}
                >
                  {step.done ? '✓' : step.locked ? '🔒' : step.n}
                </div>
                <p className={`font-bold text-sm flex-1 truncate
                  ${step.active ? 'text-gray-900' : 'text-white'}`}
                >
                  {step.title}
                </p>
                {step.active && (
                  <span className="text-[10px] font-black text-[#000FFF] bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                    EM ANDAMENTO
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════════ */}
      <section className="bg-white py-20 px-5 text-center">
        <Image src="/bot-joao-icon1.png" alt="Bot João" width={64} height={64} className="mx-auto mb-5" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
          Pronto para conhecer<br />a plataforma?
        </h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
          Acesse a demonstração completa e explore todos os recursos do Bot João.
        </p>
        <button
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 bg-[#000FFF] text-white font-black text-base
            rounded-2xl px-10 py-4 hover:bg-[#0009cc] transition-all duration-200
            shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
        >
          → Acessar demonstração
        </button>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-xs">
            © 2026 Arkanjia · Bot João · Ultragaz ·{' '}
            <Link href="/termos" className="hover:text-[#000FFF] transition-colors">Termos</Link>
            {' '}·{' '}
            <Link href="/politica" className="hover:text-[#000FFF] transition-colors">Privacidade</Link>
          </p>
        </div>
      </section>

      {modal && <TrialModal onClose={() => setModal(false)} />}
    </div>
  )
}
