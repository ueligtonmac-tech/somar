'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { generateEmbedding } from '@/lib/embeddings'
import { sendWhatsApp } from '@/lib/whatsapp'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'builder'].includes(profile.role)) throw new Error('Sem permissão')
  // Service client bypassa RLS para operações admin
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return { supabase, service, user }
}

/** Aprova um feedback e salva na base de conhecimento */
export async function approveFeedback(feedbackId: string, question: string, answer: string, editedAnswer?: string) {
  const { service } = await assertAdmin()

  const finalAnswer = (editedAnswer?.trim()) || answer

  // Verificar se já existe entrada para este feedback (evitar duplicata)
  const { data: existing } = await service
    .from('bot_knowledge')
    .select('id')
    .eq('source_feedback_id', feedbackId)
    .maybeSingle()

  if (existing) {
    const { error } = await service
      .from('bot_knowledge')
      .update({ question, answer: finalAnswer, approved: true, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error('Erro ao atualizar: ' + error.message)
  } else {
    const { error } = await service.from('bot_knowledge').insert({
      question,
      answer: finalAnswer,
      source_feedback_id: feedbackId,
      approved: true,
    })
    if (error) throw new Error('Erro ao salvar: ' + error.message)
  }

  // Gerar embedding em background (não bloqueia aprovação)
  generateEmbedding(`${question}\n${finalAnswer}`).then(async (embedding) => {
    if (!embedding) return
    const { data: saved } = await service
      .from('bot_knowledge')
      .select('id')
      .eq('source_feedback_id', feedbackId)
      .maybeSingle()
    if (saved) {
      await service.from('bot_knowledge')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', saved.id)
    }
  }).catch(() => { /* ignora erro de embedding */ })

  // Marcar feedback como revisado
  const { error: fbError } = await service
    .from('bot_feedback')
    .update({ reviewed: true })
    .eq('id', feedbackId)
  if (fbError) throw new Error('Erro ao marcar revisado: ' + fbError.message)

  revalidatePath('/admin/bot')
}

/** Rejeita um feedback (não vira conhecimento) */
export async function rejectFeedback(feedbackId: string) {
  const { service } = await assertAdmin()
  // Só marca reviewed=true; coluna 'approved' não existe em bot_feedback
  const { error } = await service.from('bot_feedback').update({ reviewed: true }).eq('id', feedbackId)
  if (error) throw new Error('Erro ao rejeitar: ' + error.message)
  revalidatePath('/admin/bot')
}

/** Resolve escalonamento: admin escreve resposta que será entregue ao usuário */
export async function resolveEscalation(feedbackId: string, adminAnswer: string, addToKnowledge: boolean) {
  const { service, user } = await assertAdmin()

  // Tenta update com campos extras; se falhar por colunas inexistentes, usa só reviewed
  const { error } = await service.from('bot_feedback').update({
    reviewed: true,
    admin_answer: adminAnswer,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', feedbackId)

  if (error) {
    // Fallback: apenas marca como revisado (colunas extras podem não existir ainda)
    const { error: fallbackError } = await service
      .from('bot_feedback')
      .update({ reviewed: true })
      .eq('id', feedbackId)
    if (fallbackError) throw new Error('Erro ao resolver: ' + fallbackError.message)
  }

  if (addToKnowledge) {
    const { data: fb } = await service.from('bot_feedback').select('question').eq('id', feedbackId).single()
    if (fb) {
      const { data: existing } = await service
        .from('bot_knowledge')
        .select('id')
        .eq('source_feedback_id', feedbackId)
        .maybeSingle()
      if (!existing) {
        await service.from('bot_knowledge').insert({
          question: fb.question,
          answer: adminAnswer,
          source_feedback_id: feedbackId,
          approved: true,
        })
      }
    }
  }

  // Notificar o usuário que sua pergunta foi respondida
  try {
    const { data: fb } = await service
      .from('bot_feedback')
      .select('user_id, question')
      .eq('id', feedbackId)
      .maybeSingle()

    if (fb?.user_id) {
      const truncatedQuestion = fb.question?.slice(0, 100) ?? ''
      const truncatedAnswer = adminAnswer?.slice(0, 200) ?? ''

      const notifTitle = '✅ Sua pergunta foi respondida — HUB Somar'
      const notifMessage = [
        `✅ *HUB Somar — Sua pergunta foi respondida!*`,
        ``,
        `❓ *Sua pergunta:*`,
        `_${truncatedQuestion}_`,
        ``,
        `💡 *Resposta do time Ultragaz:*`,
        `${truncatedAnswer}`,
        ``,
        `Acesse o HUB Somar para ver a resposta completa.`,
      ].join('\n')

      await service.from('notifications').insert({
        user_id: fb.user_id,
        type: 'escalation_answered',
        title: notifTitle,
        message: notifMessage,
        metadata: { feedbackId, question: truncatedQuestion },
      })

      // Enviar WhatsApp ao consultor se tiver telefone
      const { data: profile } = await service
        .from('profiles')
        .select('phone, whatsapp')
        .eq('id', fb.user_id)
        .maybeSingle()

      const phone = profile?.phone ?? profile?.whatsapp
      if (phone) {
        await sendWhatsApp(phone, notifMessage)
      }
    }
  } catch (e) {
    console.error('Resolve escalation notification error:', e)
    // Não bloqueia a operação principal
  }

  revalidatePath('/admin/bot')
}

/** Remove uma entrada do bot_knowledge */
export async function deleteKnowledge(id: string) {
  const { service } = await assertAdmin()
  await service.from('bot_knowledge').delete().eq('id', id)
  revalidatePath('/admin/bot')
}

/** Adiciona conhecimento manualmente (form ou CSV) */
export async function addManualKnowledge(question: string, answer: string) {
  const { service } = await assertAdmin()
  if (!question?.trim() || !answer?.trim()) throw new Error('Pergunta e resposta são obrigatórias')

  // Check duplicate
  const { data: existing } = await service
    .from('bot_knowledge')
    .select('id')
    .ilike('question', question.trim())
    .maybeSingle()

  if (existing) throw new Error('Já existe uma entrada com essa pergunta')

  const { data: inserted, error } = await service.from('bot_knowledge').insert({
    question: question.trim(),
    answer: answer.trim(),
    approved: true,
  }).select('id').single()
  if (error) throw new Error('Erro ao salvar: ' + error.message)

  // Gerar embedding em background
  if (inserted) {
    generateEmbedding(`${question.trim()}\n${answer.trim()}`).then(async (embedding) => {
      if (!embedding) return
      await service.from('bot_knowledge')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', inserted.id)
    }).catch(() => { /* ignora */ })
  }

  revalidatePath('/admin/bot')
}

/** Importa múltiplos pares em bulk (CSV parsed no cliente) */
export async function bulkImportKnowledge(items: { question: string; answer: string }[]): Promise<number> {
  const { service } = await assertAdmin()
  if (!items.length) throw new Error('Nenhum item para importar')

  const valid = items.filter(i => i.question?.trim() && i.answer?.trim()).map(i => ({
    question: i.question.trim(),
    answer: i.answer.trim(),
    approved: true,
  }))

  if (!valid.length) throw new Error('Nenhum item válido encontrado')

  // Insert ignoring duplicates by doing it one by one (simple approach)
  let imported = 0
  for (const item of valid) {
    const { error } = await service.from('bot_knowledge').insert(item)
    if (!error) imported++
  }

  revalidatePath('/admin/bot')
  return imported
}
