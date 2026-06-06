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
  video_url: string | null
  pdf_url: string | null
  pdf_name: string | null
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
  { key: 'scenario',    label: 'Cenário',    color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { key: 'challenge',   label: 'Desafio',    color: 'bg-red-50 border-red-200 text-red-800' },
  { key: 'explanation', label: 'Explicação', color: 'bg-blue-50 border-ug-blue text-ug-blue' },
  { key: 'action_hint', label: 'Ação',       color: 'bg-green-50 border-green-200 text-green-800' },
] as const

function getEmbedUrl(url: string) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vMatch) return `https://player.vimeo.com/video/${vMatch[1]}`
  return url
}

export default function CardViewer({
  moduleId, moduleTitle, cards, initialCardsSeen, backHref, nextModuleSlug,
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
    startTransition(() => updateProgress(moduleId, newCardsSeen, completed))
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-ug-gray-500">
        <p className="text-sm">Nenhum card publicado neste módulo ainda.</p>
        <Link href={backHref} className="mt-4 text-ug-blue text-sm hover:underline">← Voltar à trilha</Link>
      </div>
    )
  }

  const embedUrl = card.video_url ? getEmbedUrl(card.video_url) : null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Nav topo */}
      <div className="flex items-center justify-between mb-6">
        <Link href={backHref} className="text-sm text-ug-gray-500 hover:text-ug-blue transition-colors">← Trilha</Link>
        <span className="text-xs font-semibold text-ug-gray-500">{currentIndex + 1} / {cards.length}</span>
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
        {/* Header */}
        <div className="bg-ug-blue px-6 py-4">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">{moduleTitle}</p>
          <h2 className="text-white font-bold text-lg mt-1">{card.title}</h2>
        </div>

        {/* Vídeo embed */}
        {embedUrl && (
          <div className="aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={card.title}
            />
          </div>
        )}

        {/* Seções de texto */}
        <div className="p-6 space-y-4">
          {sections.map(({ key, label, color }) => {
            const content = card[key]
            if (!content) return null
            return (
              <div key={key} className={`border rounded-xl p-4 ${color}`}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">{label}</p>
                <p className="text-sm leading-relaxed">{content}</p>
              </div>
            )
          })}

          {/* PDF download */}
          {card.pdf_url && (
            <a
              href={card.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#000FFF] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#000FFF]">{card.pdf_name || 'Material de apoio'}</p>
                <p className="text-xs text-blue-500">Clique para baixar o PDF</p>
              </div>
              <svg className="text-[#000FFF] group-hover:translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
          )}
        </div>

        {/* Banner de conclusão total — aparece no último card do último módulo */}
        {isLast && !nextModuleSlug && (
          <div className="mx-6 mb-4 rounded-2xl bg-gradient-to-br from-[#000FFF] to-blue-600 p-5 text-center text-white">
            <div className="text-3xl mb-2">🎓</div>
            <p className="font-black text-base">Trilha 100% concluída!</p>
            <p className="text-blue-200 text-xs mt-1">
              Parabéns! Você completou todo o programa de onboarding da Ultragaz.
            </p>
          </div>
        )}

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
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg">✓ Módulo concluído</span>
              {nextModuleSlug ? (
                <Link
                  href={`/trilha/${nextModuleSlug}`}
                  className="px-4 py-2 text-sm font-semibold bg-ug-blue text-white rounded-lg hover:bg-ug-blue-dark transition-colors"
                >
                  Próximo módulo →
                </Link>
              ) : (
                <Link
                  href="/trilha/certificado"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gradient-to-r from-[#000FFF] to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
                >
                  🎓 Gerar certificado
                </Link>
              )}
            </div>
          ) : (
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold bg-ug-blue text-white rounded-lg hover:bg-ug-blue-dark transition-colors disabled:opacity-40"
            >
              Próximo →
            </button>
          )}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex ? 'w-6 bg-ug-blue'
              : i < currentIndex ? 'w-2 bg-ug-blue opacity-40'
              : 'w-2 bg-ug-gray-100'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
