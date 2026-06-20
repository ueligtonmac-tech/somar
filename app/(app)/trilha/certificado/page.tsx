import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrintButton from './PrintButton'

export default async function CertificadoPage({
  searchParams,
}: {
  searchParams: { preview?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: progress }, { data: me }] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
    supabase.from('trail_user_progress').select('quiz_passed, points_earned, completed_at').eq('user_id', user.id),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  const isAdmin = ['admin', 'builder'].includes(me?.role ?? '')
  const isPreview = searchParams.preview === '1' && isAdmin

  const { count: totalSections } = await supabase.from('trail_sections').select('*', { count: 'exact', head: true })
  const doneSections = (progress ?? []).filter(p => p.quiz_passed).length
  const totalPoints = (progress ?? []).reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const completed = isPreview || doneSections >= (totalSections ?? 999)

  const name = profile?.full_name ?? profile?.email ?? 'Consultor'
  const completedAt = progress?.find(p => p.completed_at)?.completed_at
    ? new Date(progress!.find(p => p.completed_at)!.completed_at!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  if (!completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-xl font-black text-gray-900 mb-2">Trilha incompleta</h1>
          <p className="text-gray-400 text-sm mb-6">Conclua todas as {totalSections} seções da trilha para gerar seu certificado. Você completou {doneSections} até agora.</p>
          <a href="/trilha" className="inline-block px-6 py-3 bg-[#000FFF] text-white font-bold rounded-xl text-sm">Voltar à trilha</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 print:bg-white print:p-0">
      {isPreview && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold print:hidden">
          👁️ Modo pré-visualização — os dados são do seu perfil. O consultor verá os dados dele.
        </div>
      )}
      <div className="mb-6 flex gap-3 print:hidden">
        <a href="/trilha" className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">← Voltar à trilha</a>
        <PrintButton />
      </div>

      {/* Certificado */}
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-xl border-4 border-[#000FFF] p-12 text-center print:shadow-none print:border-4 print:rounded-none">
        <div className="flex justify-center mb-6">
          <img src="/ug-icon.jpg" alt="Ultragaz" className="w-20 h-20 rounded-full" />
        </div>
        <p className="text-xs font-black text-[#000FFF] uppercase tracking-[0.3em] mb-2">Certificado de Conclusão</p>
        <h1 className="text-4xl font-black text-gray-900 mb-1">Trilha de Capacitação</h1>
        <p className="text-lg text-[#000FFF] font-bold mb-8">Bot João — Ultragaz</p>

        <p className="text-gray-500 text-sm mb-2">Este certificado é conferido a</p>
        <p className="text-3xl font-black text-gray-900 mb-2">{name}</p>
        <p className="text-gray-400 text-sm mb-8">por concluir com êxito a trilha completa de capacitação em Canais Digitais Ultragaz, acumulando <strong className="text-[#000FFF]">{totalPoints} pontos</strong>.</p>

        <div className="flex justify-center gap-12 mb-8">
          <div>
            <p className="text-3xl font-black text-[#000FFF]">{doneSections}</p>
            <p className="text-xs text-gray-400 font-semibold">seções concluídas</p>
          </div>
          <div>
            <p className="text-3xl font-black text-[#000FFF]">{totalPoints}</p>
            <p className="text-xs text-gray-400 font-semibold">pontos conquistados</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500">{completedAt}</p>
          <p className="text-xs text-gray-300 mt-1">Arkanjia · botjoao.com.br</p>
        </div>
      </div>
    </div>
  )
}
