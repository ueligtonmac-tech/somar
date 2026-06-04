'use client'

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
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Header azul Ultragaz */}
          <div className="bg-[#000FFF] px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center mb-4">
              {/* Logo placeholder — substituir pelo logo real */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#000FFF] font-black text-lg">UG</span>
              </div>
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              HUB Somar
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Plataforma de onboarding · Canais Digitais
            </p>
          </div>

          {/* Corpo */}
          <div className="px-8 py-10">
            <p className="text-gray-500 text-sm text-center mb-8">
              Acesso exclusivo para consultores Ultragaz.<br />
              Use sua conta Google corporativa.
            </p>

            {/* Erro */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm text-center">
                {errorMessages[error] ?? 'Erro desconhecido. Tente novamente.'}
              </div>
            )}

            {/* Botão Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-[#000FFF] hover:bg-blue-50 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 group"
            >
              <GoogleIcon />
              <span className="group-hover:text-[#000FFF] transition-colors">
                Entrar com Google
              </span>
            </button>

            {/* Divisor */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Problemas de acesso? Contate{' '}
                <a
                  href="https://wa.me/5565999999999"
                  className="text-[#000FFF] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  o administrador
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Ultragaz · Gerência de Venda Direta e Atendimento B2C
        </p>
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
    <Suspense fallback={<div className="min-h-screen bg-[#f5f5f5]" />}>
      <LoginForm />
    </Suspense>
  )
}
