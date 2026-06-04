'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateProgress } from '@/app/(app)/trilha/[slug]/actions'

interface Card {
  id: string
  title: string
  scenario: string | null
  challenge: string | null
  explanation: string | null
  action_hint: string | null
  order_index: number
}

interface CardViewerProps {
  moduleId: string
  moduleTitle: string
  cards: Card[]
  initialCardsSeen: number
  backHref: string
  nextModuleSlug?: string | null
}

const sections = [
  { key: 'scenario', label: 'Cenário', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { key: 'challenge', label: 'Desafio', color: 'bg-red-50 border-red-200 text-red-800' },
  { key: 'explanation', label: 'Explicação', color: 'bg-blue-50 border-ug-blue text-ug-blue' },
  { key: 'action_hint', label: 'Ação', color: 'bg-green-50 border-green-200 text-green-800' },
] as const

export default function CardViewer({
  moduleId,
  moduleTitle,
  cards,
  initialCardsSeen,
  backHref,
  nextModuleSlug,
}: CardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(initialCardsSeen, 0), cards.length - 1)
  )
  const [isPending, startTransition] = useTransition()

  const card = cards[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === cards.length - 1

  const goTo = (index: number) => {
    const newIndex = Math.max(0, Math.min(index, cards.length - 1))
    const newCardsSeen = Math.max(newIndex, initialCardsSeen)
    const completed = newIndex === cards.length - 1

    setCurrentIndex(newIndex)
    startTransition(() => {
      updateProgress(moduleId, newCardsSeen, completed)
    })
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-ug-gray-500">
        <p className="text-sm">Nenhum card publicado neste módulo ainda.</p>
        <Link href={backHref} className="mt-4 text-ug-blue text-sm hover:underline">
          ← Voltar à trilha
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Navegação topo */}
      <div className="flex items-center justify-between mb-6">
        <Link href={backHref} className="text-sm text-ug-gray-500 hover:text-ug-blue transition-colors">
          ← Trilha
        </Link>
        <span className="text-xs font-semibold text-ug-gray-500">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 bg-ug-gray-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-ug-blue rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="bg-white border-2 border-ug-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Header do card */}
        <div className="bg-ug-blue px-6 py-4">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">
            {moduleTitle}
          </p>
          <h2 className="text-white font-bold text-lg mt-1">{card.title}</h2>
        </div>

        {/* Seções do card */}
        <div className="p-6 space-y-4">
          {sections.map(({ key, label, color }) => {
            const content = card[key]
            if (!content) return null

            return (
              <div key={key} className={`border rounded-xl p-4 ${color}`}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                  {label}
                </p>
                <p className="text-sm leading-relaxed">{content}</p>
              </div>
            )
          })}
        </div>

        {/* Navegação entre cards */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={isFirst || isPending}
            className="px-4 py-2 text-sm font-medium text-ug-gray-500 border-2 border-ug-gray-100 rounded-lg hover:border-ug-blue hover:text-ug-blue transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>

          {isLast ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                ✓ Módulo concluído
              </span>
              {nextModuleSlug && (
                <Link
                  href={`/trilha/${nextModuleSlug}`}
                  className="px-4 py-2 text-sm font-semibold bg-ug-blue text-white rounded-lg hover:bg-ug-blue-dark transition-colors"
                >
                  Próximo módulo →
                </Link>
              )}
            </div>
          ) : (
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold bg-ug-blue text-white rounded-lg hover:bg-ug-blue-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próximo →
            </button>
          )}
        </div>
      </div>

      {/* Dots de navegação */}
      <div className="flex justify-center gap-1.5 mt-5">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex
                ? 'w-6 bg-ug-blue'
                : i < currentIndex
                ? 'w-2 bg-ug-blue opacity-40'
                : 'w-2 bg-ug-gray-100'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
