import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/cadastro', '/esqueci-senha', '/auth/callback', '/auth/magic', '/auth/signout', '/auth/reset-password', '/politica', '/termos', '/trial-expirado', '/api/trial', '/api/demo']
const PENDING_ROUTES = ['/completar-cadastro', '/aguardando-aprovacao']
const ADMIN_ROUTES = ['/admin']
const ADMIN_ROLES = ['admin', 'builder']

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const RATE_LIMITS: Record<string, [number, number]> = {
  '/api/chat/transcribe':       [10,  60_000],
  '/api/chat':                  [20,  60_000],
  '/api/rag/sync':              [3,  3_600_000],
  '/api/admin/generate-cards':  [5,  3_600_000],
}

const rateLimitStore = new Map<string, [number, number]>()

function checkRateLimit(userId: string, pathname: string): boolean {
  const route = Object.keys(RATE_LIMITS).find(r => pathname.startsWith(r))
  if (!route) return true

  const [max, windowMs] = RATE_LIMITS[route]
  const key = `${userId}:${route}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry[1] > windowMs) {
    rateLimitStore.set(key, [1, now])
    return true
  }

  if (entry[0] >= max) return false

  entry[0]++
  return true
}
// ──────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ── 1. Rotas públicas — sem autenticação ──
  if (PUBLIC_ROUTES.some(r => pathname === r || (r !== '/' && pathname.startsWith(r)))) {
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/trilha', request.url))
    }
    // Usuário logado que acessa `/` vai para /trilha
    if (user && pathname === '/') {
      return NextResponse.redirect(new URL('/trilha', request.url))
    }
    return supabaseResponse
  }

  // ── 2. Usuário não autenticado ──
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── 3. Rotas de API — apenas rate limiting ──
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(user.id, pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Muitas requisições. Aguarde um momento antes de tentar novamente.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return supabaseResponse
  }

  // ── 4. Buscar perfil (para rotas de página) ──
  // Tenta com rejected_at; se a coluna não existir no banco (migration pendente),
  // faz fallback sem ela — evita loop infinito em deploys graduais.
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, active, onboarding_complete, rejected_at, trial_expires_at')
    .eq('id', user.id)
    .single()

  // Fallback: colunas novas podem não existir ainda em deploys graduais
  const safeProfile = profileErr
    ? (await supabase
        .from('profiles')
        .select('role, active, onboarding_complete')
        .eq('id', user.id)
        .single()
      ).data
    : profile

  // ── 4b. Trial ──
  if (safeProfile?.role === 'consultor_trial') {
    const expiresAt = (safeProfile as { trial_expires_at?: string | null }).trial_expires_at
    if (expiresAt && new Date(expiresAt) < new Date()) {
      if (!pathname.startsWith('/trial-expirado')) {
        return NextResponse.redirect(new URL('/trial-expirado', request.url))
      }
      return supabaseResponse
    }
    // Trial válido: bloquear /admin, liberar todo o resto direto
    if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/trilha', request.url))
    }
    // Pula onboarding, aprovação e demais checks — trial vai direto
    return supabaseResponse
  }

  // ── 5. Rotas de pendência — permitir mesmo sem aprovação ──
  if (PENDING_ROUTES.some(r => pathname.startsWith(r))) {
    if (safeProfile?.active) {
      return NextResponse.redirect(new URL('/trilha', request.url))
    }
    return supabaseResponse
  }

  // ── 5b. Rota de rejeição ──
  if (pathname.startsWith('/cadastro-rejeitado')) {
    return supabaseResponse
  }

  // ── 6. Usuário com onboarding incompleto → completar cadastro ──
  // Admin/builder nunca precisam completar cadastro (já têm acesso direto)
  const isAdminRole = ADMIN_ROLES.includes(safeProfile?.role ?? '')
  if (!safeProfile?.onboarding_complete && !isAdminRole) {
    return NextResponse.redirect(new URL('/completar-cadastro', request.url))
  }

  // ── 7. Usuário rejeitado → tela específica ──
  if (!safeProfile?.active && (safeProfile as { rejected_at?: string | null } | null)?.rejected_at) {
    return NextResponse.redirect(new URL('/cadastro-rejeitado', request.url))
  }

  // ── 8. Usuário inativo (aguardando aprovação) — admin/builder sempre passa ──
  if (!safeProfile?.active && !isAdminRole) {
    return NextResponse.redirect(new URL('/aguardando-aprovacao', request.url))
  }

  // ── 9. Rotas de admin — verificar role ──
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isAdminRole) {
      return NextResponse.redirect(new URL('/trilha', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
