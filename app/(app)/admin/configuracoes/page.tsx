import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RefTable from './RefTable'
import {
  createPerfil, updatePerfil, togglePerfil, reorderPerfis,
  createRegiao, updateRegiao, toggleRegiao, reorderRegioes,
} from './actions'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role ?? '')) redirect('/trilha')

  const [{ data: perfis }, { data: regioes }] = await Promise.all([
    supabase
      .from('perfis_consultor')
      .select('id, slug, nome, descricao, ordem, ativo')
      .order('ordem'),
    supabase
      .from('regioes_geograficas')
      .select('id, slug, nome, descricao, ordem, ativo')
      .order('ordem'),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <a href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Configurações</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gerencie perfis e regiões geográficas da plataforma</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <RefTable
          title="Perfis de Consultor"
          subtitle="Aparecem no cadastro e na aprovação de novos usuários"
          rows={perfis ?? []}
          onCreate={createPerfil}
          onUpdate={updatePerfil}
          onToggle={togglePerfil}
          onReorder={reorderPerfis}
        />

        <RefTable
          title="Regiões Geográficas"
          subtitle="Aparecem no cadastro e nos filtros do painel admin"
          rows={regioes ?? []}
          onCreate={createRegiao}
          onUpdate={updateRegiao}
          onToggle={toggleRegiao}
          onReorder={reorderRegioes}
        />
      </div>
    </div>
  )
}
