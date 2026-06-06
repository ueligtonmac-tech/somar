'use client'

import { useState, useTransition } from 'react'
import { createModule } from '../actions'

export default function NewModuleButton({ nextIndex }: { nextIndex: number }) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  const handleCreate = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createModule(title.trim(), nextIndex)
      setTitle('')
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-bold hover:border-[#000FFF] hover:text-[#000FFF] hover:bg-blue-50/20 transition-all mt-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Criar novo módulo (tópico {nextIndex})
      </button>
    )
  }

  return (
    <div className="mt-6 bg-white rounded-2xl border-2 border-[#000FFF]/20 p-5 shadow-sm">
      <p className="text-sm font-black text-gray-700 mb-3">
        Novo módulo — Tópico {nextIndex}
      </p>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
        placeholder="Ex: Precificação Avançada"
        autoFocus
        className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#000FFF] focus:outline-none transition-colors mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={!title.trim() || pending}
          className="flex-1 bg-[#000FFF] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {pending ? 'Criando...' : 'Criar módulo'}
        </button>
        <button
          onClick={() => { setOpen(false); setTitle('') }}
          className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
