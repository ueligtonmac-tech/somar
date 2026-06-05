'use server'

import { createClient } from '@/lib/supabase/server'
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
  published?: boolean
}) {
  const supabase = await createClient()
  await supabase.from('cards').update({ ...data, updated_at: new Date().toISOString() }).eq('id', cardId)
  revalidatePath('/admin/cards')
}
