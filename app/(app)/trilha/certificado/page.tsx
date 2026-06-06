import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

export default async function CertificadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: modules }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
    supabase.from('modules').select('id').eq('published', true),
    supabase.from('user_progress').select('module_id, completed').eq('user_id', user.id),
  ])

  const totalModules = modules?.length ?? 0
  const completedModules = (progress ?? []).filter(p => p.completed).length
  const allCompleted = totalModules > 0 && completedModules >= totalModules

  // Bloqueia acesso se trilha incompleta
  if (!allCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Certificado bloqueado</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-1">
            Você concluiu <strong className="text-gray-700">{completedModules} de {totalModules}</strong> módulos.
          </p>
          <p className="text-gray-400 text-sm mb-6">Conclua todos os módulos para desbloquear seu certificado.</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-[#000FFF] rounded-full transition-all"
              style={{ width: `${(completedModules / totalModules) * 100}%` }}
            />
          </div>
          <Link
            href="/trilha"
            className="inline-flex items-center gap-2 bg-[#000FFF] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            ← Voltar à trilha
          </Link>
        </div>
      </div>
    )
  }

  const userName = profile?.full_name ?? profile?.email ?? 'Consultor'
  const completionDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .cert-outer { background: white !important; padding: 0 !important; display: block !important; }
          .cert-scaler { transform: none !important; width: 100% !important; }
          .cert-card { width: 100% !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
        @page { size: A4 landscape; margin: 0; }
        .cert-scaler {
          transform-origin: top center;
          transform: scale(0.62);
        }
      `}</style>

      <div className="cert-outer min-h-screen bg-gray-200 flex flex-col items-center py-10 px-4">
        {/* Wrapper que escala o certificado para caber na tela */}
        <div style={{ width: '297mm', marginBottom: '-220px' }} className="cert-scaler">
          {/* ── CERTIFICADO A4 PAISAGEM ── */}
          <div
            className="cert-card bg-white relative overflow-hidden shadow-2xl"
            style={{ width: '297mm', height: '210mm', fontFamily: 'Arial, sans-serif' }}
          >
            {/* Moldura interna dupla */}
            <div className="absolute inset-[10px] border-[2.5px] border-[#000FFF]/15 pointer-events-none z-0" />
            <div className="absolute inset-[15px] border border-[#000FFF]/8 pointer-events-none z-0" />

            {/* Barra topo: azul + laranja */}
            <div className="absolute top-0 left-0 right-0 flex z-10" style={{ height: '9px' }}>
              <div className="flex-1 bg-[#000FFF]" />
              <div style={{ width: '24px', background: '#f97316' }} />
            </div>

            {/* Barra fundo: laranja + azul */}
            <div className="absolute bottom-0 left-0 right-0 flex z-10" style={{ height: '9px' }}>
              <div style={{ width: '24px', background: '#f97316' }} />
              <div className="flex-1 bg-[#000FFF]" />
            </div>

            {/* Conteúdo */}
            <div className="relative z-10 flex flex-col h-full px-14 py-10">

              {/* ── Cabeçalho ── */}
              <div className="flex items-center justify-between mb-7">
                {/* Esquerda: apenas texto HUB Somar */}
                <div>
                  <p className="text-[#000FFF] font-black text-[22px] leading-none tracking-tight">HUB Somar</p>
                  <p className="text-gray-400 text-[10px] tracking-[0.25em] uppercase mt-1">Plataforma de Onboarding</p>
                </div>

                {/* Direita: apenas logo Ultragaz (wordmark oficial) */}
                <Image
                  src="/ultragaz-wordmark.webp"
                  alt="Ultragaz"
                  width={140}
                  height={44}
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* ── Corpo central ── */}
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-[11px] tracking-[0.5em] text-gray-400 uppercase mb-4">
                  Certificamos que
                </p>

                <h1
                  className="font-bold text-gray-900 mb-3"
                  style={{ fontFamily: 'Georgia, serif', fontSize: '42px', lineHeight: 1.1 }}
                >
                  {userName}
                </h1>

                {/* Linha decorativa sob o nome */}
                <div className="flex items-center justify-center gap-3 mb-5" style={{ width: '420px' }}>
                  <div className="flex-1 h-px bg-[#000FFF]/20" />
                  <div className="w-2 h-2 rounded-full bg-[#000FFF]" />
                  <div className="flex-1 h-px bg-[#000FFF]/20" />
                </div>

                <p className="text-gray-600 leading-relaxed max-w-[500px]" style={{ fontSize: '14px' }}>
                  concluiu com êxito a{' '}
                  <strong className="text-gray-900">Trilha de Onboarding de Canais Digitais</strong>,
                  completando todos os {totalModules} módulos do programa de capacitação desenvolvido pela{' '}
                  <strong className="text-gray-900">Ultragaz</strong> em parceria com a plataforma{' '}
                  <strong className="text-gray-900">HUB Somar</strong>.
                </p>
              </div>

              {/* ── Stats ── */}
              <div className="flex items-center justify-center gap-8 mb-6">
                {[
                  { label: 'Módulos Concluídos', value: `${totalModules}/${totalModules}` },
                  { label: 'Carga Horária', value: '40h' },
                  { label: 'Nível', value: 'Fundamentos' },
                ].map(s => (
                  <div key={s.label} className="text-center border border-gray-100 rounded-lg px-5 py-2.5 bg-gray-50/60">
                    <p className="font-black text-[#000FFF]" style={{ fontSize: '18px' }}>{s.value}</p>
                    <p className="text-gray-400 uppercase tracking-wider mt-0.5" style={{ fontSize: '9px' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ── Rodapé ── */}
              <div className="flex items-end justify-between border-t border-gray-100 pt-4">
                {/* Data */}
                <div>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>
                    Emitido em <strong className="text-gray-700">{completionDate}</strong>
                  </p>
                  <p className="text-gray-400 mt-0.5" style={{ fontSize: '9px' }}>
                    Documento gerado pela plataforma HUB Somar
                  </p>
                </div>

                {/* Assinatura */}
                <div className="text-center">
                  <div className="w-32 border-b-2 border-gray-300 mb-2 mx-auto" />
                  <p className="text-gray-600 font-bold" style={{ fontSize: '11px' }}>Coordenação Ultragaz</p>
                  <p className="text-gray-400" style={{ fontSize: '9px' }}>Canais Digitais</p>
                </div>

                {/* Selo */}
                <div className="flex items-center gap-2 border border-[#000FFF]/15 bg-[#000FFF]/5 rounded-xl px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-[#000FFF] flex items-center justify-center flex-shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#000FFF] font-black" style={{ fontSize: '10px' }}>Certificado Válido</p>
                    <p className="text-gray-400" style={{ fontSize: '9px' }}>HUB Somar · {new Date().getFullYear()}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <PrintButton />
      </div>
    </>
  )
}
