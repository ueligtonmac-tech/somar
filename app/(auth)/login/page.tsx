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
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden px-14 py-12">

        {/* Forma Onda como background */}
        <Image
          src="/onda-bg.png"
          alt=""
          fill
          className="object-cover object-center opacity-80"
          priority
        />

        {/* Logo wordmark em texto — idêntico ao site oficial */}
        <div className="relative z-10">
          <p
            className="text-white leading-none"
            style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.01em' }}
          >
            ultragaz
          </p>
          <p className="text-blue-200 text-xs font-medium mt-0.5 tracking-widest">
            somando energias
          </p>
        </div>

        {/* Título + descrição */}
        <div className="relative z-10 mb-8">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            Plataforma de onboarding
          </p>
          <h1
            className="text-white leading-none mb-5"
            style={{ fontSize: '5.5rem', fontWeight: 900, lineHeight: 1 }}
          >
            HUB<br />Somar
          </h1>
          <p className="text-blue-100 text-base font-medium leading-relaxed max-w-xs">
            Capacitação para consultores de canais digitais Ultragaz.
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
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-blue-100 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-10 relative bg-[#0009e6]">

        {/* Onda verde no canto inferior */}
        <div className="absolute bottom-0 right-0 left-0 pointer-events-none select-none opacity-25">
          <Image src="/onda-verde.png" alt="" width={700} height={240} className="w-full" />
        </div>

        <div className="w-full max-w-sm relative z-10">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <p className="text-white font-black text-3xl">ultragaz</p>
            <p className="text-blue-200 text-xs tracking-widest">somando energias</p>
          </div>

          {/* Card branco */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Topo do card */}
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-[#000FFF] font-black text-2xl leading-tight">
                Bem-vindo(a)
              </h2>
              <p className="text-gray-400 text-sm font-medium mt-1">
                Acesse com sua conta Google corporativa
              </p>
            </div>

            <div className="px-8 pb-8">
              <div className="h-px bg-gray-100 mb-6" />

              {error && (
                <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm text-center">
                  {errorMessages[error] ?? 'Erro desconhecido. Tente novamente.'}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-[#000FFF] hover:bg-blue-50 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 group shadow-sm"
              >
                <GoogleIcon />
                <span className="group-hover:text-[#000FFF] transition-colors">
                  Continuar com Google
                </span>
              </button>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  Problemas de acesso?{' '}
                  <a
                    href="https://wa.me/5565999999999"
                    className="text-[#000FFF] hover:underline font-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contate o administrador
                  </a>
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-blue-200/40 mt-6">
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
