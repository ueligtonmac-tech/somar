import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateEmbedding, generateEmbeddingsBatch } from '@/lib/embeddings'
// Rota admin: indexa todo o conteúdo existente gerando embeddings
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Sem permissão' }, { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar se a chave Google está configurada
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_KEY
  if (!googleKey || googleKey === 'your_gemini_key') {
    return Response.json({ ok: false, message: 'Erro: GOOGLE_GENERATIVE_AI_KEY não configurada no ambiente.' }, { status: 400 })
  }

  // Testar a chave gerando um embedding de teste
  const testEmb = await generateEmbedding('teste')
  if (!testEmb) {
    return Response.json({ ok: false, message: 'Erro: chave Google inválida ou sem acesso à API de embeddings.' }, { status: 400 })
  }

  const results = { knowledge: 0, cards: 0, errors: 0 }

  // ── 1. Indexar bot_knowledge sem embedding ──
  const { data: knowledge } = await service
    .from('bot_knowledge')
    .select('id, question, answer')
    .eq('approved', true)
    .is('embedding', null)

  if (knowledge && knowledge.length > 0) {
    const texts = knowledge.map(k => `${k.question}\n${k.answer}`)
    const embeddings = await generateEmbeddingsBatch(texts)

    for (let i = 0; i < knowledge.length; i++) {
      if (!embeddings[i]) { results.errors++; continue }
      const { error } = await service
        .from('bot_knowledge')
        .update({ embedding: JSON.stringify(embeddings[i]) })
        .eq('id', knowledge[i].id)
      if (error) results.errors++
      else results.knowledge++
    }
  }

  // ── 2. Indexar cards sem embedding ──
  const { data: cards } = await service
    .from('cards')
    .select('id, title, scenario, challenge, explanation, action_hint')
    .is('embedding', null)

  if (cards && cards.length > 0) {
    const texts = cards.map(c => [
      c.title,
      c.scenario && `Cenário: ${c.scenario}`,
      c.challenge && `Desafio: ${c.challenge}`,
      c.explanation && `Explicação: ${c.explanation}`,
      c.action_hint && `Dica: ${c.action_hint}`,
    ].filter(Boolean).join('\n'))

    const embeddings = await generateEmbeddingsBatch(texts)

    for (let i = 0; i < cards.length; i++) {
      if (!embeddings[i]) { results.errors++; continue }
      const { error } = await service
        .from('cards')
        .update({ embedding: JSON.stringify(embeddings[i]) })
        .eq('id', cards[i].id)
      if (error) results.errors++
      else results.cards++
    }
  }

  return Response.json({
    ok: true,
    indexed: results,
    message: `Indexados: ${results.knowledge} conhecimentos, ${results.cards} cards. Erros: ${results.errors}`,
  })
}

// Retorna status atual da indexação
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ count: kTotal }, { count: kIndexed }, { count: cTotal }, { count: cIndexed }] =
    await Promise.all([
      service.from('bot_knowledge').select('*', { count: 'exact', head: true }).eq('approved', true),
      service.from('bot_knowledge').select('*', { count: 'exact', head: true }).eq('approved', true).not('embedding', 'is', null),
      service.from('cards').select('*', { count: 'exact', head: true }),
      service.from('cards').select('*', { count: 'exact', head: true }).not('embedding', 'is', null),
    ])

  return Response.json({
    knowledge: { total: kTotal ?? 0, indexed: kIndexed ?? 0 },
    cards: { total: cTotal ?? 0, indexed: cIndexed ?? 0 },
  })
}
