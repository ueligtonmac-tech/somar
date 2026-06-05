'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  full_name: string | null
  email: string
  role: string
  whatsapp: string | null
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin:      { label: 'Admin',     color: '#dc2626' },
  builder:    { label: 'Builder',   color: '#7c3aed' },
  consultant: { label: 'Consultor', color: '#000FFF' },
}

export default function ProfileForm({ userId, profile }: { userId: string; profile: Profile }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const role = roleLabels[profile.role] ?? roleLabels.consultant
  const initials = (profile.full_name ?? profile.email).split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase
        .from('profiles')
        .update({ full_name: fullName, whatsapp, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (err) { setError(err.message); return }
      setSaved(true)
      setTimeout(() => { setSaved(false); router.refresh() }, 2000)
    })
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#000FFF] flex items-center justify-center">
            <span className="text-white font-black text-xl">{initials}</span>
          </div>
          <div>
            <p className="font-black text-gray-900 text-lg">{profile.full_name || profile.email}</p>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: role.color, background: `${role.color}15` }}>
              {role.label}
            </span>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome completo</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-[#000FFF] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">E-mail</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full border-2 border-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1.5">O e-mail não pode ser alterado aqui.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">WhatsApp</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="(65) 99999-9999"
            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-[#000FFF] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Perfil de acesso</label>
          <div className="border-2 border-gray-50 rounded-xl px-4 py-3 text-sm bg-gray-50 flex items-center gap-2">
            <span className="font-bold" style={{ color: role.color }}>{role.label}</span>
            <span className="text-gray-400 text-xs">— definido pelo administrador</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-[#000FFF] text-white hover:bg-blue-700 disabled:opacity-60'
          }`}
        >
          {saved ? '✓ Perfil atualizado!' : pending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      {/* Segurança */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Segurança</h3>
        <a
          href="/esqueci-senha"
          className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#000FFF] transition-colors font-semibold"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Alterar senha
        </a>
      </div>
    </div>
  )
}
