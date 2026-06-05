import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { generateQueryEmbedding as generateEmbedding } from '@/lib/embeddings'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é o Bot João, assistente virtual do HUB Somar da Ultragaz. É um robô azul simpático, bem-humorado e sempre positivo.

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
  * Provocação → "Você é criativo(a)! 😂 Mas minha missão aqui é te ajudar a arrasar nas vendas. Tem alguma dúvida sobre os canais digitais ou o HUB Somar?"
  * Assunto pessoal → "Fora da minha área! 😅 Mas posso te contar tudo sobre o Vale Gás, AmigU e muito mais. O que você quer saber?"
- NUNCA diga "não posso responder isso" de forma fria. Sempre redirecione com humor.

ESCOPO PRINCIPAL:
1. Canais digitais da Ultragaz (App Ultragaz, WhatsApp, site)
2. HUB Somar — gestão de pedidos, entregadores, roteirização
3. Vale Gás — tipos, fluxo, elegibilidade
4. AmigU — programa de fidelidade e entregadores
5. Precificação e faturamento
6. Informações gerais sobre a Ultragaz como empresa e seus valores

QUANDO NÃO SOUBER DE ALGO RELEVANTE:
- "Essa é boa! Não tenho essa informação agora, mas vou repassar para um colega humano que pode te ajudar. 🙋"
- Nunca invente dados ou números.

