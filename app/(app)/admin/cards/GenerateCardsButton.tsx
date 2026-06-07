'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateCardsButton({ moduleId, moduleTitle }: { moduleId: string; moduleTitle: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ inserted: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleGenerate = async () => {
    if (!confirm(`Gerar cards com IA para o módulo "${moduleTitle}"?\n\nOs cards serão criados como rascunho para você revisar antes de publicar.`)) return

    setState('loading')
    setResult(null)
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      setResult({ inserted: data.inserted })
      setState('done')
      if (data.inserted > 0) router.refresh()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao gerar cards')
      setState('error')
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-600 text-xs font-semibold border border-purple-100">
        <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Gerando com IA...
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
        {result?.inserted === 0
          ? '✓ Sem conteúdo novo — nenhum card duplicado gerado'
          : `✓ ${result?.inserted} card${(result?.inserted ?? 0) > 1 ? 's' : ''} gerado${(result?.inserted ?? 0) > 1 ? 's' : ''} como rascunho`}
        <button onClick={() => setState('idle')} className="ml-1 text-green-400 hover:text-green-700">×</button>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-100">
        ✗ {errorMsg}
        <button onClick={() => setState('idle')} className="ml-1 text-red-400 hover:text-red-700">×</button>
      </div>
    )
  }

  return (
    <button
      onClick={handleGenerate}
      title="Gerar cards com base nos documentos da biblioteca"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-600 text-xs font-semibold border border-purple-100 hover:bg-purple-100 transition-colors"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      Gerar com IA
    </button>
  )
}
