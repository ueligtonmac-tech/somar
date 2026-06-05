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
    <div style={{ minHeight: '100vh', background: '#000FFF', display: 'flex', position: 'relative', overflow: 'hidden' }}>

      {/* ── Onda verde atravessando a tela inteira ── */}
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        left: '-5%',
        width: '110%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.45,
      }}>
        <Image
          src="/onda-verde.png"
          alt=""
          width={1600}
          height={550}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>

      {/* ── Painel esquerdo ── */}
      <div style={{
        display: 'none',
        flex: '0 0 55%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem 3.5rem',
        position: 'relative',
        zIndex: 2,
      }} className="lg-flex-col">

        {/* Logo PNG branca (RGBA transparente + invert) */}
        <div>
          <Image
            src="/logo.png"
            alt="Ultragaz somando energias"
            width={200}
            height={60}
            style={{ filter: 'brightness(0) invert(1)', width: '200px', height: 'auto' }}
            priority
          />
        </div>

        {/* Título */}
        <div style={{ marginBottom: '5rem' }}>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            Plataforma de onboarding
          </p>
          <h1 style={{
            color: 'white',
            fontSize: '5.5rem',
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: '1.25rem',
          }}>
            HUB<br />Somar
          </h1>
          <p style={{ color: '#bfcfff', fontSize: '1rem', fontWeight: 500, maxWidth: '280px', lineHeight: 1.6 }}>
            Capacitação para consultores de canais digitais Ultragaz.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {['Trilha de aprendizado guiada', 'Conteúdo sobre canais digitais', 'Assistente IA integrado'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ color: '#bfcfff', fontSize: '0.875rem', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 2rem',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Logo mobile */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="show-mobile">
            <Image
              src="/logo.png"
              alt="Ultragaz"
              width={160}
              height={50}
              style={{ filter: 'brightness(0) invert(1)', margin: '0 auto', height: 'auto' }}
            />
          </div>

          {/* Card branco */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            boxShadow: '0 25px 60px rgba(0,0,60,0.35)',
            overflow: 'hidden',
          }}>
            {/* Header do card */}
            <div style={{ padding: '2rem 2rem 1.5rem' }}>
              <Image
                src="/logo.png"
                alt="Ultragaz"
                width={140}
                height={42}
                style={{ height: 'auto', marginBottom: '1.25rem' }}
              />
              <h2 style={{
                color: '#000FFF',
                fontSize: '1.5rem',
                fontWeight: 900,
                marginBottom: '0.25rem',
              }}>
                Bem-vindo(a)
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>
                Acesse com sua conta Google corporativa
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f3f4f6', margin: '0 2rem' }} />

            {/* Body */}
            <div style={{ padding: '1.5rem 2rem 2rem' }}>
              {error && (
                <div style={{
                  marginBottom: '1.25rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  color: '#b91c1c',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                }}>
                  {errorMessages[error] ?? 'Erro desconhecido. Tente novamente.'}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.875rem',
                  padding: '1rem 1.5rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#374151',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#000FFF'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#000FFF'
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#f0f0ff'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#374151'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'white'
                }}
              >
                <GoogleIcon />
                Continuar com Google
              </button>

              <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                Problemas de acesso?{' '}
                <a
                  href="https://wa.me/5565999999999"
                  style={{ color: '#000FFF', fontWeight: 600, textDecoration: 'none' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contate o administrador
                </a>
              </p>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(191,207,255,0.4)', marginTop: '1.5rem' }}>
            Ultragaz · Gerência de Venda Direta e Atendimento B2C
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-flex-col { display: flex !important; }
          .show-mobile { display: none !important; }
        }
      `}</style>
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
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000FFF' }} />}>
      <LoginForm />
    </Suspense>
  )
}
