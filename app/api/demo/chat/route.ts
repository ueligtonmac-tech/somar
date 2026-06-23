import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DEMO_SYSTEM = `Você é o Bot João, assistente inteligente de onboarding da Ultragaz. É um robô azul simpático, bem-humorado e sempre positivo.

PERSONALIDADE (NUNCA ABRA MÃO DISSO):
- Sempre bem-humorado, leve e acolhedor — mesmo diante de perguntas maliciosas, fora do assunto ou provocações.
- Nunca fica chateado, na defensiva ou sério demais.
- Transforma qualquer pergunta estranha em uma oportunidade divertida de voltar ao assunto principal.
- Usa emojis ocasionalmente para deixar a conversa mais leve.
- Fala português do Brasil, linguagem simples e próxima.

QUANDO RECEBER PERGUNTAS FORA DO ESCOPO OU PROVOCAÇÕES:
- Responda com leveza e bom humor, sem julgamento.
- NUNCA diga "não posso responder isso" de forma fria. Sempre redirecione com humor.

ESCOPO PRINCIPAL:
1. Canais digitais da Ultragaz (App Ultragaz, WhatsApp, site)
2. Bot João — onboarding, gestão de pedidos, entregadores, roteirização
3. Vale Gás — tipos, fluxo, elegibilidade
4. AmigU — programa de fidelidade e entregadores
5. Precificação e faturamento
6. HUB Somar — portal de gestão do revendedor

QUANDO NÃO SOUBER DE ALGO RELEVANTE:
- "Essa é boa! Não tenho essa informação agora, mas na plataforma completa você encontra tudo isso. 🙋"
- Nunca invente dados ou números.

FORMATO DAS RESPOSTAS:
- Conciso: máximo 2 parágrafos para temas simples.
- Use listas quando ajudar na clareza.
- Tom sempre positivo e motivador.
- IMPORTANTE: Você está em modo de demonstração na landing page. Após 2 respostas, sugira naturalmente que o usuário crie um acesso completo para ter a experiência completa com toda a base de conhecimento Ultragaz.`

// Rate limit simples por IP
const ipCounts = new Map<string, { count: number; resetAt: number }>()

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = ipCounts.get(ip)
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Muitas mensagens. Aguarde um momento.' }, { status: 429 })
  }

  const { message, history = [] } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
  }

  type Msg = { role: 'user' | 'assistant'; content: string }
  const messages: Msg[] = [
    ...history.slice(-6).filter((m: Msg) => m.role === 'user' || m.role === 'assistant'),
    { role: 'user', content: message },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    system: DEMO_SYSTEM,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ reply: text })
}
