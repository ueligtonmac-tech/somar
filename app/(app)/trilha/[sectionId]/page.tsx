import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SectionClient from './SectionClient'

export default async function SectionPage({ params }: { params: { sectionId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { sectionId } = params

  // 1. Busca a seção primeiro (precisamos dos IDs para as outras queries)
  const { data: section } = await supabase
    .from('trail_sections')
    .select('*, trail_blocks(*)')
    .eq('id', sectionId)
    .single()

  if (!section) redirect('/trilha')

  // 2. Busca tudo em paralelo
  const libraryIds = (section.library_file_ids ?? []) as string[]

  const [
    { data: flashcards },
    { data: quizQuestions },
    { data: progress },
    { data: libraryFiles },
    { data: moduleCards },
  ] = await Promise.all([
    supabase
      .from('trail_flashcards')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index'),
    supabase
      .from('trail_quiz_questions')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index'),
    supabase
      .from('trail_user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('section_id', sectionId)
      .maybeSingle(),
    libraryIds.length > 0
      ? supabase.from('library_files').select('id, title, file_url').in('id', libraryIds)
      : Promise.resolve({ data: [] }),
    section.module_id
      ? supabase
          .from('cards')
          .select('title, scenario, challenge, explanation, action_hint')
          .eq('module_id', section.module_id)
          .order('order_index')
          .limit(3)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <SectionClient
      section={section}
      flashcards={flashcards ?? []}
      quizQuestions={quizQuestions ?? []}
      progress={progress ?? null}
      libraryFiles={libraryFiles ?? []}
      moduleCards={moduleCards ?? []}
      userId={user.id}
    />
  )
}
