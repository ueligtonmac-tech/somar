'use client'

import { useRouter } from 'next/navigation'

const BADGES = [
  { key: 'iniciante',  icon: '🌱', color: '#6366f1', label: 'Iniciante',  desc: 'Completou o Bloco 0' },
  { key: 'digital',    icon: '📱', color: '#000FFF', label: 'Digital',    desc: 'Concluiu Canais Digitais' },
  { key: 'hubmaster',  icon: '🖥️', color: '#0891b2', label: 'HUBmaster', desc: 'Concluiu o HUB Somar' },
  { key: 'gasexpert',  icon: '🔥', color: '#16a34a', label: 'Esp. Gás',  desc: 'Concluiu Vale Gás' },
  { key: 'engajador',  icon: '🤝', color: '#ea580c', label: 'Engajador', desc: 'Concluiu AmigU' },
  { key: 'financeiro', icon: '💰', color: '#7c3aed', label: 'Financeiro', desc: 'Concluiu Financeiro' },
  { key: 'master',     icon: '🏆', color: '#b45309', label: 'Master',    desc: 'Trilha 100% completa' },
]

interface Block    { id: string; title: string; description: string; icon: string; color: string; order_index: number }
interface Section  { id: string; block_id: string; title: string; order_index: number; points_value: number }
interface Progress { section_id: string; quiz_passed: boolean; intro_done: boolean; module_done: boolean; flashcards_done: boolean; points_earned: number }
interface Badge    { badge_key: string }

interface Props {
  blocks: Block[]
  sections: Section[]
  progress: Progress[]
  badges: Badge[]
  totalPoints: number
}

/* Monta lista plana ordenada de todas as seções com contexto */
interface FlatSection {
  section: Section
  block: Block
  globalIndex: number   // posição global (0-based)
  localIndex: number    // posição dentro do bloco (0-based)
  isFirstInBlock: boolean
  done: boolean
  started: boolean
  isUnlocked: boolean
}

