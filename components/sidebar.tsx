'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Module {
  id: string
  slug: string
  title: string
  order_index: number
}

interface Progress {
  module_id: string
  completed: boolean
  cards_seen: number
}

interface Profile {
  full_name: string | null
  email: string
  role: string
}

interface SidebarProps {
  profile: Profile
  modules: Module[]
  progress: Progress[]
}

export default function Sidebar({ profile, modules, progress }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const progressMap = new Map(progress.map((p) => [p.module_id, p]))
  const completedCount = progress.filter((p) => p.completed).length
  const totalCount = modules.length
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = profile.full_name ?? profile.email
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">

      {/* ── Header ── */}
      <div className="bg-[#000FFF] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 flex-shrink-0">
            <Image src="/ug-icon.jpg" alt="Ultragaz" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white font-extrabold text-sm leading-tight">ultragaz</p>
            <p className="text-blue-200 text-xs font-medium">HUB Somar</p>
          </div>
        </div>
      </div>

      {/* ── Usuário ── */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#000FFF]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[#000FFF] font-extrabold text-xs">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
          </div>
        </div>

        {/* Progresso geral */}
        {totalCount > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">Seu progresso</span>
              <span className="text-xs font-bold text-[#000FFF]">{completedCount}/{totalCount}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#000FFF] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Navegação ── */}
      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">
          Trilha
        </p>
        <ul className="space-y-0.5 px-2">
          {modules.map((mod) => {
            const prog = progressMap.get(mod.id)
            const isActive = pathname === `/trilha/${mod.slug}`
            const isCompleted = prog?.completed ?? false
            const inProgress = (prog?.cards_seen ?? 0) > 0 && !isCompleted

            return (
              <li key={mod.id}>
                <Link
                  href={`/trilha/${mod.slug}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                    isActive
                      ? 'bg-[#000FFF] text-white font-bold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
                      isCompleted
                        ? 'bg-[#000FFF] border-[#000FFF] text-white'
                        : isActive
                        ? 'border-white text-white bg-white/20'
                        : inProgress
                        ? 'border-[#000FFF] text-[#000FFF] bg-blue-50'
                        : 'border-gray-200 text-gray-400 bg-white'
                    }`}
                  >
                    {isCompleted ? '✓' : mod.order_index}
                  </span>
                  <span className="truncate leading-snug">{mod.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Chat IA */}
        <div className="mt-4 px-2">
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">
            Assistente
          </p>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 cursor-not-allowed opacity-50">
            <ChatIcon />
            <span className="font-medium">Chat IA</span>
            <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold">
              Em breve
            </span>
          </div>
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-1">
        {profile.role !== 'consultant' && (
          <Link
            href="/admin"
            className={`flex items-center gap-2 text-xs py-1.5 font-semibold transition-colors ${
              pathname.startsWith('/admin')
                ? 'text-[#000FFF]'
                : 'text-gray-400 hover:text-[#000FFF]'
            }`}
          >
            <SettingsIcon />
            Painel Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors py-1.5 w-full font-semibold"
        >
          <LogoutIcon />
          Sair
        </button>
      </div>
    </aside>
  )
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
