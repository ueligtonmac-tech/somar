'use client'

import { useState, useTransition, useMemo } from 'react'
import { updateUserRole, updateUserPhone, resendAccessEmail } from './actions'
import type { UserProfile, RefItem } from './types'

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

export default function UserManagementTable({ users, perfis, regioes }: {
  users: UserProfile[]
  perfis: RefItem[]
  regioes: RefItem[]
}) {
  const [search, setSearch] = useState('')
  const [filterRegiao, setFilterRegiao] = useState('')
  const [filterPerfil, setFilterPerfil] = useState('')

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        (u.full_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.cidade ?? '').toLowerCase().includes(q)
      const matchRegiao = !filterRegiao || u.regiao === filterRegiao
      const matchPerfil = !filterPerfil || u.perfil === filterPerfil
      return matchSearch && matchRegiao && matchPerfil
    })
  }, [users, search, filterRegiao, filterPerfil])

  const hasFilters = search || filterRegiao || filterPerfil
  const selectCls = "text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20 transition-colors cursor-pointer"

  return (
    <div className="space-y-3">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Busca */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cidade…"
            className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-2 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#000FFF] focus:ring-1 focus:ring-[#000FFF]/20 transition-colors"
          />
        </div>

        {/* Filtro região */}
        <select value={filterRegiao} onChange={e => setFilterRegiao(e.target.value)} className={selectCls}>
          <option value="">Todas as regiões</option>
          {regioes.map(r => <option key={r.slug} value={r.slug}>{r.nome}</option>)}
        </select>

        {/* Filtro perfil */}
        <select value={filterPerfil} onChange={e => setFilterPerfil(e.target.value)} className={selectCls}>
          <option value="">Todos os perfis</option>
          {perfis.map(p => <option key={p.slug} value={p.slug}>{p.nome}</option>)}
        </select>

        {/* Contador + limpar */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400 font-medium">
            {hasFilters ? (
              <>{filtered.length} de {users.length}</>
            ) : (
              <>{users.length} usuário{users.length !== 1 ? 's' : ''}</>
            )}
          </span>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setFilterRegiao(''); setFilterPerfil('') }}
              className="text-[10px] text-[#000FFF] font-bold hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_2fr_130px_130px_160px_100px_130px] gap-3 px-6 py-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <span>Nome</span>
          <span>E-mail</span>
          <span>Perfil</span>
          <span>Região</span>
          <span>Telefone</span>
          <span>Cadastro</span>
          <span>Ação</span>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map(profile => {
            const role = (ROLES.includes(profile.role as Role) ? profile.role : 'consultor') as Role
            const phone = profile.whatsapp
            const perfilNome = perfis.find(p => p.slug === profile.perfil)?.nome
            const regiaoNome = regioes.find(r => r.slug === profile.regiao)?.nome
            return (
              <div
                key={profile.id}
                className="grid md:grid-cols-[2fr_2fr_130px_130px_160px_100px_130px] gap-3 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors"
              >
                {/* Nome */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#000FFF]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-extrabold text-[#000FFF]">
                      {(profile.full_name ?? profile.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name ?? '—'}</p>
                    {profile.funcao && <p className="text-[10px] text-gray-400 truncate">{profile.funcao}</p>}
                  </div>
                </div>

                {/* Email */}
                <span className="text-xs text-gray-500 truncate">{profile.email ?? '—'}</span>

                {/* Perfil */}
                <div>
                  {perfilNome ? (
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-full">{perfilNome}</span>
                  ) : (
                    <RoleCell userId={profile.id} currentRole={role} />
                  )}
                </div>

                {/* Região */}
                <span className="text-xs text-gray-500 truncate">{regiaoNome ?? '—'}</span>

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

        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">
            {hasFilters ? 'Nenhum usuário encontrado com esses filtros.' : 'Nenhum usuário cadastrado ainda.'}
          </div>
        )}
      </div>
    </div>
  )
}
