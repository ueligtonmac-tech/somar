'use client'

import { useRouter } from 'next/navigation'

const BADGES = [
  { key: 'iniciante',   icon: '🌱', label: 'Iniciante',        desc: 'Completou o Módulo 0' },
  { key: 'digital',     icon: '📱', label: 'Digital',          desc: 'Concluiu Canais Digitais' },
  { key: 'hubmaster',   icon: '🖥️', label: 'HUBmaster',        desc: 'Concluiu o HUB Somar' },
  { key: 'gasexpert',   icon: '⛽', label: 'Especialista Gás', desc: 'Concluiu Vale Gás' },
  { key: 'engajador',   icon: '🤝', label: 'Engajador',        desc: 'Concluiu AmigU' },
  { key: 'financeiro',  icon: '💰', label: 'Financeiro',       desc: 'Concluiu Financeiro' },
  { key: 'master',      icon: '🏆', label: 'Master Ultragaz',  desc: 'Trilha 100% completa' },
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <div className="bg-[#000FFF] text-white px-5 pt-8 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Trilha de Capacitação</p>
        <h1 className="text-2xl font-black mb-4">Sua jornada Ultragaz 🚀</h1>

        {/* Pontos e progresso geral */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-3xl font-black">{totalPoints}</span>
            <span className="text-sm opacity-70 ml-1">pontos</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold">{overallPct}%</span>
            <p className="text-xs opacity-70">concluído</p>
          </div>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        {/* Badges */}
        <div className="flex gap-3 mt-5 overflow-x-auto pb-1 scrollbar-none">
          {BADGES.map(b => (
            <div key={b.key} className={`flex flex-col items-center min-w-[56px] ${earnedBadges.has(b.key) ? '' : 'opacity-30'}`}>
              <span className="text-2xl">{b.icon}</span>
              <span className="text-[10px] text-white/80 mt-0.5 text-center leading-tight">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Blocos */}
      <div className="px-4 pt-5 space-y-5">
        {blocks.map(block => {
          const blockSections = sections.filter(s => s.block_id === block.id).sort((a, b) => a.order_index - b.order_index)
          const blockDone = blockSections.filter(s => progressMap[s.id]?.quiz_passed).length
          const blockTotal = blockSections.length
          const blockPct = blockTotal > 0 ? Math.round((blockDone / blockTotal) * 100) : 0

          return (
            <div key={block.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {/* Header do bloco */}
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderLeft: `4px solid ${block.color}` }}>
                <span className="text-2xl">{block.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm">{block.title}</p>
                  <p className="text-xs text-gray-400 truncate">{block.description}</p>
                </div>
                <span className="text-xs font-bold text-gray-400">{blockDone}/{blockTotal}</span>
              </div>

              {/* Barra de progresso do bloco */}
              {blockTotal > 0 && (
                <div className="h-1 bg-gray-100">
                  <div className="h-full transition-all duration-500" style={{ width: `${blockPct}%`, background: block.color }} />
                </div>
              )}

              {/* Seções */}
              <div className="divide-y divide-gray-50">
                {blockSections.map((section, idx) => {
                  const p = progressMap[section.id]
                  const done = p?.quiz_passed ?? false
                  const started = p?.intro_done ?? false

                  // Lógica de desbloqueio: seção 0 sempre livre, demais exigem anterior concluída
                  const prevSection = idx > 0 ? blockSections[idx - 1] : null
                  const prevDone = !prevSection || progressMap[prevSection.id]?.quiz_passed
                  // Bloco 0 (Módulo 0) sempre desbloqueado
                  const isUnlocked = block.order_index === 0 || prevDone

                  return (
                    <button
                      key={section.id}
                      onClick={() => isUnlocked && router.push(`/trilha/${section.id}`)}
                      disabled={!isUnlocked}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                        ${isUnlocked ? 'hover:bg-gray-50 active:bg-gray-100' : 'opacity-40 cursor-not-allowed'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                        ${done ? 'bg-green-500 text-white' : started ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                        style={started && !done ? { background: block.color } : {}}
                      >
                        {done ? '✓' : !isUnlocked ? '🔒' : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{section.title}</p>
                        <p className="text-xs text-gray-400">
                          {done ? '✅ Concluída' : started ? '▶ Em progresso' : `+${section.points_value} pts`}
                        </p>
                      </div>
                      {isUnlocked && <span className="text-gray-300 text-sm">›</span>}
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
