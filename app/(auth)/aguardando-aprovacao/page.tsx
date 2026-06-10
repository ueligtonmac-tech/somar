import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AguardandoAprovacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Usuário não está logado — manda para login
  if (!user) redirect('/login')

  // Se já está ativo — manda para a trilha
  const { data: profile } = await supabase
    .from('profiles')
    .select('active, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.active) redirect('/trilha')

  const nome = profile?.full_name || user.email || 'Usuário'
  const primeiroNome = nome.split(' ')[0]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 60%, #f8f9fa 100%)',
      fontFamily: 'Mangueira, system-ui, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.75rem',
        boxShadow: '0 12px 60px rgba(0, 15, 255, 0.08)',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <Image src="/logo.png" alt="Ultragaz" width={130} height={40} style={{ height: 'auto' }} />
        </div>

        {/* Ícone animado */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#f0f4ff',
          border: '3px solid #000FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.75rem',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#111', marginBottom: '0.5rem' }}>
          Quase lá, {primeiroNome}! 🎉
        </h1>

        <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
          Seu cadastro foi recebido com sucesso.<br />
          Nossa equipe está analisando seu perfil e você receberá um <strong style={{ color: '#111' }}>e-mail de confirmação</strong> assim que o acesso for liberado.
        </p>

        {/* Card informativo */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '1rem',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          textAlign: 'left',
        }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', fontWeight: 700, color: '#374151' }}>
            O que acontece agora?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              'Nosso time analisa seu perfil',
              'Você recebe um e-mail de liberação',
              'Acesse a plataforma com seu login',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#000FFF',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: '#9ca3af', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
          Dúvidas? Fale com o administrador pelo{' '}
          <a
            href="https://wa.me/5565996464417"
            style={{ color: '#000FFF', fontWeight: 700, textDecoration: 'none' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </p>

        {/* Sair */}
        <Link
          href="/login"
          style={{
            display: 'block',
            color: '#9ca3af',
            fontSize: '0.8rem',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          ← Sair da conta
        </Link>

        <p style={{ color: '#d1d5db', fontSize: '0.65rem', marginTop: '2rem' }}>
          © 2026 Arkanjia · Bot João · Ultragaz
        </p>
      </div>
    </div>
  )
}
