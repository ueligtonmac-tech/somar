import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/cadastro', '/esqueci-senha', '/auth/callback', '/auth/reset-password', '/politica', '/termos']
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
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    if (user && pathname === '/login') {
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active, onboarding_complete')
    .eq('id', user.id)
    .single()

  // ── 5. Rotas de pendência — permitir mesmo sem aprovação ──
  if (PENDING_ROUTES.some(r => pathname.startsWith(r))) {
    // Se já está ativo, manda para a trilha
    if (profile?.active) {
      return NextResponse.redirect(new URL('/trilha', request.url))
    }
    return supabaseResponse
  }

  // ── 6. Usuário com onboarding incompleto → completar cadastro ──
  if (!profile?.onboarding_complete) {
    return NextResponse.redirect(new URL('/completar-cadastro', request.url))
  }

  // ── 7. Usuário inativo (aguardando aprovação) ──
  if (!profile?.active) {
    return NextResponse.redirect(new URL('/aguardando-aprovacao', request.url))
  }

  // ── 8. Rotas de admin — verificar role ──
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!ADMIN_ROLES.includes(profile?.role ?? '')) {
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
