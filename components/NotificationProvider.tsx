'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationContextValue {
  unreadCount: number
  decrementCount: () => void
  resetCount: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  decrementCount: () => {},
  resetCount: () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

interface NotificationProviderProps {
  children: React.ReactNode
  initialCount: number
  userId: string
}

export default function NotificationProvider({
  children,
  initialCount,
  userId,
}: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()

    // Inscrição Realtime: escuta INSERT e UPDATE na tabela notifications do usuário
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Nova notificação não lida chega em tempo real
          if (!payload.new?.read) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Notificação marcada como lida
          if (payload.new?.read && !payload.old?.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  function decrementCount() {
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  function resetCount() {
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, decrementCount, resetCount }}>
      {children}
    </NotificationContext.Provider>
  )
}
