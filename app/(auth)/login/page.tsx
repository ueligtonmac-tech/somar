'use client'

import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  const errorMessages: Record<string, string> = {
    auth_callback: 'Erro na autenticação. Tente novamente.',
    inactive: 'Sua conta está inativa. Contate o administrador.',
  }

  return (
    <div className="min-h-screen bg-[#000FFF] flex">

      {/* ── Painel esquerdo ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 px-12 py-10 relative overflow-hidden">

        {/* Blob decorativo teal */}
        <div
          className="absolute -bottom-32 -left-32 w-[520px] h-[520px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, #00e5a0 0%, #00b8d4 60%, transparent 100%)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image src="/ug-icon.jpg" alt="Ultragaz" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white font-extrabold text-lg leading-none">ultragaz</p>
            <p className="text-blue-200 text-xs">somando energias</p>
          </div>
        </div>

        {/* Texto central */}
        <div className="relative z-10 mb-16">
          <h1 className="text-white font-black text-4xl leading-tight mb-4">
            HUB Somar
          </h1>
          <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-sm">
            Plataforma de onboarding para consultores de canais digitais Ultragaz.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              'Trilha de aprendizado guiada',
              'Conteúdo sobre canais digitais',
              'Assistente IA integrado',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-blue-100 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito (card branco) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">

          {/* Logo mobile (só aparece em telas pequenas) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image src="/ug-icon.jpg" alt="Ultragaz" width={48} height={48} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Topo do card */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100">
              <h2 className="text-[#000FFF] font-black text-2xl">Entrar</h2>
              <p className="text-gray-500 text-sm mt-1">
                Acesse com sua conta Google corporativa
              </p>
            </div>

            {/* Corpo */}
            <div className="px-8 py-8">
              {/* Erro */}
              {error && (
                <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm text-center">
                  {errorMessages[error] ?? 'Erro desconhecido. Tente novamente.'}
                </div>
              )}

              {/* Botão Google */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-[#000FFF] hover:bg-blue-50 text-gray-700 font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 group shadow-sm"
              >
                <GoogleIcon />
                <span className="group-hover:text-[#000FFF] transition-colors text-sm">
                  Continuar com Google
                </span>
              </button>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Problemas de acesso?{' '}
                  <a
                    href="https://wa.me/5565999999999"
                    className="text-[#000FFF] hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contate o administrador
                  </a>
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-blue-200/60 mt-6">
            Ultragaz · Gerência de Venda Direta e Atendimento B2C
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000FFF]" />}>
      <LoginForm />
    </Suspense>
  )
}
