'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const BLUE = '#000FFF'

export default function CompletarCadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [funcao, setFuncao] = useState('')
  const [cidade, setCidade] = useState('')
  const [regiao, setRegiao] = useState('')
  const [regioes, setRegioes] = useState<{ slug: string; nome: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingUser, setLoadingUser] = useState(true)

  // Carregar dados já existentes do usuário (vindo do Google, por exemplo)
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Buscar perfil para pré-preencher (inclui campos novos)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, whatsapp, funcao, cidade, regiao, active, onboarding_complete')
        .eq('id', user.id)
        .single<{
          full_name: string | null
          whatsapp: string | null
          funcao: string | null
          cidade: string | null
          regiao: string | null
          active: boolean
          onboarding_complete: boolean
        }>()

      // Se onboarding já está completo, redireciona
      if (profile?.onboarding_complete) {
        router.push(profile.active ? '/trilha' : '/aguardando-aprovacao')
        return
      }

      // Pré-preencher nome vindo do Google ou profile existente
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name
      setNome(profile?.full_name || googleName || '')
      setWhatsapp(profile?.whatsapp || '')
      setFuncao(profile?.funcao || '')
      setCidade(profile?.cidade || '')
      setRegiao(profile?.regiao || '')

      // Buscar regiões ativas do banco
      const { data: regioesList } = await supabase
        .from('regioes_geograficas')
        .select('slug, nome')
        .eq('ativo', true)
        .order('ordem')
      setRegioes(regioesList ?? [])

      setLoadingUser(false)
    }
    load()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) { setError('Por favor, informe seu nome completo.'); return }
    if (!funcao) { setError('Por favor, selecione sua função.'); return }
    if (!cidade.trim()) { setError('Por favor, informe sua cidade.'); return }
    if (!regiao) { setError('Por favor, selecione sua região.'); return }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: nome.trim(), whatsapp: whatsapp.trim(), funcao, cidade: cidade.trim(), regiao }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar perfil. Tente novamente.')
        setLoading(false)
        return
      }

      router.push('/aguardando-aprovacao')
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  if (loadingUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${BLUE}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

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
        padding: '2.75rem 2.5rem',
        width: '100%',
        maxWidth: '460px',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '1.75rem' }}>
          <Image src="/logo.png" alt="Ultragaz" width={130} height={40} style={{ height: 'auto' }} />
        </div>

        {/* Google icon badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#f0f4ff',
          padding: '0.4rem 0.875rem',
          borderRadius: '2rem',
          marginBottom: '1.5rem',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: BLUE }}>Login com Google</span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', marginBottom: '0.375rem' }}>
          Complete seu perfil
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Confirme seus dados para solicitar o acesso à plataforma.
        </p>

        {error && (
          <div style={{
            marginBottom: '1.25rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
            color: '#b91c1c',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
                Nome completo *
              </label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome completo"
                required
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: 'Mangueira, system-ui, sans-serif',
                  outline: 'none',
                  color: '#111',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = BLUE)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
                WhatsApp <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="(65) 99999-9999"
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: 'Mangueira, system-ui, sans-serif',
                  outline: 'none',
                  color: '#111',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = BLUE)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
                Função *
              </label>
              <select
                value={funcao}
                onChange={e => setFuncao(e.target.value)}
                required
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: 'Mangueira, system-ui, sans-serif',
                  outline: 'none',
                  color: funcao ? '#111' : '#9ca3af',
                  boxSizing: 'border-box',
                  background: 'white',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                }}
                onFocus={e => (e.target.style.borderColor = BLUE)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              >
                <option value="">Selecione sua função</option>
                <option value="Consultor">Consultor</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Gerente de Distrito">Gerente de Distrito</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
                Cidade *
              </label>
              <input
                type="text"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Ex: Cuiabá - MT"
                required
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: 'Mangueira, system-ui, sans-serif',
                  outline: 'none',
                  color: '#111',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = BLUE)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', display: 'block' }}>
                Região de atuação *
              </label>
              <select
                value={regiao}
                onChange={e => setRegiao(e.target.value)}
                required
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: 'Mangueira, system-ui, sans-serif',
                  outline: 'none',
                  color: regiao ? '#111' : '#9ca3af',
                  boxSizing: 'border-box',
                  background: 'white',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                }}
                onFocus={e => (e.target.style.borderColor = BLUE)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              >
                <option value="">Selecione sua região</option>
                {regioes.map(r => (
                  <option key={r.slug} value={r.slug}>{r.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#6b7280' : BLUE,
              color: 'white',
              border: 'none',
              borderRadius: '0.875rem',
              padding: '0.95rem',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Mangueira, system-ui, sans-serif',
              marginTop: '1.75rem',
              transition: 'background 0.18s',
            }}
          >
            {loading ? 'Enviando...' : 'Solicitar acesso →'}
          </button>
        </form>

        {/* Botão Sair */}
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/'
          }}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.875rem',
            background: 'transparent',
            border: '1.5px solid #e5e7eb',
            borderRadius: '0.875rem',
            padding: '0.75rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#9ca3af',
            cursor: 'pointer',
            fontFamily: 'Mangueira, system-ui, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = '#ef4444'; (e.target as HTMLButtonElement).style.borderColor = '#ef4444' }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = '#9ca3af'; (e.target as HTMLButtonElement).style.borderColor = '#e5e7eb' }}
        >
          Sair da conta
        </button>

        <p style={{ color: '#d1d5db', fontSize: '0.65rem', textAlign: 'center', marginTop: '1.5rem' }}>
          © 2026 Ultragaz · Bot João
        </p>
      </div>
    </div>
  )
}
