'use client'

import Link from 'next/link'

interface NotificationBellProps {
  count: number
}

export default function NotificationBell({ count }: NotificationBellProps) {
  return (
    <Link
      href="/notificacoes"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-[#000FFF] hover:bg-blue-50 transition-colors"
      title="Notificações"
    >
      <BellIcon />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#000FFF] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
