'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'

// ── Cards ──────────────────────────────────────────────────────────────────

export async function toggleUserActive(userId: string, active: boolean) {
  const { service } = await requireAdmin()
  const { error } = await service.from('profiles').update({ active }).eq('id', userId)
  if (error) throw new Error('Erro ao atualizar usuário: ' + error.message)
  revalidatePath('/admin')
}

export async function changeUserRole(userId: string, role: string) {
  const { service } = await requireAdmin()
  const { error } = await service.from('profiles').update({ role }).eq('id', userId)
  if (error) throw new Error('Erro ao alterar função: ' + error.message)
  revalidatePath('/admin')
}

export async function updateCard(cardId: string, data: {
  title?: string
  scenario?: string
  challenge?: string
  explanation?: string
  action_hint?: string
  video_url?: string
  pdf_url?: string
  pdf_name?: string
  published?: boolean
}) {
  const { service } = await requireAdmin()
  const { error } = await service
    .from('cards')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', cardId)
  if (error) throw new Error('Erro ao atualizar card: ' + error.message)
  revalidatePath('/admin/cards')
}

export async function createCard(moduleId: string, title: string, orderIndex: number) {
  const { service } = await requireAdmin()
  const { data, error } = await service
    .from('cards')
    .insert({ module_id: moduleId, title, order_index: orderIndex, published: false })
    .select('id')
    .single()
  if (error) throw new Error('Erro ao criar card: ' + error.message)
  revalidatePath('/admin/cards')
  return data.id
}

export async function deleteCard(cardId: string) {
  const { service } = await requireAdmin()
  const { error } = await service.from('cards').delete().eq('id', cardId)
  if (error) throw new Error('Erro ao excluir card: ' + error.message)
  revalidatePath('/admin/cards')
}

export async function reorderCard(cardId: string, newIndex: number) {
  const { service } = await requireAdmin()
  await service.from('cards').update({ order_index: newIndex }).eq('id', cardId)
  revalidatePath('/admin/cards')
}

export async function reorderCards(moduleId: string, orderedIds: string[]) {
  const { service } = await requireAdmin()
  await Promise.all(
    orderedIds.map((id, idx) =>
      service.from('cards').update({ order_index: idx + 1 }).eq('id', id).eq('module_id', moduleId)
    )
  )
  revalidatePath('/admin/cards')
}

// ── Módulos ────────────────────────────────────────────────────────────────

export async function createModule(title: string, orderIndex: number) {
  const { service } = await requireAdmin()

  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { error } = await service.from('modules').insert({
    title,
    slug: `${slug}-${Date.now()}`,
    order_index: orderIndex,
    description: '',
  })
  if (error) throw new Error('Erro ao criar módulo: ' + error.message)
  revalidatePath('/admin/cards')
}

export async function reorderModules(orderedIds: string[]) {
  const { service } = await requireAdmin()
  await Promise.all(
    orderedIds.map((id, idx) =>
      service.from('modules').update({ order_index: idx + 1 }).eq('id', id)
    )
  )
  revalidatePath('/admin/cards')
}

export async function updateModule(moduleId: string, data: { title?: string; description?: string; published?: boolean }) {
  const { service } = await requireAdmin()
  const { error } = await service
    .from('modules')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', moduleId)
  if (error) throw new Error('Erro ao atualizar módulo: ' + error.message)
  revalidatePath('/admin/cards')
}

export async function deleteModule(moduleId: string) {
  const { service } = await requireAdmin()
  const { error } = await service.from('modules').delete().eq('id', moduleId)
  if (error) throw new Error('Erro ao excluir módulo: ' + error.message)
  revalidatePath('/admin/cards')
}

export async function uploadCardPdf(cardId: string, formData: FormData): Promise<{ url: string; name: string }> {
  const { supabase } = await requireAdmin()

  const file = formData.get('file') as File
  if (!file) throw new Error('Arquivo não encontrado')
  if (file.size > 50 * 1024 * 1024) throw new Error('PDF deve ter no máximo 50MB')

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  void supabase // used only for auth check above

  const path = `pdfs/${cardId}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`
  const bytes = await file.arrayBuffer()

  const { data, error } = await serviceClient.storage
    .from('card-files')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) throw new Error('Erro no upload: ' + error.message)

  const { data: { publicUrl } } = serviceClient.storage.from('card-files').getPublicUrl(data.path)
  return { url: publicUrl, name: file.name }
}
