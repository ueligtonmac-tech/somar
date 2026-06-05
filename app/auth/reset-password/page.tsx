'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const BLUE = '#000FFF'
const S = {
  page: { minHeight: '100vh', background: BLUE, display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, fontFamily: 'Mangueira, system-ui, sans-serif', padding: '2rem' },
  card: { background: 'white', borderRadius: '1.75rem', boxShadow: '0 32px 80px rgba(0,0,80,0.4)', padding: '2.5rem', width: '100%', maxWidth: '400px' },
  input: { width: '100%', border: '2px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.85rem 1rem', fontSize: '0.9rem', fontFamily: 'Mangueira, system-ui, sans-serif', outline: 'none', color: '#111', boxSizing: 'border-box' as const },
  btnPrimary: { width: '100%', background: BLUE, color: 'white', border: 'none', borderRadius: '0.875rem', padding: '0.95rem', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'Mangueira, system-ui, sans-serif' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' as const },
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase sets session from URL hash automatically
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Mínimo 8 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setLoading(false)
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        {!done ? (
          <form onSubmit={handleReset}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.375rem' }}>Nova senha</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Escolha uma senha forte para sua conta.</p>
            {error && <div style={{ marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem', color: '#b91c1c', fontSize: '0.85rem' }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={S.label}>Nova senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} style={S.input} onFocus={e => (e.target.style.borderColor = BLUE)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
              </div>
              <div>
                <label style={S.label}>Confirmar senha</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" required style={S.input} onFocus={e => (e.target.style.borderColor = BLUE)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ ...S.btnPrimary, marginTop: '1.75rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111', marginBottom: '0.5rem' }}>Senha redefinida!</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Redirecionando para o login...</p>
          </div>
        )}
      </div>
    </div>
  )
}
