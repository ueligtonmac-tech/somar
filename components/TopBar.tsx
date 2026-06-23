import Link from 'next/link'
import UserMenu from './UserMenu'
import NotificationBell from './NotificationBell'

interface Profile {
  full_name: string | null
  email: string
  role: string
}

export default function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="hidden md:flex sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3 items-center justify-between gap-2">
      {/* Botão voltar ao site */}
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-bold text-[#000FFF] bg-[#000FFF]/8 hover:bg-[#000FFF]/15 px-4 py-2 rounded-xl transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Voltar ao site
      </Link>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu profile={profile} />
      </div>
    </header>
  )
}
