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
    <div style={{
      minHeight: '100vh',
      background: '#000FFF',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Mangueira, system-ui, sans-serif',
    }}>

      {/* Onda verde — atravessa toda a tela horizontalmente */}
      <div style={{
        position: 'absolute',
        bottom: '-80px',
        left: '-2%',
        width: '104%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.55,
        transform: 'rotate(-2deg)',
      }}>
        <Image src="/onda-verde.png" alt="" width={1600} height={560} style={{ width: '100%', height: 'auto' }} />
      </div>

      {/* ── ESQUERDA ── */}
      <div style={{
        flex: '0 0 52%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.75rem 3.5rem',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo no topo */}
        <Image
          src="/logo.png"
          alt="Ultragaz somando energias"
          width={180}
          height={55}
          style={{ filter: 'brightness(0) invert(1)', height: 'auto', width: '180px' }}
          priority
        />

        {/* Título central */}
        <div style={{ paddingBottom: '4rem' }}>
          <p style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            Plataforma de onboarding
          </p>

          <h1 style={{
            color: 'white',
            fontSize: 'clamp(4rem, 7vw, 6.5rem)',
            fontWeight: 900,
            lineHeight: 0.95,
            marginBottom: '1.5rem',
          }}>
            HUB<br />Somar
          </h1>

          <p style={{
            color: 'rgba(200,215,255,0.8)',
            fontSize: '1rem',
            fontWeight: 500,
            maxWidth: '300px',
            lineHeight: 1.65,
          }}>
            Capacitação para consultores de canais digitais Ultragaz.
          </p>

          <div style={{ marginTop: '2.25rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[
              'Trilha de aprendizado guiada',
              'Conteúdo sobre canais digitais',
              'Assistente IA integrado',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ color: 'rgba(200,215,255,0.85)', fontSize: '0.875rem', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divisor vertical sutil */}
      <div style={{
        width: 1,
        background: 'rgba(255,255,255,0.1)',
        alignSelf: 'stretch',
        margin: '3rem 0',
        zIndex: 1,
        flexShrink: 0,
      }} />

      {/* ── DIREITA ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 3rem',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Card */}
          <div style={{
            background: 'white',
            borderRadius: '1.75rem',
            boxShadow: '0 32px 80px rgba(0,0,80,0.4)',
            padding: '2.5rem',
          }}>
            <h2 style={{
              color: '#111827',
              fontSize: '1.5rem',
              fontWeight: 900,
              marginBottom: '0.375rem',
            }}>
              Entrar
            </h2>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '1.75rem',
            }}>
              Use sua conta Google corporativa
            </p>

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
                padding: '0.9rem 1.5rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#374151',
                transition: 'all 0.18s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.borderColor = '#000FFF'
                b.style.color = '#000FFF'
                b.style.background = '#f0f2ff'
                b.style.boxShadow = '0 4px 16px rgba(0,15,255,0.15)'
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.borderColor = '#e5e7eb'
                b.style.color = '#374151'
                b.style.background = 'white'
                b.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <GoogleIcon />
              Continuar com Google
            </button>

            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
                Problemas de acesso?{' '}
                <a
                  href="https://wa.me/5565999999999"
                  style={{ color: '#000FFF', fontWeight: 700, textDecoration: 'none' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contate o admin
                </a>
              </p>
            </div>
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '0.68rem',
            color: 'rgba(191,207,255,0.35)',
            marginTop: '1.5rem',
            fontWeight: 500,
          }}>
            Ultragaz · Gerência de Venda Direta e Atendimento B2C
          </p>
        </div>
      </div>

      {/* Mobile fallback */}
      <style>{`
        @media (max-width: 1023px) {
          [data-left] { display: none !important; }
          [data-right] { flex: 1; padding: 2rem 1.5rem; }
        }
      `}</style>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
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
