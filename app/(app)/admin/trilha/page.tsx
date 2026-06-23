import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TrailAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: me } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) redirect('/trilha')

  const [{ data: blocks }, { data: sections }, { data: flashcards }, { data: quizQuestions }] = await Promise.all([
    service.from('trail_blocks').select('*').order('order_index'),
    service.from('trail_sections').select('id, block_id, title, order_index, points_value, video_url').order('order_index'),
    service.from('trail_flashcards').select('id, section_id'),
    service.from('trail_quiz_questions').select('id, section_id'),
  ])

  const flashMap = new Map<string, number>()
  flashcards?.forEach(f => flashMap.set(f.section_id, (flashMap.get(f.section_id) ?? 0) + 1))
  const quizMap = new Map<string, number>()
  quizQuestions?.forEach(q => quizMap.set(q.section_id, (quizMap.get(q.section_id) ?? 0) + 1))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Editor da Trilha</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gerencie seções, flashcards e quiz de cada bloco</p>
        </div>
      </div>

      <div className="space-y-6">
        {blocks?.map(block => {
          const blockSections = (sections ?? []).filter(s => s.block_id === block.id).sort((a, b) => a.order_index - b.order_index)
          return (
            <div key={block.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderLeft: `4px solid ${block.color}` }}>
                <span className="text-2xl">{block.icon}</span>
                <div>
                  <p className="font-black text-gray-900">{block.title}</p>
                  <p className="text-xs text-gray-400">{blockSections.length} seções</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {blockSections.map(section => (
                  <Link key={section.id} href={`/admin/trilha/${section.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{section.title}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">📇 {flashMap.get(section.id) ?? 0} flashcards</span>
                        <span className="text-xs text-gray-400">❓ {quizMap.get(section.id) ?? 0} questões</span>
                        {section.video_url && <span className="text-xs text-purple-500">🎬 vídeo</span>}
                        <span className="text-xs text-[#000FFF] font-bold">+{section.points_value} pts</span>
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-[#000FFF] transition-colors">›</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
