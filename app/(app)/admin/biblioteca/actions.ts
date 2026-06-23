'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'

export async function deleteLibraryFile(id: string) {
  const { service } = await requireAdmin()

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
  const { service } = await requireAdmin()
  const { data: current } = await service.from('library_files').select('active').eq('id', id).single()
  const newActive = !current?.active

  await service.from('library_files').update({ active: newActive }).eq('id', id)
  revalidatePath('/biblioteca')
  revalidatePath('/admin/biblioteca')

  return { active: newActive }
}
