'use client'

/**
 * Página de ativação do trial — processa o magic link do Supabase.
 *
 * O admin.generateLink retorna um action_link que ao ser visitado,
 * Supabase redireciona de volta com tokens no hash (#access_token=...)
 * OU com code na query (?code=) dependendo das configurações do projeto.
 *
 * Esta página trata AMBOS os casos explicitamente.
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function MagicHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Verificando acesso...')

  useEffect(() => {
    const supabase = createClient()

    async function handle() {
      // ── 1. PKCE: ?code= na query string ─────────────────────────
      const code = searchParams.get('code')
      if (code) {
        setStatus('Autenticando...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace('/trilha')
          return
        }
        // Se falhou o exchange (sem code_verifier), tenta via OTP token
      }

      // ── 2. Implicit: tokens no hash da URL (#access_token=...) ──
      const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
      if (hash) {
        const params = new URLSearchParams(hash)
        const accessToken  = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          setStatus('Abrindo plataforma...')
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (!error) {
            router.replace('/trilha')
            return
          }
        }
      }

      // ── 3. OTP token: ?token_hash= + ?type= (Supabase email flow) ─
      const tokenHash = searchParams.get('token_hash')
      const type      = searchParams.get('type') as 'magiclink' | 'email' | null
      if (tokenHash && type) {
        setStatus('Verificando token...')
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (!error) {
          router.replace('/trilha')
          return
        }
      }

      // ── 4. Aguarda onAuthStateChange como último recurso ─────────
      setStatus('Aguardando autenticação...')
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          subscription.unsubscribe()
          router.replace('/trilha')
        }
      })

      // Verifica se já existe sessão ativa (pode ter sido detectada pelo SDK)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        subscription.unsubscribe()
        router.replace('/trilha')
        return
      }

      // Timeout final
      const timeout = setTimeout(() => {
        subscription.unsubscribe()
        // Log para debug — mostra o que veio na URL
        console.error('[auth/magic] timeout. hash:', window.location.hash, 'search:', window.location.search)
        router.replace('/login?error=auth_callback')
      }, 10000)

      return () => {
        clearTimeout(timeout)
        subscription.unsubscribe()
      }
    }

    handle()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#000FFF' }}>
      <div className="w-12 h-12 rounded-full border-[3px] border-white border-t-transparent animate-spin" />
      <div className="text-center">
        <p className="text-white text-lg font-black">{status}</p>
        <p className="text-blue-200 text-sm mt-1">Você será redirecionado em instantes</p>
      </div>
    </div>
  )
}

export default function MagicPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000FFF' }}>
        <div className="w-12 h-12 rounded-full border-[3px] border-white border-t-transparent animate-spin" />
      </div>
    }>
      <MagicHandler />
    </Suspense>
  )
}
