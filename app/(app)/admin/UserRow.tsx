'use client'

import { useTransition, useState } from 'react'
import { toggleUserActive, changeUserRole } from './actions'

interface Profile {
  id: string
  full_name: string | null
  email: string
  role: string
  active: boolean
  whatsapp: string | null
  created_at: string
}

export default function UserRow({
  profile,
  completedModules,
  totalModules,
}: {
  profile: Profile
  completedModules: number
  totalModules: number
}) {
  const [pending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const initials = (profile.full_name ?? profile.email)
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  const pct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin:     { label: 'Admin',     color: '#dc2626' },
    builder:   { label: 'Builder',   color: '#7c3aed' },
    consultant:{ label: 'Consultor', color: '#000FFF' },
  }
  const roleInfo = roleLabels[profile.role] ?? roleLabels.consultant

  return (
    <div className={`px-4 md:px-6 py-4 transition-colors ${pending ? 'opacity-50' : ''}`}>
      {actionError && (
        <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold">
          ⚠️ {actionError}
        </div>
      )}
      {/* Mobile layout */}
      <div className="md:hidden flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#000FFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[#000FFF] font-extrabold text-xs">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-gray-900 truncate">{profile.full_name ?? '—'}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ color: roleInfo.color, background: `${roleInfo.color}15` }}>
              {roleInfo.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{profile.email}</p>
          {profile.whatsapp && <p className="text-xs text-gray-400">{profile.whatsapp}</p>}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#000FFF] rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-500">{completedModules}/{totalModules}</span>
            <button
              onClick={() => startTransition(async () => { try { await toggleUserActive(profile.id, !profile.active) } catch (e) { setActionError(e instanceof Error ? e.message : 'Erro'); setTimeout(() => setActionError(null), 4000) } })}
              className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
                profile.active
                  ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-600'
                  : 'bg-red-50 text-red-500 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              {profile.active ? 'Ativo' : 'Inativo'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-[1fr_1fr_120px_100px_80px_80px] gap-4 items-center">
        {/* Nome */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#000FFF]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[#000FFF] font-extrabold text-[10px]">{initials}</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 truncate">{profile.full_name ?? '—'}</span>
        </div>

        {/* Email */}
        <span className="text-sm text-gray-500 truncate">{profile.email}</span>

        {/* WhatsApp */}
        <span className="text-sm text-gray-400 truncate">{profile.whatsapp ?? '—'}</span>

        {/* Role */}
        <select
          value={profile.role}
          onChange={e => { const v = e.target.value; startTransition(async () => { try { await changeUserRole(profile.id, v) } catch (err) { setActionError(err instanceof Error ? err.message : 'Erro'); setTimeout(() => setActionError(null), 4000) } }) }}
          className="text-xs font-bold rounded-lg px-2 py-1.5 border border-gray-100 bg-gray-50 outline-none cursor-pointer"
          style={{ color: roleInfo.color }}
        >
          <option value="consultant">Consultor</option>
          <option value="builder">Builder</option>
          <option value="admin">Admin</option>
        </select>

        {/* Progresso */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#000FFF] rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-400 font-bold w-6 text-right">{pct}%</span>
        </div>

        {/* Toggle ativo */}
        <button
          onClick={() => startTransition(async () => { try { await toggleUserActive(profile.id, !profile.active) } catch (e) { setActionError(e instanceof Error ? e.message : 'Erro'); setTimeout(() => setActionError(null), 4000) } })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            profile.active ? 'bg-[#000FFF]' : 'bg-gray-200'
          }`}
          title={profile.active ? 'Clique para desativar' : 'Clique para ativar'}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            profile.active ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  )
}
