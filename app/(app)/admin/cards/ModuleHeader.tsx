'use client'

import { useState, useTransition } from 'react'
import { updateModule, deleteModule, reorderModules } from '../actions'
import GenerateCardsButton from './GenerateCardsButton'

interface Props {
  module: { id: string; title: string; description?: string | null; published?: boolean; order_index: number }
  cardCount: number
  publishedCount: number
  allModuleIds: string[]
}

export default function ModuleHeader({ module, cardCount, publishedCount, allModuleIds }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(module.title)
  const [description, setDescription] = useState(module.description ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleSave = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await updateModule(module.id, { title: title.trim(), description: description.trim() })
      setEditing(false)
    })
  }

  const handleTogglePublish = () => {
    startTransition(() => updateModule(module.id, { published: !module.published }))
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3500)
      return
    }
    startTransition(() => deleteModule(module.id))
  }

  return (
    <div className={`bg-[#000FFF] px-6 py-4 transition-opacity ${pending ? 'opacity-60' : ''}`}>
      {editing ? (
        /* ── Modo edição ── */
        <div className="space-y-2">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            placeholder="Título do módulo"
            className="w-full rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!title.trim() || pending}
              className="px-4 py-1.5 rounded-lg bg-white text-[#000FFF] text-xs font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => { setEditing(false); setTitle(module.title); setDescription(module.description ?? '') }}
              className="px-4 py-1.5 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        /* ── Modo visualização ── */
        <div className="flex items-center gap-3">
          {/* Setas reordenação */}
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button
              disabled={allModuleIds[0] === module.id || pending}
              onClick={() => {
                const ids = [...allModuleIds]
                const pos = ids.indexOf(module.id)
                if (pos <= 0) return
                ;[ids[pos - 1], ids[pos]] = [ids[pos], ids[pos - 1]]
                startTransition(() => reorderModules(ids))
              }}
              className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 disabled:opacity-20 transition-colors"
              title="Mover para cima"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button
              disabled={allModuleIds[allModuleIds.length - 1] === module.id || pending}
              onClick={() => {
                const ids = [...allModuleIds]
                const pos = ids.indexOf(module.id)
                if (pos >= ids.length - 1) return
                ;[ids[pos], ids[pos + 1]] = [ids[pos + 1], ids[pos]]
                startTransition(() => reorderModules(ids))
              }}
              className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 disabled:opacity-20 transition-colors"
              title="Mover para baixo"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>

          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            {module.order_index}
          </span>

          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold truncate">{module.title}</h2>
            {module.description && (
              <p className="text-blue-200 text-xs mt-0.5 truncate">{module.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <span className="text-blue-200 text-xs font-semibold whitespace-nowrap">
              {cardCount} cards · {publishedCount} publicados
            </span>

            <GenerateCardsButton moduleId={module.id} moduleTitle={module.title} />

            {/* Publicar / Despublicar */}
            <button
              onClick={handleTogglePublish}
              title={module.published ? 'Despublicar módulo' : 'Publicar módulo'}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                module.published
                  ? 'bg-green-400/20 text-green-200 hover:bg-red-400/20 hover:text-red-200'
                  : 'bg-white/10 text-white/60 hover:bg-green-400/20 hover:text-green-200'
              }`}
            >
              {module.published ? '● Publicado' : '○ Rascunho'}
            </button>

            {/* Editar */}
            <button
              onClick={() => setEditing(true)}
              title="Editar módulo"
              className="w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>

            {/* Excluir */}
            <button
              onClick={handleDelete}
              title={confirmDelete ? 'Clique para confirmar exclusão' : 'Excluir módulo'}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                confirmDelete
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/10 text-white/50 hover:bg-red-500/30 hover:text-red-200'
              }`}
            >
              {confirmDelete ? '⚠ Confirmar' : '✕'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
