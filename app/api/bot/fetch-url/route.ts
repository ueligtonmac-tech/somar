import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'builder'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL obrigatória' }, { status: 400 })

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HubSomarBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return NextResponse.json({ error: `Não foi possível acessar a URL (${res.status})` }, { status: 400 })

    const html = await res.text()

    // Extract meaningful text: remove scripts, styles, nav, footer
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
      .slice(0, 3000)  // max 3000 chars

    if (cleaned.length < 50) {
      return NextResponse.json({ error: 'Não foi possível extrair conteúdo útil desta URL' }, { status: 400 })
    }

    return NextResponse.json({ content: cleaned })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao buscar URL'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
