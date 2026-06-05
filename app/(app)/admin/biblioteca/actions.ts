'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteLibraryFile(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) throw new Error('Sem permissão')

  const service = await createServiceClient()

  // Busca o arquivo para pegar o path no storage
  const { data: file } = await service.from('library_files').select('file_name').eq('id', id).single()
  if (file?.file_name) {
    await service.storage.from('biblioteca').remove([file.file_name])
  }

  await service.from('library_files').delete().eq('id', id)
  revalidatePath('/biblioteca')
  revalidatePath('/admin/biblioteca')
}

export async function toggleLibraryFile(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role)) throw new Error('Sem permissão')

  const service = await createServiceClient()
  const { data: current } = await service.from('library_files').select('active').eq('id', id).single()
  const newActive = !current?.active

  await service.from('library_files').update({ active: newActive }).eq('id', id)
  revalidatePath('/biblioteca')
  revalidatePath('/admin/biblioteca')

  return { active: newActive }
}
