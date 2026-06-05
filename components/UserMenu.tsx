'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  full_name: string | null
  email: string
  role: string
}

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  admin:      { label: 'Admin',     color: '#dc2626', bg: '#fef2f2' },
  builder:    { label: 'Builder',   color: '#7c3aed', bg: '#f5f3ff' },
  consultant: { label: 'Consultor', color: '#000FFF', bg: '#eff6ff' },
}

export default function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const displayName = profile.full_name ?? profile.email
  const initials = displayName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const role = roleLabels[profile.role] ?? roleLabels.consultant
  const isAdmin = ['admin', 'builder'].includes(profile.role)

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    })
  }

  const items = [
    {
      href: '/trilha',
      icon: <HomeIcon />,
      label: 'Minha Trilha',
      active: pathname === '/trilha',
    },
    {
      href: '/perfil',
      icon: <ProfileIcon />,
      label: 'Editar Perfil',
      active: pathname === '/perfil',
    },
    ...(isAdmin ? [{
      href: '/admin',
      icon: <AdminIcon />,
      label: 'Painel Admin',
      active: pathname.startsWith('/admin'),
      highlight: true,
    }] : []),
  ]

  return (
    <div ref={ref} className="relative">
      {/* Botão avatar */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:bg-gray-100 ${open ? 'bg-gray-100' : ''}`}
      >
        <div className="w-8 h-8 rounded-full bg-[#000FFF] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-extrabold text-xs">{initials}</span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-bold text-gray-900 leading-tight max-w-[120px] truncate">{displayName}</p>
          <p className="text-[10px] font-bold" style={{ color: role.color }}>{role.label}</p>
        </div>
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in">
          {/* Cabeçalho do dropdown */}
          <div className="px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#000FFF] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-extrabold text-sm">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{displayName}</p>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: role.color, background: role.bg }}>
                  {role.label}
                </span>
              </div>
            </div>
          </div>

          {/* Itens do menu */}
          <div className="py-1">
            {items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50 ${
                  item.active ? 'text-[#000FFF]' : 'text-gray-700'
                } ${item.highlight ? 'text-purple-600 hover:bg-purple-50' : ''}`}
              >
                <span className={item.active ? 'text-[#000FFF]' : item.highlight ? 'text-purple-500' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
                {item.active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#000FFF]" />
                )}
              </Link>
            ))}
          </div>

          {/* Separador + Sair */}
          <div className="border-t border-gray-50 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogoutIcon />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      className={`text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round"/>
    </svg>
  )
}
function HomeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function ProfileIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function AdminIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}
function LogoutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}
