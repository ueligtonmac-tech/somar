'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#000FFF]">
    <Image src="/bot-joao.webp" alt="Bot João" width={36} height={36} className="object-contain scale-110" />
  </div>
)

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Olá! Sou o **Bot João**, seu assistente do HUB Somar 👋\n\nEstou aqui para responder suas dúvidas sobre os módulos, produtos e processos da Ultragaz. Como posso te ajudar?',
    id: 'welcome',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const formatMessage = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-[#000FFF] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()} className="text-white/70 hover:text-white transition-colors mr-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            <Image src="/bot-joao.webp" alt="Bot João" width={40} height={40} className="object-contain scale-110" />
          </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Bot João</p>
          <p className="text-blue-200 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Assistente HUB Somar · Ultragaz
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' && BOT_AVATAR}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
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

        {feedback && !feedbackSent && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-2 font-semibold">Como foi essa resposta? (0–10)</p>
            <div className="flex gap-1 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map(score => (
                <button
                  key={score}
                  onClick={() => sendFeedback(score)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
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
          <p className="text-center text-xs text-gray-400">✓ Obrigado pelo feedback!</p>
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
            className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none transition-colors"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-[#000FFF] text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors flex-shrink-0"
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
  )
}
