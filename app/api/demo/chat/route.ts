import { createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { generateQueryEmbedding as generateEmbedding } from '@/lib/embeddings'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é o Bot João, assistente inteligente de onboarding da Ultragaz. É um robô azul simpático, bem-humorado e sempre positivo.

PERSONALIDADE (NUNCA ABRA MÃO DISSO):
- Sempre bem-humorado, leve e acolhedor — mesmo diante de perguntas maliciosas, fora do assunto ou provocações.
- Nunca fica chateado, na defensiva ou sério demais.
- Transforma qualquer pergunta estranha em uma oportunidade divertida de voltar ao assunto principal.
- Usa emojis ocasionalmente para deixar a conversa mais leve.
- Fala português do Brasil, linguagem simples e próxima.

QUANDO RECEBER PERGUNTAS FORA DO ESCOPO OU PROVOCAÇÕES:
- Responda com leveza e bom humor, sem julgamento.
- Exemplos de como desviar com graça:
  * Pergunta estranha → "Haha, essa eu não esperava! 😄 Não sou especialista nisso, mas sou ótimo em Ultragaz. Posso te ajudar com...?"
  * Provocação → "Você é criativo(a)! 😂 Mas minha missão aqui é te ajudar a arrasar nas vendas. Tem alguma dúvida sobre os canais digitais da Ultragaz?"
  * Assunto pessoal → "Fora da minha área! 😅 Mas posso te contar tudo sobre o Vale Gás, AmigU e muito mais. O que você quer saber?"
- NUNCA diga "não posso responder isso" de forma fria. Sempre redirecione com humor.

ESCOPO PRINCIPAL:
1. Canais digitais da Ultragaz (App Ultragaz, WhatsApp, site)
2. Bot João — onboarding, gestão de pedidos, entregadores, roteirização
3. Vale Gás — tipos, fluxo, elegibilidade
4. AmigU — programa de fidelidade e entregadores
5. Precificação e faturamento
6. Informações gerais sobre a Ultragaz como empresa e seus valores

ERROS DE DIGITAÇÃO E VARIAÇÕES FONÉTICAS:
- Interprete sempre pela intenção mais provável dentro do contexto da Ultragaz.
- Exemplos: "Vale gaz" → Vale Gás | "Amigo U" → AmigU | "App Ultra gás" → App Ultragaz

QUANDO NÃO SOUBER DE ALGO RELEVANTE:
- "Essa é boa! Não tenho essa informação agora, mas na plataforma completa você encontra tudo. 🙋"
- Nunca invente dados ou números.

FORMATO DAS RESPOSTAS:
- Conciso: máximo 3 parágrafos para temas simples.
- Use listas quando ajudar na clareza.
- Tom sempre positivo e motivador — você acredita no crescimento do consultor!

MODO DEMONSTRAÇÃO:
- Você está na landing page para visitantes que ainda não são cadastrados.
- Responda normalmente com toda sua inteligência e base de conhecimento.
- Após 3 trocas, sugira de forma natural que o visitante crie um acesso para ter a experiência completa: trilha de aprendizado, biblioteca de materiais, conquistas e muito mais.`

// Rate limit simples por IP
const ipCounts = new Map<string, { count: number; resetAt: number }>()
function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = ipCounts.get(ip)
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 15) return false
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

  try {
    const supabase = await createServiceClient()

    // ── RAG: embedding ──
    const queryEmbedding = await generateEmbedding(message).catch(() => null)

    // ── RAG: base de conhecimento aprovada ──
    let knowledgeContext = ''
    try {
      if (queryEmbedding) {
        const { data: semanticKnowledge } = await supabase.rpc('match_knowledge', {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.6,
          match_count: 5,
        })
        if (semanticKnowledge && semanticKnowledge.length > 0) {
          knowledgeContext = `\n\nCONHECIMENTO VALIDADO PELA EQUIPE ULTRAGAZ — use como referência PRIORITÁRIA:\n` +
            semanticKnowledge.map((k: { question: string; answer: string }, i: number) =>
              `${i + 1}. Pergunta: ${k.question}\n   Resposta: ${k.answer}`
            ).join('\n\n')
        }
      } else {
        const { data: knowledge } = await supabase
          .from('bot_knowledge')
          .select('question, answer')
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(40)
        if (knowledge && knowledge.length > 0) {
          const stopwords = new Set(['que', 'com', 'para', 'por', 'uma', 'dos', 'das', 'nos', 'nas', 'isso', 'como', 'mais', 'não', 'sim', 'vai', 'tem', 'qual'])
          const msgWords = message.toLowerCase().replace(/[^a-záéíóúãõâêîôûç\s]/gi, ' ').split(/\s+/).filter((w: string) => w.length >= 3 && !stopwords.has(w))
          const scored = knowledge
            .map(k => ({ ...k, hits: msgWords.filter((w: string) => (k.question + ' ' + k.answer).toLowerCase().includes(w)).length }))
            .filter(k => k.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 5)
          if (scored.length > 0) {
            knowledgeContext = `\n\nCONHECIMENTO VALIDADO PELA EQUIPE ULTRAGAZ:\n` +
              scored.map((k, i) => `${i + 1}. Pergunta: ${k.question}\n   Resposta: ${k.answer}`).join('\n\n')
          }
        }
      }
    } catch { /* ignora */ }

    // ── RAG: chunks de PDFs ──
    let bibliotecaContext = ''
    try {
      if (queryEmbedding) {
        const { data: chunks } = await supabase.rpc('match_chunks', {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.5,
          match_count: 3,
        })
        if (chunks && chunks.length > 0) {
          bibliotecaContext = `\n\nCONTEÚDO DOS MANUAIS DA ULTRAGAZ:\n` +
            chunks.map((c: { content: string; metadata: { title?: string } }, i: number) =>
              `${i + 1}. ${c.metadata?.title ? `[${c.metadata.title}] ` : ''}${c.content}`
            ).join('\n\n')
        }
      }
    } catch { /* ignora */ }

    // ── RAG: cards de treinamento ──
    let cardsContext = ''
    try {
      if (queryEmbedding) {
        const { data: semanticCards } = await supabase.rpc('match_cards', {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.55,
          match_count: 3,
        })
        if (semanticCards && semanticCards.length > 0) {
          cardsContext = `\n\nCONTEÚDO DOS MÓDULOS DE TREINAMENTO:\n` +
            semanticCards.map((c: { title: string; scenario: string; explanation: string }, i: number) =>
              `${i + 1}. Módulo: ${c.title}${c.scenario ? ` | Cenário: ${c.scenario}` : ''}${c.explanation ? ` | ${c.explanation}` : ''}`
            ).join('\n')
        }
      }
    } catch { /* ignora */ }

    const systemWithContext = SYSTEM_PROMPT + [knowledgeContext, bibliotecaContext, cardsContext].filter(Boolean).join('')

    type Msg = { role: 'user' | 'assistant'; content: string }
    const messages: Msg[] = [
      ...history.slice(-8).filter((m: Msg) => m.role === 'user' || m.role === 'assistant'),
      { role: 'user', content: message },
    ]

    // Streaming
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: systemWithContext,
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[demo/chat]', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
