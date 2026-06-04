import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/auth/callback']
const ADMIN_ROUTES = ['/admin']
const ADMIN_ROLES = ['admin', 'builder']

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

  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/trilha', request.url))
    }
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()

    if (!profile?.active) {
      return NextResponse.redirect(new URL('/login?error=inactive', request.url))
    }

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
