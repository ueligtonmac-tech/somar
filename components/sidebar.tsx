'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UserMenu from './UserMenu'

interface Module { id: string; slug: string; title: string; order_index: number }
interface Progress { module_id: string; completed: boolean; cards_seen: number }
interface Profile { full_name: string | null; email: string; role: string }
interface SidebarProps { profile: Profile; modules: Module[]; progress: Progress[]; unreadNotifications?: number }

export default function Sidebar({ profile, modules, progress, unreadNotifications = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const progressMap = new Map(progress.map((p) => [p.module_id, p]))
  const completedCount = progress.filter((p) => p.completed).length
  // Conta módulos iniciados (qualquer card visto) OU concluídos — reflete o avanço real
  const startedCount = progress.filter((p) => p.completed || (p.cards_seen ?? 0) > 0).length
  const totalCount = modules.length
  // Barra de progresso: módulos totalmente concluídos somados com metade dos iniciados
  const progressPct = totalCount > 0
    ? ((completedCount + (startedCount - completedCount) * 0.5) / totalCount) * 100
    : 0

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }


  const SidebarContent = ({ onNavigate }: { onNavigate?: (() => void) | undefined }) => (
    <aside className="w-64 flex-shrink-0 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#000FFF] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 flex-shrink-0">
            <Image src="/ug-icon.jpg" alt="Ultragaz" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-white font-extrabold text-sm leading-tight">ultragaz</p>
            <p className="text-blue-200 text-xs font-medium">Bot João</p>
          </div>
          {onNavigate && (
            <button onClick={onNavigate} className="md:hidden text-white/70 hover:text-white p-1">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Usuário — apenas progresso, sem nome redundante */}
      <div className="px-4 py-3 border-b border-gray-100">
        {totalCount > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 font-medium">Seu progresso</span>
              <span className="text-xs font-bold text-[#000FFF]">{startedCount}/{totalCount}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#000FFF] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Trilha</p>
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
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                    isActive ? 'bg-[#000FFF] text-white font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
                    isCompleted ? 'bg-[#000FFF] border-[#000FFF] text-white'
                    : isActive ? 'border-white text-white bg-white/20'
                    : inProgress ? 'border-[#000FFF] text-[#000FFF] bg-blue-50'
                    : 'border-gray-200 text-gray-400 bg-white'
                  }`}>
                    {isCompleted ? '✓' : mod.order_index}
                  </span>
                  <span className="truncate leading-snug">{mod.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 px-2 space-y-0.5">
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Recursos</p>
          <Link href="/biblioteca" onClick={onNavigate} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${pathname === '/biblioteca' ? 'bg-[#000FFF]/10 text-[#000FFF] font-bold' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}>
            <BibliotecaIcon />
            <span>Biblioteca</span>
          </Link>
          <Link href="/chat" onClick={onNavigate} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${pathname === '/chat' ? 'bg-[#000FFF]/10 text-[#000FFF] font-bold' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}>
            <ChatIcon />
            <span>Bot João</span>
            <span className="ml-auto text-[10px] bg-[#000FFF]/10 text-[#000FFF] px-2 py-0.5 rounded-full font-bold">IA</span>
          </Link>
          <Link href="/notificacoes" onClick={onNavigate} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${pathname === '/notificacoes' ? 'bg-[#000FFF]/10 text-[#000FFF] font-bold' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}>
            <BellIcon />
            <span>Notificações</span>
            {unreadNotifications > 0 && (
              <span className="ml-auto text-[10px] bg-[#000FFF] text-white px-2 py-0.5 rounded-full font-bold">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-1">
        {profile.role !== 'consultant' && (
          <Link href="/admin" onClick={onNavigate} className={`flex items-center gap-2 text-xs py-1.5 font-semibold transition-colors ${pathname.startsWith('/admin') ? 'text-[#000FFF]' : 'text-gray-400 hover:text-[#000FFF]'}`}>
            <SettingsIcon />{' '}Painel Admin
          </Link>
        )}
        <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors py-1.5 w-full font-semibold">
          <LogoutIcon />{' '}Sair
        </button>
        <div className="pt-2 border-t border-gray-50 mt-1">
          <p className="text-[10px] text-gray-300 font-medium">© 2026 Arkanjia</p>
          <div className="flex gap-3 mt-0.5">
            <Link href="/politica" className="text-[10px] text-gray-300 hover:text-[#000FFF] transition-colors">Privacidade</Link>
            <Link href="/termos" className="text-[10px] text-gray-300 hover:text-[#000FFF] transition-colors">Termos</Link>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex border-r border-gray-100 h-full">
        <SidebarContent />
      </div>

      {/* ── Mobile: header fixo no topo ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#000FFF] flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/25">
            <Image src="/ug-icon.jpg" alt="Ultragaz" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white font-extrabold text-sm leading-tight">Bot João</p>
            <p className="text-blue-200 text-[10px]">Ultragaz</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/10 rounded-xl">
            <UserMenu profile={profile} />
          </div>
          <button onClick={() => setMobileOpen(true)} className="text-white p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors">
            <HamburgerIcon />
          </button>
        </div>
      </div>

      {/* ── Mobile: overlay escuro ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: drawer lateral ── */}
      <div className={`md:hidden fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="relative h-full shadow-2xl">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* ── Mobile: barra inferior ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <Link href="/trilha" className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${pathname === '/trilha' ? 'text-[#000FFF]' : 'text-gray-400'}`}>
          <HomeIcon active={pathname === '/trilha'} />
          <span className="text-[10px] font-bold">Trilha</span>
        </Link>
        <Link href="/chat" className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${pathname === '/chat' ? 'text-[#000FFF]' : 'text-gray-400 hover:text-[#000FFF]'}`}>
          <ChatIcon />
          <span className="text-[10px] font-bold">Bot João</span>
        </Link>
        <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
          <LogoutIcon />
          <span className="text-[10px] font-bold">Sair</span>
        </button>
      </div>
    </>
  )
}

function HamburgerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function HomeIcon({ active }: { active: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#000FFF' : 'none'} stroke={active ? '#000FFF' : 'currentColor'} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function ChatIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function SettingsIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}
function LogoutIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}
function BibliotecaIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
}
function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
