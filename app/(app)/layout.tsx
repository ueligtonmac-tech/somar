import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import TopBar from '@/components/TopBar'
import BotJoao from '@/components/BotJoao'
import NotificationProvider from '@/components/NotificationProvider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: modules }, { data: progress }, { count: unreadCount }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single(),
      supabase
        .from('modules')
        .select('id, slug, title, order_index')
        .eq('published', true)
        .order('order_index'),
      supabase
        .from('user_progress')
        .select('module_id, completed, cards_seen')
        .eq('user_id', user.id),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
    ])

  const safeProfile = profile ?? { full_name: null, email: user.email ?? '', role: 'consultant' }
  const notifCount = unreadCount ?? 0

  return (
    <NotificationProvider initialCount={notifCount} userId={user.id}>
      <div className="flex h-screen bg-ug-gray-50 overflow-hidden">
        {/* Sidebar — oculta na impressão */}
        <div className="print:hidden">
          <Sidebar
            profile={safeProfile}
            modules={modules ?? []}
            progress={progress ?? []}
          />
        </div>
        {/* Coluna principal: TopBar (desktop) + conteúdo */}
        <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
          {/* TopBar — oculta na impressão */}
          <div className="print:hidden">
            <TopBar profile={safeProfile} />
          </div>
          {/* pt-14 = espaço para header mobile fixo | pb-16 = espaço para barra inferior mobile */}
          <main className="flex-1 overflow-auto pt-14 pb-16 md:pt-0 md:pb-0 print:overflow-visible print:p-0">{children}</main>
        </div>
        {/* Bot João desktop — chat flutuante */}
        <div className="hidden md:block print:hidden">
          <BotJoao mobile={false} />
        </div>
        {/* Bot João mobile — navega para /chat */}
        <div className="md:hidden print:hidden">
          <BotJoao mobile={true} />
        </div>
      </div>
    </NotificationProvider>
  )
}
