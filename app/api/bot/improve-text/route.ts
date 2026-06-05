import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'builder'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { question, answer, mode } = await req.json()
    if (!answer?.trim()) return NextResponse.json({ error: 'Resposta vazia' }, { status: 400 })

    const modeInstructions: Record<string, string> = {
      improve: 'Melhore a clareza, fluidez e objetividade do texto. Mantenha todas as informações originais.',
      correct: 'Corrija erros gramaticais, ortográficos e de pontuação. Não altere o conteúdo.',
      expand: 'Expanda a resposta com mais detalhes úteis e exemplos práticos relacionados ao tema.',
      summarize: 'Resuma a resposta mantendo apenas os pontos mais importantes. Seja conciso.',
      formalize: 'Reescreva em tom profissional e formal, adequado para um assistente empresarial da Ultragaz.',
    }

    const instruction = modeInstructions[mode] || modeInstructions.improve

    const prompt = `Você está editando uma resposta para a base de conhecimento do Bot João, assistente virtual da Ultragaz.

${question ? `PERGUNTA DE REFERÊNCIA: ${question}\n` : ''}RESPOSTA ATUAL:
${answer}

INSTRUÇÃO: ${instruction}

Retorne APENAS o texto da resposta melhorada, sem explicações, sem aspas, sem prefixos. Mantenha em português do Brasil.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const improved = response.content[0].type === 'text' ? response.content[0].text.trim() : answer

    return NextResponse.json({ improved })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao melhorar texto'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
