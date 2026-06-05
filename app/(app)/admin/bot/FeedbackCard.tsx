'use client'

import { useState, useTransition } from 'react'
import { approveFeedback, rejectFeedback } from './actions'

interface FeedbackItem {
  id: string
  question: string
  answer: string
  score: number
  created_at: string
  user_name?: string
}

export default function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [editing, setEditing] = useState(false)
  const [editedAnswer, setEditedAnswer] = useState(item.answer)
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) return null

  const scoreColor = item.score >= 9 ? 'bg-green-100 text-green-700'
    : item.score >= 7 ? 'bg-blue-100 text-blue-700'
    : 'bg-yellow-100 text-yellow-700'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-50">
        <span className={`px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0 ${scoreColor}`}>
          ★ {item.score}/10
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">
            {item.user_name || 'Consultor'} · {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="font-semibold text-gray-900 text-sm leading-snug">{item.question}</p>
        </div>
      </div>

      {/* Resposta */}
      <div className="px-5 py-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resposta do Bot</p>
        {editing ? (
          <textarea
            value={editedAnswer}
            onChange={e => setEditedAnswer(e.target.value)}
            rows={5}
            className="w-full border-2 border-[#000FFF]/30 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:border-[#000FFF] focus:outline-none resize-none leading-relaxed"
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl px-3 py-2.5">{editedAnswer}</p>
        )}

        {editing && (
          <p className="text-xs text-[#000FFF] mt-1.5 font-semibold">✏️ Você está editando a resposta antes de aprovar</p>
        )}
      </div>

      {/* Ações */}
      <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            setError(null)
            startTransition(async () => {
              try {
                await approveFeedback(item.id, item.question, item.answer, editedAnswer !== item.answer ? editedAnswer : undefined)
                setDone(true)
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Erro ao salvar. Tente novamente.')
              }
            })
          }}
          disabled={pending}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {pending ? 'Salvando...' : 'Aprovar e Salvar'}
        </button>

        <button
          onClick={() => setEditing(e => !e)}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
            editing ? 'border-[#000FFF] bg-[#000FFF] text-white' : 'border-gray-200 text-gray-500 hover:border-[#000FFF] hover:text-[#000FFF]'
          }`}
        >
          ✏️ {editing ? 'Cancelar edição' : 'Editar resposta'}
        </button>

        <button
          onClick={() => {
            startTransition(async () => {
              try {
                await rejectFeedback(item.id)
                setDone(true)
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Erro ao rejeitar.')
              }
            })
          }}
          disabled={pending}
          className="ml-auto px-4 py-2 border-2 border-red-200 text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Rejeitar
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mx-5 mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-xs text-red-600 font-semibold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>
      )}
    </div>
  )
}
