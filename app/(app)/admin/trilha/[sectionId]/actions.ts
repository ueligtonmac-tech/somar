'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import OpenAI from 'openai'

// Atualiza dados da seção
export async function updateSection(sectionId: string, data: {
  intro_title?: string; intro_text?: string; video_url?: string; points_value?: number
}) {
  const { service } = await requireAdmin()
  const { error } = await service.from('trail_sections').update(data).eq('id', sectionId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/trilha')
  revalidatePath(`/admin/trilha/${sectionId}`)
}

// Upsert flashcard
export async function upsertFlashcard(sectionId: string, data: { id?: string; front: string; back: string; order_index: number }) {
  const { service } = await requireAdmin()
  if (data.id) {
    const { error } = await service.from('trail_flashcards').update({ front: data.front, back: data.back }).eq('id', data.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await service.from('trail_flashcards').insert({ section_id: sectionId, front: data.front, back: data.back, order_index: data.order_index })
    if (error) throw new Error(error.message)
  }
  revalidatePath(`/admin/trilha/${sectionId}`)
}

// Deleta flashcard
export async function deleteFlashcard(id: string, sectionId: string) {
  const { service } = await requireAdmin()
  await service.from('trail_flashcards').delete().eq('id', id)
  revalidatePath(`/admin/trilha/${sectionId}`)
}

// Upsert quiz question
export async function upsertQuizQuestion(sectionId: string, data: {
  id?: string; question: string; options: string[]; correct_index: number; explanation: string; order_index: number
}) {
  const { service } = await requireAdmin()
  if (data.id) {
    const { error } = await service.from('trail_quiz_questions').update({ question: data.question, options: data.options, correct_index: data.correct_index, explanation: data.explanation }).eq('id', data.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await service.from('trail_quiz_questions').insert({ section_id: sectionId, question: data.question, options: data.options, correct_index: data.correct_index, explanation: data.explanation, order_index: data.order_index })
    if (error) throw new Error(error.message)
  }
  revalidatePath(`/admin/trilha/${sectionId}`)
}

// Deleta quiz question
export async function deleteQuizQuestion(id: string, sectionId: string) {
  const { service } = await requireAdmin()
  await service.from('trail_quiz_questions').delete().eq('id', id)
  revalidatePath(`/admin/trilha/${sectionId}`)
}

// Gerar flashcards com IA
export async function generateFlashcardsAI(sectionId: string): Promise<{ front: string; back: string }[]> {
  const { service } = await requireAdmin()

  const { data: section } = await service.from('trail_sections').select('title, intro_title, intro_text').eq('id', sectionId).single()

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const prompt = `Crie 5 flashcards de estudo sobre o seguinte tópico da trilha de capacitação Ultragaz:

Seção: ${section?.title}
Introdução: ${section?.intro_text ?? ''}

Retorne um JSON com array de objetos: {"flashcards": [{"front": "pergunta", "back": "resposta concisa"}]}
As perguntas devem ser práticas e relevantes para consultores de canais digitais Ultragaz.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0].message.content ?? '{"flashcards":[]}')
  const cards: { front: string; back: string }[] = parsed.flashcards ?? parsed

  const { data: existing } = await service.from('trail_flashcards').select('order_index').eq('section_id', sectionId).order('order_index', { ascending: false }).limit(1)
  const startIndex = (existing?.[0]?.order_index ?? -1) + 1

  await service.from('trail_flashcards').insert(cards.map((c, i) => ({
    section_id: sectionId,
    front: c.front,
    back: c.back,
    order_index: startIndex + i,
  })))

  revalidatePath(`/admin/trilha/${sectionId}`)
  return cards
}

// Vincula módulo de cards à seção
export async function setModuleId(sectionId: string, moduleId: string | null) {
  const { service } = await requireAdmin()
  const { error } = await service.from('trail_sections').update({ module_id: moduleId }).eq('id', sectionId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/trilha/${sectionId}`)
}

// Gerar cards com IA (Anthropic, usa biblioteca + bot_knowledge)
export async function generateCardsAI(sectionId: string): Promise<{ inserted: number }> {
  const { service } = await requireAdmin()

  // Busca module_id da seção
  const { data: section } = await service.from('trail_sections').select('module_id, title').eq('id', sectionId).single()
  if (!section?.module_id) throw new Error('Nenhum módulo vinculado a esta seção')

  const moduleId = section.module_id

  const [
    { data: module },
    { data: existingCards },
    { data: chunks },
    { data: knowledge },
  ] = await Promise.all([
    service.from('modules').select('id, title, description').eq('id', moduleId).single(),
    service.from('cards').select('title, scenario, challenge').eq('module_id', moduleId),
    service.from('document_chunks').select('content').limit(40),
    service.from('bot_knowledge').select('question, answer').limit(30),
  ])

  if (!module) throw new Error('Módulo não encontrado')

  const existingSummary = existingCards?.map(c => `- ${c.title}: ${c.scenario ?? ''} ${c.challenge ?? ''}`.trim()).join('\n') || 'Nenhum card ainda.'
  const libraryContent = chunks?.map(c => c.content).join('\n\n---\n\n').slice(0, 12000) || ''
  const knowledgeContent = knowledge?.map(k => `P: ${k.question}\nR: ${k.answer}`).join('\n\n').slice(0, 6000) || ''

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const hasContent = libraryContent.length > 100 || knowledgeContent.length > 100
  const contentInstruction = !hasContent
    ? `Use seu conhecimento sobre onboarding Ultragaz para criar cards introdutórios relevantes. Gere ao menos 3 cards.`
    : `Baseie o conteúdo no material fornecido. Se insuficiente para cards novos, retorne array vazio.`

  const prompt = `Você é especialista em design instrucional. Gere cards de treinamento para consultores de canais digitais da Ultragaz.

## MÓDULO: ${module.title}
${module.description ? `Descrição: ${module.description}` : ''}

## CARDS JÁ EXISTENTES (NÃO REPITA)
${existingSummary}

## CONTEÚDO DA BIBLIOTECA
${libraryContent || 'Sem conteúdo.'}

## BASE DE CONHECIMENTO
${knowledgeContent || 'Sem conteúdo.'}

## INSTRUÇÕES
1. Gere apenas cards NOVOS, sem repetir os existentes.
2. Cada card: título objetivo, cenário realista, desafio prático, explicação detalhada, dica de ação.
3. Mínimo 3, máximo 10 cards.
4. ${contentInstruction}

## SAÍDA (JSON puro, sem markdown)
[{"title":"...","scenario":"...","challenge":"...","explanation":"...","action_hint":"..."}]`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return { inserted: 0 }

  let generated: { title: string; scenario: string; challenge: string; explanation: string; action_hint: string }[]
  try { generated = JSON.parse(jsonMatch[0]) } catch { return { inserted: 0 } }
  if (!generated.length) return { inserted: 0 }

  // Deduplicação por título
  const existingTitles = existingCards?.map(c => c.title.toLowerCase()) ?? []
  const deduped = generated.filter(g => {
    const norm = g.title.toLowerCase()
    return !existingTitles.some(t => t === norm || t.includes(norm.slice(0, 20)) || norm.includes(t.slice(0, 20)))
  })
  if (!deduped.length) return { inserted: 0 }

  // Índice de inserção
  const { data: lastCard } = await service.from('cards').select('order_index').eq('module_id', moduleId).order('order_index', { ascending: false }).limit(1)
  const startIndex = (lastCard?.[0]?.order_index ?? 0) + 1

  const { data: inserted } = await service.from('cards').insert(
    deduped.map((c, i) => ({
      module_id: moduleId,
      title: c.title,
      scenario: c.scenario,
      challenge: c.challenge,
      explanation: c.explanation,
      action_hint: c.action_hint,
      order_index: startIndex + i,
      published: false,
    }))
  ).select('id')

  revalidatePath(`/admin/trilha/${sectionId}`)
  return { inserted: inserted?.length ?? 0 }
}

// Gerar quiz com IA
export async function generateQuizAI(sectionId: string): Promise<{ question: string; options: string[]; correct_index: number; explanation: string }[]> {
  const { service } = await requireAdmin()

  const { data: section } = await service.from('trail_sections').select('title, intro_title, intro_text').eq('id', sectionId).single()

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const prompt = `Crie 5 questões de múltipla escolha sobre o seguinte tópico da trilha de capacitação Ultragaz:

Seção: ${section?.title}
Introdução: ${section?.intro_text ?? ''}

Retorne JSON: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}]}
correct_index é 0-3 (índice da opção correta).`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0].message.content ?? '{"questions":[]}')
  const questions = parsed.questions ?? []

  const { data: existing } = await service.from('trail_quiz_questions').select('order_index').eq('section_id', sectionId).order('order_index', { ascending: false }).limit(1)
  const startIndex = (existing?.[0]?.order_index ?? -1) + 1

  await service.from('trail_quiz_questions').insert(questions.map((q: { question: string; options: string[]; correct_index: number; explanation: string }, i: number) => ({
    section_id: sectionId,
    question: q.question,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation,
    order_index: startIndex + i,
  })))

  revalidatePath(`/admin/trilha/${sectionId}`)
  return questions
}
