import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserRow from './UserRow'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) redirect('/trilha')

  const [
    { data: profiles },
    { data: modules },
    { data: allProgress },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, active, whatsapp, created_at').order('created_at', { ascending: false }),
    supabase.from('modules').select('id, title, order_index').order('order_index'),
    supabase.from('user_progress').select('user_id, module_id, completed'),
  ])

  const totalUsers = profiles?.length ?? 0
  const activeUsers = profiles?.filter(p => p.active).length ?? 0
  const totalModules = modules?.length ?? 0
  const completions = allProgress?.filter(p => p.completed).length ?? 0

  // Progresso por usuário
  const progressByUser = new Map<string, number>()
  allProgress?.forEach(p => {
    if (p.completed) {
      progressByUser.set(p.user_id, (progressByUser.get(p.user_id) ?? 0) + 1)
    }
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Painel Admin</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gestão de usuários e conteúdo</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/biblioteca"
            className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[#000FFF] hover:text-[#000FFF] transition-colors"
          >
            📚 Biblioteca
          </Link>
          <Link
            href="/admin/bot"
            className="flex items-center gap-2 bg-white border-2 border-[#000FFF] text-[#000FFF] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
          >
            🤖 Bot João
          </Link>
          <Link
            href="/admin/usuarios"
            className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[#000FFF] hover:text-[#000FFF] transition-colors"
          >
            👤 Usuários
          </Link>
          <Link
            href="/admin/configuracoes"
            className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[#000FFF] hover:text-[#000FFF] transition-colors"
          >
            ⚙️ Configurações
          </Link>
          <Link
            href="/admin/cards"
            className="flex items-center gap-2 bg-[#000FFF] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar Cards
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total de usuários', value: totalUsers, color: '#000FFF', icon: '👥' },
          { label: 'Usuários ativos', value: activeUsers, color: '#22c55e', icon: '✅' },
          { label: 'Módulos na trilha', value: totalModules, color: '#f59e0b', icon: '📚' },
          { label: 'Módulos concluídos', value: completions, color: '#8b5cf6', icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela de usuários */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900">Consultores</h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full font-semibold">{totalUsers} usuários</span>
        </div>

        {/* Header da tabela — desktop */}
        <div className="hidden md:grid grid-cols-[1fr_1fr_120px_100px_80px_80px] gap-4 px-6 py-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <span>Nome</span>
          <span>E-mail</span>
          <span>WhatsApp</span>
          <span>Perfil</span>
          <span>Progresso</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-gray-50">
          {profiles?.map(profile => (
            <UserRow
              key={profile.id}
              profile={profile}
              completedModules={progressByUser.get(profile.id) ?? 0}
              totalModules={totalModules}
            />
          ))}
        </div>

        {(!profiles || profiles.length === 0) && (
          <div className="py-16 text-center text-gray-400 text-sm">
            Nenhum usuário cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  )
}
