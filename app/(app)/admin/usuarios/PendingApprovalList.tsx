'use client'

import { useState, useTransition } from 'react'
import { approveUser, rejectUser } from './actions'
import type { PendingUser } from './types'

const ROLES = ['consultant', 'gerencial', 'builder', 'admin'] as const
type Role = typeof ROLES[number]

const ROLE_LABELS: Record<Role, string> = {
  consultant: 'Consultor',
  gerencial: 'Gerencial',
  builder: 'Builder',
  admin: 'Admin',
}

function ApproveRow({ user }: { user: PendingUser }) {
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<Role>('consultant')
  const [done, setDone] = useState(false)

  const handleApprove = () => {
    startTransition(async () => {
      await approveUser(user.id, role)
      setDone(true)
    })
  }

  const handleReject = () => {
    if (!confirm(`Rejeitar o cadastro de ${user.full_name || user.email}? O usuário não poderá acessar a plataforma.`)) return
    startTransition(async () => {
      await rejectUser(user.id)
      setDone(true)
    })
  }

  if (done) return null

  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-amber-50/60 hover:bg-amber-50 transition-colors border-b border-amber-100 last:border-0">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-extrabold text-amber-600">
          {(user.full_name ?? user.email ?? '?').charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{user.full_name || '—'}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
        {user.whatsapp && (
          <p className="text-xs text-gray-400">{user.whatsapp}</p>
        )}
      </div>

      {/* Data de cadastro */}
      <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
        {new Date(user.created_at).toLocaleDateString('pt-BR')}
      </span>

      {/* Seletor de role */}
      <select
        value={role}
        onChange={e => setRole(e.target.value as Role)}
        disabled={isPending}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold text-gray-700 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20 transition-colors cursor-pointer disabled:opacity-60 flex-shrink-0"
      >
        {ROLES.map(r => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>

      {/* Botões */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000FFF] text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          Aprovar
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 border border-red-100"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Rejeitar
        </button>
      </div>
    </div>
  )
}

export default function PendingApprovalList({ users }: { users: PendingUser[] }) {
  if (users.length === 0) return null

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h2 className="text-base font-black text-gray-900">Aguardando Aprovação</h2>
        </div>
        <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full">
          {users.length} {users.length === 1 ? 'pendente' : 'pendentes'}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
        {/* Cabeçalho da tabela */}
        <div className="hidden sm:grid grid-cols-[2.5fr_1.5fr_120px_140px_180px] gap-4 px-5 py-3 bg-amber-50 text-xs font-bold text-amber-700 uppercase tracking-wider border-b border-amber-100">
          <span>Usuário</span>
          <span>Cadastro</span>
          <span>Perfil</span>
          <span></span>
          <span>Ação</span>
        </div>

        <div>
          {users.map(user => (
            <ApproveRow key={user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  )
}
