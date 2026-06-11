import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateEmbedding, generateEmbeddingsBatch } from '@/lib/embeddings'
import { logger } from '@/lib/logger'

// Rota admin/builder: indexa todo o conteúdo gerando embeddings
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'builder'].includes(profile.role ?? '')) {
    return Response.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar se a chave Google está configurada
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey || openaiKey === 'your_openai_key' || !openaiKey.startsWith('sk-')) {
    return Response.json({ ok: false, message: 'Erro: OPENAI_API_KEY não configurada no Vercel.' }, { status: 400 })
  }

  // Testar a chave
  const testEmb = await generateEmbedding('teste de conexão')
  if (!testEmb) {
    return Response.json({ ok: false, message: 'Erro: chave Google inválida ou API desabilitada.' }, { status: 400 })
  }

  const results = { knowledge: 0, cards: 0, errors: 0 }

  // ── 1. Indexar TODOS os bot_knowledge aprovados ──
  // Busca em lotes de 1000 para superar o limite padrão do Supabase
  let knowledge: { id: string; question: string; answer: string; embedding: string | null }[] = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data: page, error: kErr } = await service
      .from('bot_knowledge')
      .select('id, question, answer, embedding')
      .eq('approved', true)
      .range(from, from + PAGE - 1)
    if (kErr) { logger.error('knowledge query error', { context: 'rag/sync', error: kErr }); break }
    if (!page || page.length === 0) break
    knowledge = knowledge.concat(page)
    if (page.length < PAGE) break
    from += PAGE
  }

  if (knowledge.length > 0) {
    // Só os que ainda não têm embedding
    const pending = knowledge.filter(k => !k.embedding)
    if (pending.length > 0) {
      const texts = pending.map(k => `${k.question}\n${k.answer}`)
      const embeddings = await generateEmbeddingsBatch(texts)

      for (let i = 0; i < pending.length; i++) {
        if (!embeddings[i]) { results.errors++; continue }
        const { error } = await service
          .from('bot_knowledge')
          .update({ embedding: embeddings[i] as unknown as string })
          .eq('id', pending[i].id)
        if (error) { logger.error('update knowledge error', { context: 'rag/sync', error }); results.errors++ }
        else results.knowledge++
      }
    }
  }

  // ── 2. Indexar TODOS os cards ──
  const { data: cards, error: cErr } = await service
    .from('cards')
    .select('id, title, scenario, challenge, explanation, action_hint, embedding')

  if (cErr) logger.error('cards query error', { context: 'rag/sync', error: cErr })

  if (cards && cards.length > 0) {
    const pending = cards.filter(c => !c.embedding)
    if (pending.length > 0) {
      const texts = pending.map(c => [
        c.title,
        c.scenario && `Cenário: ${c.scenario}`,
        c.challenge && `Desafio: ${c.challenge}`,
        c.explanation && `Explicação: ${c.explanation}`,
        c.action_hint && `Dica: ${c.action_hint}`,
      ].filter(Boolean).join('\n'))

      const embeddings = await generateEmbeddingsBatch(texts)

      for (let i = 0; i < pending.length; i++) {
        if (!embeddings[i]) { results.errors++; continue }
        const { error } = await service
          .from('cards')
          .update({ embedding: embeddings[i] as unknown as string })
          .eq('id', pending[i].id)
        if (error) { logger.error('update card error', { context: 'rag/sync', error }); results.errors++ }
        else results.cards++
      }
    }
  }

  const msg = results.errors > 0
    ? `Indexados: ${results.knowledge} conhecimentos, ${results.cards} cards. Falhas: ${results.errors}`
    : `✅ Indexados com sucesso: ${results.knowledge} conhecimentos e ${results.cards} cards!`

  return Response.json({ ok: true, indexed: results, message: msg })
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

  // Conta via SQL para não sofrer com o limite de 1000 rows do Supabase
  const [kCount, kIndexedCount, cCount, cIndexedCount] = await Promise.all([
    service.from('bot_knowledge').select('*', { count: 'exact', head: true }).eq('approved', true),
    service.from('bot_knowledge').select('*', { count: 'exact', head: true }).eq('approved', true).not('embedding', 'is', null),
    service.from('cards').select('*', { count: 'exact', head: true }),
    service.from('cards').select('*', { count: 'exact', head: true }).not('embedding', 'is', null),
  ])

  return Response.json({
    knowledge: { total: kCount.count ?? 0, indexed: kIndexedCount.count ?? 0 },
    cards: { total: cCount.count ?? 0, indexed: cIndexedCount.count ?? 0 },
  })
}
