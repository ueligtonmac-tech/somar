import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// Bloqueio SSRF: IPs privados, link-local e loopback
const BLOCKED_RANGES = [
  /^127\./,                         // loopback
  /^10\./,                          // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,    // RFC 1918
  /^192\.168\./,                    // RFC 1918
  /^169\.254\./,                    // link-local (AWS metadata)
  /^::1$/,                          // IPv6 loopback
  /^fc00:/,                         // IPv6 ULA
  /^fe80:/,                         // IPv6 link-local
  /^0\./,                           // 0.0.0.0/8
  /^100\.64\./,                     // CGNAT
]

function isSafeUrl(raw: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return false
  }

  // Apenas HTTPS
  if (parsed.protocol !== 'https:') return false

  // Bloquear loopback por hostname
  const host = parsed.hostname.toLowerCase()
  if (host === 'localhost' || host === '0.0.0.0') return false

  // Bloquear IPs privados literais
  if (BLOCKED_RANGES.some(r => r.test(host))) return false

  // Bloquear credenciais na URL
  if (parsed.username || parsed.password) return false

  return true
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'builder'].includes(profile.role ?? '')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { url } = body as { url?: string }
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL obrigatória' }, { status: 400 })
    }

    if (!isSafeUrl(url)) {
      logger.warn('fetch-url: URL bloqueada por política SSRF', { context: 'api/bot/fetch-url', userId: user.id, data: { url } })
      return NextResponse.json({ error: 'URL não permitida. Use apenas URLs HTTPS públicas.' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HubSomarBot/1.0)' },
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Não foi possível acessar a URL (${res.status})` }, { status: 400 })
    }

    // Limitar tamanho da resposta (2 MB)
    const contentLength = Number(res.headers.get('content-length') ?? 0)
    if (contentLength > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Página muito grande para processar' }, { status: 400 })
    }

    const html = await res.text()

    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)

    if (cleaned.length < 50) {
      return NextResponse.json({ error: 'Não foi possível extrair conteúdo útil desta URL' }, { status: 400 })
    }

    return NextResponse.json({ content: cleaned })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao buscar URL'
    logger.error('fetch-url: erro inesperado', { context: 'api/bot/fetch-url', error: err })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
