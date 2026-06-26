'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'

interface Profile {
  full_name: string | null
  email: string
  role: string
}

const VIDEO_SRC = '/botjoao-demo.mp4'

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
  { from: 'user', text: 'Oi João! Como funciona o Vale Gás?' },
  { from: 'bot',  text: 'Oi! O Vale Gás Social é um benefício federal. Pelo MAP você valida direto: acesse Benefícios → Vale Gás, insira o CPF do cliente e confirme o endereço. Processado em até 2 horas! 🔵' },
  { from: 'user', text: 'E o App Ultragaz, para que serve?' },
  { from: 'bot',  text: 'O App é o canal digital do revendedor. Você pode fazer pedidos, consultar histórico, acompanhar entregas e gerenciar clientes — tudo pelo celular, sem precisar ligar para a central. 📱' },
  { from: 'user', text: 'Como acesso o HUB Somar?' },
  { from: 'bot',  text: 'Pelo link hub.ultragaz.com.br com seu login de revendedor. Lá você encontra manuais, campanhas ativas, contatos de suporte e o histórico das suas solicitações. 💡' },
]


/* ── Acesso restrito — redireciona para login ─────────────────── */

/* ── Chat demo — preview restrito ─────────────────────────────── */
type Msg = { from: 'user' | 'bot' | 'cta'; text: string }

const RESTRICTED_REPLY = 'Será uma satisfação te ajudar! Sou o Bot João, assistente oficial dos consultores Ultragaz. O acesso à plataforma é restrito e será liberado pelos administradores. Faça seu login ou aguarde a aprovação do seu cadastro. 🔐'

