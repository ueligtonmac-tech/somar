'use client'

import { useState, useTransition } from 'react'
import { createCard } from '../actions'

export default function NewCardButton({ moduleId, nextIndex }: { moduleId: string; nextIndex: number }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [pending, startTransition] = useTransition()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      await createCard(moduleId, title.trim(), nextIndex)
      setTitle('')
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <div className="px-6 py-3 border-t border-gray-50">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#000FFF] transition-colors font-semibold w-full py-2 rounded-xl hover:bg-blue-50 px-3"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Adicionar card
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-blue-50/40">
      <form onSubmit={handleCreate} className="flex items-center gap-3">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título do novo card..."
          className="flex-1 border-2 border-[#000FFF]/30 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-[#000FFF] focus:outline-none bg-white"
        />
        <button
          type="submit"
          disabled={!title.trim() || pending}
          className="px-4 py-2.5 bg-[#000FFF] text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          {pending ? '...' : 'Criar'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setTitle('') }}
          className="px-3 py-2.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </form>
    </div>
  )
}
