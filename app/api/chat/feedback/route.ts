import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { conversationId, question, answer, score } = await req.json()

    // Silencioso se tabela não existir ainda
    try {
      await supabase.from('bot_feedback').insert({
        conversation_id: conversationId,
        user_id: user.id,
        question,
        answer,
        score,
        escalated: score < 7,
        reviewed: false,
      })
    } catch { /* tabela pode não existir ainda */ }

    return NextResponse.json({ ok: true, escalated: score < 7 })
  } catch (err) {
    console.error('Feedback error:', err)
    return NextResponse.json({ error: 'Erro ao salvar feedback' }, { status: 500 })
  }
}
