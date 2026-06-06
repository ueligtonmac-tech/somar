import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CardEditor from './CardEditor'
import NewCardButton from './NewCardButton'
import NewModuleButton from './NewModuleButton'

export default async function CardsAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) redirect('/trilha')

  const [{ data: modules }, { data: cards }] = await Promise.all([
    supabase.from('modules').select('id, title, order_index').order('order_index'),
    supabase.from('cards').select('*').order('order_index'),
  ])

  const cardsByModule = new Map<string, NonNullable<typeof cards>>()
  modules?.forEach(m => cardsByModule.set(m.id, []))
  cards?.forEach(c => {
    const list = cardsByModule.get(c.module_id) ?? []
    list.push(c)
    cardsByModule.set(c.module_id, list)
  })

  const totalCards = cards?.length ?? 0
  const publishedCards = cards?.filter(c => c.published).length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900">Editor de Cards</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            <span className="text-[#000FFF] font-bold">{publishedCards}</span> publicados ·{' '}
            <span className="text-gray-500 font-bold">{totalCards - publishedCards}</span> rascunhos
          </p>
        </div>
      </div>

      {/* Legenda dos tipos */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { icon: '📝', label: 'Texto', color: 'bg-gray-50 text-gray-600' },
          { icon: '🎬', label: 'Vídeo (YouTube/Vimeo)', color: 'bg-purple-50 text-purple-600' },
          { icon: '📄', label: 'PDF para download', color: 'bg-blue-50 text-blue-600' },
          { icon: '🎬 PDF', label: 'Vídeo + PDF', color: 'bg-amber-50 text-amber-600' },
        ].map(t => (
          <div key={t.label} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${t.color}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Módulos */}
      <div className="space-y-6">
        {modules?.map(module => {
          const moduleCards = cardsByModule.get(module.id) ?? []
          const published = moduleCards.filter(c => c.published).length
          return (
            <div key={module.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header do módulo */}
              <div className="bg-[#000FFF] px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {module.order_index}
                  </span>
                  <h2 className="text-white font-bold flex-1">{module.title}</h2>
                  <div className="text-right">
                    <span className="text-blue-200 text-xs font-semibold">
                      {moduleCards.length} cards · {published} publicados
                    </span>
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="divide-y divide-gray-50">
                {moduleCards.map((card, idx) => (
                  <CardEditor
                    key={card.id}
                    card={card}
                    index={idx + 1}
                    moduleCardIds={moduleCards.map(c => c.id)}
                  />
                ))}
              </div>

              {/* Botão novo card */}
              <NewCardButton moduleId={module.id} nextIndex={moduleCards.length + 1} />
            </div>
          )
        })}
      </div>

      {/* Criar novo módulo */}
      <NewModuleButton nextIndex={(modules?.length ?? 0) + 1} />
    </div>
  )
}
