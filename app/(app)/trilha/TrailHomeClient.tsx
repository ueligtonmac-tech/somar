'use client'

import { useRouter } from 'next/navigation'

const BADGES = [
  { key: 'iniciante',  icon: '🌱', color: '#6366f1', label: 'Iniciante',        desc: 'Completou o Bloco 0' },
  { key: 'digital',    icon: '📱', color: '#000FFF', label: 'Digital',          desc: 'Concluiu Canais Digitais' },
  { key: 'hubmaster',  icon: '🖥️', color: '#0891b2', label: 'HUBmaster',        desc: 'Concluiu o HUB Somar' },
  { key: 'gasexpert',  icon: '🔥', color: '#16a34a', label: 'Esp. Gás',         desc: 'Concluiu Vale Gás' },
  { key: 'engajador',  icon: '🤝', color: '#ea580c', label: 'Engajador',        desc: 'Concluiu AmigU' },
  { key: 'financeiro', icon: '💰', color: '#7c3aed', label: 'Financeiro',       desc: 'Concluiu Financeiro' },
  { key: 'master',     icon: '🏆', color: '#b45309', label: 'Master',           desc: 'Trilha 100% completa' },
]

interface Block { id: string; title: string; description: string; icon: string; color: string; order_index: number }
interface Section { id: string; block_id: string; title: string; order_index: number; points_value: number }
interface Progress { section_id: string; quiz_passed: boolean; intro_done: boolean; module_done: boolean; flashcards_done: boolean; points_earned: number }
interface Badge { badge_key: string }

interface Props {
  blocks: Block[]
  sections: Section[]
  progress: Progress[]
  badges: Badge[]
  totalPoints: number
}

