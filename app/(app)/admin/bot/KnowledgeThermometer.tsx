'use client'

interface AreaScore {
  area: string
  icon: string
  knowledgeCount: number
  avgScore: number | null
  totalFeedback: number
}

function Thermometer({ score }: { score: number; label: string }) {
  // score 0–100
  const color =
    score >= 75 ? '#22c55e' :
    score >= 50 ? '#f59e0b' :
    score >= 25 ? '#f97316' :
    '#ef4444'

  const level =
    score >= 75 ? 'Bom' :
    score >= 50 ? 'Regular' :
    score >= 25 ? 'Fraco' :
    'Crítico'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold w-16 text-right" style={{ color }}>{level}</span>
    </div>
  )
}

export default function KnowledgeThermometer({ areas }: { areas: AreaScore[] }) {
  // Calcula score geral ponderado
  const totalItems = areas.reduce((s, a) => s + a.knowledgeCount, 0)
  const globalScore = areas.length === 0 ? 0 :
    Math.round(areas.reduce((s, a) => s + computeScore(a), 0) / areas.length)

  function computeScore(a: AreaScore) {
    // Score baseado em: qtd de conhecimentos (até 50pts) + nota média do feedback (até 50pts)
    const knowledgeScore = Math.min(a.knowledgeCount * 5, 50)
    const feedbackScore = a.avgScore !== null ? ((a.avgScore / 10) * 50) : 25 // 25 neutro se sem feedback
    return Math.round(knowledgeScore + feedbackScore)
  }

  const globalColor =
    globalScore >= 75 ? '#22c55e' :
    globalScore >= 50 ? '#f59e0b' :
    globalScore >= 25 ? '#f97316' :
    '#ef4444'

  const globalLabel =
    globalScore >= 75 ? 'Bot bem preparado' :
    globalScore >= 50 ? 'Precisa de mais material' :
    globalScore >= 25 ? 'Base de conhecimento fraca' :
    'Urgente: adicione conhecimentos'

  return (
    <div className="space-y-5">
      {/* Score global */}
      <div className="bg-gradient-to-br from-[#000FFF]/5 to-[#000FFF]/10 rounded-2xl p-5 border border-[#000FFF]/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Nível Geral do Bot João</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: globalColor }}>{globalLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black" style={{ color: globalColor }}>{globalScore}</p>
            <p className="text-xs text-gray-400">/ 100</p>
          </div>
        </div>
        {/* Termômetro visual grande */}
        <div className="h-4 bg-white/60 rounded-full overflow-hidden border border-white/50">
          <div
            className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
            style={{ width: `${globalScore}%`, background: `linear-gradient(90deg, ${globalColor}99, ${globalColor})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
          </div>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">Crítico</span>
          <span className="text-[10px] text-gray-400">Fraco</span>
          <span className="text-[10px] text-gray-400">Regular</span>
          <span className="text-[10px] text-gray-400">Bom</span>
          <span className="text-[10px] text-gray-400">Excelente</span>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          {totalItems} conhecimentos aprovados · Score = base de conhecimento (50%) + avaliações dos usuários (50%)
        </p>
      </div>

      {/* Por área */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Termômetro por Área</p>
        </div>
        <div className="divide-y divide-gray-50">
          {areas.map(area => {
            const score = computeScore(area)
            const color =
              score >= 75 ? '#22c55e' :
              score >= 50 ? '#f59e0b' :
              score >= 25 ? '#f97316' :
              '#ef4444'
            const status =
              score >= 75 ? '✓ Bem coberto' :
              score >= 50 ? '⚠ Precisa melhorar' :
              '🚨 Adicione material'

            return (
              <div key={area.area} className="px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{area.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{area.area}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {area.knowledgeCount} conhecimento{area.knowledgeCount !== 1 ? 's' : ''}
                        {area.avgScore !== null && (
                          <span className="ml-2">· nota média: <strong>{area.avgScore.toFixed(1)}/10</strong></span>
                        )}
                        {area.totalFeedback > 0 && (
                          <span className="ml-1">({area.totalFeedback} avaliações)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xl font-black" style={{ color }}>{score}</p>
                    <p className="text-[10px]" style={{ color }}>{status}</p>
                  </div>
                </div>
                <Thermometer score={score} label={area.area} />
                {score < 50 && (
                  <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg px-3 py-1.5 font-medium">
                    💡 Dica: adicione mais conhecimentos sobre <strong>{area.area}</strong> na aba &ldquo;Adicionar&rdquo;
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { color: '#22c55e', label: 'Bom', range: '75–100' },
          { color: '#f59e0b', label: 'Regular', range: '50–74' },
          { color: '#f97316', label: 'Fraco', range: '25–49' },
          { color: '#ef4444', label: 'Crítico', range: '0–24' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <div>
              <p className="text-xs font-bold text-gray-700">{l.label}</p>
              <p className="text-[10px] text-gray-400">{l.range} pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
