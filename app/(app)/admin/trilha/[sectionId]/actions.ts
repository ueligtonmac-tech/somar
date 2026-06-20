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
