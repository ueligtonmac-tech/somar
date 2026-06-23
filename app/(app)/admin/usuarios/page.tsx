import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import UserManagementTable from './UserManagementTable'
import PendingApprovalList from './PendingApprovalList'
import IncompleteList from './IncompleteList'
import { logger } from '@/lib/logger'

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  role: string
  perfil: string | null
  funcao: string | null
  cidade: string | null
  regiao: string | null
  whatsapp: string | null
  created_at: string
}

interface PendingRow {
  id: string
  full_name: string | null
  email: string | null
  whatsapp: string | null
  funcao: string | null
  cidade: string | null
  regiao: string | null
  created_at: string
  rejected_at?: string | null
}

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Service client bypassa RLS para consultas administrativas
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: me } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!me || !['admin', 'builder'].includes(me.role ?? '')) redirect('/trilha')

    // Busca usuários, pendentes e tabelas de referência em paralelo
    const [
      { data: activeProfiles, error: activeErr },
      { data: pendingProfiles, error: pendingErr },
      { data: incompleteProfiles },
      { data: rejectedProfiles },
      { data: perfisData },
      { data: regioesData },
    ] = await Promise.all([
      service
        .from('profiles')
        .select('id, full_name, email, role, perfil, funcao, cidade, regiao, whatsapp, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false }),
      service
        .from('profiles')
        .select('id, full_name, email, whatsapp, funcao, cidade, regiao, created_at')
        .eq('active', false)
        .eq('onboarding_complete', true)
        .is('rejected_at', null)
        .order('created_at', { ascending: false }),
      // Cadastros iniciados mas não concluídos (não completou onboarding)
      service
        .from('profiles')
        .select('id, full_name, email, whatsapp, funcao, cidade, regiao, created_at')
        .eq('active', false)
        .eq('onboarding_complete', false)
        .is('rejected_at', null)
        .order('created_at', { ascending: false }),
      // Cadastros rejeitados
      service
        .from('profiles')
        .select('id, full_name, email, created_at, rejected_at')
        .eq('active', false)
        .not('rejected_at', 'is', null)
        .order('rejected_at', { ascending: false }),
      service
        .from('perfis_consultor')
        .select('slug, nome')
        .eq('ativo', true)
        .order('ordem'),
      service
        .from('regioes_geograficas')
        .select('slug, nome')
        .eq('ativo', true)
        .order('ordem'),
    ])

    if (activeErr) logger.error('profiles query error', { context: 'admin/usuarios', error: activeErr })
    if (pendingErr) logger.error('pending profiles query error', { context: 'admin/usuarios', error: pendingErr })

    const incomplete = (incompleteProfiles ?? []).map(p => ({
      id: p.id,
      full_name: p.full_name ?? null,
      email: p.email ?? null,
      whatsapp: p.whatsapp ?? null,
      funcao: p.funcao ?? null,
      cidade: p.cidade ?? null,
      regiao: p.regiao ?? null,
      created_at: p.created_at,
    }))

    const rejected = (rejectedProfiles ?? []).map(p => ({
      id: p.id,
      full_name: p.full_name ?? null,
      email: p.email ?? null,
      created_at: p.created_at,
      rejected_at: p.rejected_at ?? null,
    }))

    const users = ((activeProfiles ?? []) as ProfileRow[]).map(p => ({
      id: p.id,
      full_name: p.full_name ?? null,
      email: p.email ?? null,
      role: p.role ?? 'consultant',
      perfil: p.perfil ?? null,
      funcao: p.funcao ?? null,
      cidade: p.cidade ?? null,
      regiao: p.regiao ?? null,
      whatsapp: p.whatsapp ?? null,
      created_at: p.created_at,
    }))

    const pending = ((pendingProfiles ?? []) as PendingRow[]).map(p => ({
      id: p.id,
      full_name: p.full_name ?? null,
      email: p.email ?? null,
      whatsapp: p.whatsapp ?? null,
      funcao: p.funcao ?? null,
      cidade: p.cidade ?? null,
      regiao: p.regiao ?? null,
      created_at: p.created_at,
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

        {/* Cadastros incompletos — com botão de liberar acesso */}
        <IncompleteList users={incomplete} />

        {/* Cadastros rejeitados */}
        {rejected.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <h2 className="text-base font-black text-gray-900">Rejeitados</h2>
              <span className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full">{rejected.length}</span>
            </div>
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              {rejected.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3 border-b border-red-50 last:border-0 hover:bg-red-50/30">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-400">{(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{u.full_name && u.full_name !== u.email ? u.full_name : '—'}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-red-400 flex-shrink-0">
                    Rejeitado em {new Date(u.rejected_at ?? u.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabela de usuários ativos */}
        {users.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-black text-gray-900">Usuários Ativos</h2>
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">
                {users.length}
              </span>
            </div>
            <UserManagementTable
              users={users}
              perfis={perfisData ?? []}
              regioes={regioesData ?? []}
            />
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
