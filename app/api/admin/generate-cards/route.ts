import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { moduleId } = await req.json()
  if (!moduleId) return NextResponse.json({ error: 'moduleId obrigatório' }, { status: 400 })

  // 1. Buscar módulo
  const { data: module } = await supabase
    .from('modules')
    .select('id, title, description')
    .eq('id', moduleId)
    .single()

  if (!module) return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })

  // 2. Buscar cards existentes (para evitar duplicatas)
  const { data: existingCards } = await supabase
    .from('cards')
    .select('title, scenario, challenge, explanation')
    .eq('module_id', moduleId)

  const existingSummary = existingCards?.map(c =>
    `- ${c.title}: ${c.scenario ?? ''} ${c.challenge ?? ''}`.trim()
  ).join('\n') || 'Nenhum card ainda.'

  // 3. Buscar conteúdo relevante da biblioteca (document_chunks) por similaridade com o módulo
  const { data: chunks } = await supabase
    .from('document_chunks')
    .select('content, metadata')
    .limit(40)

  // 4. Buscar bot_knowledge relevante
  const { data: knowledge } = await supabase
    .from('bot_knowledge')
    .select('question, answer')
    .ilike('answer', `%${module.title.split(' ')[0]}%`)
    .limit(30)

  const libraryContent = chunks?.map(c => c.content).join('\n\n---\n\n').slice(0, 12000) || ''
  const knowledgeContent = knowledge?.map(k => `P: ${k.question}\nR: ${k.answer}`).join('\n\n').slice(0, 6000) || ''

  const prompt = `Você é um especialista em design instrucional. Preciso que gere cards de treinamento para consultores de canais digitais da Ultragaz.

## MÓDULO
Título: ${module.title}
Descrição: ${module.description || 'Sem descrição'}

## CARDS JÁ EXISTENTES NESTE MÓDULO (NÃO REPITA estes tópicos)
${existingSummary}

## CONTEÚDO DISPONÍVEL NA BIBLIOTECA
${libraryContent || 'Nenhum conteúdo disponível.'}

## BASE DE CONHECIMENTO RELEVANTE
${knowledgeContent || 'Nenhum conhecimento disponível.'}

## INSTRUÇÕES
1. Gere apenas cards com conteúdo NOVO — não repita nem parafraseie os cards existentes.
2. Cada card deve ter: título objetivo, cenário realista, desafio prático, explicação detalhada e dica de ação.
3. Baseie o conteúdo EXCLUSIVAMENTE no material fornecido acima. Não invente dados ou valores.
4. Gere quantos cards forem necessários para cobrir o conteúdo sem redundância.
5. Se o conteúdo disponível for insuficiente para gerar cards novos, retorne array vazio.

## FORMATO DE SAÍDA (JSON puro, sem markdown)
[
  {
    "title": "Título direto e objetivo",
    "scenario": "Situação realista que o consultor pode enfrentar",
    "challenge": "Qual é o problema ou pergunta a resolver?",
    "explanation": "Resposta completa com detalhes práticos extraídos do material",
    "action_hint": "Conselho prático e direto para aplicar imediatamente"
  }
]`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Extrai JSON da resposta
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return NextResponse.json({ inserted: 0, cards: [] })

  let generated: { title: string; scenario: string; challenge: string; explanation: string; action_hint: string }[]
  try {
    generated = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Erro ao parsear resposta da IA', raw }, { status: 500 })
  }

  if (!generated.length) return NextResponse.json({ inserted: 0, cards: [] })

  // 5. Segunda verificação de duplicatas: compara títulos similares
  const existingTitles = existingCards?.map(c => c.title.toLowerCase()) ?? []
  const deduped = generated.filter(g => {
    const norm = g.title.toLowerCase()
    return !existingTitles.some(t =>
      t === norm || t.includes(norm.slice(0, 20)) || norm.includes(t.slice(0, 20))
    )
  })

  if (!deduped.length) return NextResponse.json({ inserted: 0, cards: [] })

  // 6. Inserir com published=false para revisão
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: currentCards } = await service
    .from('cards')
    .select('order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: false })
    .limit(1)

  const startIndex = (currentCards?.[0]?.order_index ?? 0) + 1

  const rows = deduped.map((c, i) => ({
    module_id: moduleId,
    title: c.title,
    scenario: c.scenario,
    challenge: c.challenge,
    explanation: c.explanation,
    action_hint: c.action_hint,
    order_index: startIndex + i,
    published: false,
    created_by: user.id,
  }))

  const { data: inserted, error } = await service.from('cards').insert(rows).select('id, title')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inserted: inserted?.length ?? 0, cards: inserted })
}
