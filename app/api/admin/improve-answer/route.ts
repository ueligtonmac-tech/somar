import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { question, botAnswer, adminDraft } = await req.json()
  if (!question) return NextResponse.json({ error: 'question obrigatório' }, { status: 400 })

  const prompt = `Você é um especialista em suporte técnico da Ultragaz. Um consultor de canais digitais fez uma pergunta que o bot não respondeu bem.

## Pergunta do consultor
${question}

## Resposta original do bot (insatisfatória)
${botAnswer || '(sem resposta)'}

${adminDraft ? `## Rascunho do admin (melhore e complete)
${adminDraft}` : ''}

## Sua tarefa
Escreva uma resposta clara, precisa e direta para essa pergunta, adequada para um consultor de canais digitais da Ultragaz.
- Seja objetivo e prático
- Use linguagem profissional mas acessível
- Se a pergunta for irrelevante (ex: brincadeira, assunto pessoal), responda educadamente que o Bot João é focado em dúvidas sobre a Ultragaz
- Máximo 4 parágrafos curtos
- Não use markdown excessivo, apenas negrito quando necessário

Retorne APENAS a resposta, sem explicações adicionais.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const improved = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return NextResponse.json({ improved })
}