FORMATO DAS RESPOSTAS:
- Conciso: máximo 3 parágrafos para temas simples.
- Use listas quando ajudar na clareza.
- Tom sempre positivo e motivador — você acredita no crescimento do consultor!`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 })

    const { message, conversationId, history } = await req.json()
    if (!message?.trim()) return new Response(JSON.stringify({ error: 'Mensagem vazia' }), { status: 400 })

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Montar histórico
    type Message = { role: 'user' | 'assistant'; content: string }
    const messages: Message[] = []

    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content })
        }
      }
    }
    messages.push({ role: 'user', content: message })

    // ── RAG: busca semântica (embeddings) com fallback para keywords ──
    let knowledgeContext = ''
    try {
      // Tenta busca semântica primeiro
      const queryEmbedding = await generateEmbedding(message)

      if (queryEmbedding) {
        // Busca semântica em bot_knowledge
        const { data: semanticKnowledge } = await supabase.rpc('match_knowledge', {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.6,
          match_count: 6,
        })

        if (semanticKnowledge && semanticKnowledge.length > 0) {
          knowledgeContext = `\n\nCONHECIMENTO VALIDADO PELA EQUIPE ULTRAGAZ — use estas respostas como referência PRIORITÁRIA e definitiva:\n` +
            semanticKnowledge.map((k: { question: string; answer: string; similarity: number }, i: number) =>
              `${i + 1}. Pergunta: ${k.question}\n   Resposta: ${k.answer}`
            ).join('\n\n')
        }
      } else {
        // Fallback: busca por keywords
        const { data: knowledge } = await supabase
          .from('bot_knowledge')
          .select('question, answer')
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(60)

        if (knowledge && knowledge.length > 0) {
          const stopwords = new Set(['que', 'com', 'para', 'por', 'uma', 'uns', 'umas', 'dos', 'das', 'nos', 'nas', 'seu', 'sua', 'seus', 'suas', 'isso', 'esse', 'esta', 'este', 'como', 'mais', 'mas', 'nem', 'não', 'sim', 'vai', 'tem', 'ter', 'ser', 'foi', 'são', 'pode', 'qual', 'quais', 'quando', 'onde'])
          const msgWords = message.toLowerCase()
            .replace(/[^a-záéíóúãõâêîôûàèìòùç\s]/gi, ' ')
            .split(/\s+/)
            .filter((w: string) => w.length >= 3 && !stopwords.has(w))

          const scored = knowledge.map(k => {
            const text = (k.question + ' ' + k.answer).toLowerCase()
            const hits = msgWords.filter((w: string) => text.includes(w)).length
            return { ...k, hits }
          }).filter(k => k.hits > 0)
            .sort((a, b) => b.hits - a.hits)
            .slice(0, 6)

          if (scored.length > 0) {
            knowledgeContext = `\n\nCONHECIMENTO VALIDADO PELA EQUIPE ULTRAGAZ — use estas respostas como referência PRIORITÁRIA e definitiva:\n` +
              scored.map((k, i) => `${i + 1}. Pergunta: ${k.question}\n   Resposta: ${k.answer}`).join('\n\n')
          }
        }
      }
    } catch { /* ignora */ }

    // ── BIBLIOTECA: materiais da biblioteca de PDFs ──
    let bibliotecaContext = ''
    try {
      const { data: libFiles } = await supabase
        .from('library_files')
        .select('title, description, category')
        .eq('active', true)
        .not('title', 'is', null)
        .limit(30)

      if (libFiles && libFiles.length > 0) {
        const msgWords = message.toLowerCase().replace(/[^a-záéíóúãõâêîôûç\s]/gi, ' ').split(/\s+/).filter((w: string) => w.length >= 3)
        const relevantFiles = libFiles.filter(f => {
          const text = [f.title, f.description, f.category].filter(Boolean).join(' ').toLowerCase()
          return msgWords.some((w: string) => text.includes(w))
        }).slice(0, 5)

        if (relevantFiles.length > 0) {
          bibliotecaContext = `\n\nMATERIAIS DISPONÍVEIS NA BIBLIOTECA (informe ao consultor que pode baixar esses materiais na seção Biblioteca do HUB Somar):\n` +
            relevantFiles.map((f, i) => {
              const parts = [`"${f.title}"`]
              if (f.category) parts.push(`(${f.category})`)
              if (f.description) parts.push(`— ${f.description}`)
              return `${i + 1}. ${parts.join(' ')}`
            }).join('\n')
        }
      }
    } catch { /* ignora */ }

    // ── CARDS: busca semântica nos módulos da trilha ──
    let cardsContext = ''
    try {
      const queryEmbedding = await generateEmbedding(message)

      if (queryEmbedding) {
        const { data: semanticCards } = await supabase.rpc('match_cards', {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.55,
          match_count: 4,
        })

        if (semanticCards && semanticCards.length > 0) {
          cardsContext = `\n\nCONTEÚDO DOS MÓDULOS DE TREINAMENTO (use para responder dúvidas sobre os temas da trilha):\n` +
            semanticCards.map((c: { title: string; scenario: string; challenge: string; explanation: string }, i: number) => {
              const parts = [`Módulo: ${c.title}`]
              if (c.scenario) parts.push(`Cenário: ${c.scenario}`)
              if (c.challenge) parts.push(`Desafio: ${c.challenge}`)
              if (c.explanation) parts.push(`Explicação: ${c.explanation}`)
              return `${i + 1}. ${parts.join(' | ')}`
            }).join('\n')
        }
      } else {
        // Fallback: keyword search
        const { data: cards } = await supabase
          .from('cards')
          .select('title, scenario, challenge, explanation, action_hint')
          .not('explanation', 'is', null)
          .limit(40)

        if (cards && cards.length > 0) {
          const msgWords = message.toLowerCase().replace(/[^a-záéíóúãõâêîôûç\s]/gi, ' ').split(/\s+/).filter((w: string) => w.length >= 3)
          const relevantCards = cards.filter(c => {
            const text = [c.title, c.scenario, c.challenge, c.explanation, c.action_hint].filter(Boolean).join(' ').toLowerCase()
            return msgWords.some((w: string) => text.includes(w))
          }).slice(0, 4)

          if (relevantCards.length > 0) {
            cardsContext = `\n\nCONTEÚDO DOS MÓDULOS DE TREINAMENTO (use para responder dúvidas sobre os temas da trilha):\n` +
              relevantCards.map((c, i) => {
                const parts = [`Módulo: ${c.title}`]
                if (c.scenario) parts.push(`Cenário: ${c.scenario}`)
                if (c.challenge) parts.push(`Desafio: ${c.challenge}`)
                if (c.explanation) parts.push(`Explicação: ${c.explanation}`)
                return `${i + 1}. ${parts.join(' | ')}`
              }).join('\n')
          }
        }
      }
    } catch { /* ignora */ }

    const systemWithName = [
      SYSTEM_PROMPT,
      profile?.full_name ? `\nO nome do consultor que está conversando com você é: ${profile.full_name}.` : '',
      knowledgeContext,
      cardsContext,
      bibliotecaContext,
    ].filter(Boolean).join('')

    const cId = conversationId || crypto.randomUUID()

    // ── Streaming response ──
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = ''
        let modelUsed = 'claude-haiku-4-5'

        const sendChunk = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          const anthropicStream = anthropic.messages.stream({
            model: 'claude-haiku-4-5',
            max_tokens: 1024,
            system: systemWithName,
            messages,
          })

          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text
              fullText += chunk
              sendChunk({ type: 'chunk', text: chunk })
            }
          }
        } catch {
          // Fallback para Sonnet
          modelUsed = 'claude-sonnet-4-5'
          fullText = ''
          try {
            const anthropicStream = anthropic.messages.stream({
              model: 'claude-sonnet-4-5',
              max_tokens: 1024,
              system: systemWithName,
              messages,
            })

            for await (const event of anthropicStream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const chunk = event.delta.text
                fullText += chunk
                sendChunk({ type: 'chunk', text: chunk })
              }
            }
          } catch {
            sendChunk({ type: 'error', message: 'Erro interno. Tente novamente.' })
            controller.close()
            return
          }
        }

        // Envia metadados finais
        sendChunk({ type: 'done', conversationId: cId, model: modelUsed })

        // Salva no banco em background (não bloqueia a resposta)
        try {
          await supabase.from('bot_messages').insert([
            { conversation_id: cId, user_id: user.id, role: 'user', content: message, model_used: modelUsed },
            { conversation_id: cId, user_id: user.id, role: 'assistant', content: fullText, model_used: modelUsed },
          ])
        } catch { /* ignora */ }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err: unknown) {
    console.error('Chat error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno. Tente novamente.' }), { status: 500 })
  }
}
