'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'builder'].includes(profile.role)) throw new Error('Sem permissão')
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return { service }
}

export async function updateUserRole(userId: string, role: string) {
  const { service } = await assertAdmin()
  const { error } = await service
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) throw new Error('Erro ao atualizar perfil: ' + error.message)
  revalidatePath('/admin/usuarios')
}

export async function updateUserPhone(userId: string, phone: string) {
  const { service } = await assertAdmin()
  const { error } = await service
    .from('profiles')
    .update({ phone: phone.trim() || null })
    .eq('id', userId)
  if (error) throw new Error('Erro ao atualizar telefone: ' + error.message)
  revalidatePath('/admin/usuarios')
}
