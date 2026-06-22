'use client'

import { useState, useTransition } from 'react'
import { forceApproveUser } from './actions'

interface IncompleteUser {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
}

function IncompleteRow({ user }: { user: IncompleteUser }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) return null

  const handleApprove = () => {
    setError(null)
    startTransition(async () => {
      try {
        await forceApproveUser(user.id)
        setDone(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao liberar acesso')
      }
    })
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-gray-400">
          {(user.email ?? '?').charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 truncate">
          {user.full_name && user.full_name !== user.email ? user.full_name : '—'}
        </p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
        {error && <p className="text-xs text-red-500 font-semibold mt-0.5">⚠️ {error}</p>}
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">
        {new Date(user.created_at).toLocaleDateString('pt-BR')}
      </span>
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000FFF] text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex-shrink-0"
      >
        {isPending
          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        }
        Liberar acesso
      </button>
    </div>
  )
}

export default function IncompleteList({ users }: { users: IncompleteUser[] }) {
  if (users.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        <h2 className="text-base font-black text-gray-900">Cadastro Incompleto</h2>
        <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-1 rounded-full">{users.length}</span>
        <span className="text-xs text-gray-400 font-medium">Não finalizaram o cadastro — admin pode liberar acesso mesmo assim</span>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {users.map(u => <IncompleteRow key={u.id} user={u} />)}
      </div>
    </div>
  )
}
