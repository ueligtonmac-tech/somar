'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const BLUE = '#000FFF'
const steps = [
  { n: 1, label: 'Identificação' },
  { n: 2, label: 'Verificação' },
  { n: 3, label: 'Dados pessoais' },
  { n: 4, label: 'Criar senha' },
  { n: 5, label: 'Conclusão' },
]

const S = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: 'Mangueira, system-ui, sans-serif' },
  sidebar: { width: '320px', flexShrink: 0, background: BLUE, display: 'flex', flexDirection: 'column' as const, padding: '2.5rem 2rem', position: 'relative' as const, overflow: 'hidden' },
  main: { flex: 1, background: '#f8f9fa', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' as const, justifyContent: 'center' as const, padding: '3rem 2rem' },
  card: { background: 'white', borderRadius: '1.5rem', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', padding: '2.5rem', width: '100%', maxWidth: '480px' },
  input: { width: '100%', border: '2px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.85rem 1rem', fontSize: '0.9rem', fontFamily: 'Mangueira, system-ui, sans-serif', outline: 'none', color: '#111', boxSizing: 'border-box' as const },
  btnPrimary: { width: '100%', background: BLUE, color: 'white', border: 'none', borderRadius: '0.875rem', padding: '0.95rem', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'Mangueira, system-ui, sans-serif', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, gap: '0.5rem', transition: 'background 0.18s' },
  btnOutline: { width: '100%', background: 'white', color: BLUE, border: `2px solid ${BLUE}`, borderRadius: '0.875rem', padding: '0.875rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Mangueira, system-ui, sans-serif', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, gap: '0.5rem' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' as const },
  hint: { fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.35rem' },
}

export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  // Step 1 — enviar OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (err) { setError(err.message); setLoading(false); return }
    setLoading(false)
    startCountdown()
    setStep(2)
  }

  // Step 2 — verificar OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (err) { setError('Código inválido ou expirado.'); setLoading(false); return }
    setLoading(false)
    setStep(3)
  }

  // Step 3 — dados pessoais (só avança)
  const handleDados = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) { setError('Informe seu nome completo.'); return }
    setError('')
    setStep(4)
  }

  // Step 4 — criar senha e atualizar perfil
  const handleSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return }
    if (password !== confirmPass) { setError('As senhas não coincidem.'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()

    // Atualiza senha
    const { error: passErr } = await supabase.auth.updateUser({ password })
    if (passErr) { setError(passErr.message); setLoading(false); return }

    // Atualiza perfil
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: nome,
        whatsapp,
        role: 'consultant',
        active: true,
      }, { onConflict: 'id' })
    }

    setLoading(false)
    setStep(5)
  }

  const handleResend = async () => {
    if (countdown > 0) return
    const supabase = createClient()
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    startCountdown()
  }

  return (
    <div style={S.page}>
      {/* ── Sidebar ── */}
      <div style={S.sidebar}>
        {/* Onda decorativa */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.3, pointerEvents: 'none' }}>
          <Image src="/onda-verde.png" alt="" width={400} height={140} style={{ width: '100%', height: 'auto' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Image src="/logo.png" alt="Ultragaz" width={150} height={46} style={{ filter: 'brightness(0) invert(1)', height: 'auto', marginBottom: '3rem' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {steps.map((s, i) => {
              const isDone = step > s.n
              const isActive = step === s.n
              const isLast = i === steps.length - 1
              return (
                <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: isDone ? '#22c55e' : isActive ? 'white' : 'rgba(255,255,255,0.15)',
                      border: isActive ? `3px solid white` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isDone ? 'white' : isActive ? BLUE : 'rgba(255,255,255,0.5)',
                      fontSize: '0.85rem', fontWeight: 800,
                    }}>
                      {isDone ? '✓' : s.n}
                    </div>
                    {!isLast && <div style={{ width: 2, height: 28, background: isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)', margin: '4px 0' }} />}
                  </div>
                  <div style={{ paddingTop: '0.5rem', paddingBottom: isLast ? 0 : '1.75rem' }}>
                    <p style={{ color: isActive ? 'white' : isDone ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: isActive ? 800 : 500, margin: 0 }}>
                      {s.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div style={S.main}>
        <div style={S.card}>

          {/* Etapa 1 — E-mail */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.375rem' }}>Vamos começar!</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Informe seu e-mail corporativo para criar sua conta.</p>
              {error && <ErrorBox msg={error} />}
              <label style={S.label}>E-mail corporativo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={S.input} onFocus={e => (e.target.style.borderColor = BLUE)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
              <p style={S.hint}>Um código de verificação será enviado para este e-mail.</p>
              <button type="submit" disabled={loading} style={{ ...S.btnPrimary, marginTop: '1.5rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Enviando...' : 'Continuar'} <span>→</span>
              </button>
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <a href="/login" style={{ color: '#9ca3af', fontSize: '0.8rem', textDecoration: 'none' }}>← Já tenho conta</a>
              </div>
            </form>
          )}

          {/* Etapa 2 — Código */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.375rem' }}>Verifique seu e-mail</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
                Enviamos um código de 6 dígitos para <strong style={{ color: '#374151' }}>{email}</strong>
              </p>
              {error && <ErrorBox msg={error} />}
              <label style={S.label}>Código de verificação</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                style={{ ...S.input, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', fontWeight: 800 }}
                onFocus={e => (e.target.style.borderColor = BLUE)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
              <p style={{ ...S.hint, textAlign: 'center', marginTop: '0.75rem' }}>
                Não recebeu?{' '}
                <button type="button" onClick={handleResend} disabled={countdown > 0} style={{ background: 'none', border: 'none', color: countdown > 0 ? '#9ca3af' : BLUE, fontWeight: 700, cursor: countdown > 0 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                  {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar código'}
                </button>
              </p>
              <button type="submit" disabled={loading || code.length < 6} style={{ ...S.btnPrimary, marginTop: '1.5rem', opacity: (loading || code.length < 6) ? 0.7 : 1 }}>
                {loading ? 'Verificando...' : 'Validar código'} <span>→</span>
              </button>
              <button type="button" onClick={() => setStep(1)} style={{ ...S.btnOutline, marginTop: '0.75rem' }}>
                <span>←</span> Voltar
              </button>
            </form>
          )}

          {/* Etapa 3 — Dados pessoais */}
          {step === 3 && (
            <form onSubmit={handleDados}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.375rem' }}>Dados pessoais</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Informe seus dados para completar o cadastro.</p>
              {error && <ErrorBox msg={error} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Nome completo *</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" required style={S.input} onFocus={e => (e.target.style.borderColor = BLUE)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
                </div>
                <div>
                  <label style={S.label}>WhatsApp <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(65) 99999-9999" style={S.input} onFocus={e => (e.target.style.borderColor = BLUE)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
                </div>
              </div>
              <button type="submit" style={{ ...S.btnPrimary, marginTop: '1.75rem' }}>
                Continuar <span>→</span>
              </button>
              <button type="button" onClick={() => setStep(2)} style={{ ...S.btnOutline, marginTop: '0.75rem' }}>
                <span>←</span> Voltar
              </button>
            </form>
          )}

          {/* Etapa 4 — Senha */}
          {step === 4 && (
            <form onSubmit={handleSenha}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.375rem' }}>Criar senha</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Crie uma senha segura para sua conta.</p>
              {error && <ErrorBox msg={error} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} style={{ ...S.input, paddingRight: '3rem' }} onFocus={e => (e.target.style.borderColor = BLUE)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                  {/* Barra de força */}
                  <div style={{ display: 'flex', gap: 3, marginTop: '0.5rem' }}>
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length >= n * 2 ? (password.length >= 8 ? '#22c55e' : '#f59e0b') : '#e5e7eb', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <p style={S.hint}>Mínimo 8 caracteres</p>
                </div>
                <div>
                  <label style={S.label}>Confirmar senha</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repita a senha" required style={{ ...S.input, borderColor: confirmPass && confirmPass !== password ? '#ef4444' : '#e5e7eb' }} onFocus={e => (e.target.style.borderColor = BLUE)} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
                  {confirmPass && confirmPass !== password && <p style={{ ...S.hint, color: '#ef4444' }}>As senhas não coincidem</p>}
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ ...S.btnPrimary, marginTop: '1.75rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Criando conta...' : 'Finalizar cadastro'} <span>→</span>
              </button>
              <button type="button" onClick={() => setStep(3)} style={{ ...S.btnOutline, marginTop: '0.75rem' }}>
                <span>←</span> Voltar
              </button>
            </form>
          )}

          {/* Etapa 5 — Conclusão */}
          {step === 5 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.5rem' }}>Cadastro concluído!</h2>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Sua conta foi criada com sucesso.<br />
                Bem-vindo(a) ao <strong style={{ color: BLUE }}>Bot João</strong>!
              </p>
              <button onClick={() => router.push('/trilha')} style={S.btnPrimary}>
                Acessar a trilha →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.85rem' }}>
      {msg}
    </div>
  )
}
