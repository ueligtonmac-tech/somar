'use client'

import { useTransition } from 'react'
import { deleteKnowledge } from './actions'

interface KnowledgeEntry {
  id: string
  question: string
  answer: string
  created_at: string
}

export default function KnowledgeItem({ item }: { item: KnowledgeEntry }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 group">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm mb-1">{item.question}</p>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{item.answer}</p>
          <p className="text-xs text-gray-300 mt-2">
            Adicionado em {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => startTransition(() => deleteKnowledge(item.id))}
          disabled={pending}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-400 hover:text-red-600 flex-shrink-0"
          title="Remover do conhecimento"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>
  )
}
