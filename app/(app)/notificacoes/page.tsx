import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function markAllRead(userId: string) {
  'use server'
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  revalidatePath('/notificacoes')
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'escalation_answered') {
    return (
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    </div>
  )
}

export default async function NotificacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const unread = notifications?.filter(n => !n.read).length ?? 0

  // Mark all as read (server action bound with user id)
  const markRead = markAllRead.bind(null, user.id)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/trilha" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Notificações</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia!'}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <form action={markRead}>
            <button
              type="submit"
              className="text-sm text-[#000FFF] font-bold hover:underline transition-colors"
            >
              Marcar todas como lidas
            </button>
          </form>
        )}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <p className="text-gray-400 font-medium">Nenhuma notificação ainda</p>
          <p className="text-gray-300 text-sm mt-1">Você será notificado quando houver atualizações</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {notifications.map((notif) => {
            const href =
              notif.type === 'escalation_new' ? '/admin/bot?tab=escalations'
              : notif.type === 'escalation_answered' ? '/admin/bot?tab=escalations'
              : null

            const inner = (
              <>
                <NotifIcon type={notif.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${notif.read ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#000FFF] mt-1.5" />
                      )}
                      {href && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 whitespace-pre-line leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">
                    {new Date(notif.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </>
            )

            return href ? (
              <Link
                key={notif.id}
                href={href}
                className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-blue-50/60 ${
                  notif.read ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  notif.read ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                {inner}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
