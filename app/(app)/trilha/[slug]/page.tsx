import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CardViewer from '@/components/card-viewer'

interface Props {
  params: { slug: string }
}

export default async function ModulePage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  // Busca módulo pelo slug
  const { data: mod } = await supabase
    .from('modules')
    .select('id, slug, title, order_index')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!mod) notFound()

  // Busca cards publicados e progresso em paralelo
  const [{ data: cards }, { data: progress }, { data: allModules }] =
    await Promise.all([
      supabase
        .from('cards')
        .select('id, title, scenario, challenge, explanation, action_hint, order_index, video_url, pdf_url, pdf_name')
        .eq('module_id', mod.id)
        .eq('published', true)
        .order('order_index'),
      supabase
        .from('user_progress')
        .select('cards_seen, completed')
        .eq('user_id', user.id)
        .eq('module_id', mod.id)
        .single(),
      supabase
        .from('modules')
        .select('slug, order_index')
        .eq('published', true)
        .order('order_index'),
    ])

  const nextModule = (allModules ?? []).find(
    (m) => m.order_index === mod.order_index + 1
  )

  return (
    <div className="p-8">
      <CardViewer
        moduleId={mod.id}
        moduleTitle={mod.title}
        cards={cards ?? []}
        initialCardsSeen={progress?.cards_seen ?? 0}
        backHref="/trilha"
        nextModuleSlug={nextModule?.slug ?? null}
      />
    </div>
  )
}
