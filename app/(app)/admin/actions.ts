'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function toggleUserActive(userId: string, active: boolean) {
  const supabase = await createClient()
  await supabase.from('profiles').update({ active }).eq('id', userId)
  revalidatePath('/admin')
}

export async function changeUserRole(userId: string, role: string) {
  const supabase = await createClient()
  await supabase.from('profiles').update({ role }).eq('id', userId)
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
  const supabase = await createClient()
  await supabase.from('cards').update({ ...data, updated_at: new Date().toISOString() }).eq('id', cardId)
  revalidatePath('/admin/cards')
}

export async function createCard(moduleId: string, title: string, orderIndex: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .insert({ module_id: moduleId, title, order_index: orderIndex, published: false })
    .select('id')
    .single()
  if (error) throw error
  revalidatePath('/admin/cards')
  return data.id
}

export async function deleteCard(cardId: string) {
  const supabase = await createClient()
  await supabase.from('cards').delete().eq('id', cardId)
  revalidatePath('/admin/cards')
}

export async function reorderCard(cardId: string, newIndex: number) {
  const supabase = await createClient()
  await supabase.from('cards').update({ order_index: newIndex }).eq('id', cardId)
  revalidatePath('/admin/cards')
}

export async function reorderCards(moduleId: string, orderedIds: string[]) {
  const supabase = await createClient()
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from('cards').update({ order_index: idx + 1 }).eq('id', id).eq('module_id', moduleId)
    )
  )
  revalidatePath('/admin/cards')
}

export async function createModule(title: string, orderIndex: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'builder'].includes(profile.role)) throw new Error('Sem permissão')

  // derive slug from title
  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { error } = await supabase.from('modules').insert({
    title,
    slug: `${slug}-${Date.now()}`,
    order_index: orderIndex,
    description: '',
  })
  if (error) throw new Error('Erro ao criar módulo: ' + error.message)
  revalidatePath('/admin/cards')
}

export async function uploadCardPdf(cardId: string, formData: FormData): Promise<{ url: string; name: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'builder'].includes(profile.role)) throw new Error('Sem permissão')

  const file = formData.get('file') as File
  if (!file) throw new Error('Arquivo não encontrado')
  if (file.size > 50 * 1024 * 1024) throw new Error('PDF deve ter no máximo 50MB')

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const path = `pdfs/${cardId}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`
  const bytes = await file.arrayBuffer()

  const { data, error } = await serviceClient.storage
    .from('card-files')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) throw new Error('Erro no upload: ' + error.message)

  const { data: { publicUrl } } = serviceClient.storage.from('card-files').getPublicUrl(data.path)
  return { url: publicUrl, name: file.name }
}
