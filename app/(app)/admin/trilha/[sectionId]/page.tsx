import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SectionEditor from './SectionEditor'

export default async function EditSectionPage({ params }: { params: { sectionId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) redirect('/trilha')

  const { sectionId } = params

  const [{ data: section }, { data: flashcards }, { data: quizQuestions }, { data: libraryFiles }] = await Promise.all([
    supabase.from('trail_sections').select('*, trail_blocks(title, color, icon)').eq('id', sectionId).single(),
    supabase.from('trail_flashcards').select('*').eq('section_id', sectionId).order('order_index'),
    supabase.from('trail_quiz_questions').select('*').eq('section_id', sectionId).order('order_index'),
    supabase.from('library_files').select('id, title').order('title'),
  ])

  if (!section) redirect('/admin/trilha')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/trilha" className="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-semibold">{(section.trail_blocks as { title: string } | null)?.title}</p>
          <h1 className="text-xl font-black text-gray-900">{section.title}</h1>
        </div>
      </div>
      <SectionEditor
        section={section}
        flashcards={flashcards ?? []}
        quizQuestions={quizQuestions ?? []}
        libraryFiles={libraryFiles ?? []}
      />
    </div>
  )
}
