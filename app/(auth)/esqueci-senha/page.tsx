'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const BLUE = '#000FFF'
const S = {
  page: { minHeight: '100vh', background: BLUE, display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, position: 'relative' as const, overflow: 'hidden', fontFamily: 'Mangueira, system-ui, sans-serif', padding: '2rem' },
  wave: { position: 'absolute' as const, bottom: '-60px', left: '-2%', width: '104%', pointerEvents: 'none' as const, opacity: 0.45, transform: 'rotate(-2deg)' },
  card: { background: 'white', borderRadius: '1.75rem', boxShadow: '0 32px 80px rgba(0,0,80,0.4)', padding: '2.5rem', width: '100%', maxWidth: '420px', position: 'relative' as const, zIndex: 1 },
  input: { width: '100%', border: '2px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.85rem 1rem', fontSize: '0.9rem', fontFamily: 'Mangueira, system-ui, sans-serif', outline: 'none', color: '#111', boxSizing: 'border-box' as const },
  btnPrimary: { width: '100%', background: BLUE, color: 'white', border: 'none', borderRadius: '0.875rem', padding: '0.95rem', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'Mangueira, system-ui, sans-serif' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' as const },
}

export default function EsqueciSenhaPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setLoading(false)
    setStep('sent')
  }

  return (
    <div style={S.page}>
      <div style={S.wave}>
        <Image src="/onda-verde.png" alt="" width={1600} height={560} style={{ width: '100%', height: 'auto' }} />
      </div>

      <div style={S.card}>
        <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#9ca3af', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', marginBottom: '1.5rem' }}>
          ← Voltar ao login
        </a>

        {step === 'email' && (
          <form onSubmit={handleSend}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.375rem' }}>Esqueci minha senha</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            {error && <div style={{ marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.85rem' }}>{error}</div>}
            <label style={S.label}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={S.input} onFocus={e => (e.target.style.borderColor = BLUE)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
            <button type="submit" disabled={loading} style={{ ...S.btnPrimary, marginTop: '1.5rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </form>
        )}

        {step === 'sent' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#eff6ff', border: `3px solid ${BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111', marginBottom: '0.5rem' }}>E-mail enviado!</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Enviamos um link para <strong style={{ color: '#374151' }}>{email}</strong>
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: '2rem' }}>
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <button onClick={() => router.push('/login')} style={S.btnPrimary}>
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
