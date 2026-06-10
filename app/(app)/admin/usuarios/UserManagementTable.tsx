'use client'

import { useState, useTransition } from 'react'
import { updateUserRole, updateUserPhone, resendAccessEmail } from './actions'
import type { UserProfile } from './types'

const ROLES = ['consultor', 'gerencial', 'builder', 'admin'] as const
type Role = typeof ROLES[number]

const ROLE_LABELS: Record<Role, string> = {
  consultor: 'Consultor',
  gerencial: 'Gerencial',
  builder: 'Builder',
  admin: 'Admin',
}

function RoleCell({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(currentRole)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    setValue(newRole)
    startTransition(async () => {
      await updateUserRole(userId, newRole)
    })
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold text-gray-700 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20 transition-colors cursor-pointer disabled:opacity-60"
    >
      {ROLES.map(r => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </select>
  )
}

function PhoneCell({ userId, currentPhone }: { userId: string; currentPhone: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(currentPhone ?? '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    startTransition(async () => {
      await updateUserPhone(userId, value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-1">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="(11) 99999-9999"
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-32 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20 transition-colors"
        onKeyDown={e => e.key === 'Enter' && handleSave()}
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="text-[10px] bg-[#000FFF]/10 text-[#000FFF] px-2 py-1.5 rounded-lg font-bold hover:bg-[#000FFF]/20 transition-colors disabled:opacity-60"
      >
        {saved ? '✓' : isPending ? '...' : 'Salvar'}
      </button>
    </div>
  )
}

function ResendEmailButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')

  const handleResend = () => {
    startTransition(async () => {
      try {
        await resendAccessEmail(userId)
        setStatus('sent')
        setTimeout(() => setStatus('idle'), 3000)
      } catch {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    })
  }

  return (
    <button
      onClick={handleResend}
      disabled={isPending || status === 'sent'}
      title="Reenviar e-mail de acesso"
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-colors disabled:opacity-60
        ${status === 'sent' ? 'bg-green-50 text-green-600 border-green-100' :
          status === 'error' ? 'bg-red-50 text-red-500 border-red-100' :
          'bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-[#000FFF] hover:border-blue-100'}`}
    >
      {isPending ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : status === 'sent' ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      )}
      {status === 'sent' ? 'Enviado!' : status === 'error' ? 'Erro' : 'Reenviar acesso'}
    </button>
  )
}

export default function UserManagementTable({ users }: { users: UserProfile[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[2fr_2fr_130px_180px_110px_140px] gap-4 px-6 py-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
        <span>Nome</span>
        <span>E-mail</span>
        <span>Perfil</span>
        <span>Telefone (WhatsApp)</span>
        <span>Cadastro</span>
        <span>Ação</span>
      </div>

      <div className="divide-y divide-gray-50">
        {users.map(profile => {
          const role = (ROLES.includes(profile.role as Role) ? profile.role : 'consultor') as Role
          const phone = profile.phone ?? profile.whatsapp
          return (
            <div
              key={profile.id}
              className="grid md:grid-cols-[2fr_2fr_130px_180px_110px_140px] gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors"
            >
              {/* Nome */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#000FFF]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-extrabold text-[#000FFF]">
                    {(profile.full_name ?? profile.email ?? '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {profile.full_name ?? '—'}
                </span>
              </div>

              {/* Email */}
              <span className="text-xs text-gray-500 truncate">{profile.email ?? '—'}</span>

              {/* Role */}
              <RoleCell userId={profile.id} currentRole={role} />

              {/* Phone */}
              <PhoneCell userId={profile.id} currentPhone={phone ?? null} />

              {/* Created at */}
              <span className="text-xs text-gray-400">
                {new Date(profile.created_at).toLocaleDateString('pt-BR')}
              </span>

              {/* Reenviar acesso */}
              <ResendEmailButton userId={profile.id} />
            </div>
          )
        })}
      </div>

      {users.length === 0 && (
        <div className="py-16 text-center text-gray-400 text-sm">
          Nenhum usuário cadastrado ainda.
        </div>
      )}
    </div>
  )
}