export default function TrailHomeClient({ blocks, sections, progress, badges, totalPoints }: Props) {
  const router = useRouter()
  const progressMap = Object.fromEntries(progress.map(p => [p.section_id, p]))
  const earnedBadges = new Set(badges.map(b => b.badge_key))

  /* ── Monta sequência global plana ─────────────────────────── */
  const flat: FlatSection[] = []
  let globalIdx = 0

  for (const block of [...blocks].sort((a, b) => a.order_index - b.order_index)) {
    const blockSections = sections
      .filter(s => s.block_id === block.id)
      .sort((a, b) => a.order_index - b.order_index)

    blockSections.forEach((section, localIndex) => {
      const p = progressMap[section.id]
      const done = p?.quiz_passed ?? false
      const started = p?.intro_done ?? false

      // Desbloqueada se: bloco 0, ou seção anterior foi concluída
      let isUnlocked = block.order_index === 0
      if (!isUnlocked && flat.length > 0) {
        const prev = flat[flat.length - 1]
        isUnlocked = prev.done
      }

      flat.push({
        section, block,
        globalIndex: globalIdx,
        localIndex,
        isFirstInBlock: localIndex === 0,
        done, started, isUnlocked,
      })
      globalIdx++
    })
  }

  /* ── Métricas ──────────────────────────────────────────────── */
  const totalSections = flat.filter(f => f.block.order_index > 0).length
  const doneSections  = flat.filter(f => f.done && f.block.order_index > 0).length
  const overallPct    = totalSections > 0 ? Math.round((doneSections / totalSections) * 100) : 0
  const earnedCount   = BADGES.filter(b => earnedBadges.has(b.key)).length

  // Próxima seção a fazer (desbloqueada, não concluída)
  const nextIdx = flat.findIndex(f => f.isUnlocked && !f.done)

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f5f6ff] pb-28">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-5 pt-6 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Trilha de Capacitação</p>
        <h1 className="text-2xl font-black text-[#000FFF] mb-5">Sua jornada Ultragaz 🚀</h1>

        {/* Pontos + Anel */}
        <div className="flex items-center gap-5 mb-6">
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
          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-black text-gray-900">{totalPoints.toLocaleString('pt-BR')}</span>
              <span className="text-sm text-gray-400">pontos</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{doneSections} de {totalSections} módulos concluídos</p>
            <div className="flex items-center gap-1.5 bg-[#000FFF]/8 text-[#000FFF] rounded-full px-3 py-1 w-fit">
              <span className="text-sm">🏅</span>
              <span className="text-xs font-bold">{earnedCount}/{BADGES.length} conquistas</span>
            </div>
          </div>
        </div>

        {/* Jornada de conquistas */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Suas conquistas</p>
        <div className="relative">
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#000FFF] transition-all duration-1000"
            style={{ width: earnedCount === 0 ? '0%' : earnedCount >= BADGES.length ? 'calc(100% - 40px)' : `calc(${(earnedCount - 1) / (BADGES.length - 1) * 100}% * (100% - 40px) / 100%)` }}
          />
          <div className="flex items-start justify-between relative z-10">
            {BADGES.map((b, i) => {
              const earned = earnedBadges.has(b.key)
              const isNext = !earned && i === earnedCount
              return (
                <div key={b.key} title={b.desc} className="flex flex-col items-center gap-1.5" style={{ minWidth: 44 }}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                      ${earned ? 'shadow-md' : isNext ? 'ring-2 ring-dashed opacity-60' : 'opacity-20 grayscale'}`}
                    style={{
                      background: earned ? b.color : '#f3f4f6',
                      boxShadow: earned ? `0 0 12px ${b.color}55` : isNext ? `0 0 0 2px ${b.color}` : undefined,
                    }}
                  >{b.icon}</div>
                  <span className={`text-[9px] text-center font-bold leading-tight uppercase tracking-wide ${earned ? 'text-gray-600' : 'text-gray-300'}`}
                    style={{ maxWidth: 44 }}>{b.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══ LISTA DE ETAPAS ════════════════════════════════════ */}
      <div className="px-4 pt-6 space-y-2">
        {flat.map((item, i) => {
          const { section, block, done, started, isUnlocked, isFirstInBlock, localIndex } = item
          const isNext = i === nextIdx

          /* ── Cabeçalho de bloco ── */
          const blockHeader = isFirstInBlock ? (
            <div key={`blk-${block.id}`} className="flex items-center gap-3 mt-5 mb-2 first:mt-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ background: `${block.color}22` }}
              >{block.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-700 truncate">{block.title}</p>
                <p className="text-[10px] text-gray-400 truncate">{block.description}</p>
              </div>
              <div className="w-1.5 h-6 rounded-full shrink-0" style={{ background: block.color }} />
            </div>
          ) : null

          /* ── Card da seção ── */
          let card: React.ReactNode

          if (done) {
            /* CONCLUÍDA — compacta, verde, sem destaque */
            card = (
              <button
                key={section.id}
                onClick={() => router.push(`/trilha/${section.id}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-100
                  hover:border-green-200 hover:bg-green-50/30 transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="flex-1 text-xs font-semibold text-gray-400 text-left truncate">{section.title}</span>
                <span className="text-[10px] text-green-400 font-bold">+{section.points_value} pts</span>
              </button>
            )

          } else if (isNext) {
            /* PRÓXIMA — card grande, destaque azul, CTA */
            card = (
              <button
                key={section.id}
                onClick={() => router.push(`/trilha/${section.id}`)}
                className="w-full text-left rounded-2xl overflow-hidden shadow-md border-2 border-[#000FFF]/20
                  hover:shadow-lg hover:border-[#000FFF]/40 transition-all active:scale-[0.99]"
                style={{ background: `linear-gradient(135deg, #000FFF08, white)` }}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#000FFF]">
                      {started ? '▶ CONTINUAR' : '→ PRÓXIMA ETAPA'}
                    </span>
                  </div>
                  <p className="text-base font-black text-gray-900 mb-0.5">{section.title}</p>
                  <p className="text-xs text-gray-400">{block.title} · Etapa {localIndex + 1}</p>
                </div>
                <div className="px-5 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-[#000FFF] text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm">
                    {started ? '▶ Continuar' : '→ Começar'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                  <span className="text-sm font-black text-[#000FFF]">+{section.points_value} pts</span>
                </div>
              </button>
            )

          } else if (isUnlocked && !done) {
            /* DESBLOQUEADA mas não é a próxima — visível, clicável, neutro */
            card = (
              <button
                key={section.id}
                onClick={() => router.push(`/trilha/${section.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100
                  hover:border-[#000FFF]/30 hover:bg-[#000FFF]/3 transition-all group"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                  style={{ background: block.color }}
                >{localIndex + 1}</div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-700 truncate">{section.title}</p>
                  <p className="text-[11px] text-gray-400">+{section.points_value} pts</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            )

          } else {
            /* TRAVADA — mínima, cinza, não clicável */
            card = (
              <div
                key={section.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl opacity-35"
              >
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400 truncate">{section.title}</span>
              </div>
            )
          }

          return (
            <div key={`wrap-${section.id}`}>
              {blockHeader}
              {card}
            </div>
          )
        })}

        {/* Fim da trilha */}
        {overallPct === 100 && (
          <div className="mt-6 text-center py-8">
            <p className="text-4xl mb-2">🏆</p>
            <p className="font-black text-gray-900">Trilha completa!</p>
            <p className="text-sm text-gray-400 mt-1">Você concluiu todos os módulos</p>
          </div>
        )}
      </div>
    </div>
  )
}
