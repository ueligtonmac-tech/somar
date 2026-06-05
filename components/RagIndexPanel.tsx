'use client'

import { useState, useEffect } from 'react'

interface IndexStatus {
  knowledge: { total: number; indexed: number }
  cards: { total: number; indexed: number }
}

export default function RagIndexPanel() {
  const [status, setStatus] = useState<IndexStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function fetchStatus() {
    try {
      const res = await fetch('/api/rag/sync')
      if (res.ok) setStatus(await res.json())
    } catch { /* ignora */ }
  }

  useEffect(() => { fetchStatus() }, [])

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/rag/sync', { method: 'POST' })
      const data = await res.json()
      setResult(data.message ?? 'Concluído')
      await fetchStatus()
    } catch {
      setResult('Erro ao indexar. Verifique a chave OPENAI_API_KEY.')
    } finally {
      setLoading(false)
    }
  }

  const kPct = status ? Math.round((status.knowledge.indexed / Math.max(status.knowledge.total, 1)) * 100) : 0
  const cPct = status ? Math.round((status.cards.indexed / Math.max(status.cards.total, 1)) * 100) : 0
  const allIndexed = status && status.knowledge.indexed === status.knowledge.total && status.cards.indexed === status.cards.total

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Status da Indexação</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Conhecimentos do Bot', icon: '🧠', pct: kPct, indexed: status?.knowledge.indexed ?? 0, total: status?.knowledge.total ?? 0 },
            { label: 'Cards da Trilha', icon: '🃏', pct: cPct, indexed: status?.cards.indexed ?? 0, total: status?.cards.total ?? 0 },
          ].map(item => (
            <div key={item.label} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-sm font-bold text-gray-800">{item.label}</p>
                </div>
                <span className="text-xs font-bold text-gray-500">{item.indexed}/{item.total}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${item.pct}%`,
                    background: item.pct === 100 ? '#22c55e' : item.pct > 0 ? '#f59e0b' : '#e5e7eb'
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{item.pct}% indexado para busca semântica</p>
            </div>
          ))}
        </div>
      </div>

      {/* Como funciona */}
      <div className="bg-[#000FFF]/5 rounded-2xl border border-[#000FFF]/10 p-5">
        <p className="text-xs font-extrabold text-[#000FFF] uppercase tracking-widest mb-2">Como funciona</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          A indexação gera <strong>embeddings vetoriais</strong> para cada conteúdo. O Bot João passa a usar
          <strong> busca semântica</strong> — entende o significado das perguntas, não apenas palavras-chave.
          Resultado: respostas muito mais precisas e contextuais.
        </p>
        <p className="text-xs text-gray-400 mt-2">⚠️ Requer chave <code className="bg-white px-1 rounded">OPENAI_API_KEY</code> configurada no Vercel.</p>
      </div>

      {/* Resultado da última sync */}
      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {result}
        </div>
      )}

      {/* Botão */}
      <button
        onClick={handleSync}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#000FFF] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Indexando... (pode levar alguns segundos)
          </>
        ) : allIndexed ? (
          <>✓ Tudo indexado — Reindexar</>
        ) : (
          <>🚀 Indexar conteúdo para busca semântica</>
        )}
      </button>
    </div>
  )
}
