'use client'

import { useState, useEffect } from 'react'

interface IndexStatus {
  knowledge: { total: number; indexed: number }
  cards: { total: number; indexed: number }
}

interface LibraryStatus {
  total: number
  indexed: number
  totalChunks: number
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: pct === 100 ? '#22c55e' : pct > 0 ? '#f59e0b' : '#e5e7eb',
        }}
      />
    </div>
  )
}

export default function RagIndexPanel() {
  const [status, setStatus] = useState<IndexStatus | null>(null)
  const [libStatus, setLibStatus] = useState<LibraryStatus | null>(null)
  const [loadingSync, setLoadingSync] = useState(false)
  const [loadingLib, setLoadingLib] = useState(false)
  const [resultSync, setResultSync] = useState<string | null>(null)
  const [resultLib, setResultLib] = useState<string | null>(null)

  async function fetchStatus() {
    try {
      const [ragRes, libRes] = await Promise.all([
        fetch('/api/rag/sync'),
        fetch('/api/admin/index-library'),
      ])
      if (ragRes.ok) setStatus(await ragRes.json())
      if (libRes.ok) setLibStatus(await libRes.json())
    } catch { /* ignora */ }
  }

  useEffect(() => { fetchStatus() }, [])

  async function handleSync() {
    setLoadingSync(true)
    setResultSync(null)
    try {
      const res = await fetch('/api/rag/sync', { method: 'POST' })
      const data = await res.json()
      setResultSync(data.message ?? 'Concluído')
      await fetchStatus()
    } catch {
      setResultSync('Erro ao indexar. Verifique a chave de API.')
    } finally {
      setLoadingSync(false)
    }
  }

  async function handleIndexLibrary(reindex = false) {
    setLoadingLib(true)
    setResultLib(null)
    try {
      const res = await fetch('/api/admin/index-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reindex }),
      })
      const data = await res.json()
      const details = data.errorDetails?.length ? '\n\nDetalhes:\n' + data.errorDetails.slice(0, 3).join('\n') : ''
      setResultLib((data.message ?? (data.error ? `Erro: ${data.error}` : 'Concluído')) + details)
      await fetchStatus()
    } catch {
      setResultLib('Erro ao indexar biblioteca. Tente novamente.')
    } finally {
      setLoadingLib(false)
    }
  }

  const kPct = status ? Math.round((status.knowledge.indexed / Math.max(status.knowledge.total, 1)) * 100) : 0
  const cPct = status ? Math.round((status.cards.indexed / Math.max(status.cards.total, 1)) * 100) : 0
  const lPct = libStatus ? Math.round((libStatus.indexed / Math.max(libStatus.total, 1)) * 100) : 0

  const allSynced = status && status.knowledge.indexed === status.knowledge.total && status.cards.indexed === status.cards.total
  const allLibIndexed = libStatus && libStatus.indexed >= libStatus.total && libStatus.total > 0

  const items = [
    { label: 'Conhecimentos do Bot', icon: '🧠', pct: kPct, indexed: status?.knowledge.indexed ?? 0, total: status?.knowledge.total ?? 0, sub: 'Q&A aprovados' },
    { label: 'Cards da Trilha', icon: '🃏', pct: cPct, indexed: status?.cards.indexed ?? 0, total: status?.cards.total ?? 0, sub: 'cards de conteúdo' },
    { label: 'Biblioteca de PDFs', icon: '📚', pct: lPct, indexed: libStatus?.indexed ?? 0, total: libStatus?.total ?? 0, sub: `${libStatus?.totalChunks ?? 0} trechos extraídos` },
  ]

  return (
    <div className="space-y-5">

      {/* Status das 3 fontes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Status da Indexação</p>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.label} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-500">{item.indexed}/{item.total}</span>
              </div>
              <ProgressBar pct={item.pct} />
              <p className="text-xs text-gray-400 mt-1">{item.pct}% indexado para busca semântica</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seção 1: Conhecimentos + Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Conhecimentos e Cards</p>
          <p className="text-xs text-gray-400 mt-1">Indexa os Q&As aprovados e os cards da trilha de treinamento.</p>
        </div>
        <div className="p-5 space-y-3">
          {resultSync && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${resultSync.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {resultSync}
            </div>
          )}
          <button
            onClick={handleSync}
            disabled={loadingSync || loadingLib}
            className="w-full py-3 rounded-xl bg-[#000FFF] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loadingSync ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Indexando...</>
            ) : allSynced ? (
              <>✓ Tudo indexado — Reindexar</>
            ) : (
              <>🚀 Indexar conhecimentos e cards</>
            )}
          </button>
        </div>
      </div>

      {/* Seção 2: Biblioteca de PDFs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Biblioteca de PDFs</p>
          <p className="text-xs text-gray-400 mt-1">
            Lê, extrai e indexa o conteúdo dos PDFs da biblioteca. Depois de indexados, o Bot João consegue responder com base nos manuais reais.
          </p>
        </div>
        <div className="p-5 space-y-3">
          {resultLib && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${resultLib.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {resultLib}
            </div>
          )}

          {libStatus && libStatus.total === 0 && (
            <div className="rounded-xl px-4 py-3 text-sm text-gray-500 bg-gray-50">
              Nenhum arquivo na biblioteca ainda. Faça upload de PDFs na seção Biblioteca.
            </div>
          )}

          <button
            onClick={() => handleIndexLibrary(false)}
            disabled={loadingLib || loadingSync || (libStatus?.total ?? 0) === 0}
            className="w-full py-3 rounded-xl bg-[#000FFF] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loadingLib ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Extraindo e indexando PDFs... (pode levar até 2 min)</>
            ) : allLibIndexed ? (
              <>✓ PDFs indexados — Indexar novos</>
            ) : (
              <>📚 Indexar PDFs da biblioteca</>
            )}
          </button>

          {allLibIndexed && (
            <button
              onClick={() => handleIndexLibrary(true)}
              disabled={loadingLib || loadingSync}
              className="w-full py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              🔄 Reindexar tudo (substitui conteúdo existente)
            </button>
          )}
        </div>
      </div>

      {/* Como funciona */}
      <div className="bg-[#000FFF]/5 rounded-2xl border border-[#000FFF]/10 p-5">
        <p className="text-xs font-extrabold text-[#000FFF] uppercase tracking-widest mb-2">Como funciona</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          A indexação gera <strong>embeddings vetoriais</strong> para cada conteúdo. O Bot João passa a usar
          <strong> busca semântica</strong> — entende o significado das perguntas, não apenas palavras-chave.
          Resultado: respostas muito mais precisas com base nos manuais reais da Ultragaz.
        </p>
        <p className="text-xs text-gray-400 mt-2">⚠️ Requer chave <code className="bg-white px-1 rounded">OPENAI_API_KEY</code> configurada no Vercel.</p>
      </div>
    </div>
  )
}
