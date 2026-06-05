'use client'

import { useState, useTransition } from 'react'
import { updateCard } from '../actions'

interface Card {
  id: string
  title: string
  scenario: string | null
  challenge: string | null
  explanation: string | null
  action_hint: string | null
  published: boolean
  order_index: number
}

const FIELDS: { key: keyof Card; label: string; rows?: number }[] = [
  { key: 'title',       label: 'Título',         rows: 1 },
  { key: 'scenario',    label: 'Cenário',        rows: 2 },
  { key: 'challenge',   label: 'Desafio',        rows: 2 },
  { key: 'explanation', label: 'Explicação',     rows: 4 },
  { key: 'action_hint', label: 'Dica de ação',   rows: 2 },
]

export default function CardEditor({ card, index }: { card: Card; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({
    title:       card.title       ?? '',
    scenario:    card.scenario    ?? '',
    challenge:   card.challenge   ?? '',
    explanation: card.explanation ?? '',
    action_hint: card.action_hint ?? '',
  })
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const cardAny = card as unknown as Record<string, unknown>
  const isDirty = Object.keys(values).some(k => values[k] !== (cardAny[k] ?? ''))

  const handleSave = () => {
    startTransition(async () => {
      await updateCard(card.id, values)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const handleTogglePublish = () => {
    startTransition(async () => {
      await updateCard(card.id, { published: !card.published })
    })
  }

  return (
    <div className={`transition-colors ${pending ? 'opacity-60' : ''}`}>
      {/* Linha colapsável */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
          {index}
        </span>
        <span className="flex-1 font-semibold text-sm text-gray-800 truncate">{values.title || card.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
          card.published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
        }`}>
          {card.published ? 'Publicado' : 'Rascunho'}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
          className={`flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Formulário expandido */}
      {expanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
          {FIELDS.map(({ key, label, rows }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {label}
              </label>
              {rows === 1 ? (
                <input
                  type="text"
                  value={values[key] as string}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#000FFF] focus:outline-none transition-colors"
                />
              ) : (
                <textarea
                  rows={rows}
                  value={values[key] as string}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#000FFF] focus:outline-none transition-colors resize-none leading-relaxed"
                />
              )}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!isDirty || pending}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : isDirty && !pending
                  ? 'bg-[#000FFF] text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saved ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round"/></svg> Salvo!</>
              ) : pending ? 'Salvando...' : 'Salvar alterações'}
            </button>

            <button
              onClick={handleTogglePublish}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                card.published
                  ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                  : 'border-[#000FFF] text-[#000FFF] hover:bg-[#000FFF] hover:text-white'
              }`}
            >
              {card.published ? 'Despublicar' : 'Publicar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