function DemoChat() {
  const [demoIdx, setDemoIdx]           = useState(0)
  const [demoKey, setDemoKey]           = useState(0)
  const [currentTyped, setCurrentTyped] = useState('')
  const [messages, setMessages]         = useState<Msg[]>([])
  const [input, setInput]               = useState('')
  const [typing, setTyping]             = useState(false)
  const [sent, setSent]                 = useState(false) // usuário já enviou algo
  const msgsRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Animação demo loop (só enquanto não enviou mensagem)
  useEffect(() => {
    if (sent) return

    if (demoIdx >= CHAT_DEMO.length) {
      const t = setTimeout(() => { setDemoIdx(0); setCurrentTyped(''); setDemoKey(k => k + 1) }, 4000)
      return () => clearTimeout(t)
    }

    const currentMsg = CHAT_DEMO[demoIdx]

    if (currentMsg.from === 'user') {
      if (currentTyped.length < currentMsg.text.length) {
        const t = setTimeout(() => setCurrentTyped(currentMsg.text.slice(0, currentTyped.length + 1)), 55)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => { setDemoIdx(i => i + 1); setCurrentTyped('') }, 800)
      return () => clearTimeout(t)
    } else {
      if (currentTyped === '') {
        const t = setTimeout(() => setCurrentTyped(' '), demoIdx === 0 ? 1200 : 1000)
        return () => clearTimeout(t)
      }
      if (currentTyped.length < currentMsg.text.length) {
        const t = setTimeout(() => setCurrentTyped(currentMsg.text.slice(0, currentTyped.length + 1)), 45)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => { setDemoIdx(i => i + 1); setCurrentTyped('') }, 2000)
      return () => clearTimeout(t)
    }
  }, [sent, demoIdx, currentTyped])

  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [demoIdx, messages, typing])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || typing) return
    setInput('')
    setSent(true)

    // Monta histórico da demo já exibida + mensagem do usuário
    const demoShown = CHAT_DEMO.slice(0, Math.max(demoIdx, 1)).map(m => ({ from: m.from as 'user'|'bot', text: m.text }))
    setMessages([...demoShown, { from: 'user', text }])
    setTyping(true)

    // Simula digitação da resposta restrita com typewriter
    let i = 0
    const reply = RESTRICTED_REPLY
    setTyping(false)
    setMessages(prev => [...prev, { from: 'bot', text: '' }])

    const tick = () => {
      i++
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { from: 'bot', text: reply.slice(0, i) }
        return copy
      })
      if (i < reply.length) setTimeout(tick, 28)
      else setTimeout(() => setMessages(prev => [...prev, { from: 'cta', text: '' }]), 600)
    }
    setTimeout(tick, 700)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={msgsRef} className="flex-1 overflow-y-auto flex flex-col gap-2.5"
        style={{ scrollbarWidth: 'none', minHeight: 0 }}>

        {!sent ? (
          <div key={demoKey} className="flex flex-col gap-2.5">
            {CHAT_DEMO.slice(0, demoIdx).map((m, i) => (
              <Bubble key={i} from={m.from as 'user'|'bot'} text={m.text} />
            ))}
            {demoIdx < CHAT_DEMO.length && (
              currentTyped && currentTyped.trim()
                ? <Bubble from={CHAT_DEMO[demoIdx].from as 'user'|'bot'} text={currentTyped} />
                : <Dots />
            )}
          </div>
        ) : (
          <>
            {messages.map((m, i) =>
              m.from === 'cta'
                ? <CtaBlock key={i} />
                : <Bubble key={i} from={m.from as 'user'|'bot'} text={m.text} />
            )}
            {typing && <Dots />}
          </>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite algo para conhecer o Bot João..."
          className="flex-1 bg-transparent text-[13px] text-gray-700 placeholder-gray-400
            font-medium outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || typing}
          className="w-8 h-8 rounded-full bg-[#000FFF] disabled:opacity-25 flex items-center
            justify-center shrink-0 transition-opacity"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function Bubble({ from, text }: { from: 'user'|'bot'; text: string }) {
  return (
    <div className={`flex shrink-0 ${from === 'user' ? 'justify-end' : 'justify-start'}`}
      style={{ animation: 'fadeUp 0.28s ease both' }}>
      {from === 'bot' && (
        <div className="w-6 h-6 rounded-full bg-[#000FFF] flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <Image src="/bot-joao-icon1.png" alt="" width={14} height={14} />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed font-medium
        ${from === 'user' ? 'bg-[#000FFF] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
        {text}
      </div>
    </div>
  )
}

function Dots() {
  return (
    <div className="flex justify-start shrink-0" style={{ animation: 'fadeUp 0.28s ease both' }}>
      <div className="w-6 h-6 rounded-full bg-[#000FFF] flex items-center justify-center shrink-0 mr-2">
        <Image src="/bot-joao-icon1.png" alt="" width={14} height={14} />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1 items-center">
        {[0,1,2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
            style={{ animation: `bounce 1.2s ease ${i * 0.18}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

function CtaBlock() {
  return (
    <div className="flex justify-start shrink-0" style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div className="w-6 h-6 rounded-full bg-[#000FFF] flex items-center justify-center shrink-0 mr-2 mt-1">
        <Image src="/bot-joao-icon1.png" alt="" width={14} height={14} />
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-bl-sm px-3.5 py-3 max-w-[84%]">
        <p className="text-[12px] text-gray-600 mb-2.5 leading-relaxed">
          Será uma satisfação te ajudar! 😊 O acesso completo é restrito a consultores Ultragaz autorizados. Faça login ou aguarde a liberação pelo administrador.
        </p>
        <Link
          href="/login"
          className="w-full bg-[#000FFF] text-white text-[12px] font-black rounded-xl px-3 py-2
            hover:bg-[#0009cc] transition-colors flex items-center justify-center"
        >
          → Fazer Login
        </Link>
      </div>
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

/* ── Vídeo ───────────────────────────────────────────────────── */
function AutoplayVideo() {
  const ref  = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const v = ref.current; if (!v) return
    v.muted = !v.muted; setMuted(v.muted)
  }

  const handleClick = () => {
    const v = ref.current; if (!v) return
    if (v.paused) { v.muted = true; setMuted(true); v.play().catch(() => {}) }
    else v.pause()
  }

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl"
      style={{ aspectRatio: '16/9', background: '#0a1628' }}>

      {/* autoPlay nativo — browser cuida do play sem JS customizado */}
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="w-full h-full object-cover block cursor-pointer"
        onClick={handleClick}
        src={VIDEO_SRC}
      />

      {/* Botão de áudio */}
      <button type="button" onClick={toggleMute}
        className="absolute bottom-4 right-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80
          flex items-center justify-center text-white shadow-lg transition-colors">
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
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
export default function LandingPage({ profile }: { profile?: Profile | null }) {

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Mangueira', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bounce  { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse2  { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-track { animation: marquee 40s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/96 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Ultragaz" width={110} height={34} style={{ height: 'auto' }} />
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <span className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest">Bot João</span>
          </div>
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <Link
              href="/login"
              className="text-sm font-bold text-[#000FFF] border-2 border-[#000FFF] rounded-xl px-5 py-2
                hover:bg-[#000FFF] hover:text-white transition-all duration-200"
            >
              Fazer Login
            </Link>
          )}
        </div>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative bg-[#000FFF] overflow-hidden">
        {/* Onda decorativa */}
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, #ffffff, transparent)' }} />
        <Image src="/onda-bg.png" alt="" fill className="object-cover opacity-5 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-0">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

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
                <Link
                  href="/login"
                  className="bg-white text-[#000FFF] font-black text-base rounded-2xl px-8 py-4
                    hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-center"
                >
                  → Fazer Login
                </Link>
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

            {/* Chat interativo flutuante — dimensões 100% bloqueadas */}
            <div className="hidden lg:block self-start" style={{ animation: 'fadeUp .7s ease .35s both' }}>
              <div
                className="bg-white rounded-t-3xl shadow-2xl ml-auto overflow-hidden"
                style={{
                  width: '360px',
                  height: '480px',
                  minWidth: '360px',
                  maxWidth: '360px',
                  minHeight: '480px',
                  maxHeight: '480px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header fixo */}
                <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
                  <Image src="/bot-joao-icon1.png" alt="Bot João" width={32} height={32} />
                  <div>
                    <p className="text-sm font-black text-gray-900">Bot João</p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'pulse2 2s infinite' }} />
                      <span className="text-[10px] text-gray-400 font-semibold">Restrito a consultores Ultragaz</span>
                    </div>
                  </div>
                </div>
                {/* Chat ocupa o espaço restante exato */}
                <div className="flex-1 px-5 pb-5 overflow-hidden" style={{ minHeight: 0 }}>
                  <DemoChat />
                </div>
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
            { value: 3,   suffix: 'x',     label: 'Mais produtividade' },
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

      {/* ══ SCREENSHOTS ══════════════════════════════════════ */}
      <ScreenCarousel />

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

      {/* ══ DEMO CHAT MOBILE (só aparece em telas pequenas) ══ */}
      <section className="block lg:hidden bg-[#000FFF] px-5 py-12">
        <p className="text-xs font-black uppercase tracking-widest text-blue-300 text-center mb-2">Conheça o Bot João</p>
        <h2 className="text-xl font-black text-white text-center mb-6">
          Seu assistente oficial Ultragaz
        </h2>
        <div className="max-w-sm mx-auto">
          <div
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ height: '520px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <Image src="/bot-joao-icon1.png" alt="Bot João" width={32} height={32} />
              <div>
                <p className="text-sm font-black text-gray-900">Bot João</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'pulse2 2s infinite' }} />
                  <span className="text-[10px] text-gray-400 font-semibold">Restrito a consultores Ultragaz</span>
                </div>
              </div>
            </div>
            {/* Chat */}
            <div className="flex-1 px-4 pb-4 overflow-hidden" style={{ minHeight: 0 }}>
              <DemoChat />
            </div>
          </div>
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
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-[#000FFF] font-black text-sm
                rounded-xl px-6 py-3 hover:bg-blue-50 transition-colors shadow-lg"
            >
              → Fazer Login
            </Link>
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
          Acesso restrito a consultores Ultragaz autorizados. O cadastro é liberado pelos administradores.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-[#000FFF] text-white font-black text-base
            rounded-2xl px-10 py-4 hover:bg-[#0009cc] transition-all duration-200
            shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
        >
          → Fazer Login
        </Link>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-xs">
            © 2026 Ultragaz · Bot João ·{' '}
            <Link href="/termos" className="hover:text-[#000FFF] transition-colors">Termos</Link>
            {' '}·{' '}
            <Link href="/politica" className="hover:text-[#000FFF] transition-colors">Privacidade</Link>
          </p>
        </div>
      </section>

    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SCREEN CAROUSEL — telas do sistema passando automaticamente
══════════════════════════════════════════════════════════════ */

const SCREENS = [
  {
    src: '/screens/screen-login.mp4',
    label: 'Acesso seguro',
    caption: 'Login com e-mail corporativo ou Google',
    color: '#7c3aed',
  },
  {
    src: '/screens/screen-trilha.mp4',
    label: 'Trilha de aprendizado',
    caption: 'Módulos progressivos com pontos e conquistas',
    color: '#000FFF',
  },
  {
    src: '/screens/botjoao-avancando.mp4',
    label: 'Bot João em ação',
    caption: 'IA que responde dúvidas sobre a Ultragaz em tempo real',
    color: '#0891b2',
  },
  {
    src: '/screens/screen-biblioteca.mp4',
    label: 'Biblioteca de materiais',
    caption: 'PDFs e guias sempre disponíveis para download',
    color: '#16a34a',
  },
  {
    src: '/screens/screen-escalonamento.mp4',
    label: 'Escalonamento de atendimento',
    caption: 'Perguntas sem resposta sobem automaticamente para o próximo nível',
    color: '#ea580c',
  },
  {
    src: '/screens/botjoao-flutuante.mp4',
    label: 'Assistente sempre disponível',
    caption: 'Bot João acessível em qualquer tela da plataforma',
    color: '#6366f1',
  },
]

function ScreenCarousel() {
  const items = [...SCREENS, ...SCREENS]

  return (
    <section className="py-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #00CFFF 0%, #00E676 100%)' }}>
      <div className="text-center mb-10 px-5">
        <p className="text-xs font-black uppercase tracking-widest text-white/70 mb-2">
          A plataforma por dentro
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
          Tudo que você precisa, em um só lugar
        </h2>
        <p className="text-gray-800/70 text-sm mt-2">
          Passe o mouse para pausar
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #00CFFF, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(270deg, #00E676, transparent)' }} />

        <div className="marquee-track flex gap-6 w-max px-8">
          {items.map((screen, i) => (
            <ScreenCard key={i} screen={screen} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ScreenCard({ screen }: { screen: typeof SCREENS[0] }) {
  return (
    <div className="flex-shrink-0 group cursor-default" style={{ width: '340px' }}>
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_40px_rgba(0,15,255,0.35)]"
        style={{ background: '#0f172a' }}
      >
        {/* Barra do browser */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: '#1e293b' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          <div className="flex-1 mx-3 bg-white/8 rounded-md px-3 py-1">
            <span className="text-[10px] text-white/30 font-mono">botjoao.com</span>
          </div>
        </div>

        {/* Vídeo da tela */}
        <div className="relative overflow-hidden" style={{ height: '220px', background: '#f5f6ff' }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-top"
            onError={e => {
              const el = e.currentTarget
              el.style.display = 'none'
              const fb = el.nextElementSibling as HTMLElement | null
              if (fb) fb.style.display = 'flex'
            }}
          >
            <source src={screen.src} type="video/mp4" />
          </video>
          {/* Fallback se vídeo não existir */}
          <div
            className="absolute inset-0 flex-col gap-3 items-center justify-center"
            style={{ display: 'none', background: `linear-gradient(135deg, ${screen.color}22, ${screen.color}08)` }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: `${screen.color}22` }}>🖥️</div>
            <p className="text-sm font-bold" style={{ color: screen.color }}>{screen.label}</p>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-4 px-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0 bg-white/80" />
          <p className="text-sm font-black text-gray-900">{screen.label}</p>
        </div>
        <p className="text-xs text-gray-800/70 pl-4">{screen.caption}</p>
      </div>
    </div>
  )
}
