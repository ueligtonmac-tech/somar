import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import WelcomeVideoPopup from '@/components/WelcomeVideoPopup'

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

  const progressMap = new Map((progress ?? []).map((p) => [p.module_id, p]))
  const completedCount = (progress ?? []).filter((p) => p.completed).length
  const totalCount = modules?.length ?? 0
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="p-8">
      <WelcomeVideoPopup />
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Trilha de Onboarding</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            Canais Digitais Ultragaz · {completedCount} de {totalCount} módulos concluídos
          </p>
          {totalCount > 0 && (
            <div className="mt-4 flex items-center gap-3 max-w-xs">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#000FFF] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#000FFF] tabular-nums">
                {Math.round(progressPct)}%
              </span>
            </div>
          )}
        </div>

        {/* Lista de módulos */}
        <div className="space-y-3">
          {(modules ?? []).map((mod) => {
            const prog = progressMap.get(mod.id)
            const isCompleted = prog?.completed ?? false
            const inProgress = (prog?.cards_seen ?? 0) > 0 && !isCompleted

            return (
              <Link
                key={mod.id}
                href={`/trilha/${mod.slug}`}
                className={`flex items-center gap-5 bg-white rounded-2xl p-5 transition-all duration-200 group border-2 ${
                  isCompleted
                    ? 'border-[#000FFF]/20 hover:border-[#000FFF]/40'
                    : 'border-gray-100 hover:border-[#000FFF]'
                } shadow-sm hover:shadow-md`}
              >
                {/* Indicador */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all ${
                    isCompleted
                      ? 'bg-[#000FFF] text-white'
                      : inProgress
                      ? 'bg-[#000FFF]/10 text-[#000FFF] border-2 border-[#000FFF]/30'
                      : 'bg-gray-50 text-gray-400 border-2 border-gray-100 group-hover:border-[#000FFF] group-hover:text-[#000FFF] group-hover:bg-blue-50'
                  }`}
                >
                  {isCompleted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    `M${mod.order_index}`
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate transition-colors ${
                    isCompleted ? 'text-gray-600' : 'text-gray-900 group-hover:text-[#000FFF]'
                  }`}>
                    {mod.title}
                  </p>
                  {mod.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{mod.description}</p>
                  )}
                </div>

                {/* Badge */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <span className="text-xs font-bold text-[#000FFF] bg-[#000FFF]/10 px-3 py-1 rounded-full">
                      Concluído
                    </span>
                  ) : inProgress ? (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      Em andamento
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-[#000FFF] transition-colors">
                      Iniciar →
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {totalCount === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Nenhum módulo publicado ainda.</p>
          </div>
        )}

        {/* Certificado — aparece quando toda a trilha é concluída */}
        {totalCount > 0 && completedCount >= totalCount && (
          <div className="mt-8 bg-gradient-to-br from-[#000FFF] to-blue-700 rounded-2xl p-6 text-white text-center shadow-lg">
            <div className="text-4xl mb-3">🎓</div>
            <h2 className="text-xl font-black mb-1">Parabéns! Trilha concluída!</h2>
            <p className="text-blue-200 text-sm mb-4">
              Você completou todos os {totalCount} módulos da trilha de onboarding.
            </p>
            <Link
              href="/trilha/certificado"
              className="inline-flex items-center gap-2 bg-white text-[#000FFF] font-black px-6 py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-md"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              Gerar meu certificado PDF
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