export default function TrailHomeClient({ blocks, sections, progress, badges, totalPoints }: Props) {
  const router = useRouter()
  const progressMap = Object.fromEntries(progress.map(p => [p.section_id, p]))
  const earnedBadges = new Set(badges.map(b => b.badge_key))

  const totalSections = sections.filter(s => {
    const block = blocks.find(b => b.id === s.block_id)
    return block && block.order_index > 0
  }).length
  const doneSections = progress.filter(p => p.quiz_passed).length
  const overallPct = totalSections > 0 ? Math.round((doneSections / totalSections) * 100) : 0
  const earnedCount = BADGES.filter(b => earnedBadges.has(b.key)).length

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-24">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-5 pt-6 pb-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Trilha de Capacitação</p>
        <h1 className="text-2xl font-black text-[#000FFF] mb-5">Sua jornada Ultragaz 🚀</h1>

        {/* Pontos + Anel de progresso */}
        <div className="flex items-center gap-5 mb-6">
          {/* Anel SVG */}
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="33" fill="none" stroke="#e5e7eb" strokeWidth="7" />
              <circle cx="40" cy="40" r="33" fill="none" stroke="#000FFF" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 33}`}
                strokeDashoffset={`${2 * Math.PI * 33 * (1 - overallPct / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-[#000FFF] leading-none">{overallPct}%</span>
              <span className="text-[9px] text-gray-400 font-semibold mt-0.5">concluído</span>
            </div>
          </div>

          {/* Pontos + Stats */}
          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-black text-gray-900">{totalPoints.toLocaleString('pt-BR')}</span>
              <span className="text-sm text-gray-400">pontos</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {doneSections} de {totalSections} módulos concluídos
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#000FFF]/8 text-[#000FFF] rounded-full px-3 py-1">
                <span className="text-sm">🏅</span>
                <span className="text-xs font-bold">{earnedCount}/{BADGES.length} conquistas</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── JORNADA DE CONQUISTAS ─────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Suas conquistas</p>
          <div className="relative">
            {/* Linha conectora de fundo */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" style={{ zIndex: 0 }} />
            {/* Linha de progresso preenchida */}
            <div
              className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#000FFF] transition-all duration-1000"
              style={{
                zIndex: 0,
                width: earnedCount === 0 ? '0%'
                  : earnedCount === BADGES.length ? 'calc(100% - 40px)'
                  : `calc(${((earnedCount - 1) / (BADGES.length - 1)) * 100}% * (100% - 40px) / 100%)`,
              }}
            />

            <div className="flex items-start justify-between relative" style={{ zIndex: 1 }}>
              {BADGES.map((b, i) => {
                const earned = earnedBadges.has(b.key)
                const isNext = !earned && i === earnedCount // próxima a conquistar
                return (
                  <div key={b.key} title={b.desc}
                    className="flex flex-col items-center gap-1.5"
                    style={{ minWidth: 44 }}>
                    {/* Círculo do badge */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                        transition-all duration-300
                        ${earned
                          ? 'shadow-md scale-100'
                          : isNext
                            ? 'ring-2 ring-offset-1 ring-dashed scale-95 opacity-60'
                            : 'opacity-20 grayscale scale-90'
                        }`}
                      style={{
                        background: earned ? b.color : isNext ? '#f3f4f6' : '#f3f4f6',
                        boxShadow: earned ? `0 0 12px ${b.color}55` : undefined,
                        borderColor: isNext ? b.color : undefined,
                      }}
                    >
                      {b.icon}
                    </div>
                    {/* Label */}
                    <span
                      className={`text-[9px] text-center font-bold leading-tight uppercase tracking-wide
                        ${earned ? 'text-gray-600' : 'text-gray-300'}`}
                      style={{ maxWidth: 44 }}
                    >
                      {b.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOCOS DA TRILHA ─────────────────────────────────── */}
      <div className="px-4 pt-5 space-y-4">
        {blocks.map((block) => {
          const blockSections = sections
            .filter(s => s.block_id === block.id)
            .sort((a, b) => a.order_index - b.order_index)
          const blockDone = blockSections.filter(s => progressMap[s.id]?.quiz_passed).length
          const blockTotal = blockSections.length
          const blockPct = blockTotal > 0 ? Math.round((blockDone / blockTotal) * 100) : 0
          const blockComplete = blockDone === blockTotal && blockTotal > 0

          return (
            <div key={block.id}
              className={`rounded-2xl overflow-hidden shadow-sm border transition-all
                ${blockComplete
                  ? 'border-green-200 bg-white'
                  : 'border-gray-100 bg-white'
                }`}
            >
              {/* Header do bloco */}
              <div
                className="px-4 py-3.5 flex items-center gap-3"
                style={{ borderLeft: `4px solid ${block.color}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${block.color}18` }}
                >
                  {block.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm">{block.title}</p>
                  <p className="text-xs text-gray-400 truncate">{block.description}</p>
                </div>
                <div className="text-right shrink-0">
                  {blockComplete ? (
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">✓ Completo</span>
                  ) : (
                    <span className="text-xs font-bold text-gray-400">{blockDone}/{blockTotal}</span>
                  )}
                </div>
              </div>

              {/* Barra de progresso */}
              {blockTotal > 0 && (
                <div className="h-1 bg-gray-100">
                  <div
                    className="h-full transition-all duration-700 rounded-full"
                    style={{
                      width: `${blockPct}%`,
                      background: blockComplete
                        ? '#22c55e'
                        : `linear-gradient(90deg, ${block.color}aa, ${block.color})`,
                    }}
                  />
                </div>
              )}

              {/* Seções */}
              <div className="divide-y divide-gray-50">
                {blockSections.map((section, idx) => {
                  const p = progressMap[section.id]
                  const done = p?.quiz_passed ?? false
                  const started = p?.intro_done ?? false

                  const prevSection = idx > 0 ? blockSections[idx - 1] : null
                  const prevDone = !prevSection || progressMap[prevSection.id]?.quiz_passed
                  const isUnlocked = block.order_index === 0 || prevDone

                  const statusIcon = done ? '✓' : !isUnlocked ? '🔒' : (idx + 1).toString()
                  const statusBg = done
                    ? '#22c55e'
                    : started
                      ? block.color
                      : isUnlocked ? '#f3f4f6' : '#f3f4f6'
                  const statusText = done ? 'white' : started ? 'white' : '#9ca3af'

                  return (
                    <button
                      key={section.id}
                      onClick={() => isUnlocked && router.push(`/trilha/${section.id}`)}
                      disabled={!isUnlocked}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all
                        ${isUnlocked ? 'hover:bg-gray-50/80 active:bg-gray-100' : 'opacity-35 cursor-not-allowed'}
                        ${done ? 'hover:bg-green-50/30' : ''}`}
                    >
                      {/* Número / status */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                        style={{ background: statusBg, color: statusText }}
                      >
                        {statusIcon}
                      </div>

                      {/* Texto */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${done ? 'text-gray-500' : 'text-gray-800'}`}>
                          {section.title}
                        </p>
                        <p className="text-[11px] mt-0.5">
                          {done
                            ? <span className="text-green-500 font-semibold">✅ Concluída</span>
                            : started
                              ? <span style={{ color: block.color }} className="font-semibold">▶ Em progresso</span>
                              : <span className="text-gray-400">+{section.points_value} pts</span>
                          }
                        </p>
                      </div>

                      {/* Seta */}
                      {isUnlocked && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
