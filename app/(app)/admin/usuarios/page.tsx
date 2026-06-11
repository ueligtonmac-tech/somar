import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementTable from './UserManagementTable'
import PendingApprovalList from './PendingApprovalList'
import { logger } from '@/lib/logger'

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

    // Busca usuários, pendentes e tabelas de referência em paralelo
    const [
      { data: activeProfiles, error: activeErr },
      { data: pendingProfiles, error: pendingErr },
      { data: perfisData },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, phone, whatsapp, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, email, whatsapp, funcao, cidade, regiao, created_at')
        .eq('active', false)
        .eq('onboarding_complete', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('perfis_consultor')
        .select('slug, nome')
        .eq('ativo', true)
        .order('ordem'),
    ])

    if (activeErr) logger.error('profiles query error', { context: 'admin/usuarios', error: activeErr })
    if (pendingErr) logger.error('pending profiles query error', { context: 'admin/usuarios', error: pendingErr })

    const users = (activeProfiles ?? []).map(p => ({
      id: p.id as string,
      full_name: (p.full_name ?? null) as string | null,
      email: (p.email ?? null) as string | null,
      role: (p.role ?? 'consultant') as string,
      phone: (p.phone ?? null) as string | null,
      whatsapp: (p.whatsapp ?? null) as string | null,
      created_at: p.created_at as string,
    }))

    const pending = (pendingProfiles ?? []).map(p => ({
      id: p.id as string,
      full_name: (p.full_name ?? null) as string | null,
      email: (p.email ?? null) as string | null,
      whatsapp: (p.whatsapp ?? null) as string | null,
      funcao: ((p as any).funcao ?? null) as string | null,
      cidade: ((p as any).cidade ?? null) as string | null,
      regiao: ((p as any).regiao ?? null) as string | null,
      created_at: p.created_at as string,
    }))

    return (
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </a>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Gestão de Usuários</h1>
              <p className="text-gray-400 text-sm mt-0.5">Aprovações, perfis e contatos dos consultores</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-3 py-1.5 rounded-full border border-amber-200 animate-pulse">
                {pending.length} aguardando
              </span>
            )}
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full font-semibold">
              {users.length} ativos
            </span>
          </div>
        </div>

        {/* Seção de aprovações pendentes */}
        <PendingApprovalList users={pending} perfis={perfisData ?? []} />

        {/* Tabela de usuários ativos */}
        {users.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-black text-gray-900">Usuários Ativos</h2>
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">
                {users.length}
              </span>
            </div>
            <UserManagementTable users={users} />
          </>
        )}

        {users.length === 0 && pending.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
            <p className="text-gray-400 font-medium">Nenhum usuário cadastrado ainda.</p>
          </div>
        )}
      </div>
    )
  } catch (err) {
    logger.error('page error', { context: 'admin/usuarios', error: err })
    return (
      <div className="p-6 max-w-xl mx-auto mt-10 text-center">
        <p className="text-red-500 font-bold text-lg">Erro ao carregar a página</p>
        <p className="text-gray-400 text-sm mt-2">Verifique os logs do servidor para mais detalhes.</p>
      </div>
    )
  }
}
