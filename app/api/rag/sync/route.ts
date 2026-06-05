import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateEmbedding, generateEmbeddingsBatch } from '@/lib/embeddings'

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
  const { data: knowledge, error: kErr } = await service
    .from('bot_knowledge')
    .select('id, question, answer, embedding')
    .eq('approved', true)

  if (kErr) console.error('[rag/sync] knowledge query error:', kErr)

  if (knowledge && knowledge.length > 0) {
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
        if (error) { console.error('[rag/sync] update knowledge error:', error); results.errors++ }
        else results.knowledge++
      }
    }
  }

  // ── 2. Indexar TODOS os cards ──
  const { data: cards, error: cErr } = await service
    .from('cards')
    .select('id, title, scenario, challenge, explanation, action_hint, embedding')

  if (cErr) console.error('[rag/sync] cards query error:', cErr)

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
        if (error) { console.error('[rag/sync] update card error:', error); results.errors++ }
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

  const [kAll, cAll] = await Promise.all([
    service.from('bot_knowledge').select('id, embedding').eq('approved', true),
    service.from('cards').select('id, embedding'),
  ])

  const kTotal = kAll.data?.length ?? 0
  const kIndexed = kAll.data?.filter(k => k.embedding).length ?? 0
  const cTotal = cAll.data?.length ?? 0
  const cIndexed = cAll.data?.filter(c => c.embedding).length ?? 0

  return Response.json({
    knowledge: { total: kTotal, indexed: kIndexed },
    cards: { total: cTotal, indexed: cIndexed },
  })
}
