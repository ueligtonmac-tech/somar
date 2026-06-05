'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'react-qr-code'

const S = {
  page: { height: '100vh', background: '#000FFF', display: 'flex', position: 'relative' as const, overflow: 'hidden', fontFamily: 'Mangueira, system-ui, sans-serif' },
  wave: { position: 'absolute' as const, bottom: '-80px', left: '-2%', width: '104%', pointerEvents: 'none' as const, zIndex: 0, opacity: 0.5, transform: 'rotate(-2deg)' },
  left: { flex: '0 0 52%', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between', padding: '2.25rem 3.5rem', position: 'relative' as const, zIndex: 1, overflow: 'hidden' },
  right: { flex: 1, display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, padding: '1.25rem 2.5rem', position: 'relative' as const, zIndex: 1, overflowY: 'auto' as const },
  card: { background: 'white', borderRadius: '1.75rem', boxShadow: '0 32px 80px rgba(0,0,80,0.4)', padding: '1.75rem 1.75rem', width: '100%', maxWidth: '370px' },
  input: { width: '100%', border: '2px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.85rem 1rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', color: '#111', background: 'white', boxSizing: 'border-box' as const },
  btnPrimary: { width: '100%', background: '#000FFF', color: 'white', border: 'none', borderRadius: '0.875rem', padding: '0.95rem', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s' },
  btnGoogle: { width: '100%', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, gap: '0.75rem', background: 'white', border: '2px solid #e5e7eb', borderRadius: '0.875rem', padding: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, color: '#374151', transition: 'all 0.18s' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' as const },
  divider: { display: 'flex', alignItems: 'center' as const, gap: '0.75rem', margin: '1.25rem 0', color: '#9ca3af', fontSize: '0.8rem' },
  divLine: { flex: 1, height: 1, background: '#e5e7eb' },
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(urlError ? 'Erro na autenticação. Tente novamente.' : '')

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message.includes('Invalid') ? 'E-mail ou senha incorretos.' : err.message)
      setLoading(false)
    } else {
      router.push('/trilha')
    }
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } },
    })
  }

  return (
    <div style={S.page} className="login-page-root">
      <style>{`
        @media (max-width: 767px) {
          .login-left { display: none !important; }
          .login-divider { display: none !important; }
          .login-right {
            flex: 1 !important;
            padding: 1.5rem 1rem !important;
            align-items: flex-start !important;
            padding-top: 2.5rem !important;
          }
          .login-card {
            max-width: 100% !important;
            border-radius: 1.25rem !important;
          }
          .login-page-root {
            height: auto !important;
            min-height: 100dvh !important;
          }
        }
      `}</style>
      {/* Onda verde full-width */}
      <div style={S.wave}>
        <Image src="/onda-verde.png" alt="" width={1600} height={560} style={{ width: '100%', height: 'auto' }} />
      </div>

      {/* ── Esquerda ── */}
      <div style={S.left} className="login-left">
        <Image src="/logo.png" alt="Ultragaz" width={180} height={55} style={{ filter: 'brightness(0) invert(1)', height: 'auto' }} priority />
        <div style={{ paddingBottom: '4rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Plataforma de onboarding
          </p>
          <h1 style={{ color: 'white', fontSize: 'clamp(4rem, 7vw, 6.5rem)', fontWeight: 900, lineHeight: 0.95, marginBottom: '1.5rem' }}>
            HUB<br />Somar
          </h1>
          <p style={{ color: 'rgba(200,215,255,0.8)', fontSize: '1rem', fontWeight: 500, maxWidth: '300px', lineHeight: 1.65 }}>
            Capacitação para consultores de canais digitais Ultragaz.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {['Trilha de aprendizado guiada', 'Conteúdo sobre canais digitais', 'Assistente IA integrado'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ color: 'rgba(200,215,255,0.85)', fontSize: '0.875rem', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* QR Code de acesso rápido */}
          <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '10px',
              flexShrink: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}>
              <QRCode
                value="https://somar-tawny.vercel.app/login"
                size={88}
                bgColor="white"
                fgColor="#000FFF"
                level="M"
                style={{ borderRadius: '4px', display: 'block' }}
              />
            </div>
            <div>
              <p style={{ color: 'white', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                Acesse pelo celular
              </p>
              <p style={{ color: 'rgba(200,215,255,0.65)', fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.5 }}>
                Aponte a câmera para<br />acessar a plataforma
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Divisor */}
      <div className="login-divider" style={{ width: 1, background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch', margin: '2rem 0', zIndex: 1, flexShrink: 0 }} />

      {/* ── Direita ── */}
      <div style={S.right} className="login-right">
        <div style={S.card} className="login-card">
          <h2 style={{ color: '#111827', fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.2rem' }}>Bem-vindo(a)</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 500, marginBottom: '1.1rem' }}>Acesse sua conta para continuar</p>

          {error && (
            <div style={{ marginBottom: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.6rem 0.875rem', color: '#b91c1c', fontSize: '0.82rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div>
              <label style={S.label}>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={S.input}
                onFocus={e => (e.target.style.borderColor = '#000FFF')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label style={S.label}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ ...S.input, paddingRight: '3rem' }}
                  onFocus={e => (e.target.style.borderColor = '#000FFF')}
                  onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '0.3rem' }}>
                <a href="/esqueci-senha" style={{ color: '#000FFF', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Esqueci minha senha</a>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1, marginTop: '0.1rem' }}>
              {loading ? 'Entrando...' : 'Fazer Login'}
            </button>
          </form>

          <div style={{ ...S.divider, margin: '0.9rem 0' }}>
            <div style={S.divLine} />
            <span>ou</span>
            <div style={S.divLine} />
          </div>

          <button onClick={handleGoogle} style={{ ...S.btnGoogle, padding: '0.75rem' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#000FFF'; (e.currentTarget as HTMLButtonElement).style.color = '#000FFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.color = '#374151' }}
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
            <a href="/cadastro" style={{ color: '#000FFF', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ▶ Primeiro acesso
            </a>
            <a href="https://wa.me/5565999999999" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', fontSize: '0.72rem', textDecoration: 'none' }}>
              Problemas? Contate o administrador
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function EyeOffIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}
function GoogleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000FFF' }} />}>
      <LoginForm />
    </Suspense>
  )
}
