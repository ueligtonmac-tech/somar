'use client'

/**
 * Página client-side para processar o magic link do trial.
 * O Supabase redireciona aqui com #access_token=... no hash (implicit flow).
 * O servidor nunca vê o hash — precisa de JS no browser para criar a sessão.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MagicPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // onAuthStateChange detecta automaticamente o #access_token no hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        subscription.unsubscribe()
        router.replace('/trilha')
      }
    })

    // Também tenta getSession caso o evento já tenha disparado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        router.replace('/trilha')
      }
    })

    // Timeout: se após 5s não criou sessão, vai para login com erro
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      router.replace('/login?error=auth_callback')
    }, 5000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000FFF' }}>
      <div className="text-white text-center">
        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-5"
          style={{ borderWidth: 3 }} />
        <p className="text-lg font-black">Acessando sua demonstração...</p>
        <p className="text-blue-200 text-sm mt-1">Aguarde um instante</p>
      </div>
    </div>
  )
}
