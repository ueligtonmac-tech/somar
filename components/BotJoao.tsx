'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

interface FeedbackState {
  messageId: string
  question: string
  answer: string
  conversationId: string
}

const BOT_AVATAR = (
  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#000FFF]">
    <Image src="/bot-joao.webp" alt="Bot João" width={32} height={32} className="object-cover scale-125 translate-y-1" />
  </div>
)

/* ─── Versão mobile: só botão que navega para /chat ─── */
function BotJoaoMobile() {
  const router = useRouter()
  const [showBubble, setShowBubble] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 2000)
    return () => clearTimeout(t)
  }, [])

  // Se dispensado, não renderiza nada
  if (dismissed) return null

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
  }

  return (
    <>
      {/* Bolha de boas-vindas mobile — acima do mascote */}
      {showBubble && (
        <div className="fixed z-50" style={{ bottom: '158px', right: '12px', animation: 'fadeInUp 0.4s ease forwards' }}>
          <div className="relative bg-white rounded-2xl rounded-br-none shadow-xl border border-gray-100 px-3 py-2.5 max-w-[170px]">
            <p className="text-[11px] font-black text-[#000FFF] mb-0.5">Bot João</p>
            <p className="text-[11px] text-gray-600 leading-tight">Fale comigo! Estou aqui 💬</p>
            {/* X fecha bolha E mascote */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-500 text-white text-[10px] flex items-center justify-center hover:bg-gray-700"
            >×</button>
          </div>
          <div className="absolute -bottom-1.5 right-7 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45" />
        </div>
      )}

      {/* Mascote flutuante mobile — acima da barra inferior */}
      <button
        onClick={() => router.push('/chat')}
        className="fixed right-3 z-50 w-16 h-16 drop-shadow-xl"
        style={{ bottom: '80px', animation: 'botFloat 3s ease-in-out infinite' }}
        title="Fale com o Bot João"
        aria-label="Abrir Bot João"
      >
        <Image
          src="/bot-joao.webp"
          alt="Bot João"
          width={64}
          height={64}
          className="w-full h-full object-contain"
          priority
        />
      </button>

      <style>{`
        @keyframes botFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          33% { transform: translateY(-7px) rotate(1deg); }
          66% { transform: translateY(-3px) rotate(-0.5deg); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

/* ─── Versão desktop: chat flutuante completo ─── */
function BotJoaoDesktop() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou o **Bot João**, seu assistente do HUB Somar 👋\n\nEstou aqui para responder suas dúvidas sobre os módulos, produtos e processos da Ultragaz. Como posso te ajudar?',
        id: 'welcome',
      }])
    }
    if (open) {
      setShowBubble(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    const userMsgObj: Message = { role: 'user', content: userMsg, id: Date.now().toString() }
    const botMsgId = (Date.now() + 1).toString()

    setMessages(prev => [...prev, userMsgObj, { role: 'assistant', content: '', id: botMsgId }])
    setLoading(true)
    setFeedback(null)
    setFeedbackSent(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          conversationId,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) throw new Error('Erro na resposta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let finalConvId = conversationId

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw = decoder.decode(value, { stream: true })
        const lines = raw.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))

            if (parsed.type === 'chunk') {
              // Anima char a char com delay humano (~28ms por char)
              const chars = parsed.text.split('')
              for (const char of chars) {
                fullText += char
                const snapshot = fullText
                setMessages(prev =>
                  prev.map(m => m.id === botMsgId ? { ...m, content: snapshot } : m)
                )
                await new Promise(r => setTimeout(r, 28))
              }
            } else if (parsed.type === 'done') {
              finalConvId = parsed.conversationId
              setConversationId(parsed.conversationId)
              setFeedback({ messageId: botMsgId, question: userMsg, answer: fullText, conversationId: finalConvId ?? parsed.conversationId })
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message)
            }
          } catch { /* linha mal-formada, ignora */ }
        }
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === botMsgId
          ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente em instantes.' }
          : m
        )
      )
    } finally {
      setLoading(false)
    }
  }, [input, loading, conversationId, messages])

  const sendFeedback = async (score: number) => {
    if (!feedback) return
    setFeedbackSent(true)
    await fetch('/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...feedback, score }),
    })
    setFeedback(null)
  }

  const formatMessage = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
      return <span key={i}>{part}</span>
    })
  }

  return (
    <>
      {/* Bolha de boas-vindas — aponta para o mascote */}
      {showBubble && !open && (
        <div
          className="fixed z-40"
          style={{ bottom: '130px', right: '120px', animation: 'fadeInUp 0.4s ease forwards' }}
        >
          <div className="relative bg-white rounded-2xl rounded-br-none shadow-xl border border-gray-100 px-4 py-3 max-w-[200px]">
            <p className="text-xs font-black text-[#000FFF] mb-0.5">Bot João 🤖</p>
            <p className="text-xs text-gray-600 leading-snug">Fale comigo! Estou aqui para ajudar 💬</p>
            <button
              onClick={e => { e.stopPropagation(); setShowBubble(false) }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-500 text-white text-[10px] flex items-center justify-center hover:bg-gray-700"
            >×</button>
          </div>
          {/* Triângulo alinhado com a cabeça do bot (bot: right-4=16px, width 112px → head center ~right: 70px; bubble right-4=16px → tail offset = 70-16=54px) */}
          <div className="absolute -bottom-2 w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45" style={{ right: '54px' }} />
        </div>
      )}

      {/* Mascote flutuante desktop — MAIOR */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-50 w-28 h-28 drop-shadow-2xl hover:scale-105 transition-transform"
        style={{ animation: 'botFloat 3s ease-in-out infinite' }}
        title="Fale com o Bot João"
        aria-label="Abrir Bot João"
      >
        <Image
          src="/bot-joao.webp"
          alt="Bot João"
          width={80}
          height={112}
          className="w-full h-full object-contain"
          priority
        />
        {/* Badge de fechar quando aberto */}
        {open && (
          <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-gray-700/90 text-white text-xs flex items-center justify-center shadow-lg">
            ✕
          </span>
        )}
      </button>

      {/* Janela do chat — posicionada acima do mascote maior */}
      {open && (
        <div
          className="fixed bottom-36 right-4 z-50 w-[390px] max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: '530px' }}
        >
          {/* Header */}
          <div className="bg-[#000FFF] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
              <Image src="/bot-joao.webp" alt="Bot João" width={40} height={40} className="object-contain scale-110" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Bot João</p>
              <p className="text-blue-200 text-xs">Assistente HUB Somar · Ultragaz</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Online" />
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && BOT_AVATAR}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#000FFF] text-white rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                }`}>
                  {formatMessage(msg.content)}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-2">
                {BOT_AVATAR}
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-[#000FFF]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#000FFF]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#000FFF]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-gray-400 ml-1 font-medium">Digitando...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback */}
            {feedback && !feedbackSent && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-2 font-semibold">Como foi essa resposta?</p>
                <div className="flex gap-1 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map(score => (
                    <button
                      key={score}
                      onClick={() => sendFeedback(score)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all hover:scale-110 ${
                        score >= 7 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-400 hover:bg-red-100'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {feedbackSent && (
              <p className="text-center text-xs text-gray-400 py-1">✓ Obrigado pelo feedback!</p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Pergunte sobre os módulos..."
                className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2 text-sm focus:border-[#000FFF] focus:outline-none transition-colors"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[#000FFF] text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-1.5">Bot João · HUB Somar Ultragaz</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes botFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          33%  { transform: translateY(-8px) rotate(1.5deg); }
          66%  { transform: translateY(-4px) rotate(-0.5deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

/* ─── Export wrapper ─── */
export default function BotJoao({ mobile = false }: { mobile?: boolean }) {
  if (mobile) return <BotJoaoMobile />
  return <BotJoaoDesktop />
}
