'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface LibraryFile {
  id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size?: number
  category?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatMessage(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    return <span key={i}>{part}</span>
  })
}

const BOT_AVATAR = (
  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#000FFF]">
    <Image src="/bot-joao.webp" alt="Bot João" width={32} height={32} className="object-contain scale-110" />
  </div>
)

export default function BibliotecaClient({ files }: { files: LibraryFile[] }) {
  const [search, setSearch] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(6)

  // Filtro de busca
  const filtered = files.filter(f => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      f.title.toLowerCase().includes(q) ||
      (f.description?.toLowerCase().includes(q)) ||
      (f.category?.toLowerCase().includes(q))
    )
  })

  // Paginação: reset ao filtrar
  const visibleFiles = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  const categories = Array.from(new Set(visibleFiles.map(f => f.category).filter(Boolean))) as string[]

  // ── Chat embutido ──
  const WELCOME: Message = {
    role: 'assistant',
    id: 'welcome',
    content: 'Olá! 👋 Aqui na Biblioteca você encontra todos os materiais disponíveis para download.\n\nMas não precisa ficar só nos PDFs — **já li tudo** que está aqui! Me pergunte qualquer coisa sobre os materiais, Vale Gás, App Ultragaz, canais digitais... estou aqui para ajudar! 😄',
  }

  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    const botMsgId = (Date.now() + 1).toString()
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg, id: Date.now().toString() },
      { role: 'assistant', content: '', id: botMsgId },
    ])
    setLoading(true)

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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const raw = decoder.decode(value, { stream: true })
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.type === 'chunk') {
              const chars = parsed.text.split('')
              for (const char of chars) {
                fullText += char
                const snapshot = fullText
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: snapshot } : m))
                await new Promise(r => setTimeout(r, 22))
              }
            } else if (parsed.type === 'done') {
              setConversationId(parsed.conversationId)
            }
          } catch { /* ignora */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === botMsgId
        ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente.' }
        : m
      ))
    } finally {
      setLoading(false)
    }
  }, [input, loading, conversationId, messages])

  // Reset paginação ao filtrar
  const handleSearch = (val: string) => {
    setSearch(val)
    setVisibleCount(6)
  }

  return (
    <div className="space-y-6">
      {/* ── Busca ── */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar materiais por título, categoria ou descrição..."
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:border-[#000FFF] focus:outline-none bg-white shadow-sm"
        />
        {search && (
          <button onClick={() => handleSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* ── Chat com Bot João (colapsável) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header clicável */}
        <button
          onClick={() => setChatOpen(o => !o)}
          className="w-full bg-[#000FFF] px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-700 transition-colors"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            <Image src="/bot-joao.webp" alt="Bot João" width={36} height={36} className="object-contain scale-110" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-sm">Bot João</p>
            <p className="text-blue-200 text-xs">
              {chatOpen ? 'Pergunte sobre qualquer material da biblioteca' : 'Clique para perguntar ao Bot João sobre os materiais'}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2" />
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: chatOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {chatOpen && (
          <>
            {/* Mensagens */}
            <div ref={messagesContainerRef} className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && BOT_AVATAR}
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Pergunte sobre os materiais da biblioteca..."
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
            </div>
          </>
        )}
      </div>

      {/* ── Lista de arquivos ── */}
      {filtered.length > 0 ? (
        <div className="space-y-6">
          {categories.length > 0 ? (
            <>
              {categories.map(cat => (
                <div key={cat}>
                  <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">{cat}</h2>
                  <div className="grid gap-3">
                    {visibleFiles.filter(f => f.category === cat).map(file => (
                      <FileCard key={file.id} file={file} />
                    ))}
                  </div>
                </div>
              ))}
              {visibleFiles.filter(f => !f.category).length > 0 && (
                <div>
                  <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Outros</h2>
                  <div className="grid gap-3">
                    {visibleFiles.filter(f => !f.category).map(file => (
                      <FileCard key={file.id} file={file} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-3">
              {visibleFiles.map(file => <FileCard key={file.id} file={file} />)}
            </div>
          )}

          {/* ── Ver mais ── */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => setVisibleCount(c => c + 6)}
                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#000FFF] text-[#000FFF] rounded-xl text-sm font-bold hover:bg-[#000FFF] hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                Ver mais ({filtered.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 font-semibold">
            {search ? `Nenhum material encontrado para "${search}"` : 'Nenhum material disponível ainda'}
          </p>
        </div>
      )}
    </div>
  )
}

function FileCard({ file }: { file: LibraryFile }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-[#000FFF]/20 hover:shadow-md transition-all group">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5"/>
          <polyline points="14 2 14 8 20 8" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
          <text x="6" y="19" fontSize="5.5" fontWeight="700" fill="#ef4444" fontFamily="system-ui">PDF</text>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{file.title}</p>
        {file.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{file.description}</p>}
        {file.file_size && <p className="text-[10px] text-gray-300 mt-0.5">{formatBytes(file.file_size)}</p>}
      </div>
      <a
        href={file.file_url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="flex items-center gap-1.5 px-4 py-2 bg-[#000FFF] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex-shrink-0"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Baixar
      </a>
    </div>
  )
}
