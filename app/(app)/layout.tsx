import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'

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

  const [{ data: profile }, { data: modules }, { data: progress }] =
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
    ])

  return (
    <div className="flex h-screen bg-ug-gray-50 overflow-hidden">
      <Sidebar
        profile={profile ?? { full_name: null, email: user.email ?? '', role: 'consultant' }}
        modules={modules ?? []}
        progress={progress ?? []}
      />
      {/* pt-14 = espaço para header mobile fixo | pb-16 = espaço para barra inferior mobile */}
      <main className="flex-1 overflow-auto pt-14 pb-16 md:pt-0 md:pb-0">{children}</main>
    </div>
  )
}
