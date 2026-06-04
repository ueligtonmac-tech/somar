import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TrilhaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: modules }, { data: progress }] = await Promise.all([
    supabase
      .from('modules')
      .select('id, slug, title, description, order_index')
      .eq('published', true)
      .order('order_index'),
    supabase
      .from('user_progress')
      .select('module_id, completed, cards_seen')
      .eq('user_id', user.id),
  ])

  const progressMap = new Map(
    (progress ?? []).map((p) => [p.module_id, p])
  )

  const completedCount = (progress ?? []).filter((p) => p.completed).length
  const totalCount = modules?.length ?? 0

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ug-gray-900">Trilha de Onboarding</h1>
          <p className="text-sm text-ug-gray-500 mt-1">
            Canais Digitais Ultragaz · {completedCount} de {totalCount} módulos concluídos
          </p>
          {totalCount > 0 && (
            <div className="mt-3 h-2 bg-ug-gray-100 rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-ug-blue rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Módulos */}
        <div className="space-y-3">
          {(modules ?? []).map((mod) => {
            const prog = progressMap.get(mod.id)
            const isCompleted = prog?.completed ?? false
            const inProgress = (prog?.cards_seen ?? 0) > 0 && !isCompleted

            return (
              <Link
                key={mod.id}
                href={`/trilha/${mod.slug}`}
                className="flex items-center gap-5 bg-white border-2 border-ug-gray-100 hover:border-ug-blue rounded-xl p-5 transition-all duration-200 group"
              >
                {/* Número / check */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                    isCompleted
                      ? 'bg-ug-blue border-ug-blue text-white'
                      : inProgress
                      ? 'border-ug-blue text-ug-blue bg-ug-blue-light'
                      : 'border-ug-gray-100 text-ug-gray-500 bg-white group-hover:border-ug-blue group-hover:text-ug-blue'
                  }`}
                >
                  {isCompleted ? '✓' : `M${mod.order_index}`}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ug-gray-900 group-hover:text-ug-blue transition-colors truncate">
                    {mod.title}
                  </p>
                  {mod.description && (
                    <p className="text-xs text-ug-gray-500 mt-0.5 truncate">{mod.description}</p>
                  )}
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <span className="text-xs font-semibold text-ug-blue bg-ug-blue-light px-2 py-1 rounded">
                      Concluído
                    </span>
                  ) : inProgress ? (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Em andamento
                    </span>
                  ) : (
                    <span className="text-xs text-ug-gray-500 group-hover:text-ug-blue transition-colors">
                      Iniciar →
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {totalCount === 0 && (
          <div className="text-center py-16 text-ug-gray-500">
            <p className="text-sm">Nenhum módulo publicado ainda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
