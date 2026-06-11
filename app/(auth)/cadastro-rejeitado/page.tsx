import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function signOutAction() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function CadastroRejeitadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
      background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 60%, #f8f9fa 100%)',
      fontFamily: 'Mangueira, system-ui, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.75rem',
        boxShadow: '0 12px 60px rgba(239,68,68,0.08)',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <Image src="/logo.png" alt="Ultragaz" width={130} height={40} style={{ height: 'auto' }} />
        </div>

        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#fef2f2',
          border: '3px solid #fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.75rem',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.5rem' }}>
          Cadastro não aprovado
        </h1>

        <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
          Olá, <strong style={{ color: '#111' }}>{primeiroNome}</strong>.<br /><br />
          Infelizmente seu cadastro não foi aprovado neste momento.<br />
          Se acredita que isso foi um engano, entre em contato com o administrador.
        </p>

        <p style={{ color: '#9ca3af', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
          Fale com o administrador pelo{' '}
          <a
            href="https://wa.me/5565996464417"
            style={{ color: '#ef4444', fontWeight: 700, textDecoration: 'none' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </p>

        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'Mangueira, system-ui, sans-serif',
              padding: 0,
            }}
          >
            ← Sair da conta
          </button>
        </form>

        <p style={{ color: '#d1d5db', fontSize: '0.65rem', marginTop: '2rem' }}>
          © 2026 Arkanjia · Bot João · Ultragaz
        </p>
      </div>
    </div>
  )
}
