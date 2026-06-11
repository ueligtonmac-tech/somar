'use client'

import { useState, useTransition, useOptimistic } from 'react'

export interface RefRow {
  id: string
  slug: string
  nome: string
  descricao: string | null
  ordem: number
  ativo: boolean
}

interface Props {
  title: string
  subtitle: string
  rows: RefRow[]
  onCreate: (fd: FormData) => Promise<void>
  onUpdate: (id: string, fd: FormData) => Promise<void>
  onToggle: (id: string, ativo: boolean) => Promise<void>
  onReorder: (ids: string[]) => Promise<void>
  color?: string
}

function Badge({ ativo }: { ativo: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border
      ${ativo
        ? 'bg-green-50 text-green-700 border-green-100'
        : 'bg-gray-100 text-gray-400 border-gray-200'}`
    }>
      <span className={`w-1.5 h-1.5 rounded-full ${ativo ? 'bg-green-500' : 'bg-gray-400'}`} />
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function EditRow({
  row,
  onUpdate,
  onToggle,
}: {
  row: RefRow
  onUpdate: (id: string, fd: FormData) => Promise<void>
  onToggle: (id: string, ativo: boolean) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [nome, setNome] = useState(row.nome)
  const [descricao, setDescricao] = useState(row.descricao ?? '')

  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('nome', nome)
      fd.append('descricao', descricao)
      await onUpdate(row.id, fd)
      setEditing(false)
    })
  }

  const handleToggle = () => {
    startTransition(async () => {
      await onToggle(row.id, !row.ativo)
    })
  }

  if (editing) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100">
        <div className="flex-1 space-y-2">
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20"
            placeholder="Nome"
          />
          <input
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20"
            placeholder="Descrição (opcional)"
          />
        </div>
        <div className="flex gap-2 mt-1 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={isPending || !nome.trim()}
            className="text-xs bg-[#000FFF] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {isPending ? '...' : 'Salvar'}
          </button>
          <button
            onClick={() => { setNome(row.nome); setDescricao(row.descricao ?? ''); setEditing(false) }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors
      ${row.ativo ? 'bg-white border-gray-100 hover:border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}
    >
      {/* drag handle */}
      <span className="text-gray-300 cursor-grab select-none text-sm">⠿</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{row.nome}</span>
          <Badge ativo={row.ativo} />
        </div>
        {row.descricao && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{row.descricao}</p>
        )}
        <p className="text-[10px] text-gray-300 mt-0.5 font-mono">{row.slug}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-gray-400 hover:text-[#000FFF] transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50 font-medium"
        >
          Editar
        </button>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`text-xs px-2 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60
            ${row.ativo
              ? 'text-orange-500 hover:bg-orange-50'
              : 'text-green-600 hover:bg-green-50'}`}
        >
          {isPending ? '...' : row.ativo ? 'Desativar' : 'Ativar'}
        </button>
      </div>
    </div>
  )
}

export default function RefTable({ title, subtitle, rows, onCreate, onUpdate, onToggle, onReorder }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [newNome, setNewNome] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [error, setError] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [optimisticRows, updateOptimistic] = useOptimistic(
    rows,
    (state: RefRow[], newRows: RefRow[]) => newRows
  )

  const handleCreate = () => {
    if (!newNome.trim()) { setError('Informe o nome'); return }
    setError('')
    startTransition(async () => {
      const fd = new FormData()
      fd.append('nome', newNome)
      fd.append('descricao', newDesc)
      await onCreate(fd)
      setNewNome('')
      setNewDesc('')
      setShowForm(false)
    })
  }

  // Simple drag-and-drop reorder
  const handleDragStart = (id: string) => setDraggingId(id)

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) return
    const currentIds = optimisticRows.map(r => r.id)
    const fromIdx = currentIds.indexOf(draggingId)
    const toIdx = currentIds.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const newOrder = [...optimisticRows]
    const [moved] = newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, moved)
    updateOptimistic(newOrder)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingId) return
    setDraggingId(null)
    startTransition(async () => {
      await onReorder(optimisticRows.map(r => r.id))
    })
  }

  const active = optimisticRows.filter(r => r.ativo)
  const inactive = optimisticRows.filter(r => !r.ativo)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-black text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-sm bg-[#000FFF] text-white px-3.5 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Novo
        </button>
      </div>

      {/* add form */}
      {showForm && (
        <div className="px-5 py-4 bg-blue-50/40 border-b border-blue-100 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-600 mb-1 block">Nome *</label>
              <input
                value={newNome}
                onChange={e => setNewNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Ex: Diamante, Centro-Oeste..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-600 mb-1 block">Descrição <span className="font-normal text-gray-400">(opcional)</span></label>
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Breve descrição..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="text-sm bg-[#000FFF] text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {isPending ? 'Criando...' : 'Criar'}
            </button>
            <button onClick={() => { setShowForm(false); setError('') }} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* list */}
      <div className="p-4 space-y-2" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
        {active.length === 0 && inactive.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhum item cadastrado ainda.</p>
        )}

        {active.map(row => (
          <div
            key={row.id}
            draggable
            onDragStart={() => handleDragStart(row.id)}
            onDragOver={e => handleDragOver(e, row.id)}
            className={`transition-opacity ${draggingId === row.id ? 'opacity-40' : 'opacity-100'}`}
          >
            <EditRow row={row} onUpdate={onUpdate} onToggle={onToggle} />
          </div>
        ))}

        {inactive.length > 0 && (
          <>
            {active.length > 0 && <div className="border-t border-dashed border-gray-100 my-2" />}
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-1 mb-1">Inativos</p>
            {inactive.map(row => (
              <EditRow key={row.id} row={row} onUpdate={onUpdate} onToggle={onToggle} />
            ))}
          </>
        )}
      </div>

      <div className="px-5 pb-4 pt-0">
        <p className="text-[10px] text-gray-300">
          {active.length} ativo{active.length !== 1 ? 's' : ''} · {inactive.length} inativo{inactive.length !== 1 ? 's' : ''} · Arraste para reordenar
        </p>
      </div>
    </div>
  )
}
