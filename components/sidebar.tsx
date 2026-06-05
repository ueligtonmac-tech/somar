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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = (profile.full_name ?? profile.email)
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-ug-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="bg-ug-blue px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ug-blue rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/20">
            <Image
              src="/ug-icon.jpg"
              alt="Ultragaz"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">HUB Somar</p>
            <p className="text-blue-200 text-xs">Canais Digitais</p>
          </div>
        </div>
      </div>

      {/* Usuário */}
      <div className="px-4 py-3 border-b border-ug-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ug-blue-light rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-ug-blue font-bold text-xs">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ug-gray-900 truncate">
              {profile.full_name ?? profile.email}
            </p>
            <p className="text-xs text-ug-gray-500 capitalize">{profile.role}</p>
          </div>
        </div>
      </div>

      {/* Progresso geral */}
      {totalCount > 0 && (
        <div className="px-4 py-3 border-b border-ug-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-ug-gray-500">Seu progresso</span>
            <span className="text-xs font-semibold text-ug-blue">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="h-1.5 bg-ug-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-ug-blue rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Navegação — Trilha */}
      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-4 text-xs font-semibold text-ug-gray-500 uppercase tracking-wider mb-2">
          Trilha
        </p>
        <ul className="space-y-0.5">
          {modules.map((mod) => {
            const prog = progressMap.get(mod.id)
            const isActive = pathname === `/trilha/${mod.slug}`
            const isCompleted = prog?.completed ?? false

            return (
              <li key={mod.id}>
                <Link
                  href={`/trilha/${mod.slug}`}
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-ug-blue-light text-ug-blue font-semibold'
                      : 'text-ug-gray-900 hover:bg-ug-gray-50'
                  }`}
                >
                  {/* Indicador de status */}
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      isCompleted
                        ? 'bg-ug-blue border-ug-blue text-white'
                        : isActive
                        ? 'border-ug-blue text-ug-blue bg-white'
                        : 'border-ug-gray-100 text-ug-gray-500 bg-white'
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

        {/* Chat IA — desabilitado na Etapa 2 */}
        <div className="mt-4 px-4">
          <p className="text-xs font-semibold text-ug-gray-500 uppercase tracking-wider mb-2">
            Assistente
          </p>
          <div className="flex items-center gap-3 px-0 py-2 text-sm text-ug-gray-500 cursor-not-allowed opacity-50">
            <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-ug-gray-100 flex items-center justify-center">
              <ChatIcon />
            </span>
            <span>Chat IA</span>
            <span className="ml-auto text-xs bg-ug-gray-100 text-ug-gray-500 px-1.5 py-0.5 rounded">
              Em breve
            </span>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-ug-gray-100 px-4 py-3 space-y-1">
        {profile.role !== 'consultant' && (
          <Link
            href="/admin"
            className={`flex items-center gap-2 text-xs py-1.5 transition-colors ${
              pathname.startsWith('/admin')
                ? 'text-ug-blue font-semibold'
                : 'text-ug-gray-500 hover:text-ug-blue'
            }`}
          >
            <SettingsIcon />
            Painel Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-ug-gray-500 hover:text-red-500 transition-colors py-1.5 w-full"
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
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
