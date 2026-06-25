import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrintButton from './PrintButton'

export default async function CertificadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: progress }, { data: me }] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
    supabase.from('trail_user_progress').select('quiz_passed, points_earned, completed_at').eq('user_id', user.id),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  const isAdmin = ['admin', 'builder'].includes(me?.role ?? '')
  const { count: totalSections } = await supabase.from('trail_sections').select('*', { count: 'exact', head: true })
  const doneSections = (progress ?? []).filter(p => p.quiz_passed).length
  const totalPoints = (progress ?? []).reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const completed = isAdmin || doneSections >= (totalSections ?? 999)

  const name = profile?.full_name ?? profile?.email ?? 'Consultor'
  const completedAt = progress?.find(p => p.completed_at)?.completed_at
    ? new Date(progress!.find(p => p.completed_at)!.completed_at!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  if (!completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Trilha incompleta</h1>
          <p className="text-gray-400 text-sm mb-6">
            Conclua todas as {totalSections} seções da trilha para gerar seu certificado.<br />
            Você completou <strong className="text-[#000FFF]">{doneSections}</strong> de {totalSections} até agora.
          </p>
          <a href="/trilha" className="inline-block px-6 py-3 bg-[#000FFF] text-white font-bold rounded-xl text-sm">
            Continuar trilha →
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* CSS para impressão paisagem e ocultar cabeçalho/rodapé do browser */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8 px-4 print:bg-white print:p-0 print:min-h-0">

        {/* Controles — ocultos na impressão */}
        <div className="no-print mb-6 flex items-center gap-3">
          {isAdmin && doneSections < (totalSections ?? 0) && (
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-semibold">
              👁️ Pré-visualização admin
            </span>
          )}
          <a href="/trilha" className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            ← Voltar à trilha
          </a>
          <PrintButton />
        </div>

        {/* Certificado — proporção A4 paisagem */}
        <div
          className="relative bg-white overflow-hidden print:shadow-none"
          style={{
            width: '297mm',
            minHeight: '210mm',
            maxWidth: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Borda dupla elegante */}
          <div className="absolute inset-3 border-2 border-[#000FFF] pointer-events-none" style={{ zIndex: 10 }} />
          <div className="absolute inset-5 border border-[#000FFF]/20 pointer-events-none" style={{ zIndex: 10 }} />

          {/* Fundo decorativo — cantos */}
          <div className="absolute top-0 left-0 w-48 h-48 opacity-5" style={{
            background: 'radial-gradient(circle at 0% 0%, #000FFF 0%, transparent 70%)'
          }} />
          <div className="absolute bottom-0 right-0 w-48 h-48 opacity-5" style={{
            background: 'radial-gradient(circle at 100% 100%, #000FFF 0%, transparent 70%)'
          }} />

          {/* Conteúdo principal */}
          <div className="relative flex h-full" style={{ minHeight: '210mm', zIndex: 5 }}>

            {/* Coluna esquerda — faixa azul com logo */}
            <div className="flex flex-col items-center justify-center px-8 py-10 text-white" style={{
              width: '220px',
              minWidth: '220px',
              background: 'linear-gradient(180deg, #000FFF 0%, #0000cc 100%)',
            }}>
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/30 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ug-icon.jpg" alt="Ultragaz" className="w-full h-full object-cover" />
              </div>
              <p className="text-white font-black text-lg tracking-wide text-center leading-tight">Bot João</p>
              <p className="text-blue-200 text-xs font-medium mt-1 text-center">Ultragaz</p>

              <div className="w-12 h-0.5 bg-white/30 my-6" />

              {/* Métricas */}
              <div className="space-y-4 text-center w-full">
                <div>
                  <p className="text-3xl font-black text-white">{doneSections}</p>
                  <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-widest">Seções</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{totalPoints}</p>
                  <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-widest">Pontos</p>
                </div>
              </div>

              <div className="w-12 h-0.5 bg-white/30 mt-6 mb-4" />
              <p className="text-blue-200 text-[9px] text-center leading-relaxed">
                Trilha de Capacitação<br />em Canais Digitais
              </p>
            </div>

            {/* Coluna direita — conteúdo */}
            <div className="flex-1 flex flex-col justify-between px-12 py-10">

              {/* Topo */}
              <div>
                <p className="text-[10px] font-black text-[#000FFF] uppercase tracking-[0.4em] mb-1">
                  Certificado de Conclusão
                </p>
                <div className="w-16 h-0.5 bg-[#000FFF] mb-6" />
                <h1 className="text-4xl font-black text-gray-900 leading-tight mb-1">
                  Trilha de Capacitação
                </h1>
                <p className="text-base text-[#000FFF] font-bold">
                  Canais Digitais Ultragaz
                </p>
              </div>

              {/* Nome do consultor */}
              <div className="py-6">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3">
                  Conferido a
                </p>
                <p className="text-4xl font-black text-gray-900 leading-tight mb-4" style={{ fontStyle: 'italic' }}>
                  {name}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                  Por concluir com êxito o programa completo de capacitação em Canais Digitais Ultragaz,
                  demonstrando domínio das ferramentas, processos e estratégias do ecossistema digital.
                </p>
              </div>

              {/* Rodapé */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="w-40 h-px bg-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">Equipe Bot João · Ultragaz</p>
                  <p className="text-[10px] text-gray-300">ultragaz.com.br</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Data</p>
                  <p className="text-sm font-bold text-gray-700">{completedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
