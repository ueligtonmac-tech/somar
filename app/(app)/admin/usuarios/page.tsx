import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementTable from './UserManagementTable'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: me } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!me || !['admin', 'builder'].includes(me.role ?? '')) redirect('/trilha')

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, phone, whatsapp, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[usuarios] profiles query error:', error)
    }

    const users = (profiles ?? []).map(p => ({
      id: p.id as string,
      full_name: (p.full_name ?? null) as string | null,
      email: (p.email ?? null) as string | null,
      role: (p.role ?? 'consultor') as string,
      phone: (p.phone ?? null) as string | null,
      whatsapp: (p.whatsapp ?? null) as string | null,
      created_at: p.created_at as string,
    }))

    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </a>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Gestão de Usuários</h1>
              <p className="text-gray-400 text-sm mt-0.5">Perfis, funções e contatos dos consultores</p>
            </div>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full font-semibold">
            {users.length} usuários
          </span>
        </div>
        <UserManagementTable users={users} />
      </div>
    )
  } catch (err) {
    console.error('[usuarios] page error:', err)
    return (
      <div className="p-6 max-w-xl mx-auto mt-10 text-center">
        <p className="text-red-500 font-bold text-lg">Erro ao carregar a página</p>
        <p className="text-gray-400 text-sm mt-2">Verifique os logs do servidor para mais detalhes.</p>
      </div>
    )
  }
}
