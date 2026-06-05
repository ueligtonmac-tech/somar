'use client'

import { useState, useTransition } from 'react'
import { resolveEscalation } from './actions'

interface EscalationItem {
  id: string
  question: string
  answer: string
  score: number
  created_at: string
  user_name?: string
  conversation_id: string
}

export default function EscalationCard({ item }: { item: EscalationItem }) {
  const [adminAnswer, setAdminAnswer] = useState('')
  const [addToKnowledge, setAddToKnowledge] = useState(true)
  const [showConversation, setShowConversation] = useState(false)
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  if (done) return null

  const urgency = item.score <= 3 ? { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' }
    : item.score <= 5 ? { label: 'Médio', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    : { label: 'Baixo', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-50">
        <span className={`px-2.5 py-1 rounded-full text-xs font-black border flex-shrink-0 ${urgency.color}`}>
          ⚠ {urgency.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">
            {item.user_name || 'Consultor'} · {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            <span className="ml-2 text-gray-300">· Score: {item.score}/10</span>
          </p>
          <p className="font-semibold text-gray-900 text-sm leading-snug">{item.question}</p>
        </div>
      </div>

      {/* Resposta original do bot */}
      <div className="px-5 py-3 bg-red-50/50">
        <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">Resposta do Bot (insatisfatória)</p>
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{item.answer}</p>
        <button
          onClick={() => setShowConversation(e => !e)}
          className="text-xs text-[#000FFF] font-semibold mt-1 hover:underline"
        >
          {showConversation ? '▲ Ocultar' : '▼ Ver resposta completa'}
        </button>
        {showConversation && (
          <p className="text-sm text-gray-700 leading-relaxed mt-2 whitespace-pre-wrap">{item.answer}</p>
        )}
      </div>

      {/* Resposta do admin */}
      <div className="px-5 py-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sua resposta correta</p>
        <textarea
          value={adminAnswer}
          onChange={e => setAdminAnswer(e.target.value)}
          rows={4}
          placeholder="Escreva a resposta correta para essa pergunta. Ela será enviada ao consultor e, se marcada, adicionada à base de conhecimento do Bot João..."
          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:border-[#000FFF] focus:outline-none resize-none leading-relaxed placeholder:text-gray-300"
        />

        <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
          <div
            onClick={() => setAddToKnowledge(e => !e)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${addToKnowledge ? 'bg-[#000FFF]' : 'bg-gray-200'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${addToKnowledge ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-xs font-semibold text-gray-600">Adicionar à base de conhecimento do Bot João</span>
        </label>
      </div>

      {/* Ações */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <button
          onClick={() => {
            if (!adminAnswer.trim()) return
            startTransition(async () => {
              await resolveEscalation(item.id, adminAnswer, addToKnowledge)
              setDone(true)
            })
          }}
          disabled={pending || !adminAnswer.trim()}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#000FFF] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Enviar resposta ao consultor
        </button>
        <span className="text-xs text-gray-400">
          {pending ? 'Enviando...' : adminAnswer.trim() ? '' : 'Escreva uma resposta primeiro'}
        </span>
      </div>
    </div>
  )
}
