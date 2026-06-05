'use client'

import { useState, useTransition, useRef } from 'react'
import { addManualKnowledge, bulkImportKnowledge } from './actions'

export default function AddKnowledgeTab() {
  const [tab, setTab] = useState<'manual' | 'csv' | 'arquivo' | 'url'>('manual')
  const [pending, startTransition] = useTransition()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Manual form
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [improving, setImproving] = useState(false)
  const [improveMode, setImproveMode] = useState<string | null>(null)

  // CSV
  const [csvPreview, setCsvPreview] = useState<{question: string; answer: string}[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // Arquivo (TXT / DOCX)
  const [arquivoContent, setArquivoContent] = useState('')
  const [arquivoTitle, setArquivoTitle] = useState('')
  const [arquivoLoading, setArquivoLoading] = useState(false)
  const arquivoRef = useRef<HTMLInputElement>(null)

  // URL
  const [url, setUrl] = useState('')
  const [urlContent, setUrlContent] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlQuestion, setUrlQuestion] = useState('')

  const reset = () => { setSuccess(null); setError(null) }

  // ── AI Improve ──
  const handleImprove = async (mode: string) => {
    if (!answer.trim()) return
    setImproving(true)
    setImproveMode(mode)
    setError(null)
    try {
      const res = await fetch('/api/bot/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao melhorar')
      setAnswer(data.improved)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao melhorar texto')
    } finally {
      setImproving(false)
      setImproveMode(null)
    }
  }

  // ── Manual ──
  const handleManual = () => {
    reset()
    startTransition(async () => {
      try {
        await addManualKnowledge(question, answer)
        setSuccess('✓ Conhecimento salvo com sucesso!')
        setQuestion('')
        setAnswer('')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao salvar')
      }
    })
  }

  // ── CSV ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const items: {question: string; answer: string}[] = []
      for (const line of lines) {
        const parts = line.split(/[;,](?=(?:[^"]*"[^"]*")*[^"]*$)/)
        if (parts.length >= 2) {
          const q = parts[0].replace(/^"|"$/g, '').trim()
          const a = parts.slice(1).join(',').replace(/^"|"$/g, '').trim()
          if (q && a && q.toLowerCase() !== 'pergunta') items.push({ question: q, answer: a })
        }
      }
      setCsvPreview(items)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleCsvImport = () => {
    reset()
    startTransition(async () => {
      try {
        const imported = await bulkImportKnowledge(csvPreview)
        setSuccess(`✓ ${imported} itens importados com sucesso!`)
        setCsvPreview([])
        if (fileRef.current) fileRef.current.value = ''
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao importar')
      }
    })
  }

  // ── Arquivo TXT / DOCX ──
  const handleArquivoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivoLoading(true)
    setArquivoContent('')
    setError(null)

    const ext = file.name.split('.').pop()?.toLowerCase()
    // Auto-título pelo nome do arquivo
    setArquivoTitle(file.name.replace(/\.(txt|docx)$/i, '').replace(/[-_]/g, ' '))

    try {
      if (ext === 'txt') {
        // TXT: lê direto
        const text = await file.text()
        setArquivoContent(text.slice(0, 8000))
      } else if (ext === 'docx') {
        // DOCX: envia ao servidor para extrair texto com mammoth
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/bot/extract-docx', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao ler DOCX')
        setArquivoContent(data.text.slice(0, 8000))
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao ler arquivo')
    } finally {
      setArquivoLoading(false)
    }
  }

  const handleSaveArquivo = () => {
    reset()
    if (!arquivoTitle.trim() || !arquivoContent.trim()) {
      setError('Preencha o título e verifique o conteúdo extraído')
      return
    }
    startTransition(async () => {
      try {
        await addManualKnowledge(arquivoTitle, arquivoContent)
        setSuccess('✓ Conteúdo do arquivo salvo como conhecimento!')
        setArquivoContent('')
        setArquivoTitle('')
        if (arquivoRef.current) arquivoRef.current.value = ''
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao salvar')
      }
    })
  }

  // ── URL ──
  const handleFetchUrl = async () => {
    if (!url.trim()) return
    setUrlLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bot/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar URL')
      setUrlContent(data.content)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar URL')
    } finally {
      setUrlLoading(false)
    }
  }

  const handleSaveUrl = () => {
    reset()
    if (!urlQuestion.trim() || !urlContent.trim()) {
      setError('Preencha a pergunta e verifique o conteúdo extraído')
      return
    }
    startTransition(async () => {
      try {
        await addManualKnowledge(urlQuestion, urlContent)
        setSuccess('✓ Conteúdo da URL salvo como conhecimento!')
        setUrl('')
        setUrlContent('')
        setUrlQuestion('')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao salvar')
      }
    })
  }

  const tabBtnStyle = (active: boolean) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '0.82rem',
    fontWeight: 700,
    border: active ? 'none' : '2px solid #e5e7eb',
    background: active ? '#000FFF' : 'white',
    color: active ? 'white' : '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s',
  } as React.CSSProperties)

  return (
    <div>
      {/* Tabs internas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button style={tabBtnStyle(tab === 'manual')} onClick={() => { reset(); setTab('manual') }}>✍️ Manual</button>
        <button style={tabBtnStyle(tab === 'csv')} onClick={() => { reset(); setTab('csv') }}>📊 CSV</button>
        <button style={tabBtnStyle(tab === 'arquivo')} onClick={() => { reset(); setTab('arquivo') }}>📄 TXT / DOCX</button>
        <button style={tabBtnStyle(tab === 'url')} onClick={() => { reset(); setTab('url') }}>🔗 URL</button>
      </div>

      {/* Feedback */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
          <span className="text-green-600 text-sm font-bold">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-600 text-xs">✕</button>
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="text-red-600 text-sm font-bold">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 text-xs">✕</button>
        </div>
      )}

      {/* ── Manual ── */}
      {tab === 'manual' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pergunta</p>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ex: Como funciona o Vale Gás Digital?"
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Resposta</p>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Digite a resposta que o Bot João deve dar..."
              rows={5}
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none resize-none leading-relaxed"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Melhorar com IA</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { mode: 'improve', label: '✨ Melhorar', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
                { mode: 'correct', label: '🔤 Corrigir', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
                { mode: 'expand', label: '📝 Expandir', color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' },
                { mode: 'summarize', label: '✂️ Resumir', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200' },
                { mode: 'formalize', label: '👔 Formalizar', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200' },
              ].map(({ mode, label, color }) => (
                <button
                  key={mode}
                  onClick={() => handleImprove(mode)}
                  disabled={improving || !answer.trim()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 ${color} ${improveMode === mode && improving ? 'animate-pulse' : ''}`}
                >
                  {improveMode === mode && improving ? '⏳ Processando...' : label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleManual}
            disabled={pending || !question.trim() || !answer.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#000FFF] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40"
          >
            {pending ? 'Salvando...' : '✓ Salvar na base de conhecimento'}
          </button>
        </div>
      )}

      {/* ── CSV ── */}
      {tab === 'csv' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-blue-800 mb-1">Formato esperado do CSV</p>
            <p className="text-xs text-blue-600 font-mono">pergunta,resposta</p>
            <p className="text-xs text-blue-600 font-mono">Como funciona o Vale Gás?,O Vale Gás é um benefício...</p>
            <p className="text-xs text-blue-500 mt-1">Separador: vírgula ou ponto-e-vírgula. Encoding: UTF-8.</p>
          </div>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#000FFF] transition-colors">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm font-bold text-gray-700">Clique para escolher o arquivo CSV</p>
              <p className="text-xs text-gray-400">Arquivos .csv ou .txt</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
          </label>
          {csvPreview.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">{csvPreview.length} itens detectados — pré-visualização:</p>
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {csvPreview.slice(0, 10).map((item, i) => (
                  <div key={i} className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800 truncate">❓ {item.question}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">💬 {item.answer}</p>
                  </div>
                ))}
                {csvPreview.length > 10 && <p className="px-3 py-2 text-xs text-gray-400">... e mais {csvPreview.length - 10} itens</p>}
              </div>
              <button
                onClick={handleCsvImport}
                disabled={pending}
                className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-[#000FFF] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {pending ? 'Importando...' : `⬆️ Importar ${csvPreview.length} itens`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TXT / DOCX ── */}
      {tab === 'arquivo' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-violet-800 mb-0.5">Como funciona</p>
            <p className="text-xs text-violet-700">Faça upload de um arquivo <strong>.txt</strong> ou <strong>.docx</strong>. O texto será extraído e salvo como conhecimento do Bot João.</p>
          </div>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#000FFF] transition-colors">
            <span className="text-2xl">{arquivoLoading ? '⏳' : '📄'}</span>
            <div>
              <p className="text-sm font-bold text-gray-700">{arquivoLoading ? 'Extraindo texto...' : 'Clique para escolher o arquivo'}</p>
              <p className="text-xs text-gray-400">Formatos aceitos: .txt, .docx</p>
            </div>
            <input
              ref={arquivoRef}
              type="file"
              accept=".txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleArquivoChange}
              className="hidden"
              disabled={arquivoLoading}
            />
          </label>
          {arquivoContent && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1.5">Título / Tema do documento</p>
                <input
                  value={arquivoTitle}
                  onChange={e => setArquivoTitle(e.target.value)}
                  placeholder="Ex: Manual de Validação Vale Gás"
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1.5">Conteúdo extraído — edite se necessário</p>
                <textarea
                  value={arquivoContent}
                  onChange={e => setArquivoContent(e.target.value)}
                  rows={8}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none resize-none leading-relaxed font-mono text-xs"
                />
                <p className="text-xs text-gray-400 mt-1">{arquivoContent.length} caracteres</p>
              </div>
              <button
                onClick={handleSaveArquivo}
                disabled={pending || !arquivoTitle.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#000FFF] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {pending ? 'Salvando...' : '✓ Salvar como conhecimento'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── URL ── */}
      {tab === 'url' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-amber-800 mb-0.5">Como funciona</p>
            <p className="text-xs text-amber-700">Cole a URL de uma página (ex: ultragaz.com.br/vale-gas), o sistema extrai o texto e você salva como contexto do bot.</p>
          </div>
          <div className="flex gap-2">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.ultragaz.com.br/..."
              className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none"
            />
            <button
              onClick={handleFetchUrl}
              disabled={urlLoading || !url.trim()}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {urlLoading ? '⏳ Buscando...' : '🔍 Extrair'}
            </button>
          </div>
          {urlContent && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1.5">Título / Pergunta de referência</p>
                <input
                  value={urlQuestion}
                  onChange={e => setUrlQuestion(e.target.value)}
                  placeholder="Ex: Informações sobre Vale Gás Ultragaz"
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1.5">Conteúdo extraído — edite se necessário</p>
                <textarea
                  value={urlContent}
                  onChange={e => setUrlContent(e.target.value)}
                  rows={7}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-[#000FFF] focus:outline-none resize-none leading-relaxed font-mono text-xs"
                />
              </div>
              <button
                onClick={handleSaveUrl}
                disabled={pending || !urlQuestion.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#000FFF] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {pending ? 'Salvando...' : '✓ Salvar como conhecimento'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
