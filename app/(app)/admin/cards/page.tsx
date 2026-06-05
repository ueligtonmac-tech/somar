import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CardEditor from './CardEditor'

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

  const cardsByModule = new Map<string, typeof cards>()
  modules?.forEach(m => cardsByModule.set(m.id, []))
  cards?.forEach(c => {
    const list = cardsByModule.get(c.module_id) ?? []
    list.push(c)
    cardsByModule.set(c.module_id, list)
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Editor de Cards</h1>
          <p className="text-gray-400 text-sm mt-0.5">Clique em qualquer campo para editar</p>
        </div>
      </div>

      <div className="space-y-8">
        {modules?.map(module => (
          <div key={module.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#000FFF] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">
                  {module.order_index}
                </span>
                <h2 className="text-white font-bold">{module.title}</h2>
                <span className="ml-auto text-blue-200 text-xs font-semibold">
                  {cardsByModule.get(module.id)?.length ?? 0} cards
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {cardsByModule.get(module.id)?.map((card, idx) => (
                <CardEditor key={card.id} card={card} index={idx + 1} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
